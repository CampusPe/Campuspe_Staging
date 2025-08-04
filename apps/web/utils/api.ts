import axios from 'axios';

// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login on auth errors
      localStorage.removeItem('token');
      localStorage.removeItem('profileData');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  VERIFY_OTP: '/api/auth/verify-otp',
  SEND_OTP: '/api/auth/send-otp',
  CHECK_EMAIL: '/api/auth/check-email',
  CHECK_PHONE: '/api/auth/check-phone',

  // Students
  STUDENT_PROFILE: '/api/students/profile',
  STUDENT_UPDATE: (id: string) => `/api/students/${id}`,
  STUDENT_UPDATE_PROFILE: (id: string) => `/api/students/${id}/profile`,
  STUDENT_JOB_MATCHES: '/api/students/job-matches',
  STUDENT_ANALYZE_RESUME: '/api/students/analyze-resume-ai',
  STUDENT_BY_USER_ID: (userId: string) => `/api/students/user/${userId}`,

  // Jobs
  JOBS: '/api/jobs',
  JOB_BY_ID: (id: string) => `/api/jobs/${id}`,
  JOB_APPLY: (id: string) => `/api/jobs/${id}/apply`,
  JOB_CREATE: '/api/jobs',

  // Colleges
  COLLEGES: '/api/colleges',
  COLLEGE_BY_USER_ID: (userId: string) => `/api/colleges/user/${userId}`,

  // Notifications
  NOTIFICATIONS: '/api/notifications',

  // Health check
  HEALTH: '/health',
};

export default apiClient;
