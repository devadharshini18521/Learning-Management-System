const KnowledgeBase = require('../models/KnowledgeBase.model');

// @desc    Get all articles
// @route   GET /api/knowledge
// @access  Private
exports.getArticles = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const query = {};

    if (req.user.role === 'Learner') {
      query.status = 'Published';
    }

    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const articles = await KnowledgeBase.find(query)
      .populate('createdBy', 'name email avatar')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: articles.length,
      articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single article
// @route   GET /api/knowledge/:id
// @access  Private
exports.getArticle = async (req, res) => {
  try {
    const article = await KnowledgeBase.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('versions.editedBy', 'name email');

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Increment views
    article.views += 1;
    await article.save();

    res.status(200).json({
      success: true,
      article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create article
// @route   POST /api/knowledge
// @access  Private/Trainer/Admin
exports.createArticle = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;

    const article = await KnowledgeBase.create(req.body);

    res.status(201).json({
      success: true,
      article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update article
// @route   PUT /api/knowledge/:id
// @access  Private/Trainer/Admin
exports.updateArticle = async (req, res) => {
  try {
    const article = await KnowledgeBase.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Save version before update
    if (req.body.content && req.body.content !== article.content) {
      article.versions.push({
        content: article.content,
        editedBy: req.user.id,
        changeNote: req.body.changeNote || 'Content updated'
      });
    }

    Object.assign(article, req.body);
    await article.save();

    res.status(200).json({
      success: true,
      article
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete article
// @route   DELETE /api/knowledge/:id
// @access  Private/Admin
exports.deleteArticle = async (req, res) => {
  try {
    const article = await KnowledgeBase.findByIdAndDelete(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
