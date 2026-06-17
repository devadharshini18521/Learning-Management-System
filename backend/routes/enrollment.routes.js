const express = require('express');
const router = express.Router();
const {
  getAllEnrollments,
  getUserEnrollments,
  getCourseEnrollments,
  bulkEnrollUsers,
  enrollUser,
  updateEnrollment,
  removeEnrollment,
  getEnrollmentStats
} = require('../controllers/enrollment.controller');
const { protect, authorizeWithPermission } = require('../middleware/auth.middleware');

router.use(protect);

// Get enrollment statistics - requires analytics:read permission
router.get('/stats', authorizeWithPermission('analytics:read'), getEnrollmentStats);

// Get all enrollments with filtering - requires enrollments:read permission
router.get('/', authorizeWithPermission('enrollments:read'), getAllEnrollments);

// Bulk enroll users - requires enrollments:create permission
router.post('/bulk', authorizeWithPermission('enrollments:create'), bulkEnrollUsers);

// Enroll a single user - requires enrollments:create permission
router.post('/', authorizeWithPermission('enrollments:create'), enrollUser);

// Get enrollments for a specific user
router.get('/user/:userId', authorizeWithPermission('enrollments:read'), getUserEnrollments);

// Get enrollments for a specific course
router.get('/course/:courseId', authorizeWithPermission('enrollments:read'), getCourseEnrollments);

// Update enrollment progress
router.put('/:userId/:courseId', authorizeWithPermission('enrollments:update'), updateEnrollment);

// Remove enrollment - requires enrollments:update permission
router.delete('/:userId/:courseId', authorizeWithPermission('enrollments:update'), removeEnrollment);

module.exports = router;
