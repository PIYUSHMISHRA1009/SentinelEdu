import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('access_token', token);
  }

  getToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('access_token');
    }
    return this.accessToken;
  }

  clearToken() {
    this.accessToken = null;
    localStorage.removeItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    this.setToken(response.data.access_token);
    return response.data;
  }

  async register(data: { email: string; password: string; full_name: string; role: string; department?: string }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async getMe() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Class endpoints
  async getClasses(params?: { department?: string; semester?: number }) {
    const response = await this.client.get('/classes', { params });
    return response.data;
  }

  async getClass(id: number) {
    const response = await this.client.get(`/classes/${id}`);
    return response.data;
  }

  async createClass(data: { code: string; name: string; department: string; semester: number; credits: number; teacher_id: number }) {
    const response = await this.client.post('/classes', data);
    return response.data;
  }

  async getClassStudents(classId: number) {
    const response = await this.client.get(`/classes/${classId}/students`);
    return response.data;
  }

  // Grade endpoints
  async getGrades(params?: { student_id?: number; class_id?: number }) {
    const response = await this.client.get('/grades', { params });
    return response.data;
  }

  async getStudentClassGrades(studentId: number, classId: number) {
    const response = await this.client.get(`/grades/student/${studentId}/class/${classId}`);
    return response.data;
  }

  async getStudentGradeSummary(studentId: number, classId?: number) {
    const response = await this.client.get(`/grades/student/${studentId}/summary`, { params: { class_id: classId } });
    return response.data;
  }

  async createGrade(data: { student_id: number; class_id: number; assignment_name: string; score: number; max_score?: number; weight?: number }) {
    const response = await this.client.post('/grades', data);
    return response.data;
  }

  // Attendance endpoints
  async getAttendance(params?: { student_id?: number; class_id?: number; start_date?: string; end_date?: string }) {
    const response = await this.client.get('/attendance', { params });
    return response.data;
  }

  async getAttendanceSummary(studentId: number, classId: number) {
    const response = await this.client.get(`/attendance/student/${studentId}/class/${classId}/summary`);
    return response.data;
  }

  async getClassAttendanceSummary(classId: number) {
    const response = await this.client.get(`/attendance/class/${classId}/summary`);
    return response.data;
  }

  async recordAttendance(data: { student_id: number; class_id: number; date: string; status: string }) {
    const response = await this.client.post('/attendance', data);
    return response.data;
  }

  async bulkAttendance(data: { class_id: number; date: string; records: Array<{ student_id: number; status: string }> }) {
    const response = await this.client.post('/attendance/bulk', data);
    return response.data;
  }

  // Risk endpoints
  async assessAllStudents(classId?: number) {
    const response = await this.client.post('/risk/assess', null, { params: { class_id: classId } });
    return response.data;
  }

  async getStudentRisk(studentId: number, classId?: number) {
    const response = await this.client.get(`/risk/student/${studentId}`, { params: { class_id: classId } });
    return response.data;
  }

  async getStudentRiskHistory(studentId: number, classId?: number) {
    const response = await this.client.get(`/risk/student/${studentId}/history`, { params: { class_id: classId } });
    return response.data;
  }

  async getRiskDashboard(params?: { class_id?: number; department?: string; risk_level?: string }) {
    const response = await this.client.get('/risk/dashboard/summary', { params });
    return response.data;
  }

  async getStudentTrends(studentId: number, classId?: number) {
    const response = await this.client.get(`/risk/student/${studentId}/trends`, { params: { class_id: classId } });
    return response.data;
  }
}

export const api = new ApiClient();
export default api;