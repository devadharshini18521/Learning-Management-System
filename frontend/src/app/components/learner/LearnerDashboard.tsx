import { useState, useEffect } from 'react';
import { analyticsAPI, assessmentsAPI, coursesAPI } from '../../../services/api';
import { BookOpen, Award, Clock, TrendingUp, Play, ClipboardCheck, Check, ChevronDown, ChevronUp, FileText, Link as LinkIcon, Type, X, ExternalLink, Zap, Target, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';
import { getYouTubeEmbedUrl, getPdfEmbedUrl, isYouTubeUrl, isPdfUrl, getYouTubeVideoId } from '../../../utils/media';

interface LearnerDashboardProps {
  onNavigate: (view: string) => void;
  onSelectCourse: (course: any) => void;
  onSelectAssessment: (assessment: any) => void;
}

interface Assessment {
  _id: string;
  title: string;
  description: string;
  course?: any;
  questions: any[];
  duration: number;
  passingScore: number;
  status: string;
  userAttempted: boolean;
  userScore: number | null;
  userPassed: boolean | null;
  attemptNumber: number;
}

interface Lesson {
  _id: string;
  title: string;
  description?: string;
  type: string;
  content: string;
  duration: number;
}

interface Module {
  _id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

interface Course {
  _id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  category: string;
  level: string;
  duration: number;
  modules: Module[];
}

interface Enrollment {
  _id: string;
  course: Course;
  progress: number;
  status: string;
  completedLessons: string[];
  enrolledAt: string;
}

export default function LearnerDashboard({ onNavigate, onSelectCourse, onSelectAssessment }: LearnerDashboardProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<Enrollment[]>([]);
  const [availableAssessments, setAvailableAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<{ lesson: Lesson; courseId: string; course: Course } | null>(null);
  const [completingLesson, setCompletingLesson] = useState<string | null>(null);
  const [showLessonViewer, setShowLessonViewer] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const analyticsData = await analyticsAPI.getLearner();
      setAnalytics(analyticsData.analytics);
      setEnrolledCourses(analyticsData.analytics?.enrolledCourses || []);
      setAvailableAssessments(analyticsData.analytics?.availableAssessments || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteLesson = async (courseId: string, lessonId: string) => {
    setCompletingLesson(lessonId);
    try {
      const response = await coursesAPI.completeLesson(courseId, lessonId);
      
      // Update local state
      setEnrolledCourses(prev => prev.map(enrollment => {
        if (enrollment.course._id === courseId) {
          return {
            ...enrollment,
            progress: response.progress || enrollment.progress,
            status: response.status || enrollment.status,
            completedLessons: [...(enrollment.completedLessons || []), lessonId]
          };
        }
        return enrollment;
      }));

      toast.success(response.isCourseComplete 
        ? 'Congratulations! You have completed this course!' 
        : 'Lesson marked as complete!');
    } catch (err) {
      toast.error('Failed to update progress');
    } finally {
      setCompletingLesson(null);
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'Video': return <Play className="w-4 h-4" />;
      case 'PDF': return <FileText className="w-4 h-4" />;
      case 'Link': return <LinkIcon className="w-4 h-4" />;
      case 'Text': return <Type className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getNextLesson = (enrollment: Enrollment) => {
    const course = enrollment.course;
    if (!course?.modules) return null;
    
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (!enrollment.completedLessons.includes(lesson._id)) {
          return lesson;
        }
      }
    }
    return null; // No incomplete lessons - course may be complete
  };

  const toggleCourseExpand = (courseId: string) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  // Start a lesson - opens the lesson viewer
  const handleStartLesson = (course: Course, lesson: Lesson) => {
    setSelectedLesson({ lesson, courseId: course._id, course });
    setShowLessonViewer(true);
    setShowVideoPlayer(false);
  };

  // Close the lesson viewer
  const handleCloseLessonViewer = () => {
    setShowLessonViewer(false);
    setSelectedLesson(null);
  };

  // Render lesson content based on type
  const renderLessonContent = (lesson: Lesson) => {
    switch (lesson.type) {
      case 'Video':
        return (
          <div className="space-y-4">
            {showVideoPlayer ? (
              <div className="relative pb-[56.25%] h-0 bg-black rounded-lg overflow-hidden">
                <iframe
                  src={getYouTubeEmbedUrl(lesson.content)}
                  className="absolute top-0 left-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={lesson.title}
                />
              </div>
            ) : (
              <div 
                className="relative bg-black rounded-lg overflow-hidden cursor-pointer group"
                onClick={() => setShowVideoPlayer(true)}
              >
                {isYouTubeUrl(lesson.content) ? (
                  <>
                    <img
                      src={`https://img.youtube.com/vi/${getYouTubeVideoId(lesson.content)}/hqdefault.jpg`}
                      alt={lesson.title}
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
                      <p className="text-white">{lesson.content}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'PDF':
        return (
          <div className="space-y-4">
            <div 
              className="bg-white/5 rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => window.open(lesson.content, '_blank')}
            >
              <div className="h-48 flex items-center justify-center bg-red-500/10">
                <FileText className="w-16 h-16 text-red-400" />
              </div>
              <div className="p-4">
                <p className="text-white font-medium mb-1">{lesson.title}</p>
                <p className="text-indigo-300 text-sm bg-red-500/10 px-3 py-2 rounded inline-block">
                  <FileText className="w-4 h-4 inline mr-2" />
                  PDF Document - Click to Open
                </p>
              </div>
            </div>
          </div>
        );

      case 'Link':
        return (
          <div className="bg-white/5 rounded-lg p-6 text-center">
            <LinkIcon className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">{lesson.title}</p>
            <p className="text-indigo-300 text-sm mb-4 break-all bg-white/5 p-3 rounded">{lesson.content}</p>
            <Button 
              onClick={() => window.open(lesson.content, '_blank')}
              className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open External Link
            </Button>
          </div>
        );

      case 'Text':
        return (
          <div className="prose prose-invert max-w-none">
            <div 
              className="text-indigo-100"
              dangerouslySetInnerHTML={{ __html: lesson.content }}
            />
          </div>
        );

      default:
        return (
          <div className="text-center text-indigo-300">
            <p>Unknown lesson type: {lesson.type}</p>
          </div>
        );
    }
  };

  // Check if a lesson is unlocked (all previous lessons in sequence are completed)
  const isLessonUnlocked = (enrollment: Enrollment, moduleIndex: number, lessonIndex: number): boolean => {
    const course = enrollment.course;
    if (!course?.modules) return false;
    
    // First lesson in first module is always unlocked
    if (moduleIndex === 0 && lessonIndex === 0) return true;
    
    // Check all previous modules
    for (let m = 0; m < moduleIndex; m++) {
      const prevModule = course.modules[m];
      if (!prevModule?.lessons?.length) return false;
      for (const lesson of prevModule.lessons) {
        if (!enrollment.completedLessons.includes(lesson._id)) {
          return false;
        }
      }
    }
    
    // Check previous lessons in current module
    const currentModule = course.modules[moduleIndex];
    if (!currentModule?.lessons) return false;
    for (let l = 0; l < lessonIndex; l++) {
      const prevLesson = currentModule.lessons[l];
      if (!enrollment.completedLessons.includes(prevLesson._id)) {
        return false;
      }
    }
    
    return true;
  };

  // Get the first unlocked but incomplete lesson
  const getFirstUnlockedLesson = (enrollment: Enrollment): { moduleIndex: number; lessonIndex: number; lesson: Lesson } | null => {
    const course = enrollment.course;
    if (!course?.modules) return null;
    
    for (let m = 0; m < course.modules.length; m++) {
      const module = course.modules[m];
      if (!module?.lessons?.length) continue;
      
      for (let l = 0; l < module.lessons.length; l++) {
        const lesson = module.lessons[l];
        if (!enrollment.completedLessons.includes(lesson._id)) {
          return { moduleIndex: m, lessonIndex: l, lesson };
        }
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        {/* Stats Bento Grid */}
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

        {/* My Courses */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="h-6 w-32 bg-white/10 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="h-32 bg-white/10 animate-pulse" />
                <div className="p-4">
                  <div className="h-5 w-3/4 bg-white/10 rounded animate-pulse mb-2" />
                  <div className="h-8 w-full bg-white/10 rounded animate-pulse mb-3" />
                  <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Available Assessments */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="h-6 w-40 bg-white/10 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="h-32 bg-white/10 animate-pulse" />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-5 w-3/4 bg-white/10 rounded animate-pulse" />
                    <div className="h-6 w-16 bg-white/10 rounded animate-pulse" />
                  </div>
                  <div className="h-4 w-full bg-white/10 rounded animate-pulse mb-3" />
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                    <div className="h-3 w-12 bg-white/10 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                  </div>
                  <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assessment Performance */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="h-6 w-36 bg-white/10 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-4 w-20 bg-white/10 rounded animate-pulse mx-auto mb-2" />
                <div className="h-10 w-16 bg-white/10 rounded animate-pulse mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const handleStartAssessment = (assessment: Assessment) => {
    onSelectAssessment(assessment);
  };

  return (
    <div className="space-y-6">
      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Card 1 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <p className="text-indigo-300 text-sm mb-1">Total Courses</p>
          <p className="text-white text-3xl font-bold">{analytics?.courses?.total || 0}</p>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <p className="text-indigo-300 text-sm mb-1">Completed</p>
          <p className="text-white text-3xl font-bold">{analytics?.courses?.completed || 0}</p>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-indigo-300 text-sm mb-1">In Progress</p>
          <p className="text-white text-3xl font-bold">{analytics?.courses?.inProgress || 0}</p>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-400" />
            </div>
          </div>
          <p className="text-indigo-300 text-sm mb-1">Avg Progress</p>
          <p className="text-white text-3xl font-bold">{analytics?.courses?.averageProgress || 0}%</p>
        </div>
      </div>

      {/* My Courses */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">My Courses</h2>
          <Button
            onClick={() => onNavigate('courses')}
            variant="ghost"
            className="text-indigo-300 hover:text-white hover:bg-white/10"
          >
            View All
          </Button>
        </div>

      {enrolledCourses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-indigo-400" />
            </div>
            <h3 className="text-white font-bold text-xl mb-3">Start Your Learning Journey</h3>
            <p className="text-indigo-300 mb-8 max-w-md mx-auto">You haven't enrolled in any courses yet. Browse our catalog and start learning today!</p>
            <Button
              onClick={() => onNavigate('courses')}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Browse Courses
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {enrolledCourses.map((enrollment) => {
              const course = enrollment.course;
              const nextLesson = getNextLesson(enrollment);
              const isExpanded = expandedCourse === course._id;
              const totalLessons = course.modules?.reduce((acc: number, mod: Module) => acc + (mod.lessons?.length || 0), 0) || 0;
              const completedCount = enrollment.completedLessons?.length || 0;
              const timeRemaining = course.modules?.reduce((acc: number, mod: Module) => {
                let moduleTime = 0;
                mod.lessons?.forEach((lesson: Lesson) => {
                  if (!enrollment.completedLessons?.includes(lesson._id)) {
                    moduleTime += lesson.duration || 5;
                  }
                });
                return acc + moduleTime;
              }, 0) || 0;
              const firstUnlocked = getFirstUnlockedLesson(enrollment);

              return (
                <div
                  key={enrollment._id}
                  className={`bg-white/5 rounded-xl border border-white/10 overflow-hidden transition-all ${
                    enrollment.progress === 100 
                      ? 'border-green-500/30 bg-green-500/5' 
                      : 'hover:border-indigo-500/30'
                  }`}
                >
                  {/* Course Header */}
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Thumbnail */}
                      <div className="w-36 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
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
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-10 h-10 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Course Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {enrollment.status === 'Completed' && (
                                <div className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                  <Award className="w-3 h-3" />
                                  Completed
                                </div>
                              )}
                              {enrollment.progress === 100 && !enrollment.status && (
                                <div className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  Finished
                                </div>
                              )}
                            </div>
                            <h3 className="text-white font-bold text-lg mb-2 line-clamp-1">
                              {course.title || 'Course Title'}
                            </h3>
                            <div className="flex flex-wrap gap-2 text-xs text-indigo-300 mb-3">
                              <span className="px-2 py-0.5 bg-white/10 rounded-full">{course.category}</span>
                              <span className="px-2 py-0.5 bg-white/10 rounded-full">{course.level}</span>
                              <span className="px-2 py-0.5 bg-white/10 rounded-full flex items-center gap-1">
                                <Play className="w-3 h-3" />
                                {totalLessons} lessons
                              </span>
                              <span className="px-2 py-0.5 bg-white/10 rounded-full flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {course.duration} mins
                              </span>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {enrollment.progress < 100 ? (
                              <Button
                                onClick={() => {
                                  if (firstUnlocked) {
                                    handleStartLesson(course, firstUnlocked.lesson);
                                  }
                                }}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/20"
                              >
                                <Zap className="w-4 h-4 mr-2" />
                                Continue
                              </Button>
                            ) : (
                              <Button
                                onClick={() => {
                                  // Navigate to course page to take assessment
                                  onSelectCourse(course);
                                }}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/20"
                              >
                                <ClipboardCheck className="w-4 h-4 mr-2" />
                                Take Assessment
                              </Button>
                            )}
                            <Button
                              onClick={() => {
                                if (isExpanded) {
                                  setExpandedCourse(null);
                                } else {
                                  toggleCourseExpand(course._id);
                                }
                              }}
                              variant="ghost"
                              size="sm"
                              className="text-indigo-300 hover:text-white hover:bg-white/10"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-4 h-4 mr-1" />
                                  Collapse
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4 mr-1" />
                                  Expand
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Enhanced Progress Bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-indigo-400" />
                              <span className="text-indigo-300">Progress</span>
                            </div>
                            <span className="text-white font-bold">{completedCount}/{totalLessons} • {enrollment.progress || 0}%</span>
                          </div>
                          <div className="relative">
                            <Progress 
                              value={enrollment.progress || 0} 
                              className={`h-3 ${enrollment.progress === 100 ? 'bg-green-500/20' : ''}`} 
                            />
                            {enrollment.progress === 100 && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                              </div>
                            )}
                          </div>
                          
                          {/* Stats Row */}
                          <div className="flex items-center justify-between mt-2 text-xs text-indigo-300">
                            <span className="flex items-center gap-1">
                              <Check className="w-3 h-3 text-green-400" />
                              {completedCount} completed
                            </span>
                            {timeRemaining > 0 && enrollment.progress < 100 && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-orange-400" />
                                {timeRemaining} min remaining
                              </span>
                            )}
                            {enrollment.progress === 100 && (
                              <span className="flex items-center gap-1 text-green-400">
                                <Award className="w-3 h-3" />
                                All lessons complete!
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Course Content */}
                  {isExpanded && (
                    <div className="border-t border-white/10">
                      <div className="p-4 bg-white/5 space-y-3 max-h-96 overflow-y-auto">
                        {/* Next Lesson Highlight */}
                        {nextLesson && enrollment.progress < 100 && (
                          <div className="mb-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                  <ArrowRight className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                  <p className="text-green-300 text-xs font-medium uppercase tracking-wide">Up Next</p>
                                  <p className="text-white font-medium">{nextLesson.title}</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleStartLesson(course, nextLesson)}
                                className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30"
                              >
                                <Play className="w-4 h-4 mr-1" />
                                Start
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Course Modules */}
                        {course.modules?.map((module: Module, moduleIndex: number) => (
                          <div key={module._id || moduleIndex} className="bg-white/5 rounded-lg overflow-hidden">
                            {/* Module Header */}
                            <div className="px-3 py-2 bg-white/10">
                              <div className="flex items-center gap-2">
                                <span className="text-indigo-300 font-medium text-sm">
                                  {moduleIndex + 1}. {module.title}
                                </span>
                                <span className="text-xs text-indigo-400">
                                  ({module.lessons?.length || 0} lessons)
                                </span>
                              </div>
                            </div>
                            
                            {/* Lessons */}
                            <div className="p-2 space-y-1">
                              {module.lessons?.map((lesson: Lesson, lessonIndex: number) => {
                                const isCompleted = enrollment.completedLessons?.includes(lesson._id);
                                const isCurrentUnlocked = isLessonUnlocked(enrollment, moduleIndex, lessonIndex);
                                const firstUnlocked = getFirstUnlockedLesson(enrollment);
                                const isNextLesson = firstUnlocked?.lesson._id === lesson._id;
                                const isLocked = !isCurrentUnlocked;
                                
                                return (
                                  <div
                                    key={lesson._id || lessonIndex}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                                      isLocked
                                        ? 'opacity-50'
                                        : isCompleted
                                        ? 'bg-green-500/5'
                                        : isNextLesson
                                        ? 'bg-green-500/10 border border-green-500/20'
                                        : 'hover:bg-white/5'
                                    }`}
                                  >
                                    {/* Completion/Lock Status */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                      isCompleted
                                        ? 'bg-green-500/20 text-green-400'
                                        : isLocked
                                        ? 'bg-gray-500/20 text-gray-400'
                                        : isNextLesson
                                        ? 'bg-green-500/20'
                                        : 'bg-white/10'
                                    }`}>
                                      {isCompleted ? (
                                        <Check className="w-4 h-4" />
                                      ) : isLocked ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                      ) : isNextLesson ? (
                                        <Play className="w-4 h-4 text-green-400" />
                                      ) : (
                                        getLessonIcon(lesson.type)
                                      )}
                                    </div>
                                    
                                    {/* Lesson Info */}
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm line-clamp-1 ${
                                        isCompleted
                                          ? 'text-indigo-300'
                                          : isLocked
                                          ? 'text-gray-400'
                                          : isNextLesson
                                          ? 'text-green-400 font-medium'
                                          : 'text-white'
                                      }`}>
                                        {lesson.title}
                                      </p>
                                      <div className="flex items-center gap-2 text-xs text-indigo-400">
                                        <span className="capitalize">{lesson.type.toLowerCase()}</span>
                                        <span>•</span>
                                        <span>{lesson.duration}m</span>
                                        {isLocked && <span className="text-gray-400 ml-1">• Locked</span>}
                                      </div>
                                    </div>
                                    
                                    {/* Action Button */}
                                    {!isCompleted && !isLocked && (
                                      <Button
                                        size="sm"
                                        variant={isNextLesson ? 'default' : 'outline'}
                                        onClick={() => isNextLesson ? handleStartLesson(course, lesson) : handleCompleteLesson(course._id, lesson._id)}
                                        disabled={completingLesson === lesson._id}
                                        className={`flex-shrink-0 ${
                                          isNextLesson
                                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                                            : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border-indigo-500/30'
                                        }`}
                                      >
                                        {completingLesson === lesson._id ? (
                                          '...'
                                        ) : isNextLesson ? (
                                          <>
                                            <Play className="w-3 h-3 mr-1" />
                                            Start
                                          </>
                                        ) : (
                                          <>
                                            <Check className="w-3 h-3 mr-1" />
                                            Complete
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Assessments */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Available Assessments</h2>
          <Button
            onClick={() => onNavigate('assessments')}
            variant="ghost"
            className="text-indigo-300 hover:text-white hover:bg-white/10"
          >
            View All
          </Button>
        </div>

        {availableAssessments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClipboardCheck className="w-12 h-12 text-blue-400" />
            </div>
            <h3 className="text-white font-bold text-xl mb-3">No Assessments Yet</h3>
            <p className="text-indigo-300 mb-6 max-w-md mx-auto">Complete your enrolled courses to unlock assessments and test your knowledge!</p>
            <Button
              onClick={() => onNavigate('courses')}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-lg shadow-blue-500/25"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Continue Learning
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableAssessments.slice(0, 6).map((assessment) => (
              <div
                key={assessment._id}
                className="bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-indigo-500/50 transition-all group"
              >
                <div className="h-32 bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                  <ClipboardCheck className="w-12 h-12 text-white opacity-50" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold line-clamp-2 flex-1">
                      {assessment.title}
                    </h3>
                    <span className={`ml-2 px-2 py-1 rounded-lg text-xs font-medium ${
                      assessment.status === 'Published' 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {assessment.status}
                    </span>
                  </div>
                  <p className="text-indigo-300 text-sm mb-3 line-clamp-2">
                    {assessment.description || 'Test your knowledge'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-indigo-300 mb-3">
                    <span>{assessment.questions?.length || 0} questions</span>
                    <span>{assessment.duration} mins</span>
                    <span>Pass: {assessment.passingScore}%</span>
                  </div>
                  {assessment.status === 'Draft' ? (
                    <div className="bg-yellow-500/20 text-yellow-300 text-sm font-medium px-3 py-2 rounded-lg text-center">
                      Coming Soon
                    </div>
                  ) : assessment.userAttempted ? (
                    <div className="space-y-2">
                      <div className={`text-sm font-medium px-3 py-2 rounded-lg text-center ${
                        assessment.userPassed 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {assessment.userPassed ? 'Passed' : 'Failed'} - {assessment.userScore?.toFixed(0)}%
                      </div>
                      <Button
                        onClick={() => handleStartAssessment(assessment)}
                        size="sm"
                        className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30"
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleStartAssessment(assessment)}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Assessment
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assessment Performance */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-bold text-white mb-6">Assessment Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-indigo-300 text-sm mb-2">Total Assessments</p>
            <p className="text-white text-4xl font-bold">{analytics?.assessments?.total || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-indigo-300 text-sm mb-2">Passed</p>
            <p className="text-green-400 text-4xl font-bold">{analytics?.assessments?.passed || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-indigo-300 text-sm mb-2">Average Score</p>
            <p className="text-white text-4xl font-bold">{analytics?.assessments?.averageScore || 0}%</p>
          </div>
        </div>
      </div>

      {/* Lesson Content Viewer Overlay */}
      {showLessonViewer && selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                  {getLessonIcon(selectedLesson.lesson.type)}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{selectedLesson.lesson.title}</h3>
                  <p className="text-indigo-300 text-sm">{selectedLesson.course.title}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseLessonViewer}
                className="text-indigo-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {renderLessonContent(selectedLesson.lesson)}
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5">
              <div className="text-sm text-indigo-300">
                <span className="capitalize">{selectedLesson.lesson.type.toLowerCase()} Lesson</span>
                {selectedLesson.lesson.duration > 0 && <span> • {selectedLesson.lesson.duration} mins</span>}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCloseLessonViewer}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleCompleteLesson(selectedLesson.courseId, selectedLesson.lesson._id);
                    handleCloseLessonViewer();
                  }}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark as Complete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
