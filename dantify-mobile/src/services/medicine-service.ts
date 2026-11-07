
import api from '@/config/api';

import type {
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

import type {
  Medicine,
  MedicineListParams,
  CreateMedicinePayload,
  UpdateMedicinePayload,
} from '@/types/medicine';

/* ======================================================
   HELPERS
====================================================== */

const buildParams = (params: MedicineListParams = {}) => ({
  ...params,
  is_active:
    params.is_active === undefined
      ? undefined
      : params.is_active
        ? 1
        : 0,
});

/* ======================================================
   MEDICINE CATALOGUE
====================================================== */

export const getMedicines = async (
  params: MedicineListParams = {},
): Promise<PaginatedResponse<Medicine>> => {
  const response = await api.get<
    ApiResponse<PaginatedResponse<Medicine>>
  >('/medicines', {
    params: buildParams(params),
  });

  return response.data.data;
};

export const getMedicine = async (
  id: number,
): Promise<Medicine> => {
  const response = await api.get<ApiResponse<Medicine>>(
    `/medicines/${id}`,
  );

  return response.data.data;
};

export const createMedicine = async (
  payload: CreateMedicinePayload,
): Promise<Medicine> => {
  const response = await api.post<ApiResponse<Medicine>>(
    '/medicines',
    payload,
  );

  return response.data.data;
};

export const updateMedicine = async (
  id: number,
  payload: UpdateMedicinePayload,
): Promise<Medicine> => {
  const response = await api.put<ApiResponse<Medicine>>(
    `/medicines/${id}`,
    payload,
  );

  return response.data.data;
};

export const updateMedicineStatus = async (
  id: number,
  is_active: boolean,
): Promise<Medicine> => {
  const response = await api.patch<ApiResponse<Medicine>>(
    `/medicines/${id}/status`,
    { is_active },
  );

  return response.data.data;
};
