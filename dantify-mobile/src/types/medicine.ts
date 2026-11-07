
import type { PaginationParams } from './api';

export interface Medicine {
  id: number;
  name: string;
  generic_name: string | null;
  composition: string | null;
  brand_name: string | null;
  strength: string | null;
  dosage_form: string | null;
  manufacturer: string | null;
  description: string | null;
  default_instructions: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MedicineListParams extends PaginationParams {
  search?: string;
  is_active?: boolean;
  dosage_form?: string;
}

export interface CreateMedicinePayload {
  name: string;
  generic_name?: string | null;
  composition?: string | null;
  brand_name?: string | null;
  strength?: string | null;
  dosage_form?: string | null;
  manufacturer?: string | null;
  description?: string | null;
  default_instructions?: string | null;
  is_active?: boolean;
}

export type UpdateMedicinePayload = Partial<CreateMedicinePayload>;
