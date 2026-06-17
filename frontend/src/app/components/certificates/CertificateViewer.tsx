import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { certificatesAPI, coursesAPI, settingsAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import Certificate from './Certificate';

interface CertificateData {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  course: {
    _id: string;
    title: string;
    category: string;
  };
  certificateNumber: string;
  issuedAt: string;
  completionDate: string;
}

export default function CertificateViewer() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const certificateRef = useRef<HTMLDivElement>(null);
  
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [organizationLogo, setOrganizationLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchCertificate();
    fetchOrganizationSettings();
  }, [certificateId]);

  const fetchOrganizationSettings = async () => {
    try {
      console.log('Fetching organization settings for certificate...');
      const response = await settingsAPI.get();
      console.log('Settings response:', response);
      
      if (response.settings?.organization?.logo) {
        console.log('Organization logo found:', response.settings.organization.logo.substring(0, 50) + '...');
        setOrganizationLogo(response.settings.organization.logo);
      } else {
        console.log('No organization logo found in settings');
        console.log('Organization data:', response.settings?.organization);
      }
    } catch (err) {
      console.error('Failed to fetch organization settings:', err);
      toast.error('Failed to load organization logo');
    }
  };

  // Auto-download if ?download=true is in URL
  useEffect(() => {
    if (certificate && !loading && searchParams.get('download') === 'true') {
      // Small delay to ensure certificate is rendered
      const timer = setTimeout(() => {
        handleDownloadPDF();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [certificate, loading, searchParams]);

  const fetchCertificate = async () => {
    if (!certificateId) return;
    
    try {
      setLoading(true);
      const response = await certificatesAPI.getOne(certificateId);
      setCertificate(response.certificate);
      
      if (response.certificate?.course) {
        const courseResponse = await coursesAPI.getOne(response.certificate.course._id);
        setCourse(courseResponse.course);
      }
    } catch (err) {
      console.error('Failed to fetch certificate:', err);
      toast.error('Failed to load certificate');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Use backend API for reliable PDF download
  const handleDownloadPDF = async () => {
    if (downloading || !certificate?._id) return;
    
    try {
      setDownloading(true);
      toast.info('Downloading certificate...');
      
      const result = await certificatesAPI.download(certificate._id);
      
      if (result.type === 'html') {
        toast.success('Certificate opened! Use Ctrl+P to save as PDF');
      } else {
        toast.success('Certificate downloaded successfully!');
      }
    } catch (err: any) {
      console.error('Failed to download certificate:', err);
      toast.error(err.message || 'Failed to download certificate. Try using Print instead.');
    } finally {
      setDownloading(false);
    }
  };

  // Print-to-PDF fallback option
  const handleQuickDownload = () => {
    toast.info('Opening print dialog... Use "Save as PDF" as the printer');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Authority details from settings or defaults
  const authorityName = 'Dr. Sarah Mitchell';
  const authorityTitle = 'Director of Learning & Development';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <div className="text-white text-xl">Loading certificate...</div>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="text-white text-xl">Certificate not found</div>
        <Button onClick={() => navigate('/certificates')} className="bg-indigo-500">
          Back to Certificates
        </Button>
      </div>
    );
  }

  const completionDate = new Date(certificate.completionDate || certificate.issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      {/* Actions */}
      <div className="max-w-7xl mx-auto px-4 mb-6 flex items-center justify-between print:hidden">
        <Button 
          onClick={() => navigate(-1)} 
          variant="ghost" 
          className="text-white hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center gap-3">
          {organizationLogo && (
            <div className="flex items-center gap-2 mr-4 px-3 py-2 bg-white/10 rounded-lg border border-white/20">
              <span className="text-indigo-300 text-sm">Logo:</span>
              <img 
                src={organizationLogo} 
                alt="Org Logo" 
                className="w-8 h-8 object-contain rounded"
              />
            </div>
          )}
          <Button 
            onClick={handlePrint}
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button 
            onClick={handleQuickDownload}
            variant="outline"
            className="bg-green-500/20 border-green-500/30 text-green-300 hover:bg-green-500/30"
          >
            <Download className="w-4 h-4 mr-2" />
            Quick PDF
          </Button>
          <Button 
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Certificate Display */}
      <div className="flex justify-center print:justify-center print:w-full">
        <Certificate
          ref={certificateRef}
          learnerName={certificate.user?.name || user?.name || 'Student'}
          courseName={course?.title || certificate.course?.title || 'Course'}
          completionDate={completionDate}
          certificateId={certificate.certificateNumber}
          authorityName={authorityName}
          authorityTitle={authorityTitle}
          organizationLogo={organizationLogo}
        />
      </div>
    </div>
  );
}
