const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Video', 'PDF', 'Link', 'Text'],
    required: true
  },
  content: {
    type: String,
    required: true // URL for video/pdf/link, or text content
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  order: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    required: true
  },
  lessons: [lessonSchema]
}, {
  timestamps: true
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a course title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a course description']
  },
  thumbnail: {
    type: String,
    default: null
  },
  category: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  duration: {
    type: Number, // Total duration in minutes
    default: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Published'],
    default: 'Draft'
  },
  modules: [moduleSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrolledUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assessment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    default: null
  },
  tags: [String],
  prerequisites: [String],
  learningObjectives: [String]
}, {
  timestamps: true
});

// Calculate total duration
courseSchema.pre('save', function(next) {
  let totalDuration = 0;
  this.modules.forEach(module => {
    module.lessons.forEach(lesson => {
      totalDuration += lesson.duration || 0;
    });
  });
  this.duration = totalDuration;
  next();
});

module.exports = mongoose.model('Course', courseSchema);
