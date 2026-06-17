import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Save, Trash2, Check, X, BookOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { assessmentsAPI, coursesAPI } from '../../../services/api';

interface Question {
  question: string;
  type: 'MCQ' | 'True/False';
  options: string[];
  correctAnswer: string;
  points: number;
}

interface Course {
  _id: string;
  title: string;
  category: string;
}

interface AssessmentBuilderProps {
  assessment?: any;
  onBack: () => void;
  onSave: () => void;
}

export default function AssessmentBuilder({ assessment, onBack, onSave }: AssessmentBuilderProps) {
  const [formData, setFormData] = useState({
    title: assessment?.title || '',
    description: assessment?.description || '',
    passingScore: assessment?.passingScore || 70,
    duration: assessment?.duration || 30,
    status: assessment?.status || 'Draft',
    course: assessment?.course || 'none',
    questions: (assessment?.questions || []) as Question[]
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.getAll({});
      setCourses(response.courses || []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleAddQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, {
        question: '',
        type: 'MCQ',
        options: ['', '', '', ''],
        correctAnswer: '',
        points: 1
      }]
    });
  };

  const handleDeleteQuestion = (index: number) => {
    const updated = [...formData.questions];
    updated.splice(index, 1);
    setFormData({ ...formData, questions: updated });
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updated = [...formData.questions];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, questions: updated });
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...formData.questions];
    updated[questionIndex].options[optionIndex] = value;
    setFormData({ ...formData, questions: updated });
  };

  const handleAddOption = (questionIndex: number) => {
    const updated = [...formData.questions];
    updated[questionIndex].options.push('');
    setFormData({ ...formData, questions: updated });
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...formData.questions];
    updated[questionIndex].options.splice(optionIndex, 1);
    setFormData({ ...formData, questions: updated });
  };

  const handleSetCorrectAnswer = (questionIndex: number, answer: string) => {
    const updated = [...formData.questions];
    updated[questionIndex].correctAnswer = answer;
    setFormData({ ...formData, questions: updated });
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (!formData.title.trim()) {
      newErrors.push('Please enter an assessment title');
    }

    formData.questions.forEach((q, idx) => {
      if (!q.question.trim()) {
        newErrors.push(`Question ${idx + 1}: Please enter the question text`);
      }
      if (q.type === 'MCQ' && q.options.filter(o => o.trim()).length < 2) {
        newErrors.push(`Question ${idx + 1}: Please add at least 2 options`);
      }
      if (!q.correctAnswer) {
        newErrors.push(`Question ${idx + 1}: Please select the correct answer`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix all errors before saving');
      return;
    }

    try {
      // Convert 'none' to empty string for API
      const dataToSave = {
        ...formData,
        course: formData.course === 'none' ? '' : formData.course
      };
      
      if (assessment) {
        await assessmentsAPI.update(assessment._id, dataToSave);
        toast.success('Assessment updated successfully!');
      } else {
        await assessmentsAPI.create(dataToSave);
        toast.success('Assessment created successfully!');
      }
      onSave();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save assessment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" className="text-indigo-300 hover:text-white hover:bg-white/10">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button onClick={handleSave} className="bg-gradient-to-r from-indigo-500 to-purple-600">
          <Save className="w-4 h-4 mr-2" />
          Save Assessment
        </Button>
      </div>

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
          <h4 className="text-red-300 font-medium mb-2">Please fix the following errors:</h4>
          <ul className="list-disc list-inside text-red-200 text-sm space-y-1">
            {errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 space-y-6">
        <h2 className="text-2xl font-bold text-white">{assessment ? 'Edit Assessment' : 'Create Assessment'}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Label className="text-white mb-2 block">Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Assessment title"
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="text-white mb-2 block">Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Assessment description"
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <Label className="text-white mb-2 block">Passing Score (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={formData.passingScore}
              onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) || 0 })}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <Label className="text-white mb-2 block">Duration (minutes)</Label>
            <Input
              type="number"
              min="1"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <Label className="text-white mb-2 block">Status</Label>
            <Select value={formData.status} onValueChange={(value: 'Draft' | 'Published') => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/20">
                <SelectItem value="Draft">Draft (Not visible to learners)</SelectItem>
                <SelectItem value="Published">Published (Visible to learners)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label className="text-white mb-2 block flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Map to Course (Optional)
            </Label>
            <Select 
              value={formData.course} 
              onValueChange={(value: string) => setFormData({ ...formData, course: value })}
              disabled={loadingCourses}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder={loadingCourses ? "Loading courses..." : "Select a course to map this assessment"} />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/20 max-h-60">
                <SelectItem value="none">No course (Standalone assessment)</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course._id} value={course._id}>
                    {course.title} ({course.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-indigo-400 text-xs mt-1">
              When mapped to a course, learners will see this assessment after completing the course.
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Questions *</h3>
            <Button 
              onClick={handleAddQuestion} 
              size="sm" 
              className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>

          {formData.questions.length === 0 ? (
            <p className="text-indigo-300 text-center py-8">No questions yet. Click "Add Question" to begin.</p>
          ) : (
            <div className="space-y-6">
              {formData.questions.map((q, qIdx) => (
                <div key={qIdx} className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-white font-medium bg-indigo-500/30 px-3 py-1 rounded-lg">
                      Question {qIdx + 1}
                    </p>
                    <Button
                      onClick={() => handleDeleteQuestion(qIdx)}
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Question Text */}
                  <div className="mb-4">
                    <Label className="text-indigo-300 text-sm mb-2 block">Question Text *</Label>
                    <Input
                      value={q.question}
                      onChange={(e) => handleQuestionChange(qIdx, 'question', e.target.value)}
                      placeholder="Enter your question here..."
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  {/* Question Type */}
                  <div className="mb-4">
                    <Label className="text-indigo-300 text-sm mb-2 block">Question Type</Label>
                    <Select
                      value={q.type}
                      onValueChange={(value: 'MCQ' | 'True/False') => {
                        if (value === 'True/False') {
                          handleQuestionChange(qIdx, 'type', value);
                          handleQuestionChange(qIdx, 'options', ['True', 'False']);
                          handleQuestionChange(qIdx, 'correctAnswer', '');
                        } else {
                          handleQuestionChange(qIdx, 'type', value);
                          handleQuestionChange(qIdx, 'options', ['', '', '', '']);
                          handleQuestionChange(qIdx, 'correctAnswer', '');
                        }
                      }}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/20">
                        <SelectItem value="MCQ">Multiple Choice (MCQ)</SelectItem>
                        <SelectItem value="True/False">True/False</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Options (for MCQ) */}
                  {q.type === 'MCQ' && (
                    <div className="mb-4">
                      <Label className="text-indigo-300 text-sm mb-2 block">Options * (Select the correct answer below)</Label>
                      <div className="space-y-2">
                        {q.options.map((option, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="icon"
                              variant={q.correctAnswer === option ? 'default' : 'outline'}
                              className={q.correctAnswer === option 
                                ? 'bg-green-500 hover:bg-green-600' 
                                : 'bg-white/10 border-white/20 text-indigo-300'}
                              onClick={() => handleSetCorrectAnswer(qIdx, option)}
                              disabled={!option.trim()}
                            >
                              {q.correctAnswer === option ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-xs">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                              )}
                            </Button>
                            <Input
                              value={option}
                              onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                              className={`bg-white/10 border-white/20 text-white ${
                                q.correctAnswer === option ? 'border-green-500/50' : ''
                              }`}
                            />
                            {q.options.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-red-400 hover:text-red-300"
                                onClick={() => handleRemoveOption(qIdx, optIdx)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-indigo-300 hover:text-white mt-2"
                        onClick={() => handleAddOption(qIdx)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Another Option
                      </Button>
                    </div>
                  )}

                  {/* Options (for True/False) */}
                  {q.type === 'True/False' && (
                    <div className="mb-4">
                      <Label className="text-indigo-300 text-sm mb-2 block">Select Correct Answer *</Label>
                      <div className="flex gap-4">
                        {['True', 'False'].map((option) => (
                          <Button
                            key={option}
                            type="button"
                            variant={q.correctAnswer === option ? 'default' : 'outline'}
                            className={`flex-1 ${
                              q.correctAnswer === option 
                                ? 'bg-green-500 hover:bg-green-600 text-white' 
                                : 'bg-white/10 border-white/20 text-indigo-300'
                            }`}
                            onClick={() => handleSetCorrectAnswer(qIdx, option)}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Points */}
                  <div>
                    <Label className="text-indigo-300 text-sm mb-2 block">Points</Label>
                    <Input
                      type="number"
                      min="1"
                      value={q.points}
                      onChange={(e) => handleQuestionChange(qIdx, 'points', parseInt(e.target.value) || 1)}
                      className="bg-white/10 border-white/20 text-white w-32"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
