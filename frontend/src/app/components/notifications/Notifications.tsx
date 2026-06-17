import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, ExternalLink, Trash2, Volume2, VolumeX, Filter, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
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

interface NotificationsProps {
  onNavigate?: (view: ViewType) => void;
}

export default function Notifications({ onNavigate }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getAll();
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      fetchNotifications();
      toast.success('Notification marked as read');
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      fetchNotifications();
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsAPI.delete(id);
      fetchNotifications();
      toast.success('Notification deleted');
    } catch (err) {
      console.error('Failed to delete notification:', err);
      toast.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    
    // Navigate based on link
    if (notification.link && onNavigate) {
      if (notification.link.includes('/courses/')) {
        onNavigate('course-viewer');
      } else if (notification.link.includes('/certificates/')) {
        onNavigate('certificates');
      } else if (notification.link.includes('/assessments/')) {
        onNavigate('assessments');
      }
    }
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
        return 'text-yellow-400 bg-yellow-400/10';
      case 'Assessment':
        return 'text-blue-400 bg-blue-400/10';
      case 'Enrollment':
        return 'text-green-400 bg-green-400/10';
      case 'Announcement':
        return 'text-purple-400 bg-purple-400/10';
      case 'Reminder':
        return 'text-orange-400 bg-orange-400/10';
      default:
        return 'text-indigo-400 bg-indigo-400/10';
    }
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'Certificate':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Assessment':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Enrollment':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Announcement':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Reminder':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    }
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = new Date(notification.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-400" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-red-500/20 text-red-300 border-red-500/30">
                {unreadCount} unread
              </Badge>
            )}
          </h2>
          <p className="text-indigo-300 mt-1">
            Stay updated with your learning progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="border-white/20 text-indigo-300 hover:text-white hover:bg-white/10"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            className="border-white/20 text-indigo-300 hover:text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="border-white/20 text-indigo-300 hover:text-white hover:bg-white/10"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')} className="w-full">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white text-indigo-300"
          >
            All Notifications
            <Badge variant="secondary" className="ml-2 bg-white/10 text-indigo-300">
              {notifications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger 
            value="unread" 
            className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white text-indigo-300"
          >
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-red-500/20 text-red-300">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <NotificationList 
            groupedNotifications={groupedNotifications}
            onNotificationClick={handleNotificationClick}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
            getNotificationIcon={getNotificationIcon}
            getNotificationColor={getNotificationColor}
            getNotificationBadgeColor={getNotificationBadgeColor}
          />
        </TabsContent>

        <TabsContent value="unread" className="mt-6">
          <NotificationList 
            groupedNotifications={groupedNotifications}
            onNotificationClick={handleNotificationClick}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
            getNotificationIcon={getNotificationIcon}
            getNotificationColor={getNotificationColor}
            getNotificationBadgeColor={getNotificationBadgeColor}
          />
        </TabsContent>
      </Tabs>

      {filteredNotifications.length === 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="w-12 h-12 text-indigo-400/50 mb-4" />
            <p className="text-indigo-300 text-lg">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-indigo-400/60 text-sm mt-2">
              {filter === 'unread' 
                ? 'You\'re all caught up!' 
                : 'Notifications will appear here when you have updates'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Notification List Component
interface NotificationListProps {
  groupedNotifications: Record<string, Notification[]>;
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  getNotificationIcon: (type: string) => string;
  getNotificationColor: (type: string) => string;
  getNotificationBadgeColor: (type: string) => string;
}

function NotificationList({ 
  groupedNotifications, 
  onNotificationClick, 
  onMarkAsRead, 
  onDelete,
  getNotificationIcon,
  getNotificationColor,
  getNotificationBadgeColor
}: NotificationListProps) {
  const sortedDates = Object.keys(groupedNotifications).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6">
      {sortedDates.map(date => (
        <div key={date}>
          <h3 className="text-sm font-medium text-indigo-400 mb-3 sticky top-0 bg-slate-900/95 py-2">
            {date === new Date().toLocaleDateString() ? 'Today' : 
             date === new Date(Date.now() - 86400000).toLocaleDateString() ? 'Yesterday' : date}
          </h3>
          <div className="space-y-2">
            {groupedNotifications[date].map((notification) => (
              <Card 
                key={notification._id}
                className={`bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer ${
                  !notification.isRead ? 'border-l-2 border-l-indigo-400' : ''
                }`}
                onClick={() => onNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                      <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-medium">{notification.title}</h4>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                            )}
                          </div>
                          <p className="text-indigo-300 text-sm mt-1">{notification.message}</p>
                        </div>
                        <Badge variant="outline" className={`text-xs ${getNotificationBadgeColor(notification.type)}`}>
                          {notification.type}
                        </Badge>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-indigo-400 text-xs">
                          {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead(notification._id);
                              }}
                              className="text-xs text-indigo-300 hover:text-white p-1"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Mark read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(notification._id);
                            }}
                            className="text-xs text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          {notification.link && (
                            <ExternalLink className="w-3 h-3 text-indigo-400 ml-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
