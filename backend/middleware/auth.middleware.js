const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  hasRoleHierarchy,
  getRolePermissions 
} = require('../utils/permissions');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (req.user.status === 'Deactivated') {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Attach permissions to user object
    req.user.permissions = getRolePermissions(req.user.role);
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Role-based access control (legacy, kept for backward compatibility)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Enhanced authorization with permission checking
exports.authorizeWithPermission = (...permissions) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    
    // Super Admin bypass
    if (userRole === 'Super Admin') {
      return next();
    }
    
    // Check if user has any of the required permissions
    const hasRequired = hasAnyPermission(userRole, permissions);
    
    if (!hasRequired) {
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

// Check if user has minimum role level
exports.authorizeRole = (minimumRole) => {
  return (req, res, next) => {
    if (!hasRoleHierarchy(req.user.role, minimumRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Minimum role required: ${minimumRole}`,
        required: minimumRole,
        currentRole: req.user.role
      });
    }
    next();
  };
};

// Check if user can access a specific resource
exports.authorizeResource = (resourceOwnerField = 'userId') => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const userId = req.user._id.toString();
    
    // Super Admin, Admin, and HR have full access to user resources
    if (userRole === 'Super Admin' || userRole === 'Admin' || userRole === 'HR') {
      return next();
    }
    
    const resourceOwnerId = req.params[resourceOwnerField] || req.body[resourceOwnerField];
    
    if (resourceOwnerId && userId !== resourceOwnerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own resources'
      });
    }
    
    next();
  };
};
