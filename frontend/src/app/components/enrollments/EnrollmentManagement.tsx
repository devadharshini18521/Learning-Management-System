import { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  Search, 
  Filter, 
  Download,
  Upload,
  MoreVertical,
  CheckCircle,
  Clock,
  TrendingUp,
  UserPlus
} from 'lucide-react';
import { enrollmentsAPI } from '../../../services/enrollmentsAPI';
import { coursesAPI, usersAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../hooks/usePermission';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '../ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import BulkEnrollDialog from './BulkEnrollDialog';

// Enrollment interface
interface Enrollment {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseName: string;
  courseThumbnail?: string;
  courseCategory: string;
  enrolledAt: string;
  progress: number;
  status: 'In Progress' | 'Completed';
  completedLessons: string[];
}

// Stats interface
interface EnrollmentStats {
  totalEnrollments: number;
  completedEnrollments: number;
  inProgressEnrollments: number;
  averageProgress: number;
  completionRate: number;
}

// Course interface
interface Course {
  _id: string;
  title: string;
  category: string;
  status: string;
}

export default function EnrollmentManagement() {
  const { user: currentUser } = useAuth();
  const { can, isAuthenticated, role: currentUserRole } = usePermission();
  
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EnrollmentStats | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  
  // Dialogs
  const [isBulkEnrollOpen, setIsBulkEnrollOpen] = useState(false);

  // Check permissions - Admin/HR have enrollments:create, Super Admin has users:write
  const canManageEnrollments = isAuthenticated && (can('enrollments:create') || can('users:write'));

  useEffect(() => {
    fetchEnrollments();
    fetchCourses();
    fetchStats();
  }, [statusFilter, courseFilter]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const query: Record<string, string> = {};
      
      if (searchTerm) {
        query.search = searchTerm;
      }
      if (statusFilter !== 'all') {
        query.status = statusFilter;
      }
      if (courseFilter !== 'all') {
        query.courseId = courseFilter;
      }

      const response = await enrollmentsAPI.getAll(query);
      setEnrollments(response.enrollments || []);
    } catch (err) {
      console.error('Failed to fetch enrollments:', err);
      toast.error('Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.getAll({ status: 'Published' });
      setCourses(response.courses || []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await enrollmentsAPI.getStats();
      setStats(response.stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEnrollments();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Completed') {
      return (
        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
        <Clock className="w-3 h-3 mr-1" />
        In Progress
      </Badge>
    );
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  const getProgressBar = (progress: number) => {
    const colorClass = getProgressColor(progress);
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClass} transition-all`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-white text-sm w-10">{progress}%</span>
      </div>
    );
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchEnrollments();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (loading && enrollments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Loading enrollments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Course Enrollments</h2>
          <p className="text-indigo-300 mt-1">Manage learner enrollments and track progress</p>
        </div>
        {canManageEnrollments && (
          <Button
            onClick={() => setIsBulkEnrollOpen(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Bulk Enroll
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-300 text-sm">Total Enrollments</p>
                <p className="text-2xl font-bold text-white">{stats.totalEnrollments}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-300 text-sm">In Progress</p>
                <p className="text-2xl font-bold text-white">{stats.inProgressEnrollments}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-300 text-sm">Completed</p>
                <p className="text-2xl font-bold text-white">{stats.completedEnrollments}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-300 text-sm">Avg. Progress</p>
                <p className="text-2xl font-bold text-white">{stats.averageProgress}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
          <Input
            type="search"
            placeholder="Search by learner name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 bg-white/10 border-white/20 text-white placeholder:text-indigo-300"
          />
        </form>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-white/20 text-white">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-full sm:w-64 bg-white/10 border-white/20 text-white">
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-white/20 text-white">
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course._id} value={course._id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Enrollments Table */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
        {enrollments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="w-16 h-16 text-indigo-300 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Enrollments Found</h3>
            <p className="text-indigo-300 text-center max-w-md">
              {searchTerm || statusFilter !== 'all' || courseFilter !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'Start by enrolling learners in courses using the Bulk Enroll button.'}
            </p>
            {canManageEnrollments && !searchTerm && statusFilter === 'all' && courseFilter === 'all' && (
              <Button
                onClick={() => setIsBulkEnrollOpen(true)}
                className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-600"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Bulk Enroll
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-indigo-300">Learner</TableHead>
                <TableHead className="text-indigo-300">Course</TableHead>
                <TableHead className="text-indigo-300">Enrolled Date</TableHead>
                <TableHead className="text-indigo-300">Progress</TableHead>
                <TableHead className="text-indigo-300">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.map((enrollment) => (
                <TableRow key={enrollment._id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div>
                      <p className="text-white font-medium">{enrollment.userName}</p>
                      <p className="text-indigo-300 text-sm">{enrollment.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {enrollment.courseThumbnail && (
                        <img 
                          src={enrollment.courseThumbnail} 
                          alt={enrollment.courseName}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="text-white">{enrollment.courseName}</p>
                        <Badge variant="outline" className="text-xs border-white/20 text-indigo-300">
                          {enrollment.courseCategory}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-indigo-200">
                    {formatDate(enrollment.enrolledAt)}
                  </TableCell>
                  <TableCell>
                    {getProgressBar(enrollment.progress)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(enrollment.status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Bulk Enroll Dialog */}
      <BulkEnrollDialog
        open={isBulkEnrollOpen}
        onOpenChange={setIsBulkEnrollOpen}
        onSuccess={() => {
          fetchEnrollments();
          fetchStats();
        }}
      />
    </div>
  );
}
