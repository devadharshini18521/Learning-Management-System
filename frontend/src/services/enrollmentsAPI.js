// Enrollment Management API Service
// Handles all enrollment-related API calls to the backend

import { apiRequest } from './api';

// Enrollment API methods
export const enrollmentsAPI = {
  getAll: (query = {}) => {
    const params = new URLSearchParams(query);
    return apiRequest(`/enrollments?${params}`);
  },

  getStats: () => apiRequest('/enrollments/stats'),

  getUserEnrollments: (userId) =>
    apiRequest(`/enrollments/user/${userId}`),

  getCourseEnrollments: (courseId, query = {}) => {
    const params = new URLSearchParams(query);
    return apiRequest(`/enrollments/course/${courseId}?${params}`);
  },

  bulkEnroll: (data) =>
    apiRequest('/enrollments/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  enroll: (data) =>
    apiRequest('/enrollments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (userId, courseId, data) =>
    apiRequest(`/enrollments/${userId}/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  remove: (userId, courseId) =>
    apiRequest(`/enrollments/${userId}/${courseId}`, {
      method: 'DELETE',
    }),
};

export default enrollmentsAPI;