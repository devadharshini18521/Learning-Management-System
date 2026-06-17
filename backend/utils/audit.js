/**
 * Audit Logging Utility
 * Track all admin actions for security and compliance
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Audit Log Entry Structure
 * @typedef {Object} AuditLogEntry
 * @property {string} timestamp - ISO date string
 * @property {string} action - Action performed
 * @property {string} category - Category of action (users, courses, assessments, etc.)
 * @property {string} userId - ID of user performing action
 * @property {string} userRole - Role of user performing action
 * @property {string} userName - Name of user performing action
 * @property {string} resourceType - Type of resource affected
 * @property {string} resourceId - ID of resource affected
 * @property {string} previousState - Previous state (for updates)
 * @property {string} newState - New state (for updates)
 * @property {string} ipAddress - IP address of request
 * @property {string} userAgent - User agent string
 * @property {string} status - Success or failure
 * @property {string} errorMessage - Error message if failed
 */

/**
 * Action Categories
 */
const CATEGORIES = {
  AUTH: 'authentication',
  USERS: 'users',
  COURSES: 'courses',
  ASSESSMENTS: 'assessments',
  KNOWLEDGE: 'knowledge',
  CERTIFICATES: 'certificates',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
  SYSTEM: 'system'
};

/**
 * Action Types
 */
const ACTIONS = {
  // User actions
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  USER_DEACTIVATE: 'user_deactivate',
  USER_ACTIVATE: 'user_activate',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  
  // Course actions
  COURSE_CREATE: 'course_create',
  COURSE_UPDATE: 'course_update',
  COURSE_DELETE: 'course_delete',
  COURSE_PUBLISH: 'course_publish',
  COURSE_UNPUBLISH: 'course_unpublish',
  
  // Assessment actions
  ASSESSMENT_CREATE: 'assessment_create',
  ASSESSMENT_UPDATE: 'assessment_update',
  ASSESSMENT_DELETE: 'assessment_delete',
  ASSESSMENT_GRADE: 'assessment_grade',
  
  // Knowledge actions
  ARTICLE_CREATE: 'article_create',
  ARTICLE_UPDATE: 'article_update',
  ARTICLE_DELETE: 'article_delete',
  
  // Certificate actions
  CERTIFICATE_GENERATE: 'certificate_generate',
  
  // Settings actions
  SETTINGS_UPDATE: 'settings_update',
  
  // System actions
  SYSTEM_BACKUP: 'system_backup',
  SYSTEM_RESTORE: 'system_restore'
};

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @returns {AuditLogEntry}
 */
const createAuditEntry = (params) => {
  return {
    timestamp: new Date().toISOString(),
    action: params.action,
    category: params.category,
    userId: params.userId?.toString() || 'system',
    userRole: params.userRole || 'system',
    userName: params.userName || 'System',
    resourceType: params.resourceType || '',
    resourceId: params.resourceId?.toString() || '',
    resourceName: params.resourceName || '',
    previousState: params.previousState || null,
    newState: params.newState || null,
    ipAddress: params.ipAddress || '',
    userAgent: params.userAgent || '',
    status: params.status || 'success',
    errorMessage: params.errorMessage || null
  };
};

/**
 * Format audit entry for console/file output
 * @param {AuditLogEntry} entry - Audit entry
 * @returns {string}
 */
const formatAuditEntry = (entry) => {
  const statusIcon = entry.status === 'success' ? '✅' : '❌';
  return `[${entry.timestamp}] ${statusIcon} [${entry.category.toUpperCase()}] ${entry.action} by ${entry.userName} (${entry.userRole}) ${entry.resourceId ? `on ${entry.resourceType}:${entry.resourceId}` : ''} ${entry.errorMessage ? `- Error: ${entry.errorMessage}` : ''}`;
};

/**
 * Write audit log to file
 * @param {AuditLogEntry} entry - Audit entry
 */
const writeToFile = (entry) => {
  const dateStr = new Date().toISOString().split('T')[0];
  const logFile = path.join(logsDir, `audit-${dateStr}.log`);
  const formattedEntry = JSON.stringify(entry) + '\n';
  
  fs.appendFileSync(logFile, formattedEntry, 'utf8');
};

/**
 * Main audit logging function
 * @param {Object} params - Audit parameters
 */
const auditLog = async (params) => {
  const entry = createAuditEntry(params);
  
  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(formatAuditEntry(entry));
  }
  
  // Write to file
  try {
    writeToFile(entry);
  } catch (error) {
    console.error('Failed to write audit log to file:', error);
  }
  
  // TODO: Send to external logging service (Datadog, Splunk, etc.)
  // This would be implemented for production environments
  
  return entry;
};

