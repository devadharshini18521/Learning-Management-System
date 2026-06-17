                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { ArrowLeft, Play, Check, Lock, Award, ExternalLink, FileText, Link as LinkIcon, Type, X, AlertTriangle, Download, ClipboardCheck, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';
import { coursesAPI, certificatesAPI } from '../../../services/api';
import { getYouTubeEmbedUrl, getPdfEmbedUrl, isYouTubeUrl, getYouTubeVideoId, supportsInlinePdf } from '../../../utils/media';


interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  category: string;
  level: string;
  duration: number;
  modules: Module[];
  assessment?: string | { _id: string };
}

interface Module {
  _id: string;
  title: string;
  lessons: Lesson[];
}

interface Lesson {
  _id: string;
  title: string;
  description: string;
  type: string;
  content: string;
  duration: number;
}

interface Enrollment {
  course: string | { _id: string };
  enrolledAt: string;
  progress: number;
  status: string;
  completedLessons: string[];
}

interface Certificate {
  _id: string;
  certificateNumber: string;
  course?: {
    _id: string;
    title: string;
  };
  issuedDate: string;
}

interface Assessment {
  _id: string;
  title: string;
  status: string;
  questions: any[];
  passingScore: number;
  duration: number;
}

interface UserWithEnrollments {
  _id: string;
  role: string;
  name: string;
  enrolledCourses: Enrollment[];
}

interface CourseViewerProps {
  course: Course & { assessment?: Assessment | null } | null;
  onBack: () => void;
  onEdit: (course: Course) => void;
  onSelectAssessment?: (assessment: Assessment) => void;
  autoSelectFirstLesson?: boolean;
}

