import { useState, useEffect } from 'react';
import { assessmentsAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { ClipboardCheck, Plus, Search, Trash2, Edit } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
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

interface AssessmentListProps {
  onSelectAssessment: (assessment: any) => void;
  onCreateAssessment: () => void;
  onEditAssessment?: (assessment: any) => void;
}

export default function AssessmentList({ onSelectAssessment, onCreateAssessment, onEditAssessment }: AssessmentListProps) {
  const { hasRole } = useAuth();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<any>(null);

  // Check for edit/delete permissions (support both 'assessments:update' and 'assessments:write')
  const canEditAssessments = hasRole('Super Admin', 'Admin', 'Trainer') || hasRole('HR');
  const canDeleteAssessments = hasRole('Super Admin', 'Admin', 'Trainer') || hasRole('HR');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const response = await assessmentsAPI.getAll();
      setAssessments(response.assessments || []);
    } catch (err) {
      console.error('Failed to fetch assessments:', err);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, assessment: any) => {
    e.stopPropagation();
    setAssessmentToDelete(assessment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!assessmentToDelete) return;
    
    try {
      await assessmentsAPI.delete(assessmentToDelete._id);
      toast.success('Assessment deleted successfully!');
      fetchAssessments();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete assessment');
    } finally {
      setDeleteDialogOpen(false);
      setAssessmentToDelete(null);
    }
  };

  const filteredAssessments = assessments.filter(assessment =>
    assessment.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-40 bg-white/10 rounded animate-pulse mb-1" />
            <div className="h-4 w-56 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 bg-white/10 rounded animate-pulse" />
                <div className="h-6 w-20 bg-white/10 rounded animate-pulse" />
              </div>
              <div className="h-6 w-3/4 bg-white/10 rounded animate-pulse mb-2" />
              <div className="h-4 w-full bg-white/10 rounded animate-pulse mb-4" />
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-12 bg-white/10 rounded animate-pulse" />
              </div>
              <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Assessments</h2>
          <p className="text-indigo-300 mt-1">Test your knowledge</p>
        </div>
        {hasRole('Super Admin', 'Admin', 'Trainer') && (
          <Button onClick={onCreateAssessment} className="bg-gradient-to-r from-indigo-500 to-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Assessment
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
        <Input
          type="search"
          placeholder="Search assessments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-11 bg-white/10 border-white/20 text-white placeholder:text-indigo-300"
        />
      </div>

      {filteredAssessments.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-12 text-center">
          <ClipboardCheck className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <p className="text-white font-medium mb-2">No assessments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map((assessment) => (
            <div
              key={assessment._id}
              className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:border-indigo-500/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <ClipboardCheck className="w-8 h-8 text-indigo-400" />
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    assessment.status === 'Published' 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {assessment.status}
                  </span>
                  {hasRole('Super Admin', 'Admin', 'Trainer') && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEditAssessment && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            onEditAssessment(assessment);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                        onClick={(e: React.MouseEvent) => handleDeleteClick(e, assessment)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{assessment.title}</h3>
              <p className="text-indigo-200 text-sm mb-4">{assessment.description}</p>
              <div className="flex items-center justify-between text-sm text-indigo-300 mb-4">
                <span>{assessment.questions?.length || 0} questions</span>
                <span>{assessment.duration} mins</span>
              </div>
              {assessment.status === 'Draft' ? (
                <div className="bg-yellow-500/20 text-yellow-300 text-sm font-medium px-3 py-2 rounded-lg text-center">
                  Coming Soon
                </div>
              ) : (
                <Button
                  onClick={() => onSelectAssessment(assessment)}
                  className="w-full bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30"
                >
                  Start Assessment
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Assessment</AlertDialogTitle>
            <AlertDialogDescription className="text-indigo-300">
              Are you sure you want to delete "{assessmentToDelete?.title}"? This action cannot be undone.
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
              Delete Assessment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
