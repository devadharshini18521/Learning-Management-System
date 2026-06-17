const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateProfile,
  changePassword
} = require('../controllers/user.controller');
const { protect, authorizeWithPermission, authorizeResource } = require('../middleware/auth.middleware');

router.use(protect);

// Get all users - requires users:read permission (Admin/HR can see all users)
router
  .route('/')
  .get(authorizeWithPermission('users:read'), getUsers)
  .post(authorizeWithPermission('users:create'), createUser);

// Get single user - requires authentication (users can see their own profile)
router
  .route('/:id')
  .get(authorizeResource('id'), getUser)
  .put(authorizeResource('id'), authorizeWithPermission('users:update'), updateUser)
  .delete(authorizeWithPermission('users:delete'), deleteUser);

// Profile routes - for current user
router
  .route('/profile')
  .put(updateProfile);

router
  .route('/change-password')
  .put(changePassword);

module.exports = router;
