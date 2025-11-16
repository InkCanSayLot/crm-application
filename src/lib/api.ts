// Use relative API paths for Vercel deployment (proxied through vercel.json rewrites)
// or full URL for local development
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

// Generic API request function with enhanced error handling
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get user ID from multiple sources for authentication with retry logic
  let userId = null;
  let retryCount = 0;
  const maxRetries = 3;
  
  while (!userId && retryCount < maxRetries) {
    // First, try to get from localStorage (demo users)
    try {
      const storedDemoUser = localStorage.getItem('demoUser');
      if (storedDemoUser) {
        const demoUser = JSON.parse(storedDemoUser);
        userId = demoUser.id;
      }
    } catch (error) {
      console.error('Error parsing stored demo user:', error);
    }
    
    // If no demo user, try to get from Supabase session
    if (!userId) {
      try {
        // Import supabase dynamically to avoid circular dependencies
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          userId = session.user.id;
        }
      } catch (error) {
        console.error('Error getting Supabase session:', error);
      }
    }
    
    // If still no userId and we haven't reached max retries, wait and try again
    if (!userId && retryCount < maxRetries - 1) {
      retryCount++;
      console.log(`Retrying authentication (attempt ${retryCount}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 200 * retryCount)); // Exponential backoff
    } else {
      break;
    }
  }
  
  // Log authentication status for debugging
  if (!userId) {
    console.warn('No user ID found after retries. API request may fail if authentication is required.');
  }
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(userId && { 'user-id': userId }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorData = {};
      try {
        const errorText = await response.text();
        console.log('=== API ERROR RESPONSE ===');
        console.log('Status:', response.status);
        console.log('Error text:', errorText);
        if (errorText.trim()) {
          errorData = JSON.parse(errorText);
          console.log('Parsed error data:', errorData);
        }
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        errorData = {};
      }
      
      // Handle specific error cases
      if (response.status === 429) {
        throw new Error((errorData as { error?: string }).error || 'Service temporarily unavailable due to rate limits. Please try again later.');
      }
      
      if (response.status === 500) {
        throw new Error(((errorData as { error?: string }).error) || 'Internal server error. Please try again or contact support.');
      }
      
      if (response.status === 404) {
        throw new Error('Resource not found.');
      }
      
      if (response.status === 401) {
        throw new Error('Authentication required. Please sign in to continue.');
      }
      
      if (response.status === 400) {
        // Check if it's a userId-related error
        if ((errorData as { error?: string }).error && ((errorData as { error?: string }).error.includes('userId') || (errorData as { error?: string }).error.includes('Message and userId are required'))) {
          throw new Error('User authentication failed. Please refresh the page and try again.');
        }
        throw new Error((errorData as { error?: string }).error || 'Invalid request. Please check your input.');
      }
      
      throw new Error((errorData as { error?: string }).error || `HTTP error! status: ${response.status}`);
    }
    
    // Handle empty responses (like DELETE operations)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // For non-JSON responses (like successful DELETE operations), return null
      return null as T;
    }
    
    // Get response text first to handle empty responses
    const responseText = await response.text();
    if (!responseText.trim()) {
      // Empty response body, return null for DELETE operations or empty object for others
      return null as T;
    }
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parsing failed for response:', responseText);
      throw new Error('Invalid JSON response from server');
    }
    
    // Extract data from API response structure { success: true, data: ... }
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      return responseData.data;
    }
    
    return responseData;
  } catch (error) {
    // Only log AI service errors in development mode to reduce noise
    const isAiError = url.includes('/ai/') && (error as Error).message?.includes('Groq AI service');
    
    if (!isAiError || process.env.NODE_ENV === 'development') {
      console.error('API request failed:', error);
    }
    
    throw error;
  }
}

// CRM API functions
export const crmApi = {
  // Get all users
  getUsers: () => apiRequest<any[]>('/crm/users'),
  
  // Update user
  updateUser: (id: string, user: any) => {
    console.log('crmApi.updateUser - ID:', id, 'Type:', typeof id, 'User data:', user);
    return apiRequest<any>(`/crm/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  },
  
  // Get all clients
  getClients: () => apiRequest<any[]>('/crm/clients'),
  
  // Get client by ID
  getClient: (id: string) => apiRequest<any>(`/crm/clients/${id}`),
  
  // Create new client
  createClient: (client: any) => apiRequest<any>('/crm/clients', {
    method: 'POST',
    body: JSON.stringify(client),
  }),
  
  // Update client
  updateClient: (id: string, client: any) => apiRequest<any>(`/crm/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(client),
  }),
  
  // Delete client
  deleteClient: (id: string) => apiRequest<void>(`/crm/clients/${id}`, {
    method: 'DELETE',
  }),
  
  // Get client statistics
  getStats: () => apiRequest<any>('/crm/stats'),
};

// Calendar API functions
export const calendarApi = {
  // Get all events (with optional type filter)
  getEvents: (params?: { type?: 'shared' | 'personal' }) => {
    const query = params?.type ? `?type=${params.type}` : '';
    return apiRequest<any[]>(`/calendar/events${query}`);
  },
  
  // Create new event
  createEvent: (event: any) => apiRequest<any>('/calendar/events', {
    method: 'POST',
    body: JSON.stringify(event),
  }),
  
  // Update event
  updateEvent: (id: string, event: any) => apiRequest<any>(`/calendar/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(event),
  }),
  
  // Delete event
  deleteEvent: (id: string) => apiRequest<void>(`/calendar/events/${id}`, {
    method: 'DELETE',
  }),
  
  // Get all tasks
  getTasks: () => apiRequest<any[]>('/calendar/tasks'),
  
  // Create new task
  createTask: (task: any) => apiRequest<any>('/calendar/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  }),
  
  // Update task
  updateTask: (id: string, task: any) => apiRequest<any>(`/calendar/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(task),
  }),
  
  // Delete task
  deleteTask: (id: string) => apiRequest<void>(`/calendar/tasks/${id}`, {
    method: 'DELETE',
  }),
  
  // Get calendar statistics
  getStats: () => apiRequest<any>('/calendar/stats'),
};

// Journal API functions
export const journalApi = {
  // Get all entries
  getEntries: () => apiRequest<any[]>('/journal/entries'),
  
  // Get entry by ID
  getEntry: (id: string) => apiRequest<any>(`/journal/entries/${id}`),
  
  // Create new entry
  createEntry: (entry: any) => apiRequest<any>('/journal/entries', {
    method: 'POST',
    body: JSON.stringify(entry),
  }),
  
  // Update entry
  updateEntry: (id: string, entry: any) => apiRequest<any>(`/journal/entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(entry),
  }),
  
  // Delete entry
  deleteEntry: (id: string) => apiRequest<void>(`/journal/entries/${id}`, {
    method: 'DELETE',
  }),
  
  // Search entries
  searchEntries: (query: string) => apiRequest<any[]>(`/journal/search?q=${encodeURIComponent(query)}`),
  
  // Get journal statistics
  getStats: () => apiRequest<any>('/journal/stats'),
};

