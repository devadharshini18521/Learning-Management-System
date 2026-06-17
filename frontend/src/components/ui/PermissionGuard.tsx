/**
 * PermissionGuard Component
 * Conditionally render components based on user permissions
 */

import React, { ReactNode } from 'react';
import { usePermission } from '../../hooks/usePermission';
import { Lock } from 'lucide-react';

// Type definitions
interface PermissionGuardProps {
  permission?: string | string[];
  role?: string;
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean;
}

interface RoleGuardProps {
  roles: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}

interface ShowProps {
  when: string | string[];
  children: ReactNode;
}

interface HideProps {
  from: string | string[];
  children: ReactNode;
}

interface PermissionRequiredMessageProps {
  permission?: string;
  className?: string;
}

/**
 * PermissionGuard - Conditionally render content based on permissions
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  role,
  children,
  fallback = null,
  requireAll = false
}) => {
  const { can, canAny, canAll, hasRole, isAuthenticated } = usePermission();

  // Not authenticated
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Check role requirement
  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  // No permission requirement, render children
  if (!permission) {
    return <>{children}</>;
  }

  // Single permission
  if (typeof permission === 'string') {
    if (can(permission)) {
      return <>{children}</>;
    }
    return <>{fallback}</>;
  }

  // Array of permissions
  if (Array.isArray(permission)) {
    if (requireAll) {
      if (canAll(...permission)) {
        return <>{children}</>;
      }
    } else {
      if (canAny(...permission)) {
        return <>{children}</>;
      }
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * RoleGuard - Conditionally render content based on user role
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ roles, children, fallback = null }) => {
  const { isRole, isAuthenticated } = usePermission();

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  if (Array.isArray(roles)) {
    if (roles.some(role => isRole(role))) {
      return <>{children}</>;
    }
  } else if (isRole(roles)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

/**
 * Show - Simple permission check component
 * Renders children if user has permission, nothing otherwise
 */
export const Show: React.FC<ShowProps> = ({ when, children }) => {
  const { can, canAny, isAuthenticated } = usePermission();

  if (!isAuthenticated || !when) {
    return null;
  }

  if (typeof when === 'string') {
    return can(when) ? <>{children}</> : null;
  }

  if (Array.isArray(when)) {
    return canAny(...when) ? <>{children}</> : null;
  }

  return null;
};

/**
 * Hide - Inverse of Show
 * Hides children if user has permission, renders them otherwise
 */
export const Hide: React.FC<HideProps> = ({ from, children }) => {
  const { can, canAny, isAuthenticated } = usePermission();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  if (typeof from === 'string') {
    return can(from) ? null : <>{children}</>;
  }

  if (Array.isArray(from)) {
    return canAny(...from) ? null : <>{children}</>;
  }

  return <>{children}</>;
};

/**
 * PermissionRequiredMessage - Show a message when permission is denied
 */
export const PermissionRequiredMessage: React.FC<PermissionRequiredMessageProps> = ({ 
  permission, 
  className = '' 
}) => {
  const { isAuthenticated } = usePermission();

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
      <p className="text-indigo-300 max-w-md">
        You don't have permission to access this feature. 
        {permission && (
          <span className="block mt-1 text-sm text-indigo-400">
            Required permission: {permission}
          </span>
        )}
      </p>
    </div>
  );
};

/**
 * UnauthorizedPage - Full page access denied message
 */
interface UnauthorizedPageProps {
  message?: string;
}

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({ 
  message = "You don't have permission to access this page." 
}) => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Access Denied</h3>
        <p className="text-indigo-300">{message}</p>
      </div>
    </div>
  );
};

/**
 * AdminOnly - Only show to admins and super admins
 */
export const AdminOnly: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = null 
}) => {
  return (
    <PermissionGuard
      permission={['users:read', 'analytics:read']}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  );
};

/**
 * TrainerOnly - Only show to trainers
 */
export const TrainerOnly: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = null 
}) => {
  return (
    <RoleGuard
      roles={['Trainer', 'Admin', 'Super Admin']}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
};

/**
 * LearnerOnly - Only show to learners
 */
export const LearnerOnly: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ 
  children, 
  fallback = null 
}) => {
  return (
    <RoleGuard
      roles={['Learner']}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
};

export default PermissionGuard;

