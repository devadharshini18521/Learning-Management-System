import { useState, useEffect } from 'react';
import { analyticsAPI } from '../../../services/api';
import { BarChart3, Download, TrendingUp, Users, BookOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Analytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [enrollmentData, setEnrollmentData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
    fetchEnrollmentTrends();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await analyticsAPI.getDashboard();
      setAnalytics(response.analytics);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      toast.error('Failed to load analytics');
    }
  };

  const fetchEnrollmentTrends = async () => {
    try {
      const response = await analyticsAPI.getEnrollmentTrends();
      if (response.enrollmentData && response.enrollmentData.length > 0) {
        setEnrollmentData(response.enrollmentData);
      } else {
        // Fallback to empty data if no enrollments yet
        setEnrollmentData([
          { name: 'Jan', enrollments: 0 },
          { name: 'Feb', enrollments: 0 },
          { name: 'Mar', enrollments: 0 },
          { name: 'Apr', enrollments: 0 },
          { name: 'May', enrollments: 0 },
          { name: 'Jun', enrollments: 0 }
        ]);
      }
    } catch (err) {
      console.error('Failed to fetch enrollment trends:', err);
      // Use empty data on error
      setEnrollmentData([
        { name: 'Jan', enrollments: 0 },
        { name: 'Feb', enrollments: 0 },
        { name: 'Mar', enrollments: 0 },
        { name: 'Apr', enrollments: 0 },
        { name: 'May', enrollments: 0 },
        { name: 'Jun', enrollments: 0 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: string) => {
    setExporting(type);
    try {
      await analyticsAPI.export(type);
      toast.success('Report downloaded successfully!');
    } catch (err) {
      toast.error('Failed to export data');
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-1" />
            <div className="h-4 w-64 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-28 bg-white/10 rounded animate-pulse" />
            <div className="h-10 w-32 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl animate-pulse" />
              </div>
              <div className="h-4 w-24 bg-white/10 rounded animate-pulse mb-2" />
              <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="h-6 w-32 bg-white/10 rounded animate-pulse mb-6" />
              <div className="h-64 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const overview = analytics?.overview || {};

  const completionData = [
    { name: 'Completed', value: overview.completedCourses || 0, color: '#10b981' },
    { name: 'In Progress', value: (overview.totalEnrollments || 0) - (overview.completedCourses || 0), color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
          <p className="text-indigo-300 mt-1">Comprehensive insights and reports</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => handleExport('users')} 
            variant="ghost" 
            className="text-indigo-300 hover:text-white hover:bg-white/10"
            disabled={exporting === 'users'}
          >
            {exporting === 'users' ? (
              <div className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {exporting === 'users' ? 'Exporting...' : 'Export Users'}
          </Button>
          <Button 
            onClick={() => handleExport('courses')} 
            variant="ghost" 
            className="text-indigo-300 hover:text-white hover:bg-white/10"
            disabled={exporting === 'courses'}
          >
            {exporting === 'courses' ? (
              <div className="w-4 h-4 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {exporting === 'courses' ? 'Exporting...' : 'Export Courses'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-indigo-300 text-sm mb-1">Total Users</p>
          <p className="text-white text-3xl font-bold">{overview.totalUsers || 0}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-indigo-300 text-sm mb-1">Total Courses</p>
          <p className="text-white text-3xl font-bold">{overview.totalCourses || 0}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-indigo-300 text-sm mb-1">Total Enrollments</p>
          <p className="text-white text-3xl font-bold">{overview.totalEnrollments || 0}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-indigo-300 text-sm mb-1">Completion Rate</p>
          <p className="text-white text-3xl font-bold">
            {overview.totalEnrollments ? Math.round((overview.completedCourses / overview.totalEnrollments) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Trend */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h3 className="text-xl font-bold text-white mb-6">Enrollment Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={enrollmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#a5b4fc" />
              <YAxis stroke="#a5b4fc" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 41, 59, 0.95)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px'
                }}
              />
              <Line type="monotone" dataKey="enrollments" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Course Completion */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h3 className="text-xl font-bold text-white mb-6">Course Completion</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={completionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {completionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 41, 59, 0.95)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            {completionData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-indigo-200 text-sm">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

