import { useAuth } from '../../../contexts/AuthContext';
import { ArrowLeft, Edit, Eye } from 'lucide-react';
import { Button } from '../ui/button';

// Article type
interface Article {
  _id?: string;
  title: string;
  content: string;
  category: string;
  views?: number;
  createdAt: string;
  tags?: string[];
  author?: string;
}

// Props type
interface ArticleViewerProps {
  article: Article | null;
  onBack: () => void;
  onEdit: (article: Article) => void;
}

export default function ArticleViewer({ article, onBack, onEdit }: ArticleViewerProps) {
  const { hasRole } = useAuth();

  if (!article) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" className="text-indigo-300 hover:text-white hover:bg-white/10">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        {hasRole('Super Admin', 'Admin', 'Trainer') && (
          <Button onClick={() => onEdit(article)} className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30">
            <Edit className="w-4 h-4 mr-2" />
            Edit Article
          </Button>
        )}
      </div>

      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-3">{article.title}</h1>
          <div className="flex items-center gap-4 text-sm text-indigo-300">
            <span className="px-3 py-1 bg-white/10 rounded-full">{article.category}</span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {article.views || 0} views
            </span>
            <span>
              {new Date(article.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="text-indigo-100 leading-relaxed whitespace-pre-wrap">
            {article.content}
          </div>
        </div>

        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-indigo-300 text-sm mb-2">Tags:</p>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
