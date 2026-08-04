/**
 * Axios HTTP client with interceptors for authentication and error handling
 * Centralizes all API calls to backend services
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Resolve API base URL safely in both Vite and Jest environments without referencing import.meta directly
let viteBaseUrl: string | undefined;
try {
  // Use eval to avoid static parsing of import.meta in Jest's CJS environment
  // eslint-disable-next-line no-eval
  const meta: any = (0, eval)('import.meta');
  viteBaseUrl = meta?.env?.VITE_API_BASE_URL as string | undefined;
} catch {
  // Not running under Vite ESM
}
const API_BASE_URL =
  (typeof process !== 'undefined' ? process.env.VITE_API_BASE_URL : undefined) ||
  viteBaseUrl ||
  'http://localhost:8081/api';

// Create axios instance with default config
const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    const userRaw = localStorage.getItem('user_data');
    if (userRaw && config.headers) {
      try {
        const parsed = JSON.parse(userRaw) as { username?: string };
        if (parsed?.username) {
          config.headers['X-User'] = parsed.username;
        }
      } catch (parseError) {
        console.warn('Unable to parse stored user info', parseError);
      }
    }
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_data');
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Extract error message
    const errorMessage =
      (error.response?.data as { error?: string; message?: string })?.error ||
      (error.response?.data as { error?: string; message?: string })?.message ||
      error.message ||
      'An unexpected error occurred';

    return Promise.reject(new Error(errorMessage));
  }
);

export default axiosClient;

// Helper function to handle API errors
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};