/**
 * Audit middleware for Express routes
 * Automatically logs route access and modifications
 * @param {string} category - Action category
 * @param {string} action - Action type
 * @returns {Function} Express middleware
 */
const auditMiddleware = (category, action) => {
  return (req, res, next) => {
    // Store audit info on request
    req.audit = {
      category,
      action,
      userId: req.user?._id,
      userRole: req.user?.role,
      userName: req.user?.name,
      resourceType: category,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent']
    };
    
    // Log after response is sent
    res.on('finish', () => {
      if (req.audit.userId) {
        const status = res.statusCode < 400 ? 'success' : 'failure';
        auditLog({
          ...req.audit,
          status,
          errorMessage: status === 'failure' ? res.statusMessage : null,
          resourceId: req.params.id || req.params.courseId || req.params.assessmentId
        });
      }
    });
    
    next();
  };
};

/**
 * Create specific audit loggers for common actions
 */
const audit = {
  // User actions
  createUser: (req, user, resourceId) => auditLog({
    ...req.audit,
    action: ACTIONS.USER_CREATE,
    category: CATEGORIES.USERS,
    resourceType: 'User',
    resourceId,
    resourceName: user.name,
    newState: { name: user.name, email: user.email, role: user.role }
  }),
  
  updateUser: (req, resourceId, previousState, newState) => auditLog({
    ...req.audit,
    action: ACTIONS.USER_UPDATE,
    category: CATEGORIES.USERS,
    resourceType: 'User',
    resourceId,
    previousState,
    newState
  }),
  
  deleteUser: (req, resourceId, userName) => auditLog({
    ...req.audit,
    action: ACTIONS.USER_DELETE,
    category: CATEGORIES.USERS,
    resourceType: 'User',
    resourceId,
    resourceName: userName
  }),
  
  deactivateUser: (req, resourceId, userName) => auditLog({
    ...req.audit,
    action: ACTIONS.USER_DEACTIVATE,
    category: CATEGORIES.USERS,
    resourceType: 'User',
    resourceId,
    resourceName: userName
  }),
  
  // Course actions
  createCourse: (req, course, resourceId) => auditLog({
    ...req.audit,
    action: ACTIONS.COURSE_CREATE,
    category: CATEGORIES.COURSES,
    resourceType: 'Course',
    resourceId,
    resourceName: course.title,
    newState: { title: course.title, category: course.category }
  }),
  
  updateCourse: (req, resourceId, previousState, newState) => auditLog({
    ...req.audit,
    action: ACTIONS.COURSE_UPDATE,
    category: CATEGORIES.COURSES,
    resourceType: 'Course',
    resourceId,
    previousState,
    newState
  }),
  
  deleteCourse: (req, resourceId, courseTitle) => auditLog({
    ...req.audit,
    action: ACTIONS.COURSE_DELETE,
    category: CATEGORIES.COURSES,
    resourceType: 'Course',
    resourceId,
    resourceName: courseTitle
  }),
  
  publishCourse: (req, resourceId, courseTitle) => auditLog({
    ...req.audit,
    action: ACTIONS.COURSE_PUBLISH,
    category: CATEGORIES.COURSES,
    resourceType: 'Course',
    resourceId,
    resourceName: courseTitle
  }),
  
  // Assessment actions
  createAssessment: (req, assessment, resourceId) => auditLog({
    ...req.audit,
    action: ACTIONS.ASSESSMENT_CREATE,
    category: CATEGORIES.ASSESSMENTS,
    resourceType: 'Assessment',
    resourceId,
    resourceName: assessment.title,
    newState: { title: assessment.title, courseId: assessment.courseId }
  }),
  
  gradeAssessment: (req, resourceId, learnerName) => auditLog({
    ...req.audit,
    action: ACTIONS.ASSESSMENT_GRADE,
    category: CATEGORIES.ASSESSMENTS,
    resourceType: 'Assessment',
    resourceId,
    resourceName: `Graded assessment for ${learnerName}`
  }),
  
  // Settings actions
  updateSettings: (req, previousState, newState) => auditLog({
    ...req.audit,
    action: ACTIONS.SETTINGS_UPDATE,
    category: CATEGORIES.SETTINGS,
    resourceType: 'System Settings',
    previousState,
    newState
  }),
  
  // Generic
  log: auditLog,
  middleware: auditMiddleware,
  CATEGORIES,
  ACTIONS
};

module.exports = audit;

