// Type declarations for api.js module

export interface Settings {
  organization: {
    name: string;
    logo: string | null;
    favicon: string | null;
    primaryColor: string;
    secondaryColor: string;
  };
  email: {
    fromName: string;
    fromEmail: string;
    enableNotifications: boolean;
  };
  features: {
    enableCertificates: boolean;
    enableKnowledgeBase: boolean;
    enableAssessments: boolean;
    enableDiscussions: boolean;
  };
  security: {
    passwordMinLength: number;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  learningPolicies: {
    requireCourseApproval: boolean;
    allowSelfEnrollment: boolean;
    defaultCourseVisibility: string;
    certificateValidity: number;
    requireAssessmentPassing: boolean;
    assessmentPassingScore: number;
    enableGamification: boolean;
    showLeaderboard: boolean;
  };
}

export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  settings?: T;
  [key: string]: any;
}

export const settingsAPI: {
  get: () => Promise<APIResponse<Settings>>;
  update: (data: Settings) => Promise<APIResponse<Settings>>;
};

export const authAPI: {
  login: (credentials: any) => Promise<any>;
  register: (userData: any) => Promise<any>;
  getMe: () => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (token: string, password: string) => Promise<any>;
};

export const usersAPI: {
  getAll: () => Promise<any>;
  getOne: (id: string) => Promise<any>;
  create: (userData: any) => Promise<any>;
  update: (id: string, userData: any) => Promise<any>;
  delete: (id: string) => Promise<any>;
  updateProfile: (profileData: any) => Promise<any>;
  changePassword: (passwordData: any) => Promise<any>;
};

export const coursesAPI: {
  getAll: (query?: any) => Promise<any>;
  getOne: (id: string) => Promise<any>;
  create: (courseData: any) => Promise<any>;
  update: (id: string, courseData: any) => Promise<any>;
  delete: (id: string) => Promise<any>;
  enroll: (id: string) => Promise<any>;
  unenroll: (id: string) => Promise<any>;
  updateProgress: (id: string, data: any) => Promise<any>;
  completeLesson: (id: string, lessonId: string) => Promise<any>;
  completeCourse: (id: string) => Promise<any>;
};

export const assessmentsAPI: {
  getAll: (query?: any) => Promise<any>;
  getOne: (id: string) => Promise<any>;
  getWithCourse: (id: string) => Promise<any>;
  create: (data: any) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
  delete: (id: string) => Promise<any>;
  submit: (id: string, answers: any, timeTaken: number) => Promise<any>;
  getResults: (id: string) => Promise<any>;
  getMyResults: () => Promise<any>;
};

export const knowledgeAPI: {
  getAll: (query?: any) => Promise<any>;
  getOne: (id: string) => Promise<any>;
  create: (data: any) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
  delete: (id: string) => Promise<any>;
};

export const certificatesAPI: {
  getAll: () => Promise<any>;
  getOne: (id: string) => Promise<any>;
  generate: (courseId: string) => Promise<any>;
  download: (id: string) => Promise<any>;
};

export const analyticsAPI: {
  getDashboard: () => Promise<any>;
  getLearner: () => Promise<any>;
  getCourse: (id: string) => Promise<any>;
  getEnrollmentTrends: (period?: string) => Promise<any>;
  export: (type: string) => Promise<any>;
};

export const notificationsAPI: {
  getAll: () => Promise<any>;
  getUnreadCount: () => Promise<any>;
  markAsRead: (id: string) => Promise<any>;
  markAllAsRead: () => Promise<any>;
  delete: (id: string) => Promise<any>;
};

export const ROLE_OPTIONS: Array<{ value: string; label: string }>;
