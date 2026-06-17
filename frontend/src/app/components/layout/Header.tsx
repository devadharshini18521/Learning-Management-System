import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Bell, LogOut, Search, Check, ExternalLink, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { notificationsAPI } from '../../../services/api';
import { toast } from 'sonner';

// Notification type
interface Notification {
  _id: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  type: string;
  createdAt: string;
}

// View type
type ViewType = 'dashboard' | 'profile' | 'courses' | 'assessments' | 'knowledge' | 'certificates' | 'users' | 'settings' | 'analytics' | 'course-viewer' | 'course-builder' | 'assessment-viewer' | 'assessment-builder' | 'article-viewer' | 'article-editor' | 'enrollments' | 'notifications';

interface HeaderProps {
  currentView: string;
  onNavigate?: (view: ViewType) => void;
}

export default function Header({ currentView, onNavigate }: HeaderProps) {
  const { logout } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const previousUnreadCount = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  // Initialize audio on user interaction
  const enableSound = () => {
    setSoundEnabled(true);
    if (!audioRef.current) {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVanu8LdnGgU1k9n1unEiBC13yO/eizEIHWq+8+OZURE');
    }
  };

  const playNotificationSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Ignore audio play errors
      });
    }
  };

  const fetchNotifications = useCallback(async (showToast = false) => {
    try {
      const response = await notificationsAPI.getAll();
      const newNotifications = response.notifications || [];
      const newUnreadCount = response.unreadCount || 0;
      
      // Check if there are new notifications
      if (showToast && newUnreadCount > previousUnreadCount.current && previousUnreadCount.current > 0) {
        const newCount = newUnreadCount - previousUnreadCount.current;
        const latestNotification = newNotifications[0];
        
        if (latestNotification) {
          toast.info(
            <div className="flex items-start gap-2">
              <span className="text-xl">{getNotificationIcon(latestNotification.type)}</span>
              <div>
                <p className="font-medium">{latestNotification.title}</p>
                <p className="text-sm text-gray-500">{latestNotification.message}</p>
              </div>
            </div>,
            {
              duration: 5000,
              action: {
                label: 'View',
                onClick: () => handleNotificationClick(latestNotification)
              }
            }
          );
          playNotificationSound();
          setHasNewNotification(true);
          setTimeout(() => setHasNewNotification(false), 3000);
        }
      }
      
      setNotifications(newNotifications);
      setUnreadCount(newUnreadCount);
      previousUnreadCount.current = newUnreadCount;
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNotifications(false);
  }, [fetchNotifications]);

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Don't close if clicking the view all button
      if ((target as HTMLElement).closest('[data-view-all]')) {
        return;
      }
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isDropdownOpen && bellButtonRef.current) {
      const rect = bellButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [isDropdownOpen]);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await notificationsAPI.markAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      fetchNotifications();
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      handleMarkAsRead(notification._id, { stopPropagation: () => {} } as React.MouseEvent);
    }
    
    // Navigate based on link (only if onNavigate is available)
    if (notification.link && onNavigate) {
      // Parse link to get view type
      if (notification.link.includes('/courses/')) {
        onNavigate('course-viewer');
      } else if (notification.link.includes('/certificates/')) {
        onNavigate('certificates');
      } else if (notification.link.includes('/assessments/')) {
        onNavigate('assessments');
      }
    }
    
    setIsDropdownOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'Enrollment':
        return '📚';
      case 'Assessment':
        return '📝';
      case 'Certificate':
        return '🏆';
      case 'Announcement':
        return '📢';
      case 'Reminder':
        return '⏰';
      case 'Course':
        return '🎓';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'Certificate':
        return 'text-yellow-400';
      case 'Assessment':
        return 'text-blue-400';
      case 'Enrollment':
        return 'text-green-400';
      case 'Announcement':
        return 'text-purple-400';
      case 'Reminder':
        return 'text-orange-400';
      default:
        return 'text-indigo-400';
    }
  };


  const getPageTitle = () => {
    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      courses: 'Courses',
      assessments: 'Assessments',
      knowledge: 'Knowledge Base',
      certificates: 'My Certificates',
      users: 'User Management',
      settings: 'Organization Settings',
      analytics: 'Analytics',
      'course-viewer': 'Course',
      'course-builder': 'Course Builder',
      'assessment-viewer': 'Assessment',
      'assessment-builder': 'Assessment Builder',
      'article-viewer': 'Article',
      'article-editor': 'Article Editor',
      notifications: 'Notifications',
    };
    return titles[currentView] || 'Zoho Learning';
  };

  return (
    <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl font-bold text-white">{getPageTitle()}</h1>
          <p className="text-indigo-300 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 w-64 bg-white/10 border-white/20 text-white placeholder:text-indigo-300"
            />
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <Button
              ref={bellButtonRef}
              variant="ghost"
              className={`relative text-indigo-200 hover:text-white hover:bg-white/10 ${hasNewNotification ? 'animate-pulse' : ''}`}
              onClick={() => {
                setIsDropdownOpen(!isDropdownOpen);
                enableSound();
              }}
            >
              <Bell className={`w-5 h-5 ${hasNewNotification ? 'text-yellow-400' : ''}`} />
              {unreadCount > 0 && (
                <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center ${hasNewNotification ? 'animate-bounce' : ''}`}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>

            {/* Notification Panel - Rendered via Portal to ensure it's on top */}
            {isDropdownOpen && createPortal(
              <div 
                className="fixed w-80 bg-slate-900 border border-white/20 rounded-xl shadow-2xl overflow-hidden"
                style={{ 
                  top: `${dropdownPosition.top}px`, 
                  right: `${dropdownPosition.right}px`, 
                  zIndex: 99999 
                }}
              >
                <div className="p-3 border-b border-white/10 flex items-center justify-between bg-slate-900">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className="text-xs text-indigo-300 hover:text-white p-1"
                      title={soundEnabled ? 'Sound on' : 'Sound off'}
                    >
                      {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                    </Button>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-indigo-300 hover:text-white"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Mark all read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDropdownOpen(false)}
                      className="text-xs text-indigo-300 hover:text-white p-1 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="max-h-96 overflow-auto bg-slate-900">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-indigo-300">
                      No notifications
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification._id}
                        className={`p-4 cursor-pointer transition-colors hover:bg-white/5 ${
                          !notification.isRead ? 'bg-indigo-500/10 border-l-2 border-indigo-400' : 'opacity-75'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`text-xl ${getNotificationColor(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-white font-medium truncate">{notification.title}</p>
                              {!notification.isRead && (
                                <span className="w-2 h-2 bg-indigo-400 rounded-full flex-shrink-0 animate-pulse" />
                              )}
                            </div>
                            <p className="text-indigo-300 text-sm mt-1 line-clamp-2">{notification.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-indigo-400 text-xs">
                                {new Date(notification.createdAt).toLocaleDateString()} • {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {notification.link && (
                                <ExternalLink className="w-3 h-3 text-indigo-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-white/10 text-center bg-slate-900">
                  <button
                    data-view-all="true"
                    className="text-indigo-300 hover:text-white w-full text-sm py-2 px-4 rounded hover:bg-white/10 transition-colors flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('View all clicked');
                      setIsDropdownOpen(false);
                      if (onNavigate) {
                        console.log('Calling onNavigate with notifications');
                        onNavigate('notifications');
                      } else {
                        console.log('onNavigate is undefined!');
                      }
                    }}
                  >
                    View all notifications
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </button>
                </div>
              </div>,
              document.body
            )}
          </div>

          {/* Logout */}
          <Button
            onClick={logout}
            variant="ghost"
            className="text-indigo-200 hover:text-white hover:bg-white/10"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
