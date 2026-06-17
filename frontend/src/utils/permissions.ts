// Role type definition
export type RoleType = 'Super Admin' | 'Admin' | 'HR' | 'Trainer' | 'Learner';

// Role definitions
export const ROLE_INFO: Record<RoleType, { label: string; color: string; icon: string; description: string }> = {
  'Super Admin': {
    label: 'Super Admin',
    color: 'bg-purple-500/20 text-purple-300',
    icon: '👑',
    description: 'Full system access'
  },
  'Admin': {
    label: 'Admin',
    color: 'bg-blue-500/20 text-blue-300',
    icon: '⚡',
    description: 'Administrative access'
  },
  'HR': {
    label: 'HR',
    color: 'bg-green-500/20 text-green-300',
    icon: '👥',
    description: 'Human Resources access'
  },
  'Trainer': {
    label: 'Trainer',
    color: 'bg-orange-500/20 text-orange-300',
    icon: '🎓',
    description: 'Training content access'
  },
  'Learner': {
    label: 'Learner',
    color: 'bg-indigo-500/20 text-indigo-300',
    icon: '📚',
    description: 'Learning access'
  }
};

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<RoleType, string[]> = {
  'Super Admin': [
    'users:read', 'users:write', 'users:delete',
    'courses:read', 'courses:write', 'courses:delete',
    'assessments:read', 'assessments:write', 'assessments:delete',
    'knowledge:read', 'knowledge:write', 'knowledge:delete',
    'certificates:read', 'certificates:write', 'certificates:delete',
    'analytics:read', 'analytics:write',
    'settings:read', 'settings:write',
    'notifications:read', 'notifications:write',
    'enrollments:read', 'enrollments:create', 'enrollments:update', 'enrollments:delete'
  ],
  'Admin': [
    'users:read', 'users:create', 'users:update', 'users:delete', 'users:deactivate',
    'courses:read', 'courses:publish', 'courses:assign',
    'knowledge:read', 'knowledge:create', 'knowledge:update', 'knowledge:delete',
    'analytics:read', 'analytics:export',
    'enrollments:read', 'enrollments:create', 'enrollments:update',
    'notifications:read'
  ],
  'HR': [
    'users:read', 'users:create', 'users:update', 'users:delete', 'users:deactivate',
    'courses:read', 'courses:publish', 'courses:assign',
    'knowledge:read', 'knowledge:create', 'knowledge:update', 'knowledge:delete',
    'analytics:read', 'analytics:export',
    'enrollments:read', 'enrollments:create', 'enrollments:update',
    'notifications:read'
  ],
  'Trainer': [
    'courses:read', 'courses:write', 'courses:delete',
    'assessments:read', 'assessments:write', 'assessments:delete',
    'knowledge:read', 'knowledge:write', 'knowledge:delete',
    'certificates:read', 'certificates:write',
    'analytics:read'
  ],
  'Learner': [
    'courses:read',
    'courses:write',
    'assessments:read',
    'assessments:view-results',
    'knowledge:read',
    'certificates:read',
    'certificates:write'
  ]
};

// Role hierarchy for escalation checks
const ROLE_HIERARCHY: Record<RoleType, number> = {
  'Super Admin': 5,
  'Admin': 4,
  'HR': 3,
  'Trainer': 2,
  'Learner': 1
};

// Type guard to check if a string is a valid RoleType
export function isRoleType(role: string): role is RoleType {
  return role in ROLE_HIERARCHY;
}

// Check if user has a specific permission
export function hasPermission(userRole: string, permission: string): boolean {
  if (!userRole || !permission) return false;

  // Validate role at runtime
  if (!isRoleType(userRole)) return false;

  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions) return false;

  return rolePermissions.includes(permission);
}

// Check if one role has hierarchy over another
export function hasRoleHierarchy(userRole: string, targetRole: string): boolean {
  // Validate roles at runtime
  if (!isRoleType(userRole) || !isRoleType(targetRole)) return false;

  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] || 0;

  return userLevel > targetLevel;
}

// Get all permissions for a role
export function getRolePermissions(role: string): string[] {
  // Validate role at runtime
  if (!isRoleType(role)) return [];

  return ROLE_PERMISSIONS[role] || [];
}

// Check if role exists
export function isValidRole(role: string): boolean {
  return role in ROLE_INFO;
}
