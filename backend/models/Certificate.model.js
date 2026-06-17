const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: false
  },
  certificateNumber: {
    type: String,
    unique: true
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date,
    required: true
  },
  finalScore: {
    type: Number,
    default: 100
  },
  certificateUrl: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Active', 'Revoked'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Generate unique certificate number
certificateSchema.pre('save', async function(next) {
  if (!this.certificateNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.certificateNumber = `ZOHO-${year}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Certificate', certificateSchema);
