import { useState, useEffect } from 'react';
import { coursesAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { usePermission } from '../../../hooks/usePermission';
import { BookOpen, Plus, Search, Trash2, Play, Check, Clock, X, ExternalLink, FileText, Link as LinkIcon, Type, AlertTriangle, Award, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
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
import { getYouTubeEmbedUrl, getPdfEmbedUrl, isYouTubeUrl, isPdfUrl, getYouTubeVideoId } from '../../../utils/media';
import { certificatesAPI } from '../../../services/api';

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  category: string;
  level: string;
  duration: number;
  status: string;
  modules: any[];
  enrolledUsers: any[];
}

interface Enrollment {
  course: string | { _id: string; title?: string; thumbnail?: string; category?: string };
  enrolledAt: string;
  progress: number;
  status: string;
  completedLessons: string[];
}

interface User {
  _id: string;
  role: string;
  enrolledCourses: Enrollment[];
}

interface CourseListProps {
  onSelectCourse: (course: Course) => void;
  onCreateCourse: () => void;
  onRefreshUser?: () => void;
}

// Course card state interface
interface CourseCardState {
  enrolled: boolean;
  enrolling: boolean;
}

export default function CourseList({ onSelectCourse, onCreateCourse, onRefreshUser }: CourseListProps) {
  const { user, refreshUser } = useAuth() as { user: User | null; refreshUser: () => Promise<void> };
  const { isRole, can } = usePermission();
  
  // Permission checks for RBAC
  const canCreateCourse = can('courses:create');
  const canUpdateCourse = can('courses:update') || can('courses:write');
  const canDeleteCourse = can('courses:delete');
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [unenrollingId, setUnenrollingId] = useState<string | null>(null);

  // Course viewer state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseViewer, setShowCourseViewer] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [showLessonViewer, setShowLessonViewer] = useState(false);
  const [showLinkConfirm, setShowLinkConfirm] = useState(false);
  const [pendingLink, setPendingLink] = useState('');
  
  // Certificate state
  const [certificate, setCertificate] = useState<any>(null);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, [filter]);

  // Refresh user data on mount to get latest enrollment status
  useEffect(() => {
    refreshUser();
  }, []);

  const fetchCourses = async () => {
    try {
      const query = filter !== 'all' ? { status: filter } : {};
      const response = await coursesAPI.getAll(query);
      setCourses(response.courses || []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (course: Course) => {
    setEnrollingId(course._id);
    try {
      await coursesAPI.enroll(course._id);
      toast.success('Successfully enrolled in course!');

      // Refresh user data to get updated enrollment status
      await refreshUser();

      // Trigger parent refresh if needed
      onRefreshUser?.();

      // Open the course viewer with the first lesson
      openCourseViewer(course);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to enroll');
    } finally {
      setEnrollingId(null);
    }
  };

  // Handle continue button - opens course viewer directly
  const handleContinue = (course: Course) => {
    openCourseViewer(course);
  };

  // Open course viewer and auto-select first lesson
  const openCourseViewer = (course: Course, _shouldAutoSelect: boolean = false) => {
    setSelectedCourse(course);
    
    // Get enrollment data to find first unlocked lesson
    const enrollment = getEnrollment(course._id);
    
    // Find first unlocked lesson
    let firstLesson: any = null;
    if (course.modules) {
      for (const module of course.modules) {
        if (!module.lessons?.length) continue;
        for (const lesson of module.lessons) {
          if (!enrollment?.completedLessons?.includes(lesson._id)) {
            firstLesson = lesson;
            break;
          }
        }
        if (firstLesson) break;
      }
      
      // If all lessons completed, start from beginning
      if (!firstLesson && course.modules[0]?.lessons?.[0]) {
        firstLesson = course.modules[0].lessons[0];
      }
    }
    
    setSelectedLesson(firstLesson);
    setShowVideoPlayer(false);
    setShowLessonViewer(false);
    setCompletedLessons(new Set(enrollment?.completedLessons || []));
    setShowCourseViewer(true);
  };

  const handleUnenroll = async (courseId: string) => {
    setUnenrollingId(courseId);
    try {
      await coursesAPI.unenroll(courseId);
      toast.success('Successfully unenrolled from course');
      // Refresh user data locally without page reload
      await refreshUser();
      // Also refresh the courses list to show updated enrollment count
      await fetchCourses();
      // Trigger parent refresh if needed
      onRefreshUser?.();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to unenroll');
    } finally {
      setUnenrollingId(null);
    }
  };

  const handleViewCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowCourseViewer(true);
  };

  const handleCloseCourseViewer = () => {
    setShowCourseViewer(false);
    setSelectedCourse(null);
  };

  // Check if all lessons are completed
  const isAllLessonsCompleted = (): boolean => {
    if (!selectedCourse?.modules) return false;
    const totalLessons = selectedCourse.modules.reduce((acc: number, mod: any) => acc + (mod.lessons?.length || 0), 0);
    return completedLessons.size >= totalLessons;
  };

  // Check for certificate
  const checkForCertificate = async () => {
    if (!selectedCourse?._id) return;
    try {
      const response = await certificatesAPI.getAll();
      const cert = response.certificates?.find((c: any) => c.course?._id === selectedCourse._id);
      if (cert) {
        setCertificate(cert);
      }
    } catch (err) {
      console.error('Failed to check for certificate:', err);
    }
  };

  // Handle generate certificate
  const handleGenerateCertificate = async () => {
    if (!selectedCourse?._id) return;
    try {
      setGeneratingCertificate(true);
      const response = await certificatesAPI.generate(selectedCourse._id);
      toast.success('Certificate generated successfully!');
      setCertificate(response.certificate);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate certificate');
    } finally {
      setGeneratingCertificate(false);
    }
  };

  // Handle view certificate
  const handleViewCertificate = () => {
    if (certificate?.certificateNumber) {
      window.open(`/certificates/${certificate.certificateNumber}`, '_blank');
    }
  };

  // Handle download certificate - use API with authentication
  const handleDownloadCertificate = async () => {
    if (certificate?._id) {
      try {
        toast.info('Preparing certificate...');
        const result = await certificatesAPI.download(certificate._id);
        if (result.type === 'html') {
          toast.success('Certificate opened! Use Ctrl+P to save as PDF');
        } else {
          toast.success('Certificate downloaded successfully!');
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to download certificate');
      }
    }
  };


  const handleCompleteLesson = async (lessonId: string) => {
    if (!selectedCourse) return;
    try {
      const response = await coursesAPI.completeLesson(selectedCourse._id, lessonId);

      // Update local state
      const newCompleted = new Set(completedLessons);
      newCompleted.add(lessonId);
      setCompletedLessons(newCompleted);

      // Check if course is complete
      const totalLessons = selectedCourse.modules?.reduce((acc: number, mod: any) => acc + (mod.lessons?.length || 0), 0) || 1;
      const isComplete = response.isCourseComplete || newCompleted.size >= totalLessons;

      if (isComplete) {
        toast.success('🎉 Congratulations! You have completed this course! You can now generate your certificate.');
        // Check for existing certificate
        await checkForCertificate();
      } else {
        toast.success('Lesson marked as complete!');
      }
    } catch (err) {
      toast.error('Failed to update progress');
    }
  };

  const handleVideoClick = (lesson: any) => {
    setSelectedLesson(lesson);
    setShowVideoPlayer(true);
  };

  const handlePdfClick = (lesson: any) => {
    setSelectedLesson(lesson);
    setShowLessonViewer(true);
  };

  const handleLinkClick = (lesson: any) => {
    setPendingLink(lesson.content);
    setSelectedLesson(lesson);
    setShowLinkConfirm(true);
  };

  const confirmExternalLink = () => {
    if (pendingLink) {
      window.open(pendingLink, '_blank');
    }
    setShowLinkConfirm(false);
    setPendingLink('');
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
      fetchCourses();
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to delete course');
    } finally {
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  };

  const isEnrolled = (courseId: string) => {
    // Check enrollment from user data (refreshed from server)
    // Handle both string ID and populated object cases
    return user?.enrolledCourses?.some((enrollment: Enrollment) => {
      if (typeof enrollment.course === 'string') {
        return enrollment.course === courseId;
      } else if (enrollment.course && typeof enrollment.course === 'object') {
        return enrollment.course._id === courseId;
      }
      return false;
    }) || false;
  };

  const getEnrollmentProgress = (courseId: string) => {
    if (!user?.enrolledCourses) return 0;
    const enrollment = user.enrolledCourses.find((e: Enrollment) => {
      if (typeof e.course === 'string') {
        return e.course === courseId;
      } else if (e.course && typeof e.course === 'object') {
        return e.course._id === courseId;
      }
      return false;
    });
    return enrollment?.progress || 0;
  };

  // Get enrollment data for a course
  const getEnrollment = (courseId: string) => {
    if (!user?.enrolledCourses) return null;
    return user.enrolledCourses.find((e: Enrollment) => {
      if (typeof e.course === 'string') {
        return e.course === courseId;
      } else if (e.course && typeof e.course === 'object') {
        return e.course._id === courseId;
      }
      return false;
    });
  };

  // Get next incomplete lesson
  const getNextLesson = (course: Course) => {
    const enrollment = getEnrollment(course._id);
    if (!course.modules) return null;
    
    for (const module of course.modules) {
      if (!module.lessons?.length) continue;
      for (const lesson of module.lessons) {
        if (!enrollment?.completedLessons?.includes(lesson._id)) {
          return { moduleIndex: course.modules.indexOf(module), lesson };
        }
      }
    }
    return course.modules[0]?.lessons?.[0] ? { moduleIndex: 0, lesson: course.modules[0].lessons[0] } : null;
  };

  // Calculate estimated time remaining (in minutes)
  const getTimeRemaining = (course: Course) => {
    const enrollment = getEnrollment(course._id);
    if (!course.modules) return 0;
    
    let remainingMinutes = 0;
    for (const module of course.modules) {
      if (!module.lessons?.length) continue;
      for (const lesson of module.lessons) {
        if (!enrollment?.completedLessons?.includes(lesson._id)) {
          remainingMinutes += lesson.duration || 5;
        }
      }
    }
    return remainingMinutes;
  };

  // Get total lessons count
  const getTotalLessons = (course: Course) => {
    if (!course.modules) return 0;
    return course.modules.reduce((acc: number, mod: any) => acc + (mod.lessons?.length || 0), 0);
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-40 bg-white/10 rounded animate-pulse mb-1" />
            <div className="h-4 w-56 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-10 w-28 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="flex gap-4">
          <div className="h-10 flex-1 bg-white/10 rounded animate-pulse" />
          <div className="h-10 w-24 bg-white/10 rounded animate-pulse" />
          <div className="h-10 w-24 bg-white/10 rounded animate-pulse" />
          <div className="h-10 w-24 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
              <div className="h-48 bg-white/10 animate-pulse" />
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="h-6 w-3/4 bg-white/10 rounded animate-pulse mb-1" />
                    <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-20 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="h-4 w-full bg-white/10 rounded animate-pulse mb-4" />
                <div className="flex items-center justify-between mb-4">
                  <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
                  <div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
                </div>
                <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Courses</h2>
          <p className="text-indigo-300 mt-1">
            {canCreateCourse ? 'Manage and access your learning content' : 'View available courses'}
          </p>
        </div>
        {canCreateCourse && (
          <Button
            onClick={onCreateCourse}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Course
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
          <Input
            type="search"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 bg-white/10 border-white/20 text-white placeholder:text-indigo-300"
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'ghost'}
            className={filter === 'all' ? 'bg-indigo-500' : 'text-indigo-300 hover:bg-white/10'}
          >
            All
          </Button>
          <Button
            onClick={() => setFilter('Published')}
            variant={filter === 'Published' ? 'default' : 'ghost'}
            className={filter === 'Published' ? 'bg-indigo-500' : 'text-indigo-300 hover:bg-white/10'}
          >
            Published
          </Button>
          {isRole('Super Admin', 'Admin', 'Trainer') && (
            <Button
              onClick={() => setFilter('Draft')}
              variant={filter === 'Draft' ? 'default' : 'ghost'}
              className={filter === 'Draft' ? 'bg-indigo-500' : 'text-indigo-300 hover:bg-white/10'}
            >
              Draft
            </Button>
          )}
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-12 text-center">
          <BookOpen className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <p className="text-white font-medium mb-2">No courses found</p>
          <p className="text-indigo-300">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const enrolled = isEnrolled(course._id);
            const progress = getEnrollmentProgress(course._id);
            const isEnrolling = enrollingId === course._id;
            const isUnenrolling = unenrollingId === course._id;

            return (
              <div
                key={course._id}
                className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden hover:border-indigo-500/50 transition-all group"
              >
                {/* Course Thumbnail */}
                <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <BookOpen className="w-16 h-16 text-white opacity-30" />
                  )}
                  {course.status === 'Draft' && (
                    <div className="absolute top-4 right-4 bg-yellow-500/90 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Draft
                    </div>
                  )}
                  {enrolled && (
                    <div className="absolute top-4 left-4 bg-green-500/90 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Enrolled
                    </div>
                  )}
                </div>

                {/* Course Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-bold text-lg mb-1 line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-indigo-300 text-sm">{course.category}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      course.level === 'Beginner' ? 'bg-green-500/20 text-green-300' :
                      course.level === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {course.level}
                    </span>
                  </div>

                  <p className="text-indigo-200 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-indigo-300 mb-4">
                    <span>{course.modules?.length || 0} modules</span>
                    <span>{course.duration || 0} mins</span>
                    <span>{course.enrolledUsers?.length || 0} enrolled</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => user?.role === 'Learner' 
                        ? (enrolled ? handleContinue(course) : handleEnroll(course)) 
                        : handleViewCourse(course)}
                      disabled={enrollingId === course._id || unenrollingId === course._id}
                      className="hidden flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    >
                      View course
                    </Button>
                    {false && user?.role === 'Learner' && enrolled && (
                      <Button
                        onClick={() => handleUnenroll(course._id)}
                        disabled={unenrollingId === course._id}
                        variant="outline"
                        className="bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500/30 hover:text-red-300 font-medium px-4"
                      >
                        {unenrollingId === course._id ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Unenrolling...
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4 mr-2" />
                            Unenroll
                          </>
                        )}
                      </Button>
                    )}
                    {(canUpdateCourse || canDeleteCourse) && (
                      <div className="w-full flex justify-center">
                        {canUpdateCourse && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCourse(course);
                            }}
                            className="
                                        bg-gradient-to-r from-green-500 to-emerald-600
                                        hover:from-green-600 hover:to-emerald-700
                                        text-white
                                        px-15 py-
                                        text-lg font-semibold
                                        rounded-lg
                                        mx-auto
                                        block
                                        "
                          >
                            View Course
                          </Button>
                        )}
                        {canDeleteCourse && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCourseToDelete(course);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Course Viewer Modal */}
      {showCourseViewer && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/20 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{selectedCourse.title}</h3>
                  <p className="text-indigo-300 text-sm">{selectedCourse.category} • {selectedCourse.level}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseCourseViewer}
                className="text-indigo-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  {/* Certificate Section - Show when course is complete */}
                  {(isAllLessonsCompleted() || completedLessons.size > 0) && (
                    <div className="bg-yellow-500/20 backdrop-blur-xl rounded-2xl border border-yellow-500/30 p-4">
                      {certificate ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Award className="w-8 h-8 text-yellow-400" />
                            <div>
                              <p className="text-white font-medium">Certificate Available!</p>
                              <p className="text-indigo-300 text-sm">ID: {certificate.certificateNumber}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleViewCertificate} className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 text-sm">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button onClick={handleDownloadCertificate} className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-sm">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ) : isAllLessonsCompleted() ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Award className="w-8 h-8 text-yellow-400" />
                            <div>
                              <p className="text-white font-medium">Course Completed!</p>
                              <p className="text-indigo-300 text-sm">Generate your certificate now</p>
                            </div>
                          </div>
                          <Button onClick={handleGenerateCertificate} disabled={generatingCertificate} className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700">
                            <Award className="w-4 h-4 mr-2" />
                            {generatingCertificate ? 'Generating...' : 'Generate Certificate'}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4 space-y-2 sticky top-6">
                    <h3 className="text-white font-bold mb-4">Course Content</h3>
                    {selectedCourse.modules?.map((module: any, moduleIndex: number) => (
                      <div key={module._id || moduleIndex}>
                        <div className="text-white font-medium mb-2 px-3 py-2 bg-white/5 rounded-lg">
                          {moduleIndex + 1}. {module.title}
                        </div>
                        <div className="space-y-1 ml-4">
                          {module.lessons?.map((lesson: any, lessonIndex: number) => {
                            const isCompleted = completedLessons.has(lesson._id);
                            const isSelected = selectedLesson?._id === lesson._id;

                            // Get lesson icon based on type
                            const getLessonIcon = (type: string) => {
                              switch (type) {
                                case 'Video': return <Play className="w-4 h-4" />;
                                case 'PDF': return <FileText className="w-4 h-4" />;
                                case 'Link': return <LinkIcon className="w-4 h-4" />;
                                case 'Text': return <Type className="w-4 h-4" />;
                                default: return <FileText className="w-4 h-4" />;
                              }
                            };

                            return (
                              <button
                                key={lesson._id || lessonIndex}
                                onClick={() => {
                                  setSelectedLesson(lesson);
                                  setShowVideoPlayer(false);
                                  setShowLessonViewer(false);
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                                  isSelected ? 'bg-indigo-500 text-white' :
                                  'text-indigo-300 hover:bg-white/10'
                                }`}
                              >
                                {isCompleted ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  getLessonIcon(lesson.type)
                                )}
                                <span className="flex-1 text-left">{lesson.title}</span>
                                <span className="text-xs opacity-70">{lesson.duration}m</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
                    {selectedLesson ? (
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h2 className="text-2xl font-bold text-white">{selectedLesson.title}</h2>
                            {selectedLesson.description && (
                              <p className="text-indigo-200 mt-1">{selectedLesson.description}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setShowVideoPlayer(false);
                              setShowLessonViewer(false);
                              setSelectedLesson(null);
                            }}
                            className="text-indigo-300 hover:text-white"
                          >
                            <X className="w-5 h-5" />
                          </Button>
                        </div>

                        <div className="mb-6">
                          {selectedLesson.type === 'Video' ? (
                            <div className="space-y-4">
                              {showVideoPlayer ? (
                                <div className="relative pb-[56.25%] h-0 bg-black rounded-lg overflow-hidden">
                                  <iframe
                                    src={getYouTubeEmbedUrl(selectedLesson.content)}
                                    className="absolute top-0 left-0 w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title={selectedLesson.title}
                                  />
                                </div>
                              ) : (
                                <div
                                  className="relative bg-black rounded-lg overflow-hidden cursor-pointer group"
                                  onClick={() => handleVideoClick(selectedLesson)}
                                >
                                  {isYouTubeUrl(selectedLesson.content) ? (
                                    <>
                                      <img
                                        src={`https://img.youtube.com/vi/${getYouTubeVideoId(selectedLesson.content)}/hqdefault.jpg`}
                                        alt={selectedLesson.title}
                                        className="w-full h-64 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                          <Play className="w-8 h-8 text-white ml-1" />
                                        </div>
                                      </div>
                                      <div className="absolute bottom-4 left-4 right-4">
                                        <p className="text-white text-sm bg-black/50 px-3 py-1 rounded">Click to play video</p>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="h-64 flex items-center justify-center bg-white/5">
                                      <div className="text-center">
                                        <Play className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                                        <p className="text-white">{selectedLesson.content}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : selectedLesson.type === 'PDF' ? (
                            <div className="space-y-4">
                              {showLessonViewer ? (
                                <div className="h-[600px] bg-white rounded-lg overflow-hidden">
                                  <iframe
                                    src={getPdfEmbedUrl(selectedLesson.content)}
                                    className="w-full h-full"
                                    title={selectedLesson.title}
                                  />
                                </div>
                              ) : (
                                <div
                                  className="bg-white/5 rounded-lg overflow-hidden cursor-pointer group"
                                  onClick={() => handlePdfClick(selectedLesson)}
                                >
                                  <div className="h-48 flex items-center justify-center bg-red-500/10">
                                    <FileText className="w-16 h-16 text-red-400" />
                                  </div>
                                  <div className="p-4">
                                    <p className="text-white font-medium mb-1">{selectedLesson.title}</p>
                                    <p className="text-indigo-300 text-sm bg-red-500/10 px-3 py-2 rounded inline-block">
                                      <FileText className="w-4 h-4 inline mr-2" />
                                      PDF Document
                                    </p>
                                    <p className="text-indigo-400 text-sm mt-2 group-hover:text-indigo-300">Click to view PDF</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : selectedLesson.type === 'Link' ? (
                            <div className="bg-white/5 rounded-lg p-6 text-center">
                              <LinkIcon className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                              <p className="text-white font-medium mb-2">{selectedLesson.title}</p>
                              <p className="text-indigo-300 text-sm mb-4 break-all bg-white/5 p-3 rounded">{selectedLesson.content}</p>
                              <Button
                                onClick={() => handleLinkClick(selectedLesson)}
                                className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30"
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Open External Link
                              </Button>
                            </div>
                          ) : selectedLesson.type === 'Text' ? (
                            <div className="prose prose-invert max-w-none">
                              <div
                                className="text-indigo-100"
                                dangerouslySetInnerHTML={{ __html: selectedLesson.content }}
                              />
                            </div>
                          ) : (
                            <div className="text-center text-indigo-300">
                              <p>Unknown lesson type: {selectedLesson.type}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div className="text-sm text-indigo-300">
                            <span className="capitalize">{selectedLesson.type.toLowerCase()} Lesson</span>
                            {selectedLesson.duration > 0 && <span> • {selectedLesson.duration} mins</span>}
                          </div>
                          <Button
                            onClick={() => handleCompleteLesson(selectedLesson._id)}
                            disabled={completedLessons.has(selectedLesson._id)}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                          >
                            {completedLessons.has(selectedLesson._id) ? (
                              <>
                                <Check className="w-4 h-4 mr-2" /> Completed
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-2" /> Mark as Complete
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-16">
                        <Play className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                        <p className="text-white font-medium mb-2">Select a lesson to begin</p>
                        <p className="text-indigo-300">Choose a lesson from the course content to start learning</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Confirmation Dialog */}
      {showLinkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-yellow-500/30 rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
              <h3 className="text-xl font-bold text-white">Leaving LMS</h3>
            </div>
            <p className="text-indigo-200 mb-4">
              You are about to leave the Learning Management System and open an external link:
            </p>
            <p className="text-white font-medium mb-6 break-all bg-white/5 p-3 rounded-lg">{pendingLink}</p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowLinkConfirm(false)}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Stay Here
              </Button>
              <Button
                onClick={confirmExternalLink}
                className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Link
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
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
    </div>
  );
}
