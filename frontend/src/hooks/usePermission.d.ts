export interface UsePermissionResult {
  user: any;
  role: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  can: (permission: string) => boolean;
  canAny: (...permissionList: string[]) => boolean;
  canAll: (...permissionList: string[]) => boolean;
  hasRole: (minimumRole: string) => boolean;
  isRole: (...roles: string[]) => boolean;
  // Role flags
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isHR: boolean;
  isTrainer: boolean;
  isLearner: boolean;
  // Permission flags
  canManageUsers: boolean;
  canCreateCourses: boolean;
  canCreateAssessments: boolean;
  canViewAnalytics: boolean;
  canExportAnalytics: boolean;
  canManageSettings: boolean;
  canCreateKnowledge: boolean;
  canCreateCertificates: boolean;
}

export declare function usePermission(): UsePermissionResult;
export declare function getPermissionInfo(permission: string): string;
export default usePermission;
