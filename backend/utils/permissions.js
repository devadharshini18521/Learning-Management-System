/**
 * Permission Constants
 * Define all available permissions in the system
 */

const PERMISSIONS = {
  // User Management
  'users:read': 'View user list',
  'users:create': 'Create new users',
  'users:update': 'Update user information',
  'users:delete': 'Delete users',
  'users:deactivate': 'Deactivate user accounts',
  
  // Course Management
  'courses:read': 'View courses',
  'courses:create': 'Create courses',
  'courses:update': 'Update courses',
  'courses:delete': 'Delete courses',
  'courses:publish': 'Publish courses',
  'courses:manage': 'Full course management (create, update, delete, publish)',
  
  // Assessment Management
  'assessments:read': 'View assessments',
  'assessments:create': 'Create assessments',
  'assessments:update': 'Update assessments',
  'assessments:delete': 'Delete assessments',
  'assessments:grade': 'Grade assessments',
  'assessments:view-results': 'View assessment results',
  
  // Analytics & Reporting
  'analytics:read': 'View analytics',
  'analytics:export': 'Export reports',
  
  // Settings
  'settings:read': 'View settings',
  'settings:update': 'Update settings',
  
  // Knowledge Base
  'knowledge:read': 'View knowledge base',
  'knowledge:create': 'Create articles',
  'knowledge:update': 'Update articles',
  'knowledge:delete': 'Delete articles',
  
  // Certificates
  'certificates:read': 'View certificates',
  'certificates:create': 'Generate certificates',
  
  // System
  'system:super_admin': 'Super Admin access',
  'system:full_access': 'Full system access'
};

/**
 * Role Hierarchy
 * Higher roles inherit permissions from lower roles
 */
const ROLE_HIERARCHY = {
  'Super Admin': 5,
  'Admin': 4,
  'HR': 3,
  'Trainer': 2,
  'Learner': 1
};

/**
 * Role Permission Assignments
 * Define which permissions each role automatically has
 */
const ROLE_PERMISSIONS = {
  'Super Admin': [
    'system:super_admin',
    'system:full_access',
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'users:deactivate',
    'courses:read',
    'courses:create',
    'courses:update',
    'courses:delete',
    'courses:publish',
    'assessments:read',
    'assessments:create',
    'assessments:update',
    'assessments:delete',
    'assessments:grade',
    'assessments:view-results',
    'analytics:read',
    'analytics:export',
    'settings:read',
    'settings:update',
    'knowledge:read',
    'knowledge:create',
    'knowledge:update',
    'knowledge:delete',
    'certificates:read',
    'certificates:create',
    'enrollments:read',
    'enrollments:create',
    'enrollments:update',
    'enrollments:delete'
  ],
  'Admin': [
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'users:deactivate',
    'courses:read',
    'courses:publish',
    'courses:assign',
    'knowledge:read',
    'knowledge:create',
    'knowledge:update',
    'knowledge:delete',
    'analytics:read',
    'analytics:export',
    'enrollments:read',
    'enrollments:create',
    'enrollments:update'
  ],
  'HR': [
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'users:deactivate',
    'courses:read',
    'courses:publish',
    'courses:assign',
    'knowledge:read',
    'knowledge:create',
    'knowledge:update',
    'knowledge:delete',
    'analytics:read',
    'analytics:export',
    'enrollments:read',
    'enrollments:create',
    'enrollments:update'
  ],
  'Trainer': [
    'courses:read',
    'courses:create',
    'courses:update',
    'courses:delete',
    'courses:publish',
    'assessments:read',
    'assessments:create',
    'assessments:update',
    'assessments:delete',
    'assessments:grade',
    'assessments:view-results',
    'analytics:read',
    'knowledge:read',
    'knowledge:create',
    'knowledge:update',
    'knowledge:delete',
    'certificates:read',
    'certificates:create'
  ],
  'Learner': [
    'courses:read',
    'courses:write',
    'assessments:read',
    'assessments:view-results',
    'knowledge:read',
    'certificates:read',
    'certificates:create'
  ]

};

/**
 * Resource Ownership Levels
 * Define who can access whose resources
 */
const OWNERSHIP_LEVELS = {
  'own': 'Only own resources',
  'own_and_team': 'Own resources and team resources',
  'all': 'All resources'
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  
  // Super Admin has all permissions
  if (role === 'Super Admin') return true;
  
  // Check for exact permission match
  if (permissions.includes(permission)) return true;
  
  // Check for wildcard permissions
  const [resource] = permission.split(':');
  if (permissions.includes(`${resource}:*`) || permissions.includes(`*:${permission.split(':')[1]}`)) {
    return true;
  }
  
  return false;
};

/**
 * Check if a role has any of the specified permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean}
 */
const hasAnyPermission = (role, permissions) => {
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if a role has all of the specified permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean}
 */
const hasAllPermissions = (role, permissions) => {
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Check if role1 has higher or equal hierarchy than role2
 * @param {string} role1 - First role
 * @param {string} role2 - Second role
 * @returns {boolean}
 */
const hasRoleHierarchy = (role1, role2) => {
  const level1 = ROLE_HIERARCHY[role1] || 0;
  const level2 = ROLE_HIERARCHY[role2] || 0;
  return level1 >= level2;
};

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {string[]}
 */
const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if user can access another user's resource
 * @param {object} user - Current user
 * @param {string} resourceOwnerId - Resource owner ID
 * @param {string} accessLevel - Required access level
 * @returns {boolean}
 */
const canAccessResource = (user, resourceOwnerId, accessLevel = 'own') => {
  // Super Admin and Admin can access all resources
  if (user.role === 'Super Admin' || user.role === 'Admin') {
    return true;
  }
  
  // HR has limited analytics access
  if (user.role === 'HR' && accessLevel === 'all') {
    return false; // HR can only see aggregated analytics, not individual user data
  }
  
  // Check ownership
  if (accessLevel === 'own') {
    return user._id.toString() === resourceOwnerId.toString();
  }
  
  return false;
};

/**
 * Get role display name with badge color
 * @param {string} role - User role
 * @returns {object}
 */
const getRoleInfo = (role) => {
  const roleInfo = {
    'Super Admin': {
      label: 'Super Admin',
      color: 'bg-red-500/20 text-red-300',
      description: 'Full system control'
    },
    'Admin': {
      label: 'Admin',
      color: 'bg-purple-500/20 text-purple-300',
      description: 'System administration'
    },
    'HR': {
      label: 'HR',
      color: 'bg-orange-500/20 text-orange-300',
      description: 'Human Resources'
    },
    'Trainer': {
      label: 'Trainer',
      color: 'bg-blue-500/20 text-blue-300',
      description: 'Course management'
    },
    'Learner': {
      label: 'Learner',
      color: 'bg-green-500/20 text-green-300',
      description: 'Course consumption'
    }
  };
  
  return roleInfo[role] || {
    label: role,
    color: 'bg-gray-500/20 text-gray-300',
    description: ''
  };
};

module.exports = {
  PERMISSIONS,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  OWNERSHIP_LEVELS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRoleHierarchy,
  getRolePermissions,
  canAccessResource,
  getRoleInfo
};
