const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "https://learningmanagementsystem-0x2r.onrender.com/api");

// Log API URL in development
if (import.meta.env.DEV) {
  console.log('🔗 API URL:', API_URL);
  console.log('⚠️ Using LOCAL backend - Make sure backend is running on port 5000');
}

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 403) {
        throw new Error('Permission denied. You may not have access to this resource.');
      }
      if (response.status === 401) {
        throw new Error('Unauthorized. Please log in again.');
      }
      throw new Error(data.message || `API request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    // Provide more helpful error messages
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('🚫 CORS or Network Error:', error);
      throw new Error('Failed to connect to server. Please check your internet connection and ensure the backend is running.');
    }
    
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  
  getMe: () => apiRequest('/auth/me'),
  
  forgotPassword: (email) => apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),
  
  resetPassword: (token, password) => apiRequest(`/auth/reset-password/${token}`, {
    method: 'PUT',
    body: JSON.stringify({ password })
  })
};

// Users API
export const usersAPI = {
  getAll: () => apiRequest('/users'),
  getOne: (id) => apiRequest(`/users/${id}`),
  create: (userData) => apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  update: (id, userData) => apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData)
  }),
  delete: (id) => apiRequest(`/users/${id}`, { method: 'DELETE' }),
  updateProfile: (profileData) => apiRequest('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  }),
  changePassword: (passwordData) => apiRequest('/users/change-password', {
    method: 'PUT',
    body: JSON.stringify(passwordData)
  })
};

// Role options for user management
export const ROLE_OPTIONS = [
  { value: 'Super Admin', label: 'Super Admin' },
  { value: 'Admin', label: 'Admin' },
  { value: 'HR', label: 'HR' },
  { value: 'Trainer', label: 'Trainer' },
  { value: 'Learner', label: 'Learner' }
];

// Courses API
export const coursesAPI = {
  getAll: (query = {}) => {
    const params = new URLSearchParams(query);
    return apiRequest(`/courses?${params}`);
  },
  getOne: (id) => apiRequest(`/courses/${id}`),
  create: (courseData) => apiRequest('/courses', {
    method: 'POST',
    body: JSON.stringify(courseData)
  }),
  update: (id, courseData) => apiRequest(`/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(courseData)
  }),
  delete: (id) => apiRequest(`/courses/${id}`, { method: 'DELETE' }),
  enroll: (id) => apiRequest(`/courses/${id}/enroll`, { method: 'POST' }),
  unenroll: (id) => apiRequest(`/courses/${id}/unenroll`, { method: 'POST' }),
  updateProgress: (id, data) => apiRequest(`/courses/${id}/progress`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  completeLesson: (id, lessonId) => apiRequest(`/courses/${id}/complete-lesson`, {
    method: 'POST',
    body: JSON.stringify({ lessonId })
  }),
  completeCourse: (id) => apiRequest(`/courses/${id}/complete`, { method: 'POST' })
};

// Assessments API
export const assessmentsAPI = {
  getAll: (query = {}) => {
    const params = new URLSearchParams(query);
    return apiRequest(`/assessments?${params}`);
  },
  getOne: (id) => apiRequest(`/assessments/${id}`),
  getWithCourse: (id) => apiRequest(`/assessments/${id}/with-course`),
  create: (data) => apiRequest('/assessments', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/assessments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/assessments/${id}`, { method: 'DELETE' }),
  submit: (id, answers, timeTaken) => apiRequest(`/assessments/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers, timeTaken })
  }),
  getResults: (id) => apiRequest(`/assessments/${id}/results`),
  getMyResults: () => apiRequest('/assessments/my-results')
};

// Knowledge Base API
export const knowledgeAPI = {
  getAll: (query = {}) => {
    const params = new URLSearchParams(query);
    return apiRequest(`/knowledge?${params}`);
  },
  getOne: (id) => apiRequest(`/knowledge/${id}`),
  create: (data) => apiRequest('/knowledge', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/knowledge/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/knowledge/${id}`, { method: 'DELETE' })
};

// Certificates API
export const certificatesAPI = {
  getAll: () => apiRequest('/certificates'),
  getOne: (id) => apiRequest(`/certificates/${id}`),
  generate: (courseId) => apiRequest('/certificates/generate', {
    method: 'POST',
    body: JSON.stringify({ courseId })
  }),
  download: async (id) => {
    const token = getToken();
    const response = await fetch(`${API_URL}/certificates/${id}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Not authorized to download this certificate');
      }
      throw new Error('Failed to download certificate');
    }
    
    // Check if response is PDF or HTML
    const contentType = response.headers.get('content-type');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // Get filename from header
    const contentDisposition = response.headers.get('content-disposition');
    let filename = `certificate-${id}.pdf`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match) {
        filename = match[1];
      }
    }
    
    // If HTML response (fallback when Chrome not installed), open in new tab
    if (contentType && contentType.includes('text/html')) {
      // Open HTML in new tab for printing
      const htmlUrl = window.URL.createObjectURL(new Blob([await blob.text()], { type: 'text/html' }));
      window.open(htmlUrl, '_blank');
      window.URL.revokeObjectURL(url);
      return { success: true, filename, type: 'html' };
    }
    
    // For PDF, trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    return { success: true, filename, type: 'pdf' };
  }
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => apiRequest('/analytics/dashboard'),
  getLearner: () => apiRequest('/analytics/learner'),
  getCourse: (id) => apiRequest(`/analytics/course/${id}`),
  getEnrollmentTrends: (period = '6months') => apiRequest(`/analytics/enrollment-trends?period=${period}`),
  export: async (type) => {
    const token = getToken();
    const response = await fetch(`${API_URL}/analytics/export?type=${type}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 403) {
        throw new Error('Permission denied. You need analytics:export permission to export reports.');
      }
      if (response.status === 401) {
        throw new Error('Unauthorized. Please log in again.');
      }
      
      // Try to get error message from response
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Export failed: ${response.statusText}`);
      } catch (e) {
        throw new Error(`Failed to export data: ${response.status} ${response.statusText}`);
      }
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
};

// Settings API
export const settingsAPI = {
  get: () => apiRequest('/settings'),
  update: (data) => apiRequest('/settings', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
};

// Notifications API
export const notificationsAPI = {
  getAll: () => apiRequest('/notifications'),
  getUnreadCount: () => apiRequest('/notifications/unread-count'),
  markAsRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead: () => apiRequest('/notifications/read-all', { method: 'PUT' }),
  delete: (id) => apiRequest(`/notifications/${id}`, { method: 'DELETE' })
};

// Export apiRequest for use by other API modules
export { apiRequest };
