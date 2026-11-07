import type { PaginationParams } from './api';

/* ======================================================
   DENTAL SERVICE
   Master service catalogue
====================================================== */

export interface DentalService {
  id: number;
  name: string;
  description: string | null;
  price: string | number;
  duration_minutes: number;
  is_active: boolean;

  created_at?: string;
  updated_at?: string;
}

/* ======================================================
   LIST / FILTER PARAMETERS
====================================================== */

export interface DentalServiceListParams extends PaginationParams {
  search?: string;
  is_active?: boolean;
}

/* ======================================================
   CREATE / UPDATE PAYLOADS
====================================================== */

export interface CreateDentalServicePayload {
  name: string;
  description?: string | null;
  price: number;
  duration_minutes: number;
  is_active?: boolean;
}

export interface UpdateDentalServicePayload {
  name?: string;
  description?: string | null;
  price?: number;
  duration_minutes?: number;
  is_active?: boolean;
}