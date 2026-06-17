import { useState, useEffect } from 'react';
import { knowledgeAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { FileText, Plus, Search, Trash2, Edit } from 'lucide-react';
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

type KnowledgeBaseProps = {
  onSelectArticle: (article: any) => void;
  onCreateArticle: () => void;
  onEditArticle?: (article: any) => void;
};

export default function KnowledgeBase({ onSelectArticle, onCreateArticle, onEditArticle }: KnowledgeBaseProps) {
  const { hasRole } = useAuth();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<any>(null);

  // Check for edit permissions (support both 'knowledge:update' and 'knowledge:write')
  const canEditArticles = hasRole('Super Admin', 'Admin', 'Trainer') || hasRole('HR');
  const canDeleteArticles = hasRole('Super Admin', 'Admin', 'Trainer') || hasRole('HR');

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await knowledgeAPI.getAll();
      setArticles(response.articles || []);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const handleArticleClick = async (article: any) => {
    try {
      // Fetch the article to increment view count
      const response = await knowledgeAPI.getOne(article._id);
      if (response.article) {
        onSelectArticle(response.article);
      } else {
        onSelectArticle(article);
      }
    } catch (err) {
      console.error('Failed to fetch article:', err);
      // Fallback to using the article from the list if API fails
      onSelectArticle(article);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, article: any) => {
    e.stopPropagation();
    setArticleToDelete(article);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!articleToDelete) return;
    
    try {
      await knowledgeAPI.delete(articleToDelete._id);
      toast.success('Article deleted successfully!');
      fetchArticles();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to delete article');
    } finally {
      setDeleteDialogOpen(false);
      setArticleToDelete(null);
    }
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-40 bg-white/10 rounded animate-pulse mb-1" />
            <div className="h-4 w-56 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-10 w-24 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="h-10 w-full bg-white/10 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 bg-white/10 rounded animate-pulse" />
                <div className="h-6 w-12 bg-white/10 rounded animate-pulse" />
              </div>
              <div className="h-6 w-3/4 bg-white/10 rounded animate-pulse mb-2" />
              <div className="h-4 w-full bg-white/10 rounded animate-pulse mb-1" />
              <div className="h-4 w-2/3 bg-white/10 rounded animate-pulse mb-4" />
              <div className="flex items-center justify-between">
                <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-12 bg-white/10 rounded animate-pulse" />
              </div>
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
          <h2 className="text-2xl font-bold text-white">Knowledge Base</h2>
          <p className="text-indigo-300 mt-1">Browse articles and documentation</p>
        </div>
        {hasRole('Super Admin', 'Admin', 'Trainer') && (
          <Button onClick={onCreateArticle} className="bg-gradient-to-r from-indigo-500 to-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Article
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
        <Input
          type="search"
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-11 bg-white/10 border-white/20 text-white placeholder:text-indigo-300"
        />
      </div>

      {filteredArticles.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-12 text-center">
          <FileText className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <p className="text-white font-medium mb-2">No articles found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <div
              key={article._id}
              onClick={() => handleArticleClick(article)}
              className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:border-indigo-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <FileText className="w-8 h-8 text-indigo-400" />
                <div className="flex items-center gap-2">
                  {article.status === 'Draft' && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-lg text-xs">
                      Draft
                    </span>
                  )}
                  {hasRole('Super Admin', 'Admin', 'Trainer') && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEditArticle && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditArticle(article);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30"
                        onClick={(e) => handleDeleteClick(e, article)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">{article.title}</h3>
              <p className="text-indigo-200 text-sm mb-4 line-clamp-3">{article.content?.substring(0, 150)}...</p>
              <div className="flex items-center justify-between text-sm text-indigo-300">
                <span>{article.category}</span>
                <span>{article.views || 0} views</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-900 border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Article</AlertDialogTitle>
            <AlertDialogDescription className="text-indigo-300">
              Are you sure you want to delete "{articleToDelete?.title}"? This action cannot be undone.
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
              Delete Article
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
