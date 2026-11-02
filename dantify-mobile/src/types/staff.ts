
export interface Staff {
  id: number;
  user_id: number;
  clinic_id: number;
  name: string;
  job_title: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface StaffCreatePayload {
  clinic_id: number;
  name: string;
  job_title?: string | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
}

export interface StaffUpdatePayload {
  clinic_id?: number;
  name?: string;
  job_title?: string | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
}

export interface MyStaffProfileResponse {
  message?: string;
  next_step: 'create_profile' | 'dashboard';
  data: Staff | null;
}

export interface PaginatedStaffResponse {
  data: Staff[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface StaffClinicInfo {
  id: number;
  name: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
}
