const express = require('express');
const router = express.Router();
const {
  getCertificates,
  getCertificate,
  generateCertificate,
  verifyCertificate,
  downloadCertificate
} = require('../controllers/certificate.controller');
const { protect, authorizeWithPermission } = require('../middleware/auth.middleware');

router.use(protect);

// Get all certificates - requires certificates:read permission
router.get('/', authorizeWithPermission('certificates:read'), getCertificates);

// Generate certificate - requires certificates:create permission
router.post('/generate', authorizeWithPermission('certificates:create'), generateCertificate);

// Verify certificate - public route (no auth required)
router.get('/verify/:certificateId', verifyCertificate);

// Download certificate as PDF - requires certificates:read permission
router.get('/:id/download', authorizeWithPermission('certificates:read'), downloadCertificate);

// Get single certificate by ID or certificateId - requires certificates:read permission
router.get('/:id', authorizeWithPermission('certificates:read'), getCertificate);

module.exports = router;
