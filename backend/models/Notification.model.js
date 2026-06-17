const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['Enrollment', 'Assessment', 'Certificate', 'Announcement', 'Reminder'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  metadata: {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
