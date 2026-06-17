/**
 * Permission Middleware
 * Enhanced role-based access control with granular permissions
 */

const { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  hasRoleHierarchy,
  getRolePermissions,
  PERMISSIONS
} = require('../utils/permissions');

/**
 * Check if user has required permission
 * @param {...string} permissions - Required permissions (any one)
 */
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    
    // Check if user has any of the required permissions
    const hasRequired = hasAnyPermission(userRole, permissions);
    
    if (!hasRequired) {
      // Log unauthorized access attempt
      console.warn(`Permission denied: User ${req.user.email} (${userRole}) attempted to access ${permissions.join(' or ')}`);
      
      return res.status(403).json({
        success: false,
        message: `Permission denied. Required: ${permissions.join(' or ')}`,
        required: permissions,
        userRole
      });
    }

    next();
  };
};

/**
 * Check if user has all required permissions
 * @param {...string} permissions - All required permissions
 */
const requireAllPermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    
    // Check if user has all required permissions
    const hasAll = hasAllPermissions(userRole, permissions);
    
    if (!hasAll) {
      console.warn(`Permission denied: User ${req.user.email} (${userRole}) lacks all permissions: ${permissions.join(', ')}`);
      
      return res.status(403).json({
        success: false,
        message: `Permission denied. Missing required permissions`,
        required: permissions,
        userRole
      });
    }

    next();
  };
};

/**
 * Check if user has minimum role hierarchy level
 * @param {string} minimumRole - Minimum required role
 */
const requireRole = (minimumRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    
    if (!hasRoleHierarchy(userRole, minimumRole)) {
      console.warn(`Role access denied: User ${req.user.email} (${userRole}) attempted to access ${minimumRole}+ resource`);
      
      return res.status(403).json({
        success: false,
        message: `Access denied. Minimum role required: ${minimumRole}`,
        required: minimumRole,
        currentRole: userRole
      });
    }

    next();
  };
};

/**
 * Check if user can access a specific resource based on ownership
 * @param {string} resourceOwnerField - Field name containing owner ID in request params
 * @param {string} accessLevel - 'own', 'own_and_team', or 'all'
 */
const requireOwnership = (resourceOwnerField = 'userId', accessLevel = 'own') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const userId = req.user._id.toString();
    
    // Super Admin and Admin have full access
    if (userRole === 'Super Admin' || userRole === 'Admin') {
      return next();
    }
    
    // Get resource owner from request params or body
    const resourceOwnerId = req.params[resourceOwnerField] || req.body[resourceOwnerField];
    
    // Check access level
    if (accessLevel === 'own') {
      if (resourceOwnerId && userId !== resourceOwnerId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only access your own resources'
        });
      }
    }
    
    // For 'own_and_team', we would need team membership logic
    // For now, treat as 'own' for most resources
    
    next();
  };
};

/**
 * Combined middleware for protected routes with permissions
 * @param {Object} options - Middleware options
 * @param {string[]} options.permissions - Required permissions
 * @param {string} options.role - Minimum role required
 * @param {string} options.ownershipField - Field for ownership check
 */
const authorize = (options = {}) => {
  const { 
    permissions = [], 
    role = null,
    ownershipField = null,
    ownershipLevel = 'own'
  } = options;
  
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const userId = req.user._id.toString();
    
    // Check role hierarchy first
    if (role && !hasRoleHierarchy(userRole, role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Minimum role required: ${role}`,
        required: role,
        currentRole: userRole
      });
    }
    
    // Check permissions
    if (permissions.length > 0 && !hasAnyPermission(userRole, permissions)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied`,
        required: permissions,
        userRole
      });
    }
    
    // Check ownership if field provided
    if (ownershipField) {
      const resourceOwnerId = req.params[ownershipField] || req.body[ownershipField];
      
      // Super Admin and Admin bypass ownership check
      if (userRole !== 'Super Admin' && userRole !== 'Admin') {
        if (resourceOwnerId && userId !== resourceOwnerId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'You can only access your own resources'
          });
        }
      }
    }
    
    next();
  };
};

/**
 * Get user's permissions and attach to request
 */
const attachPermissions = (req, res, next) => {
  if (req.user) {
    req.userPermissions = getRolePermissions(req.user.role);
    req.hasPermission = (permission) => hasPermission(req.user.role, permission);
  }
  next();
};

/**
 * Rate limiting for sensitive operations
 * @param {number} maxRequests - Maximum requests per window
 * @param {number} windowMs - Time window in milliseconds
 */
const createRateLimitMiddleware = (maxRequests = 10, windowMs = 60000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.user?._id || req.ip;
    const now = Date.now();
    
    // Clean old entries
    requests.forEach((timestamps, k) => {
      requests.set(k, timestamps.filter(t => now - t < windowMs));
    });
    
    const userRequests = requests.get(key) || [];
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }
    
    userRequests.push(now);
    requests.set(key, userRequests);
    
    next();
  };
};

// Specific permission middlewares for common use cases
const permissionMiddleware = {
  // User permissions
  canViewUsers: requirePermission('users:read'),
  canCreateUsers: requirePermission('users:create'),
  canUpdateUsers: requirePermission('users:update'),
  canDeleteUsers: requirePermission('users:delete'),
  canDeactivateUsers: requirePermission('users:deactivate'),
  
  // Course permissions
  canViewCourses: requirePermission('courses:read'),
  canCreateCourses: requirePermission('courses:create'),
  canUpdateCourses: requirePermission('courses:update'),
  canDeleteCourses: requirePermission('courses:delete'),
  canPublishCourses: requirePermission('courses:publish'),
  
  // Assessment permissions
  canViewAssessments: requirePermission('assessments:read'),
  canCreateAssessments: requirePermission('assessments:create'),
  canUpdateAssessments: requirePermission('assessments:update'),
  canDeleteAssessments: requirePermission('assessments:delete'),
  canGradeAssessments: requirePermission('assessments:grade'),
  canViewResults: requirePermission('assessments:view-results'),
  
  // Analytics permissions
  canViewAnalytics: requirePermission('analytics:read'),
  canExportAnalytics: requirePermission('analytics:export'),
  
  // Settings permissions
  canViewSettings: requirePermission('settings:read'),
  canUpdateSettings: requirePermission('settings:update'),
  
  // Knowledge permissions
  canViewKnowledge: requirePermission('knowledge:read'),
  canCreateKnowledge: requirePermission('knowledge:create'),
  canUpdateKnowledge: requirePermission('knowledge:update'),
  canDeleteKnowledge: requirePermission('knowledge:delete'),
  
  // Certificate permissions
  canViewCertificates: requirePermission('certificates:read'),
  canCreateCertificates: requirePermission('certificates:create'),
  
  // Role-based
  isAdmin: requireRole('Admin'),
  isSuperAdmin: requireRole('Super Admin'),
  isHR: requireRole('HR'),
  isTrainer: requireRole('Trainer'),
  isLearner: requireRole('Learner'),
  
  // Generic
  requirePermission,
  requireAllPermissions,
  requireRole,
  requireOwnership,
  authorize,
  attachPermissions,
  createRateLimitMiddleware,
  PERMISSIONS
};

module.exports = permissionMiddleware;

