const User = require('../models/User.model');
const Course = require('../models/Course.model');
const Notification = require('../models/Notification.model');
const { sendEmail } = require('../config/email');
const { getEnrollmentEmailTemplate, getBulkEnrollmentEmailTemplate } = require('../utils/emailTemplates');

// @desc    Get all enrollments
// @route   GET /api/enrollments
// @access  Private/Admin/Trainer
exports.getAllEnrollments = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      courseId, 
      userId, 
      status,
      search 
    } = req.query;

    const query = {};

    // Filter by course
    if (courseId) {
      query['enrolledCourses.course'] = courseId;
    }

    // Filter by user
    if (userId) {
      query._id = userId;
    }

    // Filter by status
    if (status && ['In Progress', 'Completed'].includes(status)) {
      query['enrolledCourses.status'] = status;
    }

    // Search by user name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('name email enrolledCourses')
      .populate('enrolledCourses.course', 'title thumbnail category')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('-enrolledCourses.enrolledAt');

    // Transform data to flat enrollment list
    const enrollments = [];
    users.forEach(user => {
      user.enrolledCourses.forEach(enrollment => {
        enrollments.push({
          _id: `${user._id}-${enrollment.course._id}`,
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          courseId: enrollment.course._id,
          courseName: enrollment.course.title,
          courseThumbnail: enrollment.course.thumbnail,
          courseCategory: enrollment.course.category,
          enrolledAt: enrollment.enrolledAt,
          progress: enrollment.progress,
          status: enrollment.status,
          completedLessons: enrollment.completedLessons
        });
      });
    });

    // Filter by course name if courseId is provided in nested populate
    const filteredEnrollments = courseId 
      ? enrollments.filter(e => e.courseId.toString() === courseId)
      : enrollments;

    // Get total count for users with enrollments
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      success: true,
      count: filteredEnrollments.length,
      total: filteredEnrollments.length,
      page: parseInt(page),
      totalPages,
      enrollments: filteredEnrollments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get enrollments for a specific user
// @route   GET /api/enrollments/user/:userId
// @access  Private/Admin/Trainer
exports.getUserEnrollments = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('name email enrolledCourses')
      .populate('enrolledCourses.course', 'title thumbnail category description');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Filter out orphaned enrollments (courses that have been deleted)
    const validEnrollments = user.enrolledCourses.filter(
      enrollment => enrollment.course !== null
    );

    const enrollments = validEnrollments.map(enrollment => ({
      courseId: enrollment.course._id,
      courseName: enrollment.course.title,
      courseThumbnail: enrollment.course.thumbnail,
      courseDescription: enrollment.course.description,
      enrolledAt: enrollment.enrolledAt,
      progress: enrollment.progress,
      status: enrollment.status,
      completedLessons: enrollment.completedLessons
    }));

    res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email
      },
      count: enrollments.length,
      enrollments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get enrollments for a specific course
