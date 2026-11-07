
import type { PaginationParams } from './api';

/* ======================================================
   DENTAL ADVICE
   Master dental advice catalogue
====================================================== */

export interface DentalAdvice {
  id: number;
  name: string;
  description: string | null;
  default_instructions: string | null;
  is_active: boolean;

  created_at?: string;
  updated_at?: string;
}

/* ======================================================
   LIST / FILTER PARAMETERS
====================================================== */

export interface DentalAdviceListParams extends PaginationParams {
  search?: string;
  is_active?: boolean;
}

/* ======================================================
   CREATE / UPDATE PAYLOADS
====================================================== */

export interface CreateDentalAdvicePayload {
  name: string;
  description?: string | null;
  default_instructions?: string | null;
  is_active?: boolean;
}

export interface UpdateDentalAdvicePayload {
  name?: string;
  description?: string | null;
  default_instructions?: string | null;
  is_active?: boolean;
}
