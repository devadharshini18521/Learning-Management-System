/**
 * usePermission Hook
 * Frontend permission checking for role-based access control
 */

import { useAuth } from '../contexts/AuthContext';
import { 
  ROLE_PERMISSIONS,
  hasRoleHierarchy
} from '../utils/permissions';

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
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {string[]}
 */
const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * usePermission hook for checking permissions in components
 */
export const usePermission = () => {
  const { user, isAuthenticated } = useAuth();

  const role = user?.role || null;
  const permissions = isAuthenticated ? getRolePermissions(role) : [];

  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean}
   */
  const can = (permission) => {
    if (!isAuthenticated || !role) return false;
    return hasPermission(role, permission);
  };

  /**
   * Check if user has any of the specified permissions
   * @param {...string} permissionList - Permissions to check
   * @returns {boolean}
   */
  const canAny = (...permissionList) => {
    if (!isAuthenticated || !role) return false;
    return hasAnyPermission(role, permissionList);
  };

  /**
   * Check if user has all of the specified permissions
   * @param {...string} permissionList - Permissions to check
   * @returns {boolean}
   */
  const canAll = (...permissionList) => {
    if (!isAuthenticated || !role) return false;
    return hasAllPermissions(role, permissionList);
  };

  /**
   * Check if user has at least the minimum role
   * @param {string} minimumRole - Minimum required role
   * @returns {boolean}
   */
  const hasRole = (minimumRole) => {
    if (!isAuthenticated || !role) return false;
    return hasRoleHierarchy(role, minimumRole);
  };

  /**
   * Check if user is a specific role
   * @param {...string} roles - Roles to check
   * @returns {boolean}
   */
  const isRole = (...roles) => {
    if (!isAuthenticated || !role) return false;
    return roles.includes(role);
  };

  return {
    user,
    role,
    permissions,
    isAuthenticated,
    can,
    canAny,
    canAll,
    hasRole,
    isRole,
    // Role checks
    isSuperAdmin: isRole('Super Admin'),
    isAdmin: isRole('Super Admin', 'Admin'),
    isHR: isRole('HR'),
    isTrainer: isRole('Trainer'),
    isLearner: isRole('Learner'),
    // Permission checks
    canManageUsers: canAny('users:read', 'users:create', 'users:update', 'users:delete'),
    canCreateCourses: can('courses:create'),
    canCreateAssessments: can('assessments:create'),
    canViewAnalytics: can('analytics:read'),
    canExportAnalytics: can('analytics:export'),
    canManageSettings: can('settings:update'),
    canCreateKnowledge: can('knowledge:create'),
    canCreateCertificates: can('certificates:create'),
  };
};

/**
 * Permission information helper
 */
export const getPermissionInfo = (permission) => {
  const permissionDescriptions = {
    'users:read': 'View user list',
    'users:create': 'Create new users',
    'users:update': 'Update user information',
    'users:delete': 'Delete users',
    'users:deactivate': 'Deactivate user accounts',
    'courses:read': 'View courses',
    'courses:create': 'Create courses',
    'courses:update': 'Update courses',
    'courses:delete': 'Delete courses',
    'courses:publish': 'Publish courses',
    'assessments:read': 'View assessments',
    'assessments:create': 'Create assessments',
    'assessments:update': 'Update assessments',
    'assessments:delete': 'Delete assessments',
    'assessments:grade': 'Grade assessments',
    'assessments:view-results': 'View assessment results',
    'analytics:read': 'View analytics',
    'analytics:export': 'Export reports',
    'settings:read': 'View settings',
    'settings:update': 'Update settings',
    'knowledge:read': 'View knowledge base',
    'knowledge:create': 'Create articles',
    'knowledge:update': 'Update articles',
    'knowledge:delete': 'Delete articles',
    'certificates:read': 'View certificates',
    'certificates:create': 'Generate certificates',
    'system:super_admin': 'Super Admin access',
    'system:full_access': 'Full system access'
  };

  return permissionDescriptions[permission] || permission;
};

export default usePermission;

