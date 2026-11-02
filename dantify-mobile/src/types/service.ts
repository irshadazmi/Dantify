export interface Service {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  duration_minutes: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ClinicService {
  id: number;
  clinic_id: number;
  service_id: number;
  price: string | number;
  duration_minutes: number;
  is_active: boolean;
  service: Service;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url?: string | null;
  from?: number | null;
  last_page: number;
  per_page: number;
  to?: number | null;
  total: number;
}

export interface ApiResponse<T> {
  message?: string;
  data: T;
}

export interface ServiceListParams {
  search?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export interface CreateServicePayload {
  name: string;
  description?: string | null;
  price: number;
  duration_minutes: number;
  is_active?: boolean;
}

export interface UpdateServicePayload {
  name?: string;
  description?: string | null;
  price?: number;
  duration_minutes?: number;
  is_active?: boolean;
}

export interface AddClinicServicePayload {
  service_id: number;
  price?: number;
  duration_minutes?: number;
}

export interface UpdateClinicServicePayload {
  price?: number;
  duration_minutes?: number;
}