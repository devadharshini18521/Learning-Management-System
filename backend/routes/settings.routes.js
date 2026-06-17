const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings
} = require('../controllers/settings.controller');
const { protect, authorizeWithPermission } = require('../middleware/auth.middleware');

router.use(protect);

// Settings - only Super Admin can view/update settings
router.route('/')
  .get(authorizeWithPermission('settings:read'), getSettings)
  .put(authorizeWithPermission('settings:update'), updateSettings);

module.exports = router;
