import type { PaginationParams } from './api';
import type { DentalService } from './dental-service';

/* ======================================================
   CLINIC SERVICE OFFERING
====================================================== */

export interface ClinicServiceOffering {
  id: number;
  clinic_id: number;
  dental_service_id: number;
  price: string | number;
  duration_minutes: number;
  is_active: boolean;

  dental_service?: DentalService;

  created_at?: string;
  updated_at?: string;
}

/* ======================================================
   CREATE / UPDATE PAYLOADS
====================================================== */

/**
 * Add a dental service to a clinic's service catalogue.
 */
export interface AddClinicServiceOfferingPayload {
  dental_service_id: number;
  price?: number;
  duration_minutes?: number;
}

/**
 * Update clinic-specific pricing and duration.
 */
export interface UpdateClinicServiceOfferingPayload {
  price?: number;
  duration_minutes?: number;
}

/* ======================================================
   LIST / FILTER PARAMETERS
====================================================== */

export interface ClinicServiceOfferingListParams
  extends PaginationParams {
  search?: string;
  is_active?: boolean;
}