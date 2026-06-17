import { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Save, GripVertical, Video, FileText, Link as LinkIcon, Type, Image } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { coursesAPI } from '../../../services/api';
import { lessonTypeHints, getYouTubeVideoId, isYouTubeUrl, isPdfUrl } from '../../../utils/media';

interface Lesson {
  _id?: string;
  title: string;
  type: string;
  content: string;
  duration: number;
  order: number;
  description: string;
}

interface Module {
  _id?: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

interface CourseBuilderProps {
  course?: any;
  onBack: () => void;
  onSave: () => void;
}

export default function CourseBuilder({ course, onBack, onSave }: CourseBuilderProps) {
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    thumbnail: course?.thumbnail || '',
    category: course?.category || '',
    level: course?.level || 'Beginner',
    status: course?.status || 'Draft',
    modules: course?.modules || [] as Module[]
  });

  const handleAddModule = () => {
    setFormData({
      ...formData,
      modules: [...formData.modules, {
        title: '',
        description: '',
        order: formData.modules.length + 1,
        lessons: []
      }]
    });
  };

  const handleDeleteModule = (moduleIndex: number) => {
    const updated = [...formData.modules];
    updated.splice(moduleIndex, 1);
    // Update order
    updated.forEach((mod: Module, idx: number) => {
      mod.order = idx + 1;
    });
    setFormData({ ...formData, modules: updated });
  };

  const handleAddLesson = (moduleIndex: number) => {
    const updated = [...formData.modules];
    const module = updated[moduleIndex];
    module.lessons.push({
      title: '',
      type: 'Video',
      content: '',
      duration: 0,
      order: module.lessons.length + 1,
      description: ''
    });
    setFormData({ ...formData, modules: updated });
  };

  const handleDeleteLesson = (moduleIndex: number, lessonIndex: number) => {
    const updated = [...formData.modules];
    const module = updated[moduleIndex];
    module.lessons.splice(lessonIndex, 1);
    // Update order
    module.lessons.forEach((lesson: Lesson, idx: number) => {
      lesson.order = idx + 1;
    });
    setFormData({ ...formData, modules: updated });
  };

  const updateLesson = (moduleIndex: number, lessonIndex: number, field: string, value: any) => {
    const updated = [...formData.modules];
    updated[moduleIndex].lessons[lessonIndex] = {
      ...updated[moduleIndex].lessons[lessonIndex],
      [field]: value
    };
    setFormData({ ...formData, modules: updated });
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'Video': return <Video className="w-4 h-4" />;
      case 'PDF': return <FileText className="w-4 h-4" />;
      case 'Link': return <LinkIcon className="w-4 h-4" />;
      case 'Text': return <Type className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleSave = async () => {
    try {
      // Validate
      if (!formData.title.trim()) {
        toast.error('Please enter a course title');
        return;
      }
      if (!formData.category.trim()) {
        toast.error('Please enter a course category');
        return;
      }
      if (formData.modules.length === 0) {
        toast.error('Please add at least one module');
        return;
      }

      if (course) {
        await coursesAPI.update(course._id, formData);
        toast.success('Course updated successfully!');
      } else {
        await coursesAPI.create(formData);
        toast.success('Course created successfully!');
      }
      onSave();
    } catch (err) {
      toast.error((err as Error).message || 'Failed to save course');
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
          {course ? 'Update Course' : 'Create Course'}
        </Button>
      </div>

      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 space-y-6">
        <h2 className="text-2xl font-bold text-white">{course ? 'Edit Course' : 'Create New Course'}</h2>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-white mb-2 block">Course Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter course title"
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <Label className="text-white mb-2 block">Category *</Label>
            <Input
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Programming, Design"
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
        </div>

        <div>
          <Label className="text-white mb-2 block">Description *</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter course description"
            className="bg-white/10 border-white/20 text-white min-h-[100px]"
          />
        </div>

        <div>
          <Label className="text-white mb-2 block">Course Thumbnail URL</Label>
          <div className="flex gap-3">
            <Input
              value={formData.thumbnail}
              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="bg-white/10 border-white/20 text-white flex-1"
            />
            {formData.thumbnail && (
              <div className="w-20 h-20 bg-white/10 rounded-lg overflow-hidden flex-shrink-0 border border-white/20">
                <img 
                  src={formData.thumbnail} 
                  alt="Course thumbnail" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
          <p className="text-indigo-400 text-xs mt-1">Enter an image URL for the course thumbnail (PNG, JPG, etc.)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-white mb-2 block">Level</Label>
            <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/20">
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-white mb-2 block">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/20">
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Modules & Lessons */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Course Content</h3>
            <Button onClick={handleAddModule} className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30">
              <Plus className="w-4 h-4 mr-2" />
              Add Module
            </Button>
          </div>

          {formData.modules.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
              <GripVertical className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
              <p className="text-indigo-300 mb-2">No modules yet</p>
              <p className="text-indigo-400 text-sm">Click "Add Module" to create your first module</p>
            </div>
          ) : (
            <div className="space-y-6">
              {formData.modules.map((module: Module, moduleIndex: number) => (
                <div key={moduleIndex} className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                  {/* Module Header */}
                  <div className="bg-white/10 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-5 h-5 text-indigo-400" />
                      <span className="text-indigo-300 font-medium">Module {module.order}</span>
                    </div>
                    <Button
                      onClick={() => handleDeleteModule(moduleIndex)}
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Module Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        value={module.title}
                        onChange={(e) => {
                          const updated = [...formData.modules];
                          updated[moduleIndex].title = e.target.value;
                          setFormData({ ...formData, modules: updated });
                        }}
                        placeholder="Module title"
                        className="bg-white/10 border-white/20 text-white"
                      />
                      <Input
                        value={module.description}
                        onChange={(e) => {
                          const updated = [...formData.modules];
                          updated[moduleIndex].description = e.target.value;
                          setFormData({ ...formData, modules: updated });
                        }}
                        placeholder="Module description (optional)"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    {/* Lessons */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-indigo-300 text-sm font-medium">Lessons</span>
                        <Button
                          onClick={() => handleAddLesson(moduleIndex)}
                          variant="ghost"
                          size="sm"
                          className="text-indigo-300 hover:text-white"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Lesson
                        </Button>
                      </div>

                      {module.lessons.length === 0 ? (
                        <p className="text-indigo-400 text-sm text-center py-4">No lessons in this module</p>
                      ) : (
                        <div className="space-y-3 ml-4">
                          {module.lessons.map((lesson: Lesson, lessonIndex: number) => (
                            <div key={lessonIndex} className="bg-white/5 rounded-lg p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {getLessonIcon(lesson.type)}
                                  <span className="text-indigo-300 text-sm">Lesson {lesson.order}</span>
                                </div>
                                <Button
                                  onClick={() => handleDeleteLesson(moduleIndex, lessonIndex)}
                                  variant="ghost"
                                  size="icon"
                                  className="w-6 h-6 text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Input
                                  value={lesson.title}
                                  onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'title', e.target.value)}
                                  placeholder="Lesson title"
                                  className="bg-white/10 border-white/20 text-white text-sm"
                                />
                                <Select
                                  value={lesson.type}
                                  onValueChange={(value) => updateLesson(moduleIndex, lessonIndex, 'type', value)}
                                >
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white text-sm h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-900 border-white/20">
                                    <SelectItem value="Video">
                                      <div className="flex items-center gap-2">
                                        <Video className="w-4 h-4" /> Video
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="PDF">
                                      <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> PDF Document
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="Link">
                                      <div className="flex items-center gap-2">
                                        <LinkIcon className="w-4 h-4" /> External Link
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="Text">
                                      <div className="flex items-center gap-2">
                                        <Type className="w-4 h-4" /> Text Content
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Input
                                  type="number"
                                  value={lesson.duration}
                                  onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'duration', parseInt(e.target.value) || 0)}
                                  placeholder="Duration (minutes)"
                                  className="bg-white/10 border-white/20 text-white text-sm h-8"
                                />
                                <div className="relative">
                                  <Input
                                    value={lesson.content}
                                    onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'content', e.target.value)}
                                    placeholder={lessonTypeHints[lesson.type]?.placeholder || 'Enter content URL or text'}
                                    className="bg-white/10 border-white/20 text-white text-sm h-8 pr-20"
                                  />
                                  {lesson.type === 'Video' && lesson.content && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-400">
                                      {getYouTubeVideoId(lesson.content) ? '✓ Valid' : '✗ Invalid'}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Content type hint */}
                              {lesson.content && lesson.type === 'Video' && !isYouTubeUrl(lesson.content) && (
                                <p className="text-yellow-400 text-xs">Please enter a valid YouTube URL</p>
                              )}
                              {lesson.content && lesson.type === 'PDF' && !isPdfUrl(lesson.content) && (
                                <p className="text-yellow-400 text-xs">URL must end with .pdf</p>
                              )}

                              <Textarea
                                value={lesson.description}
                                onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'description', e.target.value)}
                                placeholder="Lesson description (optional)"
                                className="bg-white/10 border-white/20 text-white text-sm min-h-[60px]"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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