// @route   GET /api/enrollments/course/:courseId
// @access  Private/Admin/Trainer
exports.getCourseEnrollments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const course = await Course.findById(req.params.courseId)
      .populate('createdBy', 'name email');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get users enrolled in this course
    const users = await User.find({
      'enrolledCourses.course': req.params.courseId
    })
      .select('name email enrolledCourses')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort('-enrolledCourses.enrolledAt');

    const enrollments = users.map(user => {
      const enrollment = user.enrolledCourses.find(
        e => e.course.toString() === req.params.courseId
      );
      return {
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        enrolledAt: enrollment.enrolledAt,
        progress: enrollment.progress,
        status: enrollment.status,
        completedLessons: enrollment.completedLessons
      };
    });

    const totalEnrolled = await User.countDocuments({
      'enrolledCourses.course': req.params.courseId
    });

    res.status(200).json({
      success: true,
      course: {
        title: course.title,
        totalEnrolled
      },
      count: enrollments.length,
      total: totalEnrolled,
      page: parseInt(page),
      totalPages: Math.ceil(totalEnrolled / limit),
      enrollments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Bulk enroll users in courses
// @route   POST /api/enrollments/bulk
// @access  Private/Admin/Trainer
exports.bulkEnrollUsers = async (req, res) => {
  try {
    const { userIds, courseIds, enrollDate = new Date() } = req.body;

    if (!userIds || !courseIds || userIds.length === 0 || courseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide userIds and courseIds arrays'
      });
    }

    // Validate users exist
    const users = await User.find({ _id: { $in: userIds } });
    if (users.length !== userIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more users not found'
      });
    }

    // Validate courses exist
    const courses = await Course.find({ _id: { $in: courseIds } });
    if (courses.length !== courseIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more courses not found'
      });
    }

    const enrollments = [];
    const notifications = [];
    const enrollmentEmails = [];

    // Process each user and course combination
    for (const user of users) {
      const userEnrolledCourses = [];
      
      for (const course of courses) {
        // Check if already enrolled
        const alreadyEnrolled = user.enrolledCourses.some(
          e => e.course.toString() === course._id.toString()
        );

        if (!alreadyEnrolled) {
          // Add enrollment to user
          user.enrolledCourses.push({
            course: course._id,
            enrolledAt: enrollDate,
            progress: 0,
            status: 'In Progress'
          });
          await user.save();

          // Add user to course's enrolled users
          if (!course.enrolledUsers.includes(user._id)) {
            course.enrolledUsers.push(user._id);
            await course.save();
          }

          // Create notification
          notifications.push({
            user: user._id,
            type: 'Enrollment',
            title: 'Course Enrollment',
            message: `You have been enrolled in ${course.title}`,
            link: `/courses/${course._id}`
          });

          // Add to enrollment data
          enrollments.push({
            userId: user._id,
            userName: user.name,
            courseId: course._id,
            courseName: course.title,
            enrolledAt: enrollDate,
            status: 'In Progress'
          });

          // Collect course info for email
          userEnrolledCourses.push({
            _id: course._id,
            title: course.title,
            description: course.description,
            thumbnail: course.thumbnail,
            category: course.category
          });
        }
      }

      // Send email notification if user was enrolled in any courses
      if (userEnrolledCourses.length > 0) {
        enrollmentEmails.push({
          to: user.email,
          subject: userEnrolledCourses.length > 1 
            ? `You've been enrolled in ${userEnrolledCourses.length} courses!`
            : `You've been enrolled in: ${userEnrolledCourses[0].title}`,
          html: userEnrolledCourses.length > 1 
            ? getBulkEnrollmentEmailTemplate(user.name, userEnrolledCourses)
            : getEnrollmentEmailTemplate(
                user.name,
                userEnrolledCourses[0].title,
                userEnrolledCourses[0].description,
                userEnrolledCourses[0].thumbnail
              )
        });
      }
    }

    // Send all email notifications
    const emailPromises = enrollmentEmails.map(emailData => 
      sendEmail(emailData).catch(err => {
        console.error(`Failed to send enrollment email to ${emailData.to}:`, err);
      })
    );
    
    // Don't wait for emails to complete - send in background
    Promise.all(emailPromises).catch(err => console.error('Email sending errors:', err));

    // Create all notifications
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(200).json({
      success: true,
      message: `Successfully enrolled ${enrollments.length} user(s) in course(s)`,
      enrolledCount: enrollments.length,
      alreadyEnrolledCount: (userIds.length * courseIds.length) - enrollments.length,
      enrollments,
      emailsSent: enrollmentEmails.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Enroll a single user in a course
// @route   POST /api/enrollments
// @access  Private/Admin/Trainer
exports.enrollUser = async (req, res) => {
  try {
    const { userId, courseId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    const alreadyEnrolled = user.enrolledCourses.some(
      e => e.course.toString() === courseId
    );

    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'User is already enrolled in this course'
      });
    }

    // Add enrollment
    user.enrolledCourses.push({
      course: courseId,
      enrolledAt: new Date(),
      progress: 0,
      status: 'In Progress'
    });
    await user.save();

    // Add user to course
    if (!course.enrolledUsers.includes(user._id)) {
      course.enrolledUsers.push(user._id);
      await course.save();
    }

    // Create in-app notification
    await Notification.create({
      user: user._id,
      type: 'Enrollment',
      title: 'Course Enrollment',
      message: `You have been enrolled in ${course.title}`,
      link: `/courses/${course._id}`
    });

    // Send email notification
    try {
      await sendEmail({
        to: user.email,
        subject: `You've been enrolled in: ${course.title}`,
        html: getEnrollmentEmailTemplate(
          user.name,
          course.title,
          course.description,
          course.thumbnail
        )
      });
      console.log(`Enrollment email sent to ${user.email}`);
    } catch (emailError) {
      console.error(`Failed to send enrollment email to ${user.email}:`, emailError);
    }

    res.status(200).json({
      success: true,
      message: 'User enrolled successfully',
      enrollment: {
        userId: user._id,
        userName: user.name,
        courseId: course._id,
        courseName: course.title,
        enrolledAt: new Date(),
        status: 'In Progress'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update enrollment progress
// @route   PUT /api/enrollments/:userId/:courseId
// @access  Private/Admin/Trainer
exports.updateEnrollment = async (req, res) => {
  try {
    const { userId, courseId } = req.params;
    const { progress, status } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const enrollment = user.enrolledCourses.find(
      e => e.course.toString() === courseId
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Update fields if provided
    if (progress !== undefined) {
      enrollment.progress = Math.min(100, Math.max(0, progress));
    }

    if (status && ['In Progress', 'Completed'].includes(status)) {
      enrollment.status = status;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Enrollment updated successfully',
      enrollment: {
        userId: user._id,
        userName: user.name,
        courseId: courseId,
        progress: enrollment.progress,
        status: enrollment.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove enrollment
// @route   DELETE /api/enrollments/:userId/:courseId
// @access  Private/Admin
exports.removeEnrollment = async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const enrollmentIndex = user.enrolledCourses.findIndex(
      e => e.course.toString() === courseId
    );

    if (enrollmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Remove enrollment
    user.enrolledCourses.splice(enrollmentIndex, 1);
    await user.save();

    // Remove user from course's enrolled users
    const course = await Course.findById(courseId);
    if (course) {
      course.enrolledUsers = course.enrolledUsers.filter(
        id => id.toString() !== userId
      );
      await course.save();
    }

    res.status(200).json({
      success: true,
      message: 'Enrollment removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get enrollment statistics
// @route   GET /api/enrollments/stats
// @access  Private/Admin/Trainer
exports.getEnrollmentStats = async (req, res) => {
  try {
    const totalEnrollments = await User.aggregate([
      { $unwind: '$enrolledCourses' },
      { $count: 'total' }
    ]);

    const completedEnrollments = await User.aggregate([
      { $unwind: '$enrolledCourses' },
      { $match: { 'enrolledCourses.status': 'Completed' } },
      { $count: 'completed' }
    ]);

    const inProgressEnrollments = await User.aggregate([
      { $unwind: '$enrolledCourses' },
      { $match: { 'enrolledCourses.status': 'In Progress' } },
      { $count: 'inProgress' }
    ]);

    const averageProgress = await User.aggregate([
      { $unwind: '$enrolledCourses' },
      {
        $group: {
          _id: null,
          avgProgress: { $avg: '$enrolledCourses.progress' }
        }
      }
    ]);

    // Enrollments by course
    const enrollmentsByCourse = await User.aggregate([
      { $unwind: '$enrolledCourses' },
      {
        $group: {
          _id: '$enrolledCourses.course',
          count: { $sum: 1 },
          avgProgress: { $avg: '$enrolledCourses.progress' }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $project: {
          courseName: '$course.title',
          enrollmentCount: '$count',
          averageProgress: { $round: ['$avgProgress', 1] }
        }
      },
      { $sort: { enrollmentCount: -1 } },
      { $limit: 10 }
    ]);

    // Recent enrollments
    const recentEnrollments = await User.aggregate([
      { $unwind: '$enrolledCourses' },
      { $sort: { 'enrolledCourses.enrolledAt': -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'courses',
          localField: 'enrolledCourses.course',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $project: {
          userName: '$name',
          userEmail: '$email',
          courseName: '$course.title',
          enrolledAt: '$enrolledCourses.enrolledAt',
          status: '$enrolledCourses.status'
        }
      }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalEnrollments: totalEnrollments[0]?.total || 0,
        completedEnrollments: completedEnrollments[0]?.completed || 0,
        inProgressEnrollments: inProgressEnrollments[0]?.inProgress || 0,
        averageProgress: Math.round(averageProgress[0]?.avgProgress || 0),
        completionRate: totalEnrollments[0]?.total 
          ? Math.round((completedEnrollments[0]?.completed / totalEnrollments[0].total) * 100)
          : 0
      },
      enrollmentsByCourse,
      recentEnrollments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

