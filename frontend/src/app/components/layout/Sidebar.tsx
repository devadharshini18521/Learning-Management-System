import { useAuth } from '../../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Award, 
  Users, 
  Settings, 
  BarChart3,
  GraduationCap,
  ClipboardCheck,
  User
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '../ui/utils';
import { ROLE_INFO, ROLE_PERMISSIONS, hasPermission as checkPermission, isValidRole, RoleType } from '../../../utils/permissions';

// Menu item type definition
interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string | null;
  path: string;
  roles?: string[];
}

// Auth context type
interface AuthContextType {
  user?: {
    name?: string;
    email?: string;
    role?: string;
  } | null;
  isAuthenticated: boolean;
  hasPermission?: (permission: string) => boolean;
}

// Role info type
interface RoleInfo {
  label: string;
  color: string;
  icon: string;
  description: string;
}

export default function Sidebar({ currentView, onNavigate }: { currentView: string; onNavigate: (view: string) => void }) {
  const authContext = useAuth() as AuthContextType;
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Safely get user properties
  const user = authContext?.user || { name: 'User', email: '', role: '' };
  const userName = user?.name || 'User';
  const userEmail = user?.email || '';
  const userRole = user?.role || '';
  const isAuthenticated = authContext?.isAuthenticated || false;

  // Permission check helper
  const can = (permission: string): boolean => {
    if (!isAuthenticated || !userRole) return false;
    return checkPermission(userRole, permission);
  };

  // Get role info
  const getRoleInfo = (): RoleInfo => {
    if (isValidRole(userRole)) {
      const info = ROLE_INFO[userRole as RoleType];
      return {
        label: info.label,
        color: info.color,
        icon: info.icon,
        description: info.description
      };
    }
    return {
      label: userRole || 'User',
      color: 'bg-gray-500/20 text-gray-300',
      icon: '',
      description: ''
    };
  };

  const roleInfo = getRoleInfo();

// Menu items with permission requirements
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      permission: null, // All authenticated users
      path: '/dashboard'
    },
    { 
      id: 'courses',
      label: 'Courses', 
      icon: BookOpen, 
      permission: 'courses:read',
      path: '/courses'
    },
    { 
      id: 'enrollments', 
      label: 'Enrollments', 
      icon: Users, 
      permission: 'enrollments:read',
      path: '/enrollments',
      roles: ['Super Admin', 'Admin', 'HR']
    },
    { 
      id: 'assessments', 
      label: 'Assessments', 
      icon: ClipboardCheck, 
      permission: 'assessments:read',
      path: '/assessments',
      roles: ['Super Admin', 'Trainer', 'Learner']
    },
    { 
      id: 'knowledge', 
      label: 'Knowledge Base', 
      icon: FileText, 
      permission: 'knowledge:read',
      path: '/knowledge'
    },
    { 
      id: 'certificates', 
      label: 'Certificates', 
      icon: Award, 
      permission: 'certificates:read',
      path: '/certificates',
      roles: ['Learner']
    },
    { 
      id: 'analytics', 
      label: 'Reports', 
      icon: BarChart3, 
      permission: 'analytics:read',
      path: '/analytics',
      roles: ['Super Admin', 'Admin', 'HR']
    },
    { 
      id: 'users', 
      label: 'User Management', 
      icon: Users, 
      permission: 'users:read',
      path: '/users',
      roles: ['Super Admin', 'Admin', 'HR']
    },
    { 
      id: 'settings', 
      label: 'Organization Settings', 
      icon: Settings, 
      permission: 'settings:read',
      path: '/settings',
      roles: ['Super Admin']
    },

  ];

  // Filter menu items based on permissions and roles
  const visibleItems = menuItems.filter((item: MenuItem) => {
    // Check if user is authenticated
    if (!isAuthenticated) return false;
    
    // Check role restrictions
    if (item.roles && !item.roles.includes(userRole || '')) {
      return false;
    }
    
    // Check permission requirements
    if (item.permission && !can(item.permission)) {
      return false;
    }
    
    return true;
  });

  const handleNavigation = (item: MenuItem) => {
    if (onNavigate) {
      onNavigate(item.id);
    }
    // Also navigate via router if path exists
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <aside className={cn(
      "bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col transition-all duration-300",
      isCollapsed ? "w-20" : "w-72"
    )}>
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-white font-bold">Zoho Learning</h2>
              {roleInfo && (
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs">{roleInfo.icon}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", roleInfo.color)}>
                    {roleInfo.label}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="p-2 mx-2 mt-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
      >
        <svg 
          className={cn("w-5 h-5 transition-transform", isCollapsed && "rotate-180")} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-auto">
        <ul className="space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id || location.pathname === item.path;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative",
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-indigo-200 hover:bg-white/10 hover:text-white'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-indigo-300 text-xs truncate">{user?.email || ''}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
