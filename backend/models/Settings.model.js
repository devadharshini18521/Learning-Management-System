const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  organization: {
    name: {
      type: String,
      default: 'Zoho Learning'
    },
    logo: {
      type: String,
      default: null
    },
    primaryColor: {
      type: String,
      default: '#6366f1'
    },
    secondaryColor: {
      type: String,
      default: '#8b5cf6'
    },
    favicon: {
      type: String,
      default: null
    }
  },
  email: {
    fromName: {
      type: String,
      default: 'Zoho Learning'
    },
    fromEmail: {
      type: String,
      default: 'noreply@zoholearning.com'
    },
    enableNotifications: {
      type: Boolean,
      default: true
    }
  },
  features: {
    enableCertificates: {
      type: Boolean,
      default: true
    },
    enableKnowledgeBase: {
      type: Boolean,
      default: true
    },
    enableAssessments: {
      type: Boolean,
      default: true
    },
    enableDiscussions: {
      type: Boolean,
      default: false
    }
  },
  security: {
    passwordMinLength: {
      type: Number,
      default: 6
    },
    sessionTimeout: {
      type: Number,
      default: 60 // minutes
    },
    maxLoginAttempts: {
      type: Number,
      default: 5
    }
  },
  learningPolicies: {
    requireCourseApproval: {
      type: Boolean,
      default: false
    },
    allowSelfEnrollment: {
      type: Boolean,
      default: true
    },
    defaultCourseVisibility: {
      type: String,
      enum: ['public', 'private', 'hidden'],
      default: 'public'
    },
    certificateValidity: {
      type: Number,
      default: 0 // 0 = lifetime
    },
    requireAssessmentPassing: {
      type: Boolean,
      default: true
    },
    assessmentPassingScore: {
      type: Number,
      default: 70
    },
    enableGamification: {
      type: Boolean,
      default: false
    },
    showLeaderboard: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