// Confirmation Dialog Component
function LinkConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  url 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void;
  url: string;
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-yellow-500/30 rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-8 h-8 text-yellow-400" />
          <h3 className="text-xl font-bold text-white">Leaving LMS</h3>
        </div>
        <p className="text-indigo-200 mb-4">
          You are about to leave the Learning Management System and open an external link:
        </p>
        <p className="text-white font-medium mb-6 break-all bg-white/5 p-3 rounded-lg">{url}</p>
        <div className="flex gap-3">
          <Button 
            onClick={onClose} 
            variant="outline" 
            className="flex-1 border-white/20 text-white hover:bg-white/10"
          >
            Stay Here
          </Button>
          <Button 
            onClick={onConfirm} 
            className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Link
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CourseViewer({ course: initialCourse, onBack, onEdit, onSelectAssessment, autoSelectFirstLesson = false }: CourseViewerProps) {
  const { user, hasRole, refreshUser } = useAuth() as { user: UserWithEnrollments | null; hasRole: (...roles: string[]) => boolean; refreshUser: () => Promise<void> };
  const [course, setCourse] = useState<Course | null>(initialCourse);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [assessmentPassed, setAssessmentPassed] = useState(false);
  const [assessmentPercentage, setAssessmentPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [, forceUpdate] = useState({});
  
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [showLinkConfirm, setShowLinkConfirm] = useState(false);
  const [pendingLink, setPendingLink] = useState('');
  const [autoCompletingLessons, setAutoCompletingLessons] = useState<Set<string>>(new Set());

  const isLessonUnlocked = (moduleIndex: number, lessonIndex: number): boolean => {
    if (!course?.modules) return false;
    if (moduleIndex === 0 && lessonIndex === 0) return true;
    
    for (let m = 0; m < moduleIndex; m++) {
      const prevModule = course.modules[m];
      if (!prevModule?.lessons?.length) return false;
      for (const lesson of prevModule.lessons) {
        if (!completedLessons.has(lesson._id)) {
          return false;
        }
      }
    }
    
    const currentModule = course.modules[moduleIndex];
    if (!currentModule?.lessons) return false;
    for (let l = 0; l < lessonIndex; l++) {
      const prevLesson = currentModule.lessons[l];
      if (!completedLessons.has(prevLesson._id)) {
        return false;
      }
    }
    
    return true;
  };

  const getFirstUnlockedLesson = (): { moduleIndex: number; lesson: Lesson } | null => {
    if (!course?.modules) return null;
    
    for (let m = 0; m < course.modules.length; m++) {
      const module = course.modules[m];
      if (!module?.lessons?.length) continue;
      
      for (let l = 0; l < module.lessons.length; l++) {
        const lesson = module.lessons[l];
        if (!completedLessons.has(lesson._id)) {
          return { moduleIndex: m, lesson };
        }
      }
    }
    
    if (course.modules[0]?.lessons?.[0]) {
      return { moduleIndex: 0, lesson: course.modules[0].lessons[0] };
    }
    
    return null;
  };

  useEffect(() => {
    const fetchFullCourseData = async () => {
      if (!initialCourse?._id) return;
      
      try {
        setLoading(true);
        const response = await coursesAPI.getOne(initialCourse._id);
        setCourse(response.course);
        if (response.assessment) {
          setAssessment(response.assessment);
        }
      } catch (err) {
        console.error('Failed to fetch course data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFullCourseData();
  }, [initialCourse?._id]);

  useEffect(() => {
    if (user?.enrolledCourses && course) {
      const enrolled = user.enrolledCourses.find((e: Enrollment) => {
        const courseId = typeof e.course === 'string' ? e.course : (e.course as any)?._id;
        return courseId?.toString() === course._id?.toString();
      });
      setIsEnrolled(!!enrolled);
      
      // Reset states when loading a new course
      setCertificate(null);
      setAssessmentPassed(false);
      setAssessmentPercentage(0);
      
      if (enrolled) {
        const enrolledProgress = enrolled.progress || 0;
        setProgress(enrolledProgress);
        setCompletedLessons(new Set(enrolled.completedLessons || []));
        
        const firstUnlocked = getFirstUnlockedLesson();
        if (firstUnlocked && !selectedLesson) {
          setSelectedLesson(firstUnlocked.lesson);
        }
        
        // Only check assessment status when course is completed
        // Certificate will be checked after assessment is passed with 90%+
        if (enrolled.status === 'Completed' || enrolledProgress === 100) {
          checkAssessmentStatus();
        }
      }
    }
  }, [user, course]);

  useEffect(() => {
    if (autoSelectFirstLesson && course && !selectedLesson) {
      const firstUnlocked = getFirstUnlockedLesson();
      if (firstUnlocked) {
        setSelectedLesson(firstUnlocked.lesson);
      } else if (course.modules?.[0]?.lessons?.[0]) {
        setSelectedLesson(course.modules[0].lessons[0]);
      }
    }
  }, [autoSelectFirstLesson, course, selectedLesson]);

  // Auto-complete lesson when viewed (if unlocked and not already completed)
  useEffect(() => {
    const autoCompleteLesson = async () => {
      if (!selectedLesson || !course || !isEnrolled) return;
      
      // Check if lesson is already completed
      if (completedLessons.has(selectedLesson._id)) return;
      
      // Check if lesson is currently being auto-completed
      if (autoCompletingLessons.has(selectedLesson._id)) return;
      
      // Find lesson indices to check if unlocked
      let moduleIndex = -1;
      let lessonIndex = -1;
      
      for (let m = 0; m < course.modules.length; m++) {
        const lIndex = course.modules[m].lessons.findIndex(l => l._id === selectedLesson._id);
        if (lIndex !== -1) {
          moduleIndex = m;
          lessonIndex = lIndex;
          break;
        }
      }
      
      if (moduleIndex === -1 || lessonIndex === -1) return;
      
      // Check if lesson is unlocked
      const unlocked = isLessonUnlocked(moduleIndex, lessonIndex);
      if (!unlocked) return;
      
      // Mark as auto-completing to prevent duplicate calls
      setAutoCompletingLessons(prev => new Set(prev).add(selectedLesson._id));
      
      try {
        // Auto-complete the lesson without showing toast
        const response = await coursesAPI.completeLesson(course._id, selectedLesson._id);
        
        const newCompletedLessons = new Set([...completedLessons, selectedLesson._id]);
        setCompletedLessons(newCompletedLessons);
        
        const totalLessons = course.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 1;
        const completedCount = newCompletedLessons.size;
        const newProgress = response?.progress || Math.round((completedCount / totalLessons) * 100);
        
        setProgress(newProgress);
        
        const courseIsComplete = response?.isCourseComplete || newProgress >= 100 || completedCount >= totalLessons;
        if (courseIsComplete) {
          setProgress(100);
          forceUpdate({});
          await refreshUser();
          await checkAssessmentStatus();
          if (course?.assessment) {
            toast.success('🎉 Course completed! Take the assessment to earn your certificate.');
          } else {
            toast.success('🎉 Course completed!');
          }
        } else {
          // Only show toast for individual lesson completion in auto-mode
          toast.success('Lesson completed automatically!');
        }
        
        // Move to next lesson if available
        const firstUnlocked = getFirstUnlockedLesson();
        if (firstUnlocked && firstUnlocked.lesson._id !== selectedLesson._id) {
          setSelectedLesson(firstUnlocked.lesson);
          setShowVideoPlayer(false);
          setShowPdfViewer(false);
        }
        
        if (!courseIsComplete) {
          await refreshUser();
        }
      } catch (err: unknown) {
        // Silently fail for auto-complete, user can manually complete if needed
        console.error('Auto-complete failed:', err);
      } finally {
        // Remove from auto-completing set
        setAutoCompletingLessons(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedLesson._id);
          return newSet;
        });
      }
    };
    
    autoCompleteLesson();
  }, [selectedLesson, course, isEnrolled, completedLessons]);

  const checkForCertificate = async () => {
    if (!course?._id) return;
    
    try {
      const response = await certificatesAPI.getAll();
      const cert = response.certificates?.find((c: any) => c.course?._id === course._id);
      if (cert) {
        setCertificate(cert);
      }
    } catch (err) {
      console.error('Failed to check for certificate:', err);
    }
  };

  const checkAssessmentStatus = async () => {
    if (!course?._id) {
      // Reset states if no course
      setAssessmentPassed(false);
      setAssessmentPercentage(0);
      return;
    }

    // Check if course has an assessment (could be string ID or full object)
    const hasAssessment = course.assessment && (
      typeof course.assessment === 'string' 
        ? course.assessment 
        : course.assessment?._id
    );

    if (!hasAssessment) {
      // No assessment for this course - reset states
      setAssessmentPassed(false);
      setAssessmentPercentage(0);
      setCertificate(null);
      return;
    }

    try {
      const { assessmentsAPI } = await import('../../../services/api');
      // Get assessment results for current user
      const response = await assessmentsAPI.getMyResults();
      const results = response.results || [];

      // Find results for this course's assessment
      const assessmentId = typeof course.assessment === 'string'
        ? course.assessment
        : course.assessment?._id;

      const assessmentResults = results.filter((r: any) =>
        r.assessment?._id === assessmentId || r.assessment === assessmentId
      );

      if (assessmentResults.length > 0) {
        // Get the best result (highest percentage)
        const bestResult = assessmentResults.reduce((best: any, current: any) =>
          (current.percentage > best.percentage) ? current : best
        );

        setAssessmentPassed(bestResult.passed);
        setAssessmentPercentage(bestResult.percentage);

        // Only check for certificate if assessment passed with 90%+
        // Certificate should ONLY appear after passing assessment, not after course completion
        if (bestResult.passed && bestResult.percentage >= 90) {
          await checkForCertificate();
        } else {
          // Clear certificate if assessment not passed with 90%+
          setCertificate(null);
        }
      } else {
        // No assessment results found - reset states
        setAssessmentPassed(false);
        setAssessmentPercentage(0);
        setCertificate(null);
      }
    } catch (err) {
      console.error('Failed to check assessment status:', err);
      setAssessmentPassed(false);
      setAssessmentPercentage(0);
    }
  };

  const handleEnroll = async () => {
    if (!course?._id) return;
    
    // Optimistic update - show enrolled state immediately
    setIsEnrolled(true);
    toast.success('Enrolling...');
    
    try {
      await coursesAPI.enroll(course._id);
      toast.success('Successfully enrolled in course!');
      await refreshUser();
      setProgress(0);
      setCompletedLessons(new Set());
      if (course.modules?.[0]?.lessons?.[0]) {
        const firstLesson = course.modules[0].lessons[0];
        setSelectedLesson(firstLesson);
      }
    } catch (err: unknown) {
      // Revert on error
      setIsEnrolled(false);
      toast.error((err as Error).message || 'Failed to enroll');
    }
  };

  const handleUnenroll = async () => {
    if (!course?._id) return;
    
    // Optimistic update - show unenrolled state immediately
    const wasEnrolled = isEnrolled;
    setIsEnrolled(false);
    setSelectedLesson(null);
    toast.success('Unenrolling...');
    
    try {
      await coursesAPI.unenroll(course._id);
      toast.success('Successfully unenrolled from course');
      await refreshUser();
      setProgress(0);
      setCompletedLessons(new Set());
      setCertificate(null);
    } catch (err: unknown) {
      // Revert on error
      setIsEnrolled(wasEnrolled);
      toast.error((err as Error).message || 'Failed to unenroll');
    }
  };

  const handleCompleteLesson = async (lessonId: string) => {
    if (!course?._id) return;
    
    // Optimistic update - show completion immediately
    const newCompletedLessons = new Set([...completedLessons, lessonId]);
    setCompletedLessons(newCompletedLessons);
    
    const totalLessons = course.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 1;
    const completedCount = newCompletedLessons.size;
    const newProgress = Math.round((completedCount / totalLessons) * 100);
    setProgress(newProgress);
    
    // Show immediate feedback
    toast.success('Lesson marked as complete!');
    
    try {
      const response = await coursesAPI.completeLesson(course._id, lessonId);
      
      // Update with server response if different
      if (response?.progress && response.progress !== newProgress) {
        setProgress(response.progress);
      }
      
      const courseIsComplete = response?.isCourseComplete || newProgress >= 100 || completedCount >= totalLessons;
      if (courseIsComplete) {
        setProgress(100);
        forceUpdate({});
        // Refresh user to get updated enrollment status
        await refreshUser();
        // Check assessment status after course completion
        await checkAssessmentStatus();
        // Show course completion message
        if (course?.assessment) {
          toast.success('🎉 Course completed! Take the assessment to earn your certificate.');
        } else {
          toast.success('🎉 Course completed!');
        }
      }
      
      const firstUnlocked = getFirstUnlockedLesson();
      if (firstUnlocked) {
        setSelectedLesson(firstUnlocked.lesson);
      }
      
      if (!courseIsComplete) {
        await refreshUser();
      }
    } catch (err: unknown) {
      // Revert optimistic update on error
      setCompletedLessons(prev => {
        const reverted = new Set(prev);
        reverted.delete(lessonId);
        return reverted;
      });
      setProgress(Math.round((completedLessons.size / totalLessons) * 100));
      toast.error((err as Error).message || 'Failed to complete lesson');
    }
  };

  const handleViewCertificate = () => {
    if (certificate?._id) {
      window.open(`/certificates/${certificate._id}`, '_blank');
    }
  };

  const handleDownloadCertificate = async () => {
    if (certificate?._id) {
      try {
        toast.info('Preparing certificate...');
        const result = await certificatesAPI.download(certificate._id);
        if (result.type === 'html') {
          toast.success('Certificate opened in new tab for printing');
        } else {
          toast.success('Certificate downloaded successfully!');
        }
      } catch (err: any) {
        console.error('Failed to download certificate:', err);
        toast.error(err.message || 'Failed to download certificate');
      }
    }
  };

  const handleVideoClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowVideoPlayer(true);
  };

  const handlePdfClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowPdfViewer(true);
  };

  const handleLinkClick = (lesson: Lesson) => {
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
                onClick={() => handleVideoClick(lesson)}
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
        const pdfUrl = lesson.content;
        const canViewInline = supportsInlinePdf();
        
        return (
          <div className="space-y-4">
            {showPdfViewer && canViewInline ? (
              <div className="h-[600px] bg-white rounded-lg overflow-hidden relative">
                <iframe
                  src={getPdfEmbedUrl(pdfUrl)}
                  className="w-full h-full"
                  title={lesson.title}
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    onClick={() => window.open(pdfUrl, '_blank')}
                    className="bg-indigo-500/80 hover:bg-indigo-600 text-white text-sm"
                    size="sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 rounded-lg overflow-hidden">
                <div className="h-48 flex items-center justify-center bg-red-500/10">
                  <FileText className="w-16 h-16 text-red-400" />
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-white font-medium text-lg">{lesson.title}</p>
                  <p className="text-indigo-300 text-sm">
                    <FileText className="w-4 h-4 inline mr-2" />
                    PDF Document
                  </p>
                  <div className="flex gap-3">
                    {canViewInline && (
                      <Button
                        onClick={() => handlePdfClick(lesson)}
                        className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View PDF
                      </Button>
                    )}
                    <Button
                      onClick={() => window.open(pdfUrl, '_blank')}
                      className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open PDF
                    </Button>
                  </div>
                  {!canViewInline && (
                    <p className="text-indigo-400 text-xs">
                      PDF viewing is limited on mobile devices. Please use the Open PDF button.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'Link':
        return (
          <div className="bg-white/5 rounded-lg p-6 text-center">
            <LinkIcon className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">{lesson.title}</p>
            <p className="text-indigo-300 text-sm mb-4 break-all bg-white/5 p-3 rounded">{lesson.content}</p>
            <Button 
              onClick={() => handleLinkClick(lesson)}
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

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
          <div className="h-10 w-24 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-64 h-48 bg-white/10 rounded-xl animate-pulse" />
            <div className="flex-1 space-y-4">
              <div className="h-8 w-3/4 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-white/10 rounded animate-pulse" />
                <div className="h-6 w-20 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const firstUnlocked = getFirstUnlockedLesson();

  return (
    <div className="space-y-6">
      <LinkConfirmDialog
        isOpen={showLinkConfirm}
        onClose={() => setShowLinkConfirm(false)}
        onConfirm={confirmExternalLink}
        url={pendingLink}
      />

      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" className="text-indigo-300 hover:text-white hover:bg-white/10">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Courses
        </Button>
        {hasRole('Super Admin', 'Admin', 'Trainer') && (
          <Button onClick={() => onEdit(course)} className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30">
            Edit Course
          </Button>
        )}
      </div>

      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
        <div className="flex flex-col md:flex-row gap-8">
          {course.thumbnail ? (
            <div className="w-full md:w-64 h-48 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl overflow-hidden flex-shrink-0">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="w-full md:w-64 h-48 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Play className="w-16 h-16 text-white" />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-3">{course.title}</h1>
            <p className="text-indigo-200 mb-4">{course.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-indigo-300 mb-4">
              <span className="px-3 py-1 bg-white/10 rounded-full">{course.category}</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">{course.level}</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">{course.duration} mins</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">{course.modules?.length || 0} modules</span>
            </div>
            
            {isEnrolled ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-indigo-300">Your Progress</span>
                        <span className="text-white font-medium ml-2">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2 w-32" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUnenroll}
                      variant="outline"
                      className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                    >
                      Unenroll
                    </Button>
                  </div>
                </div>

                {/* Learning Path Progress */}
                <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="text-white font-medium mb-4 flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-indigo-400" />
                    Learning Path Progress
                  </h4>
                  
                  <div className="flex items-center gap-2">
                    {/* Step 1: Course */}
                    <div className={`flex-1 flex items-center gap-2 p-3 rounded-lg ${
                      progress >= 100 ? 'bg-green-500/20 border border-green-500/30' : 'bg-indigo-500/20 border border-indigo-500/30'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        progress >= 100 ? 'bg-green-500' : 'bg-indigo-500'
                      }`}>
                        {progress >= 100 ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <span className="text-white text-sm font-bold">1</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${progress >= 100 ? 'text-green-300' : 'text-indigo-300'}`}>
                          Course
                        </p>
                        <p className="text-xs text-white/60">{progress}% Complete</p>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-white/30" />

                    {/* Step 2: Assessment */}
                    <div className={`flex-1 flex items-center gap-2 p-3 rounded-lg ${
                      assessmentPassed && assessmentPercentage >= 90 
                        ? 'bg-green-500/20 border border-green-500/30' 
                        : assessmentPassed 
                          ? 'bg-orange-500/20 border border-orange-500/30'
                          : progress >= 100 
                            ? 'bg-indigo-500/20 border border-indigo-500/30 animate-pulse'
                            : 'bg-white/5 border border-white/10 opacity-50'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        assessmentPassed && assessmentPercentage >= 90 
                          ? 'bg-green-500' 
                          : assessmentPassed 
                            ? 'bg-orange-500'
                            : progress >= 100 
                              ? 'bg-indigo-500'
                              : 'bg-white/20'
                      }`}>
                        {assessmentPassed && assessmentPercentage >= 90 ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : assessmentPassed ? (
                          <span className="text-white text-sm font-bold">!</span>
                        ) : (
                          <span className="text-white text-sm font-bold">2</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          assessmentPassed && assessmentPercentage >= 90 
                            ? 'text-green-300' 
                            : assessmentPassed 
                              ? 'text-orange-300'
                              : progress >= 100 
                                ? 'text-indigo-300'
                                : 'text-white/40'
                        }`}>
                          Assessment
                        </p>
                        <p className="text-xs text-white/60">
                          {assessmentPassed 
                            ? `${assessmentPercentage.toFixed(0)}% Score` 
                            : progress >= 100 
                              ? 'Ready to take'
                              : 'Locked'}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-white/30" />

                    {/* Step 3: Certificate */}
                    <div className={`flex-1 flex items-center gap-2 p-3 rounded-lg ${
                      certificate 
                        ? 'bg-yellow-500/20 border border-yellow-500/30' 
                        : assessmentPassed && assessmentPercentage >= 90 
                          ? 'bg-green-500/20 border border-green-500/30 animate-pulse'
                          : 'bg-white/5 border border-white/10 opacity-50'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        certificate 
                          ? 'bg-yellow-500' 
                          : assessmentPassed && assessmentPercentage >= 90 
                            ? 'bg-green-500'
                            : 'bg-white/20'
                      }`}>
                        {certificate ? (
                          <Award className="w-5 h-5 text-white" />
                        ) : (
                          <span className="text-white text-sm font-bold">3</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          certificate 
                            ? 'text-yellow-300' 
                            : assessmentPassed && assessmentPercentage >= 90 
                              ? 'text-green-300'
                              : 'text-white/40'
                        }`}>
                          Certificate
                        </p>
                        <p className="text-xs text-white/60">
                          {certificate ? 'Earned!' : assessmentPassed && assessmentPercentage >= 90 ? 'Generate now' : 'Locked'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {progress >= 100 && (
                  <div className="mt-4 space-y-4">
                    {/* Show assessment button - always allow unlimited retakes */}
                    {assessment && onSelectAssessment && (
                      <div className="p-4 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ClipboardCheck className="w-8 h-8 text-indigo-400" />
                            <div>
                              <p className="text-white font-medium">
                                {assessmentPassed 
                                  ? `Last Score: ${assessmentPercentage.toFixed(0)}%` 
                                  : 'Ready for Assessment!'}
                              </p>
                              <p className="text-indigo-300 text-sm">
                                {assessmentPassed && assessmentPercentage >= 90
                                  ? '🎉 You passed! You can retake to improve your score.'
                                  : assessmentPassed
                                    ? 'You passed but need 90% for certificate. Retake to improve!'
                                    : 'Complete the assessment to earn your certificate'}
                              </p>
                              <p className="text-indigo-400 text-xs mt-1">
                                {assessment.title} • {assessment.questions?.length || 0} questions • {assessment.duration} mins
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => assessment && onSelectAssessment?.(assessment)}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                          >
                            {assessmentPassed ? 'Retake Assessment' : 'Start Assessment'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Show certificate if assessment passed with 90%+ AND certificate exists */}
                    {assessment && assessmentPassed && assessmentPercentage >= 90 && certificate && (
                      <div className="p-4 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Award className="w-8 h-8 text-yellow-400" />
                            <div>
                              <p className="text-white font-medium">🎉 Certificate Earned!</p>
                              <p className="text-indigo-300 text-sm">ID: {certificate.certificateNumber} • Best Score: {assessmentPercentage.toFixed(0)}%</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleViewCertificate} className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button onClick={handleDownloadCertificate} className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show waiting message if assessment passed 90%+ but certificate not yet generated */}
                    {assessment && assessmentPassed && assessmentPercentage >= 90 && !certificate && (
                      <div className="p-4 bg-green-500/20 rounded-xl border border-green-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Award className="w-8 h-8 text-green-400" />
                            <div>
                              <p className="text-white font-medium">Congratulations! Assessment Passed!</p>
                              <p className="text-green-300 text-sm">You scored {assessmentPercentage.toFixed(0)}%. Your certificate will appear here shortly.</p>
                            </div>
                          </div>
                          <div className="text-green-300 text-sm">
                            <Check className="w-5 h-5 inline mr-1" />
                            Certificate pending...
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Button onClick={handleEnroll} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                Enroll in Course
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-4 space-y-2 sticky top-6">
            <h3 className="text-white font-bold mb-4">Course Content</h3>
            {!isEnrolled ? (
              <div className="text-center py-8">
                <Lock className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <p className="text-indigo-300 text-sm">Enroll to view course content</p>
              </div>
            ) : (
              course.modules?.map((module, moduleIndex) => (
                <div key={module._id || moduleIndex}>
                  <div className="text-white font-medium mb-2 px-3 py-2 bg-white/5 rounded-lg">
                    {moduleIndex + 1}. {module.title}
                  </div>
                  <div className="space-y-1 ml-4">
                    {module.lessons?.map((lesson, lessonIndex) => {
                      const isCompleted = completedLessons.has(lesson._id);
                      const isSelected = selectedLesson?._id === lesson._id;
                      const unlocked = isLessonUnlocked(moduleIndex, lessonIndex);
                      
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
                            if (unlocked) {
                              // Immediate UI feedback
                              setSelectedLesson(lesson);
                              setShowVideoPlayer(false);
                              setShowPdfViewer(false);
                            }
                          }} 
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all active:scale-95 ${
                            !unlocked ? 'opacity-50 cursor-not-allowed' : 
                            isSelected ? 'bg-indigo-500 text-white' : 
                            'text-indigo-300 hover:bg-white/10'
                          }`}
                          disabled={!unlocked}
                        >
                          {isCompleted ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : !unlocked ? (
                            <Lock className="w-4 h-4 text-gray-400" />
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
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
            {!isEnrolled ? (
              <div className="text-center py-16">
                <Lock className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                <p className="text-white font-medium mb-2">Enroll to Access Course Content</p>
                <p className="text-indigo-300 mb-6">Enroll in this course to start learning and access all lessons.</p>
                <Button onClick={handleEnroll} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">Enroll Now</Button>
              </div>
            ) : selectedLesson ? (
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
                      setShowPdfViewer(false);
                      setSelectedLesson(null);
                    }}
                    className="text-indigo-300 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="mb-6">
                  {renderLessonContent(selectedLesson)}
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
                <p className="text-white font-medium mb-2">
                  {isEnrolled 
                    ? (firstUnlocked ? 'Select a lesson to begin' : 'All lessons completed!')
                    : 'Enroll to start learning'}
                </p>
                {isEnrolled && firstUnlocked && (
                  <Button 
                    onClick={() => {
                      setSelectedLesson(firstUnlocked.lesson);
                      setShowVideoPlayer(false);
                      setShowPdfViewer(false);
                    }}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Learning
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
