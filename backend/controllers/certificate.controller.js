const Certificate = require('../models/Certificate.model');
const User = require('../models/User.model');
const Course = require('../models/Course.model');
const { AssessmentResult } = require('../models/Assessment.model');
const puppeteer = require('puppeteer-core');

// Professional certificate HTML template - Figma Design
const generateCertificateHTML = (certificate, user, course) => {
  const completionDate = new Date(certificate.completionDate || certificate.issuedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Get first and last name for signature
  const nameParts = user.name.split(' ');
  const signatureName = nameParts.length > 1 
    ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
    : user.name;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate of Completion</title>
  <style>
    @page { 
      size: A4 landscape; 
      margin: 0; 
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body { 
      margin: 0; 
      padding: 0; 
      font-family: 'Georgia', 'Times New Roman', serif;
      background: #f1f5f9;
      width: 100%;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .certificate {
      position: relative;
      width: 1123px;
      height: 794px;
      background: white;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    /* Decorative Corner Elements */
    .corner-tl {
      position: absolute;
      top: 0;
      left: 0;
      width: 128px;
      height: 128px;
      border-top: 4px solid #1e3a5f;
      border-left: 4px solid #1e3a5f;
    }
    .corner-tr {
      position: absolute;
      top: 0;
      right: 0;
      width: 128px;
      height: 128px;
      border-top: 4px solid #1e3a5f;
      border-right: 4px solid #1e3a5f;
    }
    .corner-bl {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 128px;
      height: 128px;
      border-bottom: 4px solid #1e3a5f;
      border-left: 4px solid #1e3a5f;
    }
    .corner-br {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 128px;
      height: 128px;
      border-bottom: 4px solid #1e3a5f;
      border-right: 4px solid #1e3a5f;
    }
    /* Inner Border */
    .inner-border {
      position: absolute;
      inset: 32px;
      border: 2px solid #e2e8f0;
      pointer-events: none;
    }
    /* Main Content */
    .content {
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      height: 100%;
      padding: 64px 96px;
    }
    /* Header Section */
    .header-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }
    .logo {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e3a5f 0%, #2c5f8d 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }
    .logo svg {
      width: 40px;
      height: 40px;
      color: white;
    }
    .decorative-line {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .line-left, .line-right {
      width: 96px;
      height: 1px;
      background: linear-gradient(to right, transparent, #c9a961);
    }
    .line-right {
      background: linear-gradient(to left, transparent, #c9a961);
    }
    .line-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #c9a961;
    }
    .certificate-title {
      text-align: center;
    }
    .certificate-title h1 {
      font-size: 48px;
      letter-spacing: 0.1em;
      color: #1e3a5f;
      font-family: Georgia, serif;
      font-weight: normal;
      margin: 0;
    }
    .certificate-title p {
      font-size: 20px;
      letter-spacing: 0.2em;
      color: #64748b;
      margin-top: 8px;
    }
    /* Body Section */
    .body-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 32px;
      text-align: center;
      max-width: 768px;
    }
    .certify-text {
      font-size: 18px;
      color: #475569;
      line-height: 1.6;
    }
    .recipient-name {
      position: relative;
    }
    .recipient-name h2 {
      font-size: 48px;
      font-family: Georgia, serif;
      color: #1e3a5f;
      padding: 0 32px;
      font-weight: normal;
      margin: 0;
    }
    .recipient-underline {
      margin-top: 12px;
      height: 1px;
      background: linear-gradient(to right, transparent, #cbd5e1, transparent);
    }
    .course-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .course-info p {
      font-size: 18px;
      color: #475569;
    }
    .course-info h3 {
      font-size: 24px;
      font-weight: 600;
      color: #2c5f8d;
      padding: 0 16px;
    }
    .course-info .lms-text {
      font-size: 16px;
      color: #64748b;
    }
    /* Footer Section */
    .footer-section {
      width: 100%;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      align-items: end;
      gap: 32px;
    }
    .date-column, .signature-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .date-column p:first-child, .signature-column .title {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .date-column p:last-child {
      font-size: 16px;
      font-weight: 600;
      color: #1e3a5f;
    }
    .seal-column {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .seal {
      position: relative;
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e3a5f 0%, #2c5f8d 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }
    .seal svg {
      width: 48px;
      height: 48px;
      color: #c9a961;
    }
    .seal-border {
      position: absolute;
      inset: 8px;
      border-radius: 50%;
      border: 2px dashed #c9a961;
    }
    .signature-column .signature {
      margin-bottom: 8px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .signature-column .signature span {
      font-size: 30px;
      font-family: Georgia, serif;
      font-style: italic;
      color: #1e3a5f;
    }
    .signature-line {
      width: 192px;
      height: 1px;
      background: #94a3b8;
      margin-bottom: 4px;
    }
    .signature-column .name {
      font-size: 14px;
      font-weight: 600;
      color: #1e3a5f;
    }
    .signature-column .title {
      font-size: 12px;
      color: #64748b;
    }
    .certificate-id {
      margin-top: 32px;
      text-align: center;
    }
    .certificate-id p {
      font-size: 12px;
      color: #94a3b8;
      letter-spacing: 0.1em;
    }
    /* Watermark */
    .watermark {
      position: absolute;
      inset: 0;
      opacity: 0.02;
      pointer-events: none;
      background-image: repeating-linear-gradient(45deg, #1e3a5f 0px, #1e3a5f 1px, transparent 1px, transparent 20px);
    }
  </style>
</head>
<body>
  <div class="certificate">
    <!-- Decorative Corners -->
    <div class="corner-tl"></div>
    <div class="corner-tr"></div>
    <div class="corner-bl"></div>
    <div class="corner-br"></div>
    
    <!-- Inner Border -->
    <div class="inner-border"></div>
    
    <!-- Watermark -->
    <div class="watermark"></div>
    
    <!-- Main Content -->
    <div class="content">
      <!-- Header Section -->
      <div class="header-section">
        <div class="logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
        </div>
        
        <div class="decorative-line">
          <div class="line-left"></div>
          <div class="line-dot"></div>
          <div class="line-right"></div>
        </div>
        
        <div class="certificate-title">
          <h1>CERTIFICATE</h1>
          <p>OF COMPLETION</p>
        </div>
      </div>
      
      <!-- Body Section -->
      <div class="body-section">
        <p class="certify-text">This is to certify that</p>
        
        <div class="recipient-name">
          <h2>${user.name}</h2>
          <div class="recipient-underline"></div>
        </div>
        
        <div class="course-info">
          <p>has successfully completed the course</p>
          <h3>${course.title}</h3>
          <p class="lms-text">through our Learning Management System</p>
        </div>
      </div>
      
      <!-- Footer Section -->
      <div class="footer-section">
        <div class="footer-grid">
          <!-- Date -->
          <div class="date-column">
            <p>Date of Completion</p>
            <p>${completionDate}</p>
          </div>
          
          <!-- Seal -->
          <div class="seal-column">
            <div class="seal">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.78 4.78 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.78 4 4 0 0 1 0-6.74Z"/><path d="m9 12 2 2 4-4"/></svg>
              <div class="seal-border"></div>
            </div>
          </div>
          
          <!-- Signature -->
          <div class="signature-column">
            <div class="signature">
              <span> Dr.JEEVANANDHAM </span>
            </div>
            <div class="signature-line"></div>
            <p class="name">Dr.Jeevanandham</p>
            <p class="title">Director of Learning & Development</p>
          </div>
        </div>
        
        <div class="certificate-id">
          <p>CERTIFICATE ID: ${certificate.certificateNumber}</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

// Check if Chrome/Chromium is available
const findChromeExecutable = () => {
  const possiblePaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
    '/usr/lib/chromium/chromium',
    '/usr/lib/chromium-browser/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows
  ].filter(Boolean);
  
  const fs = require('fs');
  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      return path;
    }
  }
  return null;
};

// Generate PDF using Puppeteer with fallback
const generatePDF = async (html, certificateNumber) => {
  const chromePath = findChromeExecutable();
  
  if (!chromePath) {
    throw new Error('Chrome/Chromium not found. Please install Chrome or use the HTML version.');
  }
  
  let browser;
  try {
    // Launch browser with system Chrome/Chromium
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: chromePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Set content
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded']
    });

    // Wait for fonts to load
    await page.waitForTimeout(500);

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      scale: 1.5
    });

    return pdf;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// @desc    Get all certificates for user
// @route   GET /api/certificates
// @access  Private
exports.getCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ user: req.user.id })
      .populate('course', 'title category')
      .sort('-issuedDate');

    res.status(200).json({
      success: true,
      count: certificates.length,
      certificates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single certificate by ID
// @route   GET /api/certificates/:id
// @access  Private
exports.getCertificate = async (req, res) => {
  try {
    // Try to find by _id first
    let certificate = await Certificate.findById(req.params.id)
      .populate('user', 'name email')
      .populate('course', 'title description category');

    // If not found, try by certificateNumber
    if (!certificate) {
      certificate = await Certificate.findOne({ certificateNumber: req.params.id })
        .populate('user', 'name email')
        .populate('course', 'title description category');
    }

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    res.status(200).json({
      success: true,
      certificate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to check if user has passed assessment for a course
const hasPassedAssessment = async (userId, courseId) => {
  // Find assessment for this course
  const { Assessment } = require('../models/Assessment.model');
  const assessment = await Assessment.findOne({ course: courseId });
  
  if (!assessment) {
    return { hasAssessment: false, passed: false, percentage: 0, assessmentId: null };
  }
  
  // Check if user has passed this assessment
  const result = await AssessmentResult.findOne({
    assessment: assessment._id,
    user: userId,
    passed: true
  });
  
  return {
    hasAssessment: true,
    passed: !!result,
    percentage: result ? result.percentage : 0,
    assessmentId: assessment._id,
    assessmentTitle: assessment.title
  };
};

// @desc    Generate certificate
// @route   POST /api/certificates/generate
// @access  Private
exports.generateCertificate = async (req, res) => {
  try {
    const { courseId } = req.body;

    const user = await User.findById(req.user.id);
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user completed the course (90%+ progress)
    const enrollment = user.enrolledCourses.find(
      e => e.course.toString() === courseId
    );

    if (!enrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are not enrolled in this course.'
      });
    }

    const courseProgress = enrollment.progress || 0;
    
    // Check if course progress is at least 90%
    if (courseProgress < 90) {
      return res.status(400).json({
        success: false,
        message: `Course progress must be at least 90% to get certificate. Current progress: ${courseProgress}%`
      });
    }

    // Check if user has passed the assessment (90%+)
    const assessmentStatus = await hasPassedAssessment(req.user.id, courseId);
    
    // STRICT RULE: Certificate can ONLY be generated after passing assessment
    // If no assessment is mapped to this course, reject certificate generation
    if (!assessmentStatus.hasAssessment) {
      return res.status(400).json({
        success: false,
        message: 'This course requires a completed assessment to earn a certificate. Please complete the assessment first.',
        courseProgress: courseProgress,
        assessmentRequired: true,
        assessmentPassed: false,
        assessmentExists: false
      });
    }
    
    if (!assessmentStatus.passed) {
      return res.status(400).json({
        success: false,
        message: 'You must pass the course assessment with at least 90% to get a certificate.',
        courseProgress: courseProgress,
        assessmentRequired: true,
        assessmentPassed: false,
        assessmentExists: true
      });
    }

    if (assessmentStatus.percentage < 90) {
      return res.status(400).json({
        success: false,
        message: `Assessment score must be at least 90% to get certificate. Your score: ${assessmentStatus.percentage.toFixed(0)}%`,
        courseProgress: courseProgress,
        assessmentRequired: true,
        assessmentPassed: true,
        assessmentPercentage: assessmentStatus.percentage,
        assessmentExists: true
      });
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      user: user._id,
      course: course._id
    });

    if (existingCertificate) {
      return res.status(400).json({
        success: false,
        message: 'Certificate already generated',
        certificate: existingCertificate
      });
    }

    // Generate certificate - the model will auto-generate certificateNumber
    const certificate = await Certificate.create({
      user: user._id,
      course: course._id,
      assessment: assessmentStatus.hasAssessment ? assessmentStatus.assessmentId : null,
      completionDate: Date.now(),
      finalScore: assessmentStatus.hasAssessment ? assessmentStatus.percentage : courseProgress,
      issuedDate: Date.now()
    });

    await certificate.populate([
      { path: 'user', select: 'name email' },
      { path: 'course', select: 'title category' }
    ]);

    res.status(201).json({
      success: true,
      certificate,
      message: 'Congratulations! You have earned your certificate by completing both the course and assessment with 90% or higher.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Download certificate as HTML with auto-print (PDF requires Chrome)
// @route   GET /api/certificates/:id/download
// @access  Private
exports.downloadCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('user', 'name email')
      .populate('course', 'title description category');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Check if user owns this certificate
    if (certificate.user._id.toString() !== req.user.id && req.user.role !== 'Super Admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this certificate'
      });
    }

    // Generate HTML
    const html = generateCertificateHTML(certificate, certificate.user, certificate.course);
    
    // Send HTML with auto-print dialog
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="certificate-${certificate.certificateNumber}.html"`);
    
    const autoPrintHtml = html.replace('</body>', `
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 800);
        };
      </script>
    </body>`);
    
    return res.send(autoPrintHtml);
    
  } catch (error) {
    console.error('Certificate download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate certificate. Please try again.'
    });
  }
};

// @desc    Verify certificate
// @route   GET /api/certificates/verify/:certificateNumber
// @access  Public
exports.verifyCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ 
      certificateNumber: req.params.certificateNumber 
    })
      .populate('user', 'name')
      .populate('course', 'title');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    res.status(200).json({
      success: true,
      verification: {
        valid: true,
        certificateNumber: certificate.certificateNumber,
        learnerName: certificate.user?.name,
        courseName: certificate.course?.title,
        completionDate: certificate.completionDate,
        issuedDate: certificate.issuedDate
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
