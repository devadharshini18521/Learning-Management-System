const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  unenrollCourse,
  updateProgress,
  completeLesson,
  completeCourse
} = require('../controllers/course.controller');
const { protect, authorizeWithPermission, authorizeResource } = require('../middleware/auth.middleware');

router.use(protect);

// Get all courses - any authenticated user with read permission
router
  .route('/')
  .get(authorizeWithPermission('courses:read'), getCourses)
  .post(authorizeWithPermission('courses:create'), createCourse);

// Get single course - requires read permission
router
  .route('/:id')
  .get(authorizeWithPermission('courses:read'), getCourse)
  .put(authorizeWithPermission('courses:update'), updateCourse)
  .delete(authorizeWithPermission('courses:delete'), deleteCourse);

// Enroll in a course - users can enroll themselves
router.post('/:id/enroll', authorizeWithPermission('courses:write'), enrollCourse);

// Unenroll from a course
router.post('/:id/unenroll', authorizeWithPermission('courses:write'), unenrollCourse);

// Update progress - users can update their own progress
router.put('/:id/progress', authorizeWithPermission('courses:write'), updateProgress);

// Complete a single lesson
router.post('/:id/complete-lesson', completeLesson);

// Complete entire course
router.post('/:id/complete', completeCourse);

module.exports = router;
