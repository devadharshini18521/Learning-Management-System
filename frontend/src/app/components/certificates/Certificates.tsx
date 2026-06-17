import { useState, useEffect } from 'react';
import { Award, Download, Plus, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { certificatesAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

interface Certificate {
  _id: string;
  course: {
    _id: string;
    title: string;
    category: string;
  };
  certificateNumber: string;
  issuedAt: string;
  completionDate: string;
}

export default function Certificates() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
    
    // Add Ctrl+T keyboard shortcut listener for quick certificate access
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        if (certificates.length > 0) {
          handleViewCertificate(certificates[0].certificateNumber);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [certificates.length]);

  const fetchCertificates = async () => {
    try {
      const response = await certificatesAPI.getAll();
      setCertificates(response.certificates || []);
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCertificate = (certificateId: string) => {
    window.open(`/certificates/${certificateId}`, '_blank');
  };

  const handleDownloadCertificate = async (certificateId: string) => {
    try {
      toast.info('Preparing certificate...');
      const result = await certificatesAPI.download(certificateId);
      if (result.type === 'html') {
        toast.success('Certificate opened! Use Ctrl+P to save as PDF');
      } else {
        toast.success('Certificate downloaded successfully!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to download certificate');
    }
  };

  if (loading) {
    return (
      <div className="text-white text-center py-12">Loading certificates...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">My Certificates</h2>
          <p className="text-indigo-300 mt-1">View and download your earned certificates</p>
        </div>
      </div>

      {/* Certificate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-indigo-300 text-sm">Total Certificates</p>
              <p className="text-white text-3xl font-bold">{certificates.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-12 text-center">
          <Award className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <p className="text-white font-medium mb-2">No certificates yet</p>
          <p className="text-indigo-300 mb-4">Complete courses to earn certificates!</p>
          <Button 
            onClick={() => window.location.href = '/courses'}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            Browse Courses
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert._id}
              className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden hover:border-yellow-500/50 transition-all group"
            >
              <div className="h-32 bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center relative">
                <Award className="w-16 h-16 text-white opacity-50" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
              </div>
              
              <div className="p-6">
                <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
                  {cert.course?.title || 'Course'}
                </h3>
                <p className="text-indigo-300 text-sm mb-4">
                  {cert.course?.category || 'General'}
                </p>
                
<div className="flex items-center justify-between text-sm text-indigo-300 mb-4">
                  <span>ID: {cert.certificateNumber}</span>
                  <span>{new Date(cert.completionDate || cert.issuedAt).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleViewCertificate(cert.certificateNumber)}
                    className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    onClick={() => handleDownloadCertificate(cert._id)}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
