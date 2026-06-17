import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { 
  ROLE_PERMISSIONS, 
  hasPermission as checkPermission,
  hasRoleHierarchy as checkHierarchy,
  isRoleType
} from '../utils/permissions';

// Enrollment type definition - course can be string ID or populated object
interface Enrollment {
  course: string | { _id: string; title?: string; thumbnail?: string; category?: string };
  enrolledAt: string;
  progress: number;
  status: string;
  completedLessons: string[];
}

// User type definition
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  enrolledCourses?: Enrollment[];
}

// Auth Context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { name: string; email: string; password: string; department?: string }) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (...permissionList: string[]) => boolean;
  hasMinimumRole: (minimumRole: string) => boolean;
  getRoleInfo: () => { label: string; color: string; icon: string } | null;
  permissions: string[];
  isAuthenticated: boolean;
  role: string | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuthWithTimeout = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Auth check timeout')), 5000)
          );
          
          const authPromise = authAPI.getMe();
          const response = await Promise.race([authPromise, timeoutPromise]);
          
          setUser(response.user);
          // Set permissions based on role using centralized definitions
          const userRole = response.user.role;
          if (isRoleType(userRole)) {
            setPermissions(ROLE_PERMISSIONS[userRole] || []);
          }
        } catch (err) {
          console.error('Auth check failed:', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuthWithTimeout();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.getMe();
        setUser(response.user);
        // Set permissions based on role using centralized definitions
        const userRole = response.user.role;
        if (isRoleType(userRole)) {
          setPermissions(ROLE_PERMISSIONS[userRole] || []);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });
      localStorage.setItem('token', response.token);
      setUser(response.user);
      // Set permissions based on role using centralized definitions
      const userRole = response.user.role;
      if (isRoleType(userRole)) {
        setPermissions(ROLE_PERMISSIONS[userRole] || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    }
  };

  const register = async (userData: { name: string; email: string; password: string; department?: string }): Promise<void> => {
    try {
      setError(null);
      const response = await authAPI.register(userData);
      localStorage.setItem('token', response.token);
      setUser(response.user);
      // Set permissions based on role using centralized definitions
      const userRole = response.user.role;
      if (isRoleType(userRole)) {
        setPermissions(ROLE_PERMISSIONS[userRole] || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setPermissions([]);
  };

  const hasRole = (...roles: string[]): boolean => {
    return !!user && roles.includes(user!.role);
  };

  // Check if user has a specific permission using centralized function
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return checkPermission(user.role, permission);
  };

  // Check if user has any of the specified permissions
  const hasAnyPermission = (...permissionList: string[]): boolean => {
    if (!user) return false;
    return permissionList.some(p => checkPermission(user.role, p));
  };

  // Check if user has at least the minimum role
  const hasMinimumRole = (minimumRole: string): boolean => {
    if (!user) return false;
    return checkHierarchy(user.role, minimumRole);
  };

  // Get role info for display
  const getRoleInfo = () => {
    if (!user) return null;
    const roleInfo: Record<string, { label: string; color: string; icon: string }> = {
      'Super Admin': { label: 'Super Admin', color: 'bg-red-500/20 text-red-300', icon: '👑' },
      'Admin': { label: 'Admin', color: 'bg-purple-500/20 text-purple-300', icon: '⚡' },
      'HR': { label: 'HR', color: 'bg-orange-500/20 text-orange-300', icon: '👥' },
      'Trainer': { label: 'Trainer', color: 'bg-blue-500/20 text-blue-300', icon: '📚' },
      'Learner': { label: 'Learner', color: 'bg-green-500/20 text-green-300', icon: '🎓' }
    };
    return roleInfo[user.role] || { label: user.role, color: 'bg-gray-500/20 text-gray-300', icon: '' };
  };

  // Refresh user data from server
  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.getMe();
        setUser(response.user);
        // Set permissions based on role using centralized definitions
        const userRole = response.user.role;
        if (isRoleType(userRole)) {
          setPermissions(ROLE_PERMISSIONS[userRole] || []);
        }
      } catch (err) {
        console.error('Failed to refresh user:', err);
      }
    }
  };

  const isAuth: boolean = !!user;
  const userRole: string | null = user ? user.role : null;

  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasMinimumRole,
    getRoleInfo,
    permissions,
    isAuthenticated: isAuth as boolean,
    role: userRole,
    refreshUser
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
