export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'provider' | 'admin';
  created_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  image?: string;
}

export interface Service {
  id: string;
  provider_id: string;
  category_id: string;
  title: string;
  description: string;
  price: number;
  price_type: 'fixed' | 'hourly' | 'starting_from';
  duration_minutes?: number;
  image?: string;
  is_active: boolean;
  created_at: string;
}

export interface ServiceProvider {
  id: string;
  user_id: string;
  business_name: string;
  description: string;
  services: string[];
  location: string;
  latitude?: number;
  longitude?: number;
  rating: number;
  total_reviews: number;
  total_jobs: number;
  verified: boolean;
  avatar?: string;
  banner_image?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  provider_id: string;
  service_id: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  scheduled_time: string;
  address: string;
  notes?: string;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'refunded';
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  user_id: string;
  provider_id: string;
  rating: number;
  comment: string;
  created_at: string;
}
