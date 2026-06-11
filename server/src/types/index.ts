export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'volunteer' | 'organizer' | 'admin';
  phone: string;
  id_card: string;
  created_at: string;
}

export interface Event {
  id: number;
  organizer_id: number;
  name: string;
  city: string;
  date: string;
  description: string;
  status: 'recruiting' | 'ongoing' | 'finished';
  created_at: string;
}

export interface Position {
  id: number;
  event_id: number;
  name: string;
  description: string;
  people_needed: number;
  people_assigned: number;
  time_start: string;
  time_end: string;
  location_point: string;
  created_at: string;
}

export interface Application {
  id: number;
  user_id: number;
  event_id: number;
  position_id: number;
  available_times: string;
  personal_info: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Schedule {
  id: number;
  user_id: number;
  event_id: number;
  position_id: number;
  date: string;
  time_start: string;
  time_end: string;
  contact_person: string;
  contact_phone: string;
  created_at: string;
}

export interface Checkin {
  id: number;
  user_id: number;
  event_id: number;
  position_id: number;
  checkin_time: string;
  checkout_time: string;
  created_at: string;
}

export interface Evaluation {
  id: number;
  user_id: number;
  event_id: number;
  score: number;
  comment: string;
  certificate_url: string;
  created_by: number;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  content: string;
  is_read: number;
  created_at: string;
}

export interface JwtPayload {
  userId: number;
  role: string;
}
