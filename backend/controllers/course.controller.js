const Course = require('../models/Course.model');
const User = require('../models/User.model');
const Notification = require('../models/Notification.model');
const { sendEmail } = require('../config/email');
const { getEnrollmentEmailTemplate } = require('../utils/emailTemplates');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
exports.getCourses = async (req, res) => {
  try {
    const { status, category, level } = req.query;
    const query = {};

    // Learners only see published courses
    if (req.user.role === 'Learner') {
      query.status = 'Published';
    }

    if (status) query.status = status;
    if (category) query.category = category;
    if (level) query.level = level;

    const courses = await Course.find(query)
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('assessment');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get user's enrollment status and progress
    let enrollment = null;
    if (req.user) {
      const user = await User.findById(req.user.id);
      enrollment = user.enrolledCourses.find(
        e => e.course.toString() === course._id.toString()
      );
    }

    // Get assessment for this course if exists (from populated field or fallback query)
    let assessment = course.assessment;
    if (!assessment) {
      const { Assessment } = require('../models/Assessment.model');
      assessment = await Assessment.findOne({ course: course._id });
    }

    res.status(200).json({
      success: true,
      course,
      enrollment: enrollment ? {
        progress: enrollment.progress,
        status: enrollment.status,
        completedLessons: enrollment.completedLessons,
        completedAt: enrollment.completedAt
      } : null,
      assessment: assessment ? {
        _id: assessment._id,
        title: assessment.title,
        status: assessment.status,
        questions: assessment.questions,
        passingScore: assessment.passingScore,
        duration: assessment.duration
      } : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private/Trainer/Admin
exports.createCourse = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;

    const course = await Course.create(req.body);

    res.status(201).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Trainer/Admin
exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course is being published
    const wasPublished = course.status === 'Published';
    const isBeingPublished = req.body.status === 'Published' && !wasPublished;

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // If course is being published, notify all learners
    if (isBeingPublished) {
      // Get all learners
      const learners = await User.find({ role: 'Learner' }).select('_id');
      
      // Create notifications for all learners
      const notifications = learners.map(learner => ({
        user: learner._id,
        type: 'Course',
        title: 'New Course Available!',
        message: `A new course "${course.title}" has been published. Enroll now to start learning!`,
        link: `/courses/${course._id}`
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    res.status(200).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Remove course from all users' enrolledCourses arrays
    await User.updateMany(
      { 'enrolledCourses.course': course._id },
      { $pull: { enrolledCourses: { course: course._id } } }
    );

    // Delete the course
    await Course.findByIdAndDelete(course._id);

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Enroll in course
// @route   POST /api/courses/:id/enroll
// @access  Private/Learner
exports.enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const user = await User.findById(req.user.id);

    // Check if already enrolled
    const alreadyEnrolled = user.enrolledCourses.some(
      enrollment => enrollment.course.toString() === course._id.toString()
    );

    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Enroll user
    user.enrolledCourses.push({
      course: course._id,
      enrolledAt: Date.now(),
      progress: 0,
      status: 'In Progress',
      completedLessons: []
    });

    await user.save();

    // Add user to course
    course.enrolledUsers.push(user._id);
    await course.save();

    // Create notification
    await Notification.create({
      user: user._id,
      type: 'Enrollment',
      title: 'Course Enrollment Successful',
      message: `You have successfully enrolled in ${course.title}`,
      link: `/courses/${course._id}`
    });

    // Send email notification
    try {
      await sendEmail({
        to: user.email,
        subject: `Course Enrollment Confirmation: ${course.title}`,
        html: getEnrollmentEmailTemplate(
          user.name,
          course.title,
          course.description,
          course.thumbnail
        )
      });
      console.log(`Self-enrollment email sent to ${user.email}`);
    } catch (emailError) {
      console.error(`Failed to send enrollment email to ${user.email}:`, emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Successfully enrolled in course'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Unenroll from course
// @route   POST /api/courses/:id/unenroll
// @access  Private/Learner
exports.unenrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const user = await User.findById(req.user.id);

    // Check if enrolled
    const isEnrolled = user.enrolledCourses.some(
      enrollment => enrollment.course.toString() === course._id.toString()
    );

    if (!isEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    // Remove enrollment
    user.enrolledCourses = user.enrolledCourses.filter(
      enrollment => enrollment.course.toString() !== course._id.toString()
    );

    await user.save();

    // Remove user from course
    course.enrolledUsers = course.enrolledUsers.filter(
      userId => userId.toString() !== user._id.toString()
    );
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Successfully unenrolled from course'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update course progress
// @route   PUT /api/courses/:id/progress
// @access  Private/Learner
exports.updateProgress = async (req, res) => {
  try {
    const { lessonId, progress } = req.body;
    const user = await User.findById(req.user.id);

    const enrollment = user.enrolledCourses.find(
      e => e.course.toString() === req.params.id
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    // Add completed lesson
    if (lessonId && !enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    }

    // Update progress
    if (progress !== undefined) {
      enrollment.progress = progress;
      if (progress >= 100) {
        enrollment.status = 'Completed';
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Complete a single lesson
// @route   POST /api/courses/:id/complete-lesson
// @access  Private/Learner
exports.completeLesson = async (req, res) => {
  try {
    const { lessonId } = req.body;
    
    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: 'Lesson ID is required'
      });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const user = await User.findById(req.user.id);
    
    const enrollment = user.enrolledCourses.find(
      e => e.course.toString() === req.params.id
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    // Check if lesson already completed
    if (enrollment.completedLessons.includes(lessonId)) {
      return res.status(400).json({
        success: false,
        message: 'Lesson already completed'
      });
    }

    // Find the lesson in the course
    let lessonFound = false;
    let lessonOrder = -1;
    
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (lesson._id.toString() === lessonId) {
          lessonFound = true;
          break;
        }
        lessonOrder++;
      }
      if (lessonFound) break;
    }

    if (!lessonFound) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found in this course'
      });
    }

    // Sequential Learning Rule: Check if all previous lessons are completed
    // Get all lessons in order and check if this is the next lesson
    const allLessonsInOrder = [];
    course.modules.forEach(module => {
      module.lessons.forEach(lesson => {
        allLessonsInOrder.push(lesson._id.toString());
      });
    });

    // Find the index of the lesson being completed
    const currentLessonIndex = allLessonsInOrder.indexOf(lessonId);
    
    // Check if all previous lessons are completed
    for (let i = 0; i < currentLessonIndex; i++) {
      if (!enrollment.completedLessons.includes(allLessonsInOrder[i])) {
        return res.status(400).json({
          success: false,
          message: 'You must complete previous lessons before this one. Sequential learning is enforced.'
        });
      }
    }

    // Add lesson to completed lessons
    enrollment.completedLessons.push(lessonId);

    // Calculate total lessons in course
    let totalLessons = 0;
    course.modules.forEach(module => {
      totalLessons += module.lessons.length;
    });

    // Calculate progress
    const newProgress = Math.round((enrollment.completedLessons.length / totalLessons) * 100);
    enrollment.progress = newProgress;

    // Check if course is complete
    const isCourseComplete = enrollment.completedLessons.length >= totalLessons;
    
    if (isCourseComplete) {
      enrollment.status = 'Completed';
      enrollment.completedAt = new Date();
    }

    await user.save();

    // Create notification if course is completed
    if (isCourseComplete) {
      await Notification.create({
        user: user._id,
        type: 'Assessment',
        title: 'Course Completed!',
        message: `Congratulations! You have completed ${course.title}. You can now take the assessment to earn your certificate.`,
        link: `/courses/${course._id}`
      });
    }

    res.status(200).json({
      success: true,
      message: isCourseComplete ? 'Course completed!' : 'Lesson marked as complete',
      progress: enrollment.progress,
      completedLessons: enrollment.completedLessons.length,
      totalLessons,
      isCourseComplete,
      status: enrollment.status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Complete entire course
// @route   POST /api/courses/:id/complete
// @access  Private/Learner
exports.completeCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const user = await User.findById(req.user.id);
    
    const enrollment = user.enrolledCourses.find(
      e => e.course.toString() === req.params.id
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    // Calculate total lessons
    let totalLessons = 0;
    course.modules.forEach(module => {
      totalLessons += module.lessons.length;
    });

    // Mark all lessons as completed
    course.modules.forEach(module => {
      module.lessons.forEach(lesson => {
        if (!enrollment.completedLessons.includes(lesson._id.toString())) {
          enrollment.completedLessons.push(lesson._id.toString());
        }
      });
    });

    // Update enrollment
    enrollment.progress = 100;
    enrollment.status = 'Completed';
    enrollment.completedAt = new Date();

    await user.save();

    // Create notification
    await Notification.create({
      user: user._id,
      type: 'Assessment',
      title: 'Course Completed!',
      message: `Congratulations! You have completed ${course.title}. You can now take the assessment to earn your certificate.`,
      link: `/courses/${course._id}`
    });

    // Check if there's an assessment for this course
    const { Assessment } = require('../models/Assessment.model');
    const assessment = await Assessment.findOne({ course: course._id });

    res.status(200).json({
      success: true,
      message: 'Course completed successfully!',
      enrollment: {
        progress: 100,
        status: 'Completed',
        completedLessons: enrollment.completedLessons.length,
        totalLessons,
        hasAssessment: !!assessment
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
