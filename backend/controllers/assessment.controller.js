const { Assessment, AssessmentResult } = require('../models/Assessment.model');
const Notification = require('../models/Notification.model');
const User = require('../models/User.model');
const Certificate = require('../models/Certificate.model');
const Course = require('../models/Course.model');

// @desc    Get all assessments
// @route   GET /api/assessments
// @access  Private
exports.getAssessments = async (req, res) => {
  try {
    const { course, status } = req.query;
    const query = {};

    // Show all assessments to all users (status determines visibility on learner dashboard)
    if (course) query.course = course;
    if (status) query.status = status;

    const assessments = await Assessment.find(query)
      .populate('course', 'title')
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      count: assessments.length,
      assessments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single assessment with course completion status
// @route   GET /api/assessments/:id/with-course
// @access  Private/Learner
exports.getAssessmentWithCourse = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate('course', 'title');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Don't send correct answers to learners
    let questions = assessment.questions;
    if (req.user.role === 'Learner') {
      questions = assessment.questions.map(q => ({
        _id: q._id,
        question: q.question,
        type: q.type,
        options: q.options,
        points: q.points
      }));
    }

    // Check user's course completion status
    let courseCompleted = false;
    if (assessment.course) {
      const user = await User.findById(req.user.id);
      const enrollment = user.enrolledCourses.find(
        e => e.course.toString() === assessment.course._id.toString()
      );
      courseCompleted = enrollment && enrollment.status === 'Completed';
    }

    // Check if user has already passed
    const passedResult = await AssessmentResult.findOne({
      assessment: assessment._id,
      user: req.user.id,
      passed: true
    });

    res.status(200).json({
      success: true,
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        course: assessment.course,
        questions,
        status: assessment.status,
        duration: assessment.duration,
        passingScore: assessment.passingScore,
        attempts: assessment.attempts,
        attemptNumber: passedResult ? passedResult.attemptNumber : null
      },
      courseCompleted,
      alreadyPassed: !!passedResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single assessment
// @route   GET /api/assessments/:id
// @access  Private
exports.getAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate('course', 'title');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Don't send correct answers to learners
    if (req.user.role === 'Learner') {
      assessment.questions = assessment.questions.map(q => ({
        _id: q._id,
        question: q.question,
        type: q.type,
        options: q.options,
        points: q.points
      }));
    }

    res.status(200).json({
      success: true,
      assessment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create assessment
// @route   POST /api/assessments
// @access  Private/Trainer/Admin
exports.createAssessment = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;

    // Validate title
    if (!req.body.title || req.body.title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Assessment title is required'
      });
    }

    // Validate that assessment has at least one question
    if (!req.body.questions || req.body.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Assessment must have at least one question'
      });
    }

    // Validate each question has required fields
    for (let i = 0; i < req.body.questions.length; i++) {
      const q = req.body.questions[i];
      
      if (!q.question || q.question.trim() === '') {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: Question text is required`
        });
      }
      
      if (!q.type) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: Question type is required`
        });
      }
      
      if (q.points === undefined || q.points === null || q.points < 1) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: Points must be at least 1`
        });
      }
      
      // Validate options for MCQ type
      if (q.type === 'MCQ') {
        if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: MCQ questions must have at least 2 options`
          });
        }
        
        // Check if options have content (non-empty strings)
        const validOptions = q.options.filter(opt => opt && opt.trim() !== '');
        if (validOptions.length < 2) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: At least 2 options must have text`
          });
        }
      }
      
      // Validate correct answer
      if (!q.correctAnswer || q.correctAnswer.trim() === '') {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: Correct answer is required`
        });
      }
      
      // For MCQ, validate correct answer exists in options
      if (q.type === 'MCQ' && q.options) {
        const optionExists = q.options.some(
          opt => opt && opt.trim() !== '' && opt.trim() === q.correctAnswer.trim()
        );
        if (!optionExists) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: Correct answer must match one of the options`
          });
        }
      }
    }

    const assessment = await Assessment.create(req.body);

    res.status(201).json({
      success: true,
      assessment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update assessment
// @route   PUT /api/assessments/:id
// @access  Private/Trainer/Admin
exports.updateAssessment = async (req, res) => {
  try {
    // Validate questions if provided
    if (req.body.questions && req.body.questions.length > 0) {
      // Validate title
      if (req.body.title && (!req.body.title.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Assessment title cannot be empty'
        });
      }

      // Validate each question has required fields
      for (let i = 0; i < req.body.questions.length; i++) {
        const q = req.body.questions[i];
        
        if (!q.question || q.question.trim() === '') {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: Question text is required`
          });
        }
        
        if (!q.type) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: Question type is required`
          });
        }
        
        if (q.points === undefined || q.points === null || q.points < 1) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: Points must be at least 1`
          });
        }
        
        // Validate options for MCQ type
        if (q.type === 'MCQ') {
          if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
            return res.status(400).json({
              success: false,
              message: `Question ${i + 1}: MCQ questions must have at least 2 options`
            });
          }
          
          // Check if options have content (non-empty strings)
          const validOptions = q.options.filter(opt => opt && opt.trim() !== '');
          if (validOptions.length < 2) {
            return res.status(400).json({
              success: false,
              message: `Question ${i + 1}: At least 2 options must have text`
            });
          }
        }
        
        // Validate correct answer
        if (!q.correctAnswer || q.correctAnswer.trim() === '') {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: Correct answer is required`
          });
        }
        
        // For MCQ, validate correct answer exists in options
        if (q.type === 'MCQ' && q.options) {
          const optionExists = q.options.some(
            opt => opt && opt.trim() !== '' && opt.trim() === q.correctAnswer.trim()
          );
          if (!optionExists) {
            return res.status(400).json({
              success: false,
              message: `Question ${i + 1}: Correct answer must match one of the options`
            });
          }
        }
      }
    }

    const assessment = await Assessment.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    res.status(200).json({
      success: true,
      assessment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete assessment
// @route   DELETE /api/assessments/:id
// @access  Private/Admin
exports.deleteAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findByIdAndDelete(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Assessment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Submit assessment
// @route   POST /api/assessments/:id/submit
// @access  Private/Learner
exports.submitAssessment = async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;

    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Check if assessment has questions
    if (!assessment.questions || assessment.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'This assessment has no questions'
      });
    }

    // Check if assessment is published
    if (assessment.status !== 'Published') {
      return res.status(400).json({
        success: false,
        message: 'This assessment is not available for taking'
      });
    }

    // Variable to store enrollment for later use
    let enrollment = null;

    // Check if user is enrolled in the course (if assessment is course-specific)
    if (assessment.course) {
      const user = await User.findById(req.user.id);
      enrollment = user.enrolledCourses.find(
        e => e.course.toString() === assessment.course.toString()
      );
      
      if (!enrollment) {
        return res.status(403).json({
          success: false,
          message: 'You must be enrolled in this course to take this assessment'
        });
      }

      // Check if course is completed
      if (enrollment.status !== 'Completed') {
        return res.status(403).json({
          success: false,
          message: 'You must complete all lessons in the course before taking this assessment'
        });
      }
    }

    // Check attempt count - allow unlimited retakes even if passed
    const previousAttempts = await AssessmentResult.countDocuments({
      assessment: assessment._id,
      user: req.user.id
    });

    if (previousAttempts >= assessment.attempts) {
      return res.status(400).json({
        success: false,
        message: 'Maximum attempts reached'
      });
    }

    // Validate answers
    if (!answers || answers.length !== assessment.questions.length) {
      return res.status(400).json({
        success: false,
        message: `Please answer all ${assessment.questions.length} questions`
      });
    }

    // Auto-evaluate
    let totalPoints = 0;
    let earnedPoints = 0;
    const evaluatedAnswers = [];

    assessment.questions.forEach((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      
      totalPoints += question.points;
      if (isCorrect) {
        earnedPoints += question.points;
      }

      evaluatedAnswers.push({
        question: question._id,
        selectedAnswer: userAnswer,
        isCorrect,
        points: isCorrect ? question.points : 0
      });
    });

    const percentage = (earnedPoints / totalPoints) * 100;
    const passed = percentage >= assessment.passingScore;

    // Save result
    const result = await AssessmentResult.create({
      assessment: assessment._id,
      user: req.user.id,
      answers: evaluatedAnswers,
      score: earnedPoints,
      percentage,
      passed,
      attemptNumber: previousAttempts + 1,
      timeTaken
    });

    // STRICT RULE: Certificate can ONLY be generated if:
    // 1. Assessment is passed with 90%+
    // 2. Course progress is 90%+
    // 3. Certificate doesn't already exist
    let certificate = null;
    let certificateMessage = null;
    
    if (passed && assessment.course && enrollment) {
      const courseProgress = enrollment.progress || 0;
      const hasRequiredCourseProgress = courseProgress >= 90;
      const hasRequiredAssessmentScore = percentage >= 90;
      
      // Check if certificate already exists
      const existingCert = await Certificate.findOne({
        user: req.user.id,
        course: assessment.course
      });

      // Only generate certificate if BOTH course progress AND assessment score are 90%+
      if (!existingCert && hasRequiredCourseProgress && hasRequiredAssessmentScore) {
        // Generate unique certificate number
        const certCount = await Certificate.countDocuments();
        const certificateNumber = `CERT-${Date.now().toString(36).toUpperCase()}-${(certCount + 1).toString().padStart(4, '0')}`;

        certificate = await Certificate.create({
          user: req.user.id,
          course: assessment.course,
          assessment: assessment._id,
          certificateNumber,
          issuedDate: new Date(),
          completionDate: new Date(),
          finalScore: percentage
        });

        // Create certificate notification
        await Notification.create({
          user: req.user.id,
          type: 'Certificate',
          title: 'Certificate Earned!',
          message: `Congratulations! You have earned a certificate for completing ${assessment.title} with ${percentage.toFixed(0)}%`,
          link: `/certificates/${certificate._id}`
        });
        
        certificateMessage = 'Congratulations! You have earned your certificate by completing both the course and assessment with 90% or higher.';
      } else if (!existingCert && !hasRequiredCourseProgress) {
        // Assessment passed but course not complete enough
        certificateMessage = `You passed the assessment with ${percentage.toFixed(0)}%! Complete the course to ${Math.max(90 - courseProgress, 0)}% more to earn your certificate.`;
      } else if (!existingCert && !hasRequiredAssessmentScore) {
        // Assessment passed but score not high enough
        certificateMessage = `You passed the assessment with ${percentage.toFixed(0)}%. You need 90% or higher to earn a certificate. Retake to improve your score.`;
      }
    }

    // Create assessment result notification
    const notificationMessage = certificate 
      ? `You scored ${percentage.toFixed(0)}% on ${assessment.title}. ${certificateMessage}`
      : `You scored ${percentage.toFixed(0)}% on ${assessment.title}. ${passed ? (certificateMessage || 'Great job!') : 'Keep learning and try again.'}`;
    
    await Notification.create({
      user: req.user.id,
      type: passed ? 'Assessment' : 'Assessment',
      title: passed ? 'Assessment Passed!' : 'Assessment Completed',
      message: notificationMessage,
      link: `/assessments/${assessment._id}/results/${result._id}`,
      metadata: {
        assessment: assessment._id,
        passed,
        certificateId: certificate?._id,
        courseProgress: enrollment?.progress || 0,
        certificateMessage: certificateMessage
      }
    });

    res.status(200).json({
      success: true,
      result: {
        score: earnedPoints,
        totalPoints,
        percentage,
        passed,
        attemptNumber: previousAttempts + 1,
        certificateId: certificate?._id,
        certificateMessage: certificateMessage,
        courseProgressRequired: 90,
        currentCourseProgress: enrollment?.progress || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get assessment results
// @route   GET /api/assessments/:id/results
// @access  Private
exports.getResults = async (req, res) => {
  try {
    const results = await AssessmentResult.find({
      assessment: req.params.id,
      user: req.user.id
    }).sort('-createdAt');

    res.status(200).json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current user's all assessment results
// @route   GET /api/assessments/my-results
// @access  Private
exports.getMyResults = async (req, res) => {
  try {
    const results = await AssessmentResult.find({
      user: req.user.id
    })
    .populate('assessment', 'title course')
    .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
