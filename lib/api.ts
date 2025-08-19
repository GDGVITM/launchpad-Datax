// lib/api.ts
const API_BASE_URL = typeof window !== 'undefined' 
  ? (window as any).process?.env?.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
  : 'http://localhost:5000/api';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  timestamp: string;
}

// Statistics API response types
interface LogStats {
  total: number;
  trend: number;
  recent: number;
}

interface ThreatStats {
  total: number;
  active: number;
  trend: number;
  critical: number;
}

interface AlertStats {
  total: number;
  critical: number;
  trend: number;
  resolved: number;
}

interface DashboardStatsResponse {
  logs: LogStats;
  threats: ThreatStats;
  alerts: AlertStats;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        // Handle token expiration
        if (response.status === 401 && this.token) {
          await this.refreshToken();
          // Retry the original request
          return this.request(endpoint, options);
        }
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refresh_token') 
      : null;

    if (!refreshToken) {
      this.clearToken();
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      this.setToken(data.data.tokens.accessToken);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', data.data.tokens.refreshToken);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearToken();
      throw error;
    }
  }

  // Authentication methods
  async login(credentials: { email: string; password: string } | { walletAddress: string; signature: string }) {
    const response = await this.request<{
      user: any;
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.setToken(response.data.tokens.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', response.data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }

    return response;
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
    organizationId: string;
    role?: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refresh_token') 
      : null;

    if (refreshToken) {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    }

    this.clearToken();
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(profileData: any) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Logs methods
  async getLogs(params?: {
    page?: number;
    limit?: number;
    eventType?: string;
    severity?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async createLog(logData: {
    eventType: string;
    severity: string;
    message: string;
    source: string;
    details?: any;
    affectedResource?: string;
    riskScore?: number;
  }) {
    return this.request('/logs', {
      method: 'POST',
      body: JSON.stringify(logData),
    });
  }

  async getLogById(id: string) {
    return this.request(`/logs/${id}`);
  }

  async verifyLog(id: string) {
    return this.request(`/logs/${id}/verify`, {
      method: 'POST',
    });
  }

  async anchorLog(id: string) {
    return this.request(`/logs/${id}/anchor`, {
      method: 'POST',
    });
  }

  async getLogStats(params?: any) {
    const queryParams = new URLSearchParams(params);
    return this.request(`/logs/stats?${queryParams.toString()}`);
  }

  // Threats methods
  async getThreats(params?: {
    page?: number;
    limit?: number;
    threatType?: string;
    severity?: string;
    status?: string;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/threats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async createThreat(threatData: any) {
    return this.request('/threats', {
      method: 'POST',
      body: JSON.stringify(threatData),
    });
  }

  async updateThreatStatus(id: string, status: string, resolutionNotes?: string) {
    return this.request(`/threats/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, resolutionNotes }),
    });
  }

  async getThreatStats() {
    return this.request('/threats/stats');
  }

  async getThreatTrends(period = '7d') {
    return this.request(`/threats/trends?period=${period}`);
  }

  // Alerts methods
  async getAlerts(params?: {
    page?: number;
    limit?: number;
    alertType?: string;
    severity?: string;
    status?: string;
    isAcknowledged?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/alerts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request(endpoint);
  }

  async createAlert(alertData: any) {
    return this.request('/alerts', {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
  }

  async updateAlertStatus(id: string, status: string, resolutionNotes?: string) {
    return this.request(`/alerts/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, resolutionNotes }),
    });
  }

  async acknowledgeAlert(id: string) {
    return this.request(`/alerts/${id}/acknowledge`, {
      method: 'PUT',
    });
  }

  async getAlertStats() {
    return this.request('/alerts/stats');
  }

  // Users methods
  async getUsers(params?: any) {
    const queryParams = new URLSearchParams(params);
    return this.request(`/users?${queryParams.toString()}`);
  }

  async createUser(userData: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // System methods
  async getHealthStatus() {
    return this.request('/health');
  }

  async getSystemStatus() {
    return this.request('/status');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
