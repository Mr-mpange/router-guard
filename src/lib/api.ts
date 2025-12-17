// API configuration and utilities
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('netflow_token');
};

export const api = {
  baseURL: API_BASE_URL,
  
  // Helper function to make API calls
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Add auth token if available
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const config: RequestInit = {
      headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle authentication errors
      if (response.status === 401) {
        // Clear invalid token
        localStorage.removeItem('netflow_token');
        localStorage.removeItem('netflow_user');
        throw new Error('Authentication required. Please log in.');
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (response.status === 404) {
          throw new Error('API endpoint not found');
        }
        throw new Error(`Expected JSON response but got ${contentType || 'unknown'}`);
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  },

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  },

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  },
};

// Specific API endpoints
export const portalApi = {
  // Get available packages
  getPackages: () => api.get<{ packages: any[] }>('/api/portal/packages'),
  
  // Check device status
  getDeviceStatus: (macAddress: string, routerId?: string, ipAddress?: string) => {
    const params = new URLSearchParams();
    if (routerId) params.append('routerId', routerId);
    if (ipAddress) params.append('ipAddress', ipAddress);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<any>(`/api/portal/status/${macAddress}${query}`);
  },
  
  // Get router information
  getRouterInfo: (routerId: string) => api.get<{ router: any }>(`/api/portal/router/${routerId}`),
  
  // Purchase package
  purchasePackage: (data: {
    packageId: string;
    deviceMac: string;
    ipAddress?: string;
    routerId: string;
    phoneNumber: string;
    paymentMethod: 'MPESA' | 'TIGO_PESA' | 'AIRTEL_MONEY';
  }) => api.post<any>('/api/portal/purchase', data),
  
  // Redeem voucher
  redeemVoucher: (data: {
    voucherCode: string;
    deviceMac: string;
    ipAddress?: string;
    routerId: string;
  }) => api.post<any>('/api/portal/redeem-voucher', data),
  
  // Extend session
  extendSession: (sessionId: string, data: {
    packageId: string;
    phoneNumber: string;
    paymentMethod: 'MPESA' | 'TIGO_PESA' | 'AIRTEL_MONEY';
  }) => api.post<any>(`/api/portal/extend/${sessionId}`, data),
};

// Admin API endpoints (require authentication)
export const adminApi = {
  // Authentication
  login: (email: string, password: string) => 
    api.post<{ token: string; user: any }>('/api/auth/login', { email, password }),
  
  getCurrentUser: () => api.get<{ user: any }>('/api/auth/me'),
  
  // Routers
  getRouters: () => api.get<{ routers: any[] }>('/api/routers'),
  createRouter: (data: any) => api.post<any>('/api/routers', data),
  updateRouter: (id: string, data: any) => api.put<any>(`/api/routers/${id}`, data),
  deleteRouter: (id: string) => api.delete<any>(`/api/routers/${id}`),
  testRouter: (id: string) => api.post<any>(`/api/routers/${id}/test`),
  
  // Packages
  getPackages: () => api.get<{ packages: any[] }>('/api/packages'),
  createPackage: (data: any) => api.post<any>('/api/packages', data),
  updatePackage: (id: string, data: any) => api.put<any>(`/api/packages/${id}`, data),
  deletePackage: (id: string) => api.delete<any>(`/api/packages/${id}`),
  
  // Sessions
  getSessions: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get<{ sessions: any[] }>(`/api/sessions${query}`);
  },
  terminateSession: (id: string) => api.post<any>(`/api/sessions/${id}/terminate`),
  suspendSession: (id: string) => api.post<any>(`/api/sessions/${id}/suspend`),
  resumeSession: (id: string) => api.post<any>(`/api/sessions/${id}/resume`),
  extendSession: (id: string, minutes: number = 60) => api.post<any>(`/api/sessions/${id}/extend`, { minutes }),
  
  // Payments
  getPayments: (params?: any) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return api.get<{ payments: any[] }>(`/api/payments${query}`);
  },
  
  // Dashboard
  getDashboardStats: () => api.get<any>('/api/dashboard/stats'),
  getActiveSessions: () => api.get<{ sessions: any[] }>('/api/dashboard/active-sessions'),
};

// Test API connection
export const testApiConnection = async (): Promise<boolean> => {
  try {
    await api.get('/api/test');
    return true;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};

export default api;