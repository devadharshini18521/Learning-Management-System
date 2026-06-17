const express = require('express');
const router = express.Router();
const {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle
} = require('../controllers/knowledge.controller');
const { protect, authorizeWithPermission, authorizeResource } = require('../middleware/auth.middleware');

router.use(protect);

// Get all articles - requires authentication (all roles can read)
router
  .route('/')
  .get(authorizeWithPermission('knowledge:read'), getArticles)
  .post(authorizeWithPermission('knowledge:create'), createArticle);

// Get single article - requires authentication
router
  .route('/:id')
  .get(authorizeWithPermission('knowledge:read'), getArticle)
  .put(authorizeWithPermission('knowledge:update'), updateArticle)
  .delete(authorizeWithPermission('knowledge:delete'), deleteArticle);

module.exports = router;
