import { useState, useEffect } from 'react';
import { analyticsAPI, coursesAPI, assessmentsAPI } from '../../../services/api';
import { BookOpen, Users, TrendingUp, Clock, Trash2, Edit, ClipboardCheck, Link2, Award } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface OverviewData {
  totalCourses: number;
  totalEnrollments: number;
  completedCourses: number;
}

interface RecentAssessmentResult {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  assessment: {
    title: string;
  };
  score: number;
  percentage: number;
  passed: boolean;
  attemptNumber: number;
  createdAt: string;
}

interface AnalyticsData {
  overview: OverviewData;
  recentEnrollments?: any[];
  recentAssessmentResults?: RecentAssessmentResult[];
}

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  modules: any[];
  assessment?: string | { _id: string; title: string };
}

interface Assessment {
  questions: any;
  _id: string;
  title: string;
  course?: string | { _id: string };
  status: string;
}

interface TrainerDashboardProps {
  onNavigate: (view: string) => void;
  onEditCourse?: (course: Course) => void;
  onEditAssessment?: (assessment: Assessment) => void;
  onEditArticle?: (article: any) => void;
  onCreateCourse?: () => void;
}

export default function TrainerDashboard({ onNavigate, onEditCourse, onEditAssessment, onCreateCourse }: TrainerDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [assessmentDeleteDialogOpen, setAssessmentDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [courseToMap, setCourseToMap] = useState<Course | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<string>('');

  useEffect(() => {
    fetchAnalytics();
    fetchMyCourses();
    fetchAssessments();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await analyticsAPI.getDashboard();
      setAnalytics(response.analytics as AnalyticsData);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const fetchMyCourses = async () => {
    try {
      const response = await coursesAPI.getAll({});
      setCourses(response.courses || []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessments = async () => {
    try {
      const response = await assessmentsAPI.getAll();
      setAssessments(response.assessments || []);
    } catch (err) {
      console.error('Failed to fetch assessments:', err);
    }
  };

  const handleDeleteClick = (course: Course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;
    
    try {
      await coursesAPI.delete(courseToDelete._id);
      toast.success('Course deleted successfully!');
      fetchMyCourses();
      fetchAnalytics();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete course');
    } finally {
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  };

  const handleAssessmentDeleteClick = (assessment: Assessment) => {
    setAssessmentToDelete(assessment);
    setAssessmentDeleteDialogOpen(true);
  };

  const handleAssessmentDeleteConfirm = async () => {
    if (!assessmentToDelete) return;
    
    try {
      await assessmentsAPI.delete(assessmentToDelete._id);
      toast.success('Assessment deleted successfully!');
      fetchAssessments();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete assessment');
    } finally {
      setAssessmentDeleteDialogOpen(false);
      setAssessmentToDelete(null);
    }
  };

  const handleMapClick = (course: Course) => {
    setCourseToMap(course);
    setSelectedAssessment('');
    setMapDialogOpen(true);
  };

  const handleMapConfirm = async () => {
    if (!courseToMap) return;
    
    try {
      // If "none" selected, remove the mapping (set to null)
      const assessmentValue = selectedAssessment === 'none' ? null : selectedAssessment;
      await coursesAPI.update(courseToMap._id, { assessment: assessmentValue });
      toast.success(assessmentValue ? 'Assessment mapped to course successfully!' : 'Assessment mapping removed!');
      fetchMyCourses();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to map assessment');
    } finally {
      setMapDialogOpen(false);
      setCourseToMap(null);
      setSelectedAssessment('');
    }
  };

  const getMappedAssessment = (course: Course) => {
    if (!course.assessment) return null;
    const assessmentId = typeof course.assessment === 'string' ? course.assessment : course.assessment._id;
    return assessments.find(a => a._id === assessmentId);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-8 h-36">
          <div className="h-8 w-48 bg-white/20 rounded animate-pulse mb-2" />
          <div className="h-4 w-72 bg-white/20 rounded animate-pulse" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl animate-pulse" />
              </div>
              <div className="h-4 w-24 bg-white/10 rounded animate-pulse mb-2" />
              <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="h-6 w-28 bg-white/10 rounded animate-pulse mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-white/10 rounded animate-pulse" />
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="h-6 w-32 bg-white/10 rounded animate-pulse mb-6" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-20 bg-white/10 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Enrollments */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="h-6 w-36 bg-white/10 rounded animate-pulse mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-white/10 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const overview: OverviewData = analytics?.overview || {
    totalCourses: 0,
    totalEnrollments: 0,
    completedCourses: 0
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Welcome, Trainer! 📚</h2>
        <p className="text-purple-100">Create engaging content and track learner progress.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-indigo-300 text-sm mb-1">My Courses</p>
          <p className="text-white text-3xl font-bold">{overview.totalCourses || 0}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <p className="text-indigo-300 text-sm mb-1">Total Learners</p>
          <p className="text-white text-3xl font-bold">{overview.totalEnrollments || 0}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <p className="text-indigo-300 text-sm mb-1">Completions</p>
          <p className="text-white text-3xl font-bold">{overview.completedCourses || 0}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-400" />
            </div>
          </div>
          <p className="text-indigo-300 text-sm mb-1">Avg. Completion</p>
          <p className="text-white text-3xl font-bold">
            {overview.completedCourses && overview.totalEnrollments
              ? Math.round((overview.completedCourses / overview.totalEnrollments) * 100)
              : 0}%
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => onCreateCourse ? onCreateCourse() : onNavigate('courses')}
            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 py-6"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Create New Course
          </Button>
          <Button
            onClick={() => onEditAssessment ? onEditAssessment(null as any) : onNavigate('assessments')}
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 py-6"
          >
            <ClipboardCheck className="w-5 h-5 mr-2" />
            Create Assessment
          </Button>
          <Button
            onClick={() => onNavigate('courses')}
            className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 py-6"
          >
            <Link2 className="w-5 h-5 mr-2" />
            Map Assessment to Course
          </Button>
          <Button
            onClick={() => onNavigate('knowledge')}
            className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 py-6"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Write Article
          </Button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">My Courses</h3>
            <Button
              onClick={() => onNavigate('courses')}
              className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30"
            >
              <Edit className="w-4 h-4 mr-2" />
              Manage All
            </Button>
          </div>
          
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
              <p className="text-indigo-300 mb-4">You haven't created any courses yet</p>
              <Button
                onClick={() => onNavigate('courses')}
                className="bg-gradient-to-r from-indigo-500 to-purple-600"
              >
                Create Your First Course
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.slice(0, 4).map((course) => (
                <div key={course._id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-white font-medium mb-1 line-clamp-1">{course.title}</h4>
                      <p className="text-indigo-300 text-sm">{course.category}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      course.status === 'Published' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {course.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-300 text-sm">
                        {course.modules?.length || 0} modules
                      </span>
                      {getMappedAssessment(course) && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          Assessment Mapped
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleMapClick(course)}
                        variant="ghost"
                        size="icon"
                        className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                        title="Map Assessment"
                      >
                        <Link2 className="w-4 h-4" />
                      </Button>
                      {onEditCourse && (
                        <Button
                          onClick={() => onEditCourse(course)}
                          variant="ghost"
                          size="icon"
                          className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDeleteClick(course)}
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Assessments */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">My Assessments</h3>
            <Button
              onClick={() => onNavigate('assessments')}
              className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30"
            >
              <Edit className="w-4 h-4 mr-2" />
              Manage All
            </Button>
          </div>
          
          {assessments.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardCheck className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
              <p className="text-indigo-300 mb-4">You haven't created any assessments yet</p>
              <Button
                onClick={() => onEditAssessment ? onEditAssessment(null as any) : onNavigate('assessments')}
                className="bg-gradient-to-r from-blue-500 to-cyan-600"
              >
                Create Your First Assessment
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {assessments.slice(0, 4).map((assessment) => (
                <div key={assessment._id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-white font-medium mb-1 line-clamp-1">{assessment.title}</h4>
                      <p className="text-indigo-300 text-sm">
                        {assessment.course ? 'Mapped to course' : 'Standalone assessment'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      assessment.status === 'Published' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {assessment.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-300 text-sm">
                      {assessment.questions?.length || 0} questions
                    </span>
                    <div className="flex items-center gap-2">
                      {onEditAssessment && (
                        <Button
                          onClick={() => onEditAssessment(assessment)}
                          variant="ghost"
                          size="icon"
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                          title="Edit Assessment"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        onClick={() => handleAssessmentDeleteClick(assessment)}
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        title="Delete Assessment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Enrollments */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <h3 className="text-xl font-bold text-white mb-6">Recent Enrollments</h3>
        <div className="space-y-3">
          {analytics?.recentEnrollments?.slice(0, 5).map((enrollment: any) => (
            <div key={enrollment._id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {enrollment.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-medium">{enrollment.name}</p>
                  <p className="text-indigo-300 text-sm">{enrollment.email}</p>
                </div>
              </div>
              {enrollment.course?.title && (
                <div className="text-right">
                  <p className="text-indigo-300 text-sm">Enrolled in</p>
                  <p className="text-white text-sm">{enrollment.course.title}</p>
                </div>
              )}
            </div>
          )) || (
            <p className="text-indigo-300 text-center py-8">No recent enrollments</p>
          )}
        </div>
      </div>

      {/* Delete Course Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Course</AlertDialogTitle>
            <AlertDialogDescription className="text-indigo-300">
              Are you sure you want to delete "{courseToDelete?.title}"? This action cannot be undone and all enrolled users will lose access to this course.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete Course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Assessment Confirmation Dialog */}
      <AlertDialog open={assessmentDeleteDialogOpen} onOpenChange={setAssessmentDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Assessment</AlertDialogTitle>
            <AlertDialogDescription className="text-indigo-300">
              Are you sure you want to delete "{assessmentToDelete?.title}"? This action cannot be undone and all assessment results will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAssessmentDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete Assessment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Map Assessment Dialog */}
      <AlertDialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Map Assessment to Course</AlertDialogTitle>
            <AlertDialogDescription className="text-indigo-300">
              Select an assessment to map to "{courseToMap?.title}". Learners will see this assessment after completing the course.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select an assessment" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/20">
                <SelectItem value="none">-- Remove mapping --</SelectItem>
                {assessments
                  .filter(a => a.status === 'Published' || a.status === 'Active')
                  .map((assessment) => (
                    <SelectItem key={assessment._id} value={assessment._id}>
                      {assessment.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setSelectedAssessment('')}
              className="bg-white/10 text-white hover:bg-white/20"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMapConfirm}
              disabled={!selectedAssessment}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {selectedAssessment === 'none' ? 'Remove Mapping' : 'Map Assessment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
