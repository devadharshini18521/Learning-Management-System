const express = require('express');
const router = express.Router();
const {
  getDashboardAnalytics,
  getLearnerAnalytics,
  getCourseAnalytics,
  exportReport,
  getEnrollmentTrends
} = require('../controllers/analytics.controller');
const { protect, authorizeWithPermission } = require('../middleware/auth.middleware');

router.use(protect);

// Dashboard analytics - Admin/HR/Trainer can view
router.get('/dashboard', authorizeWithPermission('analytics:read'), getDashboardAnalytics);

// Learner analytics - users can view their own analytics
router.get('/learner', getLearnerAnalytics);

// Course analytics - Admin/Trainer can view course-specific analytics
router.get('/course/:id', authorizeWithPermission('analytics:read'), getCourseAnalytics);

// Enrollment trends - Admin/Trainer can view
router.get('/enrollment-trends', authorizeWithPermission('analytics:read'), getEnrollmentTrends);

// Export reports - only Admin can export
router.get('/export', authorizeWithPermission('analytics:export'), exportReport);

module.exports = router;
