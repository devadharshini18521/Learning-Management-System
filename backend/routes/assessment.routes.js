const express = require('express');
const router = express.Router();
const {
  getAssessments,
  getAssessment,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  submitAssessment,
  getResults,
  getAssessmentWithCourse,
  getMyResults
} = require('../controllers/assessment.controller');
const { protect, authorizeWithPermission, authorizeResource } = require('../middleware/auth.middleware');

router.use(protect);

// Get all assessments - requires authentication
router
  .route('/')
  .get(authorizeWithPermission('assessments:read'), getAssessments)
  .post(authorizeWithPermission('assessments:create'), createAssessment);

// Get current user's assessment results (must be before /:id routes)
router.get('/my-results', getMyResults);

// Get single assessment with course completion status
router.get('/:id/with-course', getAssessmentWithCourse);

// Get single assessment - requires authentication
router
  .route('/:id')
  .get(authorizeWithPermission('assessments:read'), getAssessment)
  .put(authorizeWithPermission('assessments:update'), updateAssessment)
  .delete(authorizeWithPermission('assessments:delete'), deleteAssessment);

// Submit assessment - requires authentication (any authenticated user)
router.post('/:id/submit', protect, submitAssessment);

// Get results - depends on role (own results or grading permission)
router.get('/:id/results', authorizeWithPermission('assessments:view-results'));

module.exports = router;
