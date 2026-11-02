
import type { Address } from '@/types/address';

export interface Clinic extends Address {
  id: number;
  user_id: number;
  name: string;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface ClinicCreatePayload extends Address {
  name: string;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
}

export interface ClinicUpdatePayload extends Partial<Address> {
  name?: string;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean;
}

export type ClinicResponse = Clinic;
export type ClinicsResponse = Clinic[];

export interface MyClinicProfileResponse {
  message?: string;
  next_step: 'create_profile' | 'dashboard';
  data: Clinic | null;
}

export interface PaginatedClinicsResponse {
  data: Clinic[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
