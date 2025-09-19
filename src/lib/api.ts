const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003/api';

// Generic API request function with enhanced error handling
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle specific error cases
      if (response.status === 429) {
        throw new Error(errorData.error || 'Service temporarily unavailable due to rate limits. Please try again later.');
      }
      
      if (response.status === 500) {
        throw new Error(errorData.error || 'Internal server error. Please try again or contact support.');
      }
      
      if (response.status === 404) {
        throw new Error('Resource not found.');
      }
      
      if (response.status === 400) {
        throw new Error(errorData.error || 'Invalid request. Please check your input.');
      }
      
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const responseData = await response.json();
    
    // Extract data from API response structure { success: true, data: ... }
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
      return responseData.data;
    }
    
    return responseData;
  } catch (error) {
    console.error('API request failed:', error);
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
  // Get all events
  getEvents: () => apiRequest<any[]>('/calendar/events'),
  
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

// AI API functions
export const aiApi = {
  // Chat with AI
  chat: (data: { message: string; context?: any; sessionId?: string }) => apiRequest<any>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Get CRM optimization suggestions
  getCrmOptimizations: () => apiRequest<any[]>('/ai/crm-optimize'),
  
  // Analyze journal entry
  analyzeJournalEntry: (entryId: string) => apiRequest<any>(`/ai/journal-analyze/${entryId}`, {
    method: 'POST',
  }),
  
  // Summarize meeting notes
  summarizeMeetingNotes: (notes: string) => apiRequest<any>('/ai/meeting-summarize', {
    method: 'POST',
    body: JSON.stringify({ notes }),
  }),
  
  // Get optimization history
  getOptimizationHistory: () => apiRequest<any[]>('/ai/optimizations'),
  
  // Get AI usage statistics
  getStats: () => apiRequest<any>('/ai/stats'),
};