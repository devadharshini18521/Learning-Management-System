import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { settingsAPI } from '../services/api';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import AdminDashboard from './components/admin/AdminDashboard';
import TrainerDashboard from './components/trainer/TrainerDashboard';
import LearnerDashboard from './components/learner/LearnerDashboard';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import CourseList from './components/courses/CourseList';
import CourseViewer from './components/courses/CourseViewer';
import CourseBuilder from './components/courses/CourseBuilder';
import AssessmentList from './components/assessments/AssessmentList';
import AssessmentViewer from './components/assessments/AssessmentViewer';
import AssessmentBuilder from './components/assessments/AssessmentBuilder';
import KnowledgeBase from './components/knowledge/KnowledgeBase';
import ArticleViewer from './components/knowledge/ArticleViewer';
import ArticleEditor from './components/knowledge/ArticleEditor';
import Certificates from './components/certificates/Certificates';
import CertificateViewer from './components/certificates/CertificateViewer';
import UserManagement from './components/admin/UserManagement';
import OrgSettings from './components/admin/OrgSettings';
import Analytics from './components/admin/Analytics';
import EnrollmentManagement from './components/enrollments/EnrollmentManagement';
import Notifications from './components/notifications/Notifications';

function AppContent() {
  const { user, loading, isAuthenticated, refreshUser } = useAuth() as { user: any; loading: boolean; isAuthenticated: boolean; refreshUser: () => Promise<void> };
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [certificateId, setCertificateId] = useState<string | null>(null);

  // Fetch and apply organization settings (favicon, title)
  useEffect(() => {
    const applyOrganizationSettings = async () => {
      try {
        const response = await settingsAPI.get();
        if (response.settings?.organization) {
          const { organization } = response.settings;
          
          // Update page title
          if (organization.name) {
            document.title = organization.name;
          }
          
          // Update favicon
          if (organization.favicon) {
            let faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
            if (!faviconLink) {
              faviconLink = document.createElement('link');
              faviconLink.rel = 'icon';
              faviconLink.type = 'image/x-icon';
              document.head.appendChild(faviconLink);
            }
            faviconLink.href = organization.favicon;
          }
        }
      } catch (err) {
        console.error('Failed to load organization settings:', err);
      }
    };
    
    applyOrganizationSettings();
  }, []);

  // Check for reset password token or certificate URL in URL path
  useEffect(() => {
    const path = window.location.pathname;
    
    // Check for reset password token
    const resetMatch = path.match(/^\/reset-password\/(.+)$/);
    if (resetMatch && resetMatch[1]) {
      setResetToken(resetMatch[1]);
      return;
    }
    
    // Check for certificate view
    const certMatch = path.match(/^\/certificates\/(.+)$/);
    if (certMatch && certMatch[1]) {
      setCertificateId(certMatch[1]);
      setCurrentView('certificate-viewer');
      return;
    }
    
    // Reset these states if on normal routes
    setResetToken(null);
    setCertificateId(null);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-indigo-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show reset password page if token exists in URL
  if (resetToken) {
    return <ResetPassword token={resetToken} onNavigate={setCurrentView} />;
  }

  // Show certificate viewer if certificateId exists
  if (certificateId) {
    return <CertificateViewer />;
  }

  if (!isAuthenticated) {
    if (showForgotPassword) {
      return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
    }
    return <Login onForgotPassword={() => setShowForgotPassword(true)} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        if (user?.role === 'Super Admin' || user?.role === 'Admin' || user?.role === 'HR') {
          return <AdminDashboard onNavigate={setCurrentView} />;
        } else if (user?.role === 'Trainer') {
          return <TrainerDashboard 
            onNavigate={setCurrentView}
            onEditCourse={(course: any) => {
              setSelectedItem(course);
              setCurrentView('course-builder');
            }}
            onEditAssessment={(assessment: any) => {
              setSelectedItem(assessment);
              setCurrentView('assessment-builder');
            }}
            onEditArticle={(article: any) => {
              setSelectedItem(article);
              setCurrentView('article-editor');
            }}
            onCreateCourse={() => {
              setSelectedItem(null);
              setCurrentView('course-builder');
            }}
          />;
        } else {
          return <LearnerDashboard 
            onNavigate={setCurrentView} 
            onSelectCourse={(course: any) => {
              setSelectedItem(course);
              setCurrentView('course-viewer');
            }}
            onSelectAssessment={(assessment: any) => {
              setSelectedItem(assessment);
              setCurrentView('assessment-viewer');
            }}
          />;
        }
      
      case 'courses':
        return <CourseList 
          onSelectCourse={(course: any) => {
            setSelectedItem(course);
            setCurrentView('course-viewer');
          }}
          onCreateCourse={() => {
            setSelectedItem(null);
            setCurrentView('course-builder');
          }}
          onRefreshUser={refreshUser}
        />;
      
      case 'course-viewer':
        return <CourseViewer 
          course={selectedItem} 
          onBack={() => setCurrentView('courses')}
          onEdit={(course: any) => {
            setSelectedItem(course);
            setCurrentView('course-builder');
          }}
          onSelectAssessment={(assessment: any) => {
            setSelectedItem(assessment);
            setCurrentView('assessment-viewer');
          }}
        />;
      
      case 'course-builder':
        return <CourseBuilder 
          course={selectedItem}
          onBack={() => setCurrentView('courses')}
          onSave={() => setCurrentView('courses')}
        />;
      
      case 'assessments':
        return <AssessmentList 
          onSelectAssessment={(assessment: any) => {
            setSelectedItem(assessment);
            setCurrentView('assessment-viewer');
          }}
          onCreateAssessment={() => {
            setSelectedItem(null);
            setCurrentView('assessment-builder');
          }}
        />;
      
      case 'assessment-viewer':
        return <AssessmentViewer 
          assessment={selectedItem}
          onBack={() => setCurrentView('assessments')}
        />;
      
      case 'assessment-builder':
        return <AssessmentBuilder 
          assessment={selectedItem}
          onBack={() => setCurrentView('assessments')}
          onSave={() => setCurrentView('assessments')}
        />;
      
      case 'knowledge':
        return <KnowledgeBase 
          onSelectArticle={(article: any) => {
            setSelectedItem(article);
            setCurrentView('article-viewer');
          }}
          onCreateArticle={() => {
            setSelectedItem(null);
            setCurrentView('article-editor');
          }}
        />;
      
      case 'article-viewer':
        return <ArticleViewer 
          article={selectedItem}
          onBack={() => setCurrentView('knowledge')}
          onEdit={(article: any) => {
            setSelectedItem(article);
            setCurrentView('article-editor');
          }}
        />;
      
      case 'article-editor':
        return <ArticleEditor 
          article={selectedItem}
          onBack={() => setCurrentView('knowledge')}
          onSave={() => setCurrentView('knowledge')}
        />;
      
      case 'certificates':
        return <Certificates />;
      
      case 'certificate-viewer':
        return <CertificateViewer />;
      
      case 'users':
        return <UserManagement />;
      
      case 'settings':
        return <OrgSettings />;

      case 'analytics':
        return <Analytics />;
      
      case 'enrollments':
        return <EnrollmentManagement />;
      
      case 'notifications':
        return <Notifications onNavigate={setCurrentView} />;
      
      default:
        return <div className="text-white">View not found</div>;
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header currentView={currentView} onNavigate={setCurrentView} />
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AuthProvider>
  );
}
