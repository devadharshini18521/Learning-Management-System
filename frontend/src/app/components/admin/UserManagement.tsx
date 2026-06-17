import { useState, useEffect } from 'react';
import { usersAPI, ROLE_OPTIONS } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import  {usePermission}  from '../../../hooks/usePermission';
import { Users, Plus, Search, Edit, Trash2, X, Shield, Info, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

// Role information with descriptions
const ROLE_INFO = {
  'Super Admin': {
    label: 'Super Admin',
    color: 'bg-red-500/20 text-red-300 border-red-500/30',
    icon: '👑',
    description: 'Full system control - all permissions'
  },
  'Admin': {
    label: 'Admin',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    icon: '⚡',
    description: 'System administration with user management'
  },
  'HR': {
    label: 'HR',
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    icon: '👥',
    description: 'User management and reporting'
  },
  'Trainer': {
    label: 'Trainer',
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: '📚',
    description: 'Course and assessment management'
  },
  'Learner': {
    label: 'Learner',
    color: 'bg-green-500/20 text-green-300 border-green-500/30',
    icon: '🎓',
    description: 'Course consumption and assessments'
  }
};

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  enrolledCourses?: Array<unknown>;
  department?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  role: string;
  department: string;
  status: string;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { can, isAuthenticated, role: currentUserRole } = usePermission();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    role: 'Learner',
    department: '',
    status: 'Active'
  });

  // Check permissions
  const canCreateUsers = isAuthenticated && can('users:create');
  const canUpdateUsers = isAuthenticated && can('users:update');
  const canDeleteUsers = isAuthenticated && can('users:delete');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      setUsers(response.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingUser) {
        // Update existing user - remove password if it's empty
        const updateData = { ...formData };
        if (!updateData.password) {
          delete (updateData as Record<string, unknown>).password;
        }
        await usersAPI.update(editingUser._id, updateData);
        toast.success('User updated successfully');
      } else {
        // Create new user
        await usersAPI.create(formData);
        toast.success('User created successfully');
      }
      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'Learner',
        department: '',
        status: 'Active'
      });
      fetchUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : `Failed to ${editingUser ? 'update' : 'create'} user`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDeleteUsers) {
      toast.error('You do not have permission to delete users');
      return;
    }

    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await usersAPI.delete(id);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete user');
      }
    }
  };

  const handleEdit = (user: User) => {
    if (!canUpdateUsers) {
      toast.error('You do not have permission to edit users');
      return;
    }
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Password is optional when editing
      role: user.role,
      department: user.department || '',
      status: user.status
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      // Reset form when dialog closes
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'Learner',
        department: '',
        status: 'Active'
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get role badge component
  const RoleBadge = ({ role }: { role: string }) => {
    const roleData = ROLE_INFO[role as keyof typeof ROLE_INFO];
    if (!roleData) {
      return (
        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-500/20 text-gray-300">
          {role}
        </span>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`px-2 py-1 rounded-lg text-xs font-medium border cursor-help ${roleData.color}`}>
              <span className="mr-1">{roleData.icon}</span>
              {roleData.label}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{roleData.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

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
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-5 w-16 bg-white/10 rounded animate-pulse" />
          ))}
        </div>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex gap-4 pb-3 border-b border-white/10">
                <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-16 bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-20 ml-auto bg-white/10 rounded animate-pulse" />
              </div>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-4 py-2">
                  <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
                  <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
                  <div className="h-6 w-20 bg-white/10 rounded animate-pulse" />
                  <div className="h-6 w-16 bg-white/10 rounded animate-pulse" />
                  <div className="h-6 w-16 bg-white/10 rounded animate-pulse" />
                  <div className="flex gap-2 ml-auto">
                    <div className="h-8 w-8 bg-white/10 rounded animate-pulse" />
                    <div className="h-8 w-8 bg-white/10 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-indigo-300 mt-1">Manage system users and roles</p>
        </div>
        {canCreateUsers && (
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300" />
        <Input
          type="search"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-11 bg-white/10 border-white/20 text-white placeholder:text-indigo-300"
        />
      </div>

      {/* Role Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(ROLE_INFO).map(([key, value]) => (
          <div key={key} className="flex items-center gap-1 text-xs text-indigo-300">
            <span>{value.icon}</span>
            <span>{value.label}</span>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-indigo-300">Name</TableHead>
              <TableHead className="text-indigo-300">Email</TableHead>
              <TableHead className="text-indigo-300">Role</TableHead>
              <TableHead className="text-indigo-300">Status</TableHead>
              <TableHead className="text-indigo-300">Enrolled Courses</TableHead>
              <TableHead className="text-indigo-300 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user._id} className="border-white/10 hover:bg-white/5">
                <TableCell className="text-white font-medium">{user.name}</TableCell>
                <TableCell className="text-indigo-200">{user.email}</TableCell>
                <TableCell>
                  <RoleBadge role={user.role} />
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    user.status === 'Active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {user.status}
                  </span>
                </TableCell>
                <TableCell className="text-indigo-200">{user.enrolledCourses?.length || 0}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {canUpdateUsers && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(user)}
                        className="text-indigo-300 hover:text-white hover:bg-white/10"
                        disabled={user.role === 'Super Admin' && currentUserRole !== 'Super Admin'}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {canDeleteUsers && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(user._id)}
                        className="text-red-300 hover:text-red-200 hover:bg-red-500/10"
                        disabled={user.role === 'Super Admin'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="bg-slate-900 border-white/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-indigo-300">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter full name"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-indigo-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-indigo-300">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-indigo-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-indigo-300">
                Password {editingUser && '(leave blank to keep current)'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={editingUser ? 'Enter new password (optional)' : 'Enter password'}
                  minLength={editingUser ? 0 : 6}
                  className="bg-white/10 border-white/20 text-white placeholder:text-indigo-400 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-indigo-300">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => handleSelectChange('role', value)}
                  disabled={!canCreateUsers && !canUpdateUsers}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20 text-white">
                    {ROLE_OPTIONS.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {ROLE_INFO[role.value as keyof typeof ROLE_INFO]?.icon} {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-indigo-300">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20 text-white">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Deactivated">Deactivated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department" className="text-indigo-300">Department (Optional)</Label>
              <Input
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="Enter department"
                className="bg-white/10 border-white/20 text-white placeholder:text-indigo-400"
              />
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-indigo-500 to-purple-600"
              >
                {isSubmitting ? (editingUser ? 'Updating...' : 'Creating...') : (editingUser ? 'Update User' : 'Create User')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
