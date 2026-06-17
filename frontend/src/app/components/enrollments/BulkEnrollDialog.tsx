import React, { useState, useEffect } from 'react';
import { Users, BookOpen, Check, Loader2 } from 'lucide-react';
import { enrollmentsAPI } from '../../../services/enrollmentsAPI';
import { coursesAPI, usersAPI } from '../../../services/api';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '../ui/dialog';

// User interface
interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

// Course interface
interface Course {
  _id: string;
  title: string;
  category: string;
}

interface BulkEnrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function BulkEnrollDialog({ open, onOpenChange, onSuccess }: BulkEnrollDialogProps) {
  const [step, setStep] = useState<'courses' | 'users' | 'confirm'>('courses');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchUsers, setSearchUsers] = useState('');

  useEffect(() => {
    if (open) {
      fetchCourses();
      fetchUsers();
      // Reset state when dialog opens
      setStep('courses');
      setSelectedCourses([]);
      setSelectedUsers([]);
    }
  }, [open]);

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.getAll({ status: 'Published' });
      setCourses(response.courses || []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      toast.error('Failed to load courses');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      // Only show learners and trainers for enrollment
      const filteredUsers = (response.users || []).filter(
        (u: User) => u.role === 'Learner' || u.role === 'Trainer'
      );
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error('Failed to load users');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
    user.email.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const handleBulkEnroll = async () => {
    if (selectedCourses.length === 0 || selectedUsers.length === 0) {
      toast.error('Please select at least one course and one user');
      return;
    }

    setLoading(true);
    try {
      await enrollmentsAPI.bulkEnroll({
        userIds: selectedUsers,
        courseIds: selectedCourses
      });

      toast.success(`Successfully enrolled ${selectedUsers.length} user(s) in ${selectedCourses.length} course(s)`);
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to enroll users');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCourseNames = () => {
    return courses
      .filter((c: Course) => selectedCourses.includes(c._id))
      .map((c: Course) => c.title);
  };

  const getSelectedUserNames = () => {
    return users
      .filter((u: User) => selectedUsers.includes(u._id))
      .map((u: User) => u.name);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Learner':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Trainer':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-white/20 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Bulk Enroll Users
          </DialogTitle>
          <DialogDescription className="text-indigo-300">
            Enroll multiple users in one or more courses at once.
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 my-4">
          <div className={`flex items-center gap-2 ${step === 'courses' ? 'text-indigo-400' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'courses' ? 'bg-indigo-500' :
              step === 'users' ? 'bg-green-500' : 'bg-green-500'
            }`}>
              {step === 'courses' ? (
                <BookOpen className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </div>
            <span className="text-sm font-medium">Select Courses</span>
          </div>

          <div className="w-16 h-0.5 bg-white/20" />

          <div className={`flex items-center gap-2 ${step === 'users' ? 'text-indigo-400' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'users' ? 'bg-indigo-500' :
              step === 'confirm' ? 'bg-green-500' : 'bg-white/10'
            }`}>
              {step === 'confirm' ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="text-sm font-medium">2</span>
              )}
            </div>
            <span className="text-sm font-medium">Select Users</span>
          </div>

          <div className="w-16 h-0.5 bg-white/20" />

          <div className={`flex items-center gap-2 ${step === 'confirm' ? 'text-indigo-400' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'confirm' ? 'bg-indigo-500' : 'bg-white/10'
            }`}>
              <span className="text-sm font-medium">3</span>
            </div>
            <span className="text-sm font-medium">Confirm</span>
          </div>
        </div>

        {/* Step 1: Select Courses */}
        {step === 'courses' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-white font-medium mb-2">Select Courses ({selectedCourses.length} selected)</h4>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {courses.length === 0 ? (
                  <p className="text-indigo-300 text-center py-8">No published courses available</p>
                ) : (
                  courses.map((course: Course) => (
                    <div
                      key={course._id}
                      onClick={() => toggleCourse(course._id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedCourses.includes(course._id)
                          ? 'bg-indigo-500/20 border-indigo-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedCourses.includes(course._id)}
                            onCheckedChange={() => toggleCourse(course._id)}
                            className="border-indigo-400 data-[state=checked]:bg-indigo-500"
                          />
                          <div>
                            <p className="text-white font-medium">{course.title}</p>
                            <Badge variant="outline" className={`text-xs mt-1 ${getRoleColor(course.category)}`}>
                              {course.category}
                            </Badge>
                          </div>
                        </div>
                        {selectedCourses.includes(course._id) && (
                          <Check className="w-5 h-5 text-indigo-400" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setStep('users')}
                disabled={selectedCourses.length === 0}
                className="bg-gradient-to-r from-indigo-500 to-purple-600"
              >
                Next: Select Users
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2: Select Users */}
        {step === 'users' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-medium">Select Users ({selectedUsers.length} selected)</h4>
              </div>
              <Input
                type="search"
                placeholder="Search by name or email..."
                value={searchUsers}
                onChange={(e) => setSearchUsers(e.target.value)}
                className="mb-3 bg-white/10 border-white/20 text-white placeholder:text-indigo-400"
              />

              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="text-indigo-300 text-center py-8">No users found</p>
                ) : (
                  filteredUsers.map((user: User) => (
                    <div
                      key={user._id}
                      onClick={() => toggleUser(user._id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedUsers.includes(user._id)
                          ? 'bg-indigo-500/20 border-indigo-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedUsers.includes(user._id)}
                            onCheckedChange={() => toggleUser(user._id)}
                            className="border-indigo-400 data-[state=checked]:bg-indigo-500"
                          />
                          <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{user.name}</p>
                            <p className="text-indigo-300 text-sm">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${getRoleColor(user.role)}`}>
                            {user.role}
                          </Badge>
                          {selectedUsers.includes(user._id) && (
                            <Check className="w-5 h-5 text-indigo-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep('courses')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                disabled={selectedUsers.length === 0}
                className="bg-gradient-to-r from-indigo-500 to-purple-600"
              >
                Next: Confirm
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 className="text-white font-medium mb-3">Summary</h4>

              <div className="space-y-3">
                <div>
                  <p className="text-indigo-300 text-sm mb-1">Courses ({selectedCourses.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {getSelectedCourseNames().map((name: string, i: number) => (
                      <Badge key={i} className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-indigo-300 text-sm mb-1">Users ({selectedUsers.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {getSelectedUserNames().slice(0, 5).map((name: string, i: number) => (
                      <Badge key={i} className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        {name}
                      </Badge>
                    ))}
                    {getSelectedUserNames().length > 5 && (
                      <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">
                        +{getSelectedUserNames().length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-indigo-300 text-sm text-center">
              {selectedUsers.length} user(s) will be enrolled in {selectedCourses.length} course(s)
            </p>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep('users')}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Back
              </Button>
              <Button
                onClick={handleBulkEnroll}
                disabled={loading}
                className="bg-gradient-to-r from-indigo-500 to-purple-600"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirm Enrollment
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
