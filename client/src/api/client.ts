const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (data: { username: string; email: string; password: string; role?: string; phone?: string; id_card?: string }) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => request('/auth/me'),

  // Events
  getEvents: (params?: { status?: string; city?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.city) searchParams.set('city', params.city);
    const qs = searchParams.toString();
    return request(`/events${qs ? '?' + qs : ''}`);
  },

  getEvent: (id: number) => request(`/events/${id}`),

  createEvent: (data: any) =>
    request('/events', { method: 'POST', body: JSON.stringify(data) }),

  updateEvent: (id: number, data: any) =>
    request(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteEvent: (id: number) =>
    request(`/events/${id}`, { method: 'DELETE' }),

  getMyEvents: () => request('/events/my/list'),

  // Positions
  getEventPositions: (eventId: number) =>
    request(`/positions/event/${eventId}`),

  createPosition: (data: any) =>
    request('/positions', { method: 'POST', body: JSON.stringify(data) }),

  updatePosition: (id: number, data: any) =>
    request(`/positions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deletePosition: (id: number) =>
    request(`/positions/${id}`, { method: 'DELETE' }),

  // Applications
  apply: (data: { event_id: number; position_id: number; available_times?: string; personal_info?: string }) =>
    request('/applications', { method: 'POST', body: JSON.stringify(data) }),

  getMyApplications: () => request('/applications/my'),

  getEventApplications: (eventId: number, status?: string) => {
    const qs = status ? `?status=${status}` : '';
    return request(`/applications/event/${eventId}${qs}`);
  },

  updateApplicationStatus: (id: number, status: 'approved' | 'rejected') =>
    request(`/applications/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  cancelApplication: (id: number) =>
    request(`/applications/${id}`, { method: 'DELETE' }),

  // Schedules
  getMySchedules: () => request('/schedules/my'),

  getEventSchedules: (eventId: number) =>
    request(`/schedules/event/${eventId}`),

  createSchedule: (data: any) =>
    request('/schedules', { method: 'POST', body: JSON.stringify(data) }),

  updateSchedule: (id: number, data: any) =>
    request(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteSchedule: (id: number) =>
    request(`/schedules/${id}`, { method: 'DELETE' }),

  // Checkin
  checkin: (event_id: number, position_id: number) =>
    request('/checkins/checkin', {
      method: 'POST',
      body: JSON.stringify({ event_id, position_id }),
    }),

  checkout: (event_id: number, position_id: number) =>
    request('/checkins/checkout', {
      method: 'POST',
      body: JSON.stringify({ event_id, position_id }),
    }),

  getMyCheckins: () => request('/checkins/my'),

  getEventCheckins: (eventId: number) =>
    request(`/checkins/event/${eventId}`),

  // Notifications
  getNotifications: () => request('/notifications'),

  getUnreadCount: () => request('/notifications/unread-count'),

  markAsRead: (id: number) =>
    request(`/notifications/${id}/read`, { method: 'PUT' }),

  markAllAsRead: () =>
    request('/notifications/read-all', { method: 'PUT' }),

  // Admin
  getUsers: (role?: string) => {
    const qs = role ? `?role=${role}` : '';
    return request(`/admin/users${qs}`);
  },

  getStats: () => request('/admin/stats'),

  evaluate: (data: { user_id: number; event_id: number; score: number; comment?: string; certificate_url?: string }) =>
    request('/admin/evaluate', { method: 'POST', body: JSON.stringify(data) }),

  getEventEvaluations: (eventId: number) =>
    request(`/admin/evaluations/event/${eventId}`),

  getMyEvaluations: () => request('/admin/evaluations/my'),

  exportVolunteers: (eventId: number) =>
    request(`/admin/export/volunteers/${eventId}`),
};
