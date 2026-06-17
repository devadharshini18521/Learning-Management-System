const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  editedAt: {
    type: Date,
    default: Date.now
  },
  changeNote: {
    type: String,
    default: ''
  }
});

const knowledgeBaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide an article title'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Please provide article content']
  },
  category: {
    type: String,
    required: true
  },
  tags: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['Draft', 'Published'],
    default: 'Draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  versions: [versionSchema],
  views: {
    type: Number,
    default: 0
  },
  helpful: {
    type: Number,
    default: 0
  },
  notHelpful: {
    type: Number,
    default: 0
  },
  attachments: [{
    name: String,
    url: String,
    type: String
  }]
}, {
  timestamps: true
});

// Add version on update
knowledgeBaseSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  if (update.content) {
    const doc = await this.model.findOne(this.getQuery());
    if (doc) {
      doc.versions.push({
        content: doc.content,
        editedBy: update.editedBy || doc.createdBy,
        changeNote: update.changeNote || 'Updated content'
      });
      await doc.save();
    }
  }
  next();
});

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