// Reports API functions
export const reportsApi = {
  // Generate reports
  generateFinancialSummary: (params: { startDate: string; endDate: string; format?: string }) =>
    apiRequest<any>('/reports/financial-summary', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  generateClientProfitability: (params: { startDate: string; endDate: string; format?: string }) =>
    apiRequest<any>('/reports/client-profitability', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  generateBudgetPerformance: (params: { startDate: string; endDate: string; format?: string }) =>
    apiRequest<any>('/reports/budget-performance', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // Export functionality
  exportCSV: (jobId: string) => {
    const url = `${API_BASE_URL}/reports/export/${jobId}/csv`;
    window.open(url, '_blank');
  },

  exportPDF: (jobId: string) => {
    const url = `${API_BASE_URL}/reports/export/${jobId}/pdf`;
    window.open(url, '_blank');
  },

  // Export history
  getExportHistory: (params?: { limit?: number; offset?: number }) => {
    const query = params ? `?limit=${params.limit || 50}&offset=${params.offset || 0}` : '';
    return apiRequest<any[]>(`/reports/export-history${query}`);
  },

  deleteExportJob: (jobId: string) => apiRequest<void>(`/reports/export-history/${jobId}`, {
    method: 'DELETE',
  }),
};

// Financial API functions
export const financialApi = {
  // Budgets
  getBudgets: (params?: { client_id?: string }) => {
    const query = params?.client_id ? `?client_id=${params.client_id}` : '';
    return apiRequest<any[]>(`/financial/budgets${query}`);
  },
  
  getBudget: (id: string) => apiRequest<any>(`/financial/budgets/${id}`),
  
  createBudget: (budget: any) => apiRequest<any>('/financial/budgets', {
    method: 'POST',
    body: JSON.stringify(budget),
  }),
  
  updateBudget: (id: string, budget: any) => apiRequest<any>(`/financial/budgets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(budget),
  }),
  
  deleteBudget: (id: string) => apiRequest<void>(`/financial/budgets/${id}`, {
    method: 'DELETE',
  }),

  // Payments
  getPayments: (params?: { client_id?: string }) => {
    const query = params?.client_id ? `?client_id=${params.client_id}` : '';
    return apiRequest<any[]>(`/financial/payments${query}`);
  },
  
  getPayment: (id: string) => apiRequest<any>(`/financial/payments/${id}`),
  
  createPayment: (payment: any) => apiRequest<any>('/financial/payments', {
    method: 'POST',
    body: JSON.stringify(payment),
  }),
  
  updatePayment: (id: string, payment: any) => apiRequest<any>(`/financial/payments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payment),
  }),
  
  deletePayment: (id: string) => apiRequest<void>(`/financial/payments/${id}`, {
    method: 'DELETE',
  }),

  // Expenses
  getExpenses: (params?: { client_id?: string }) => {
    const query = params?.client_id ? `?client_id=${params.client_id}` : '';
    return apiRequest<any[]>(`/financial/expenses${query}`);
  },
  
  getExpense: (id: string) => apiRequest<any>(`/financial/expenses/${id}`),
  
  createExpense: (expense: any) => apiRequest<any>('/financial/expenses', {
    method: 'POST',
    body: JSON.stringify(expense),
  }),
  
  updateExpense: (id: string, expense: any) => apiRequest<any>(`/financial/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(expense),
  }),
  
  deleteExpense: (id: string) => apiRequest<void>(`/financial/expenses/${id}`, {
    method: 'DELETE',
  }),

  // Vendors
  getVendors: () => apiRequest<any[]>('/financial/vendors'),
  
  getVendor: (id: string) => apiRequest<any>(`/financial/vendors/${id}`),
  
  createVendor: (vendor: any) => apiRequest<any>('/financial/vendors', {
    method: 'POST',
    body: JSON.stringify(vendor),
  }),
  
  updateVendor: (id: string, vendor: any) => apiRequest<any>(`/financial/vendors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(vendor),
  }),
  
  deleteVendor: (id: string) => apiRequest<void>(`/financial/vendors/${id}`, {
    method: 'DELETE',
  }),

  // Analytics
  getClientAnalytics: (clientId: string) => apiRequest<any>(`/financial/analytics/client-profitability/${clientId}?start_date=2024-01-01&end_date=2024-12-31`),
  
  getFinancialOverview: () => apiRequest<any>('/financial/analytics/overview'),
  
  getClientProfitability: () => apiRequest<any[]>('/financial/analytics/client-summary'),
  
  getMonthlyTrends: (params?: { months?: number }) => {
    const query = params?.months ? `?months=${params.months}` : '';
    return apiRequest<any[]>(`/financial/analytics/monthly-trends${query}`);
  },
};