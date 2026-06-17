const Settings = require('../models/Settings.model');
const { auditActions } = require('../utils/audit');

// @desc    Get settings
// @route   GET /api/settings
// @access  Private/Admin
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update settings
// @route   PUT /api/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
  try {
    // Get previous settings for audit log
    let previousSettings = await Settings.findOne();
    const previousState = previousSettings ? previousSettings.toObject() : {};

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }

    // Log the settings update
    if (req.audit && auditActions.updateSettings) {
      auditActions.updateSettings(req, previousState, settings.toObject());
    }

    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
