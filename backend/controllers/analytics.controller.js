const User = require('../models/User.model');
const Course = require('../models/Course.model');
const { Assessment, AssessmentResult } = require('../models/Assessment.model');
const Certificate = require('../models/Certificate.model');

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private/Admin/Trainer
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalCertificates = await Certificate.countDocuments();
    
    const activeUsers = await User.countDocuments({ status: 'Active' });
    const publishedCourses = await Course.countDocuments({ status: 'Published' });

    // Enrollment stats
    const users = await User.find().select('enrolledCourses');
    let totalEnrollments = 0;
    let completedCourses = 0;
    
    users.forEach(user => {
      totalEnrollments += user.enrolledCourses.length;
      completedCourses += user.enrolledCourses.filter(e => e.status === 'Completed').length;
    });

    // Assessment stats
    const assessmentResults = await AssessmentResult.find();
    const passedAssessments = assessmentResults.filter(r => r.passed).length;
    const averageScore = assessmentResults.length > 0
      ? assessmentResults.reduce((sum, r) => sum + r.percentage, 0) / assessmentResults.length
      : 0;

    // Top courses
    const topCourses = await Course.find({ status: 'Published' })
      .sort({ 'enrolledUsers.length': -1 })
      .limit(5)
      .select('title enrolledUsers category');

    // Recent enrollments
    const recentEnrollments = await User.find()
      .select('name email enrolledCourses')
      .populate('enrolledCourses.course', 'title')
      .sort('-enrolledCourses.enrolledAt')
      .limit(10);

    // Recent assessment results
    const recentAssessmentResults = await AssessmentResult.find()
      .populate('user', 'name email')
      .populate('assessment', 'title')
      .sort('-createdAt')
      .limit(10);

    // All assessments with results
    const allAssessments = await Assessment.find()
      .select('title questions duration status createdBy')
      .populate('createdBy', 'name')
      .sort('-createdAt');

    // Calculate assessment stats per assessment
    const assessmentsWithStats = await Promise.all(
      allAssessments.map(async (assessment) => {
        const results = await AssessmentResult.find({ assessment: assessment._id });
        const totalAttempts = results.length;
        const passedAttempts = results.filter(r => r.passed).length;
        const averageScore = totalAttempts > 0
          ? results.reduce((sum, r) => sum + r.percentage, 0) / totalAttempts
          : 0;

        return {
          _id: assessment._id,
          title: assessment.title,
          status: assessment.status,
          createdBy: assessment.createdBy,
          totalAttempts,
          passedAttempts,
          failedAttempts: totalAttempts - passedAttempts,
          averageScore: averageScore.toFixed(2),
          lastAttempt: results.length > 0 ? results[0].createdAt : null
        };
      })
    );

    res.status(200).json({
      success: true,
      analytics: {
        overview: {
          totalUsers,
          activeUsers,
          totalCourses,
          publishedCourses,
          totalEnrollments,
          completedCourses,
          totalCertificates
        },
        assessments: {
          totalAttempts: assessmentResults.length,
          passedAssessments,
          averageScore: averageScore.toFixed(2)
        },
        topCourses,
        recentEnrollments,
        recentAssessmentResults,
        assessments: assessmentsWithStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get learner analytics
// @route   GET /api/analytics/learner
// @access  Private/Learner
exports.getLearnerAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('enrolledCourses.course', 'title description thumbnail category level duration modules');

    const certificates = await Certificate.find({ user: req.user.id });
    const assessmentResults = await AssessmentResult.find({ user: req.user.id })
      .populate('assessment', 'title');

    // Filter out orphaned enrollments (courses that have been deleted)
    const validEnrolledCourses = user.enrolledCourses.filter(
      enrollment => enrollment.course !== null
    );

    const totalCourses = validEnrolledCourses.length;
    const completedCourses = validEnrolledCourses.filter(e => e.status === 'Completed').length;
    const inProgressCourses = totalCourses - completedCourses;
    
    const averageProgress = totalCourses > 0
      ? validEnrolledCourses.reduce((sum, e) => sum + e.progress, 0) / totalCourses
      : 0;

    const passedAssessments = assessmentResults.filter(r => r.passed).length;
    const averageAssessmentScore = assessmentResults.length > 0
      ? assessmentResults.reduce((sum, r) => sum + r.percentage, 0) / assessmentResults.length
      : 0;

    // Get available assessments - only show assessments for courses the learner is enrolled in
    // and has completed (or is eligible to take)
    const enrolledCourseIds = validEnrolledCourses
      .filter(e => e.course && e.course._id)
      .map(e => e.course._id.toString());
    
    const availableAssessments = await Assessment.find({
      course: { $in: enrolledCourseIds },
      status: 'Published' // Only show published assessments
    })
      .select('title description course questions duration passingScore status')
      .populate('course', 'title')
      .sort('-createdAt');

    // Get user's assessment results by assessment ID for quick lookup
    const userResultsMap = {};
    assessmentResults.forEach(result => {
      if (result.assessment) {
        userResultsMap[result.assessment.toString()] = result;
      }
    });

    // Map assessments with user's results
    const assessmentsWithStatus = availableAssessments.map(assessment => {
      const result = userResultsMap[assessment._id.toString()];
      return {
        _id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        course: assessment.course,
        questions: assessment.questions,
        duration: assessment.duration,
        passingScore: assessment.passingScore,
        status: assessment.status,
        userAttempted: !!result,
        userScore: result ? result.percentage : null,
        userPassed: result ? result.passed : null,
        attemptNumber: result ? result.attemptNumber : 0,
        lastAttempt: result ? result.createdAt : null
      };
    });

    // Get pending assessments (not attempted yet)
    const pendingAssessments = assessmentsWithStatus.filter(a => !a.userAttempted);
    
    // Get completed assessments (attempted)
    const completedAssessments = assessmentsWithStatus.filter(a => a.userAttempted);

    res.status(200).json({
      success: true,
      analytics: {
        courses: {
          total: totalCourses,
          completed: completedCourses,
          inProgress: inProgressCourses,
          averageProgress: averageProgress.toFixed(2)
        },
        assessments: {
          total: assessmentResults.length,
          passed: passedAssessments,
          averageScore: averageAssessmentScore.toFixed(2),
          pending: pendingAssessments.length,
          completed: completedAssessments.length
        },
        certificates: {
          total: certificates.length
        },
        enrolledCourses: validEnrolledCourses,
        availableAssessments: assessmentsWithStatus,
        recentAssessments: assessmentResults.slice(0, 5)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get course analytics
// @route   GET /api/analytics/course/:id
// @access  Private/Admin/Trainer
exports.getCourseAnalytics = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('enrolledUsers', 'name email');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const users = await User.find({
      'enrolledCourses.course': course._id
    }).select('name email enrolledCourses');

    const enrollmentData = users.map(user => {
      const enrollment = user.enrolledCourses.find(
        e => e.course.toString() === course._id.toString()
      );
      return {
        user: {
          name: user.name,
          email: user.email
        },
        enrolledAt: enrollment.enrolledAt,
        progress: enrollment.progress,
        status: enrollment.status
      };
    });

    const completedCount = enrollmentData.filter(e => e.status === 'Completed').length;
    const averageProgress = enrollmentData.length > 0
      ? enrollmentData.reduce((sum, e) => sum + e.progress, 0) / enrollmentData.length
      : 0;

    res.status(200).json({
      success: true,
      analytics: {
        course: {
          title: course.title,
          totalEnrollments: enrollmentData.length,
          completed: completedCount,
          averageProgress: averageProgress.toFixed(2)
        },
        enrollments: enrollmentData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Export report to CSV
// @route   GET /api/analytics/export
// @access  Private/Admin/Trainer
exports.exportReport = async (req, res) => {
  try {
    const { type } = req.query; // 'users', 'courses', 'enrollments', 'assessments'

    let data = [];
    let headers = [];

    switch (type) {
      case 'users':
        const users = await User.find().select('-password');
        headers = ['Name', 'Email', 'Role', 'Status', 'Department', 'Created At'];
        data = users.map(u => [
          u.name,
          u.email,
          u.role,
          u.status,
          u.department || 'N/A',
          new Date(u.createdAt).toLocaleDateString()
        ]);
        break;

      case 'courses':
        const courses = await Course.find();
        headers = ['Title', 'Category', 'Level', 'Status', 'Enrollments', 'Duration'];
        data = courses.map(c => [
          c.title,
          c.category,
          c.level,
          c.status,
          c.enrolledUsers.length,
          `${c.duration} mins`
        ]);
        break;

      case 'assessments':
        const results = await AssessmentResult.find()
          .populate('user', 'name email')
          .populate('assessment', 'title');
        headers = ['User', 'Assessment', 'Score', 'Percentage', 'Passed', 'Date'];
        data = results.map(r => [
          r.user.name,
          r.assessment.title,
          r.score,
          `${r.percentage.toFixed(2)}%`,
          r.passed ? 'Yes' : 'No',
          new Date(r.createdAt).toLocaleDateString()
        ]);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }

    // Convert to CSV
    const csv = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get enrollment trends
// @route   GET /api/analytics/enrollment-trends
// @access  Private/Admin/Trainer
exports.getEnrollmentTrends = async (req, res) => {
  try {
    const { period = '6months' } = req.query;
    
    // Calculate start date based on period
    const months = period === '1year' ? 12 : 6;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    // Get all users with enrollment data
    const users = await User.find({
      'enrolledCourses.enrolledAt': { $gte: startDate }
    }).select('enrolledCourses');
    
    // Aggregate enrollments by month
    const enrollmentByMonth = {};
    
    // Initialize all months with 0
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      enrollmentByMonth[key] = 0;
    }
    
    // Count enrollments per month
    users.forEach(user => {
      user.enrolledCourses.forEach(enrollment => {
        if (enrollment.enrolledAt && enrollment.enrolledAt >= startDate) {
          const date = new Date(enrollment.enrolledAt);
          const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          if (enrollmentByMonth.hasOwnProperty(key)) {
            enrollmentByMonth[key]++;
          }
        }
      });
    });
    
    // Format for chart
    const enrollmentData = Object.entries(enrollmentByMonth).map(([name, enrollments]) => ({
      name,
      enrollments
    }));
    
    res.status(200).json({
      success: true,
      enrollmentData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
