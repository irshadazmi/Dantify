
import api from '@/config/api';

import type {
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

import type {
  DentalAdvice,
  DentalAdviceListParams,
  CreateDentalAdvicePayload,
  UpdateDentalAdvicePayload,
} from '@/types/dental-advice';

/* ======================================================
   HELPERS
====================================================== */

/**
 * Prepare query parameters for the dental advice list.
 * Convert boolean is_active into 1 or 0 for the API.
 */
const buildParams = (
  params: DentalAdviceListParams = {},
) => ({
  ...params,
  is_active:
    params.is_active === undefined
      ? undefined
      : params.is_active
        ? 1
        : 0,
});

/* ======================================================
   DENTAL ADVICE CATALOGUE
====================================================== */

/**
 * Get the master dental advice catalogue.
 *
 * GET /dental-advices
 */
export const getDentalAdvices = async (
  params: DentalAdviceListParams = {},
): Promise<PaginatedResponse<DentalAdvice>> => {
  const response = await api.get<
    ApiResponse<PaginatedResponse<DentalAdvice>>
  >('/dental-advices', {
    params: buildParams(params),
  });

  return response.data.data;
};

/**
 * Get dental advice by ID.
 *
 * GET /dental-advices/{id}
 */
export const getDentalAdvice = async (
  id: number,
): Promise<DentalAdvice> => {
  const response = await api.get<ApiResponse<DentalAdvice>>(
    `/dental-advices/${id}`,
  );

  return response.data.data;
};

/**
 * Create dental advice.
 *
 * POST /dental-advices
 */
export const createDentalAdvice = async (
  payload: CreateDentalAdvicePayload,
): Promise<DentalAdvice> => {
  const response = await api.post<ApiResponse<DentalAdvice>>(
    '/dental-advices',
    payload,
  );

  return response.data.data;
};

/**
 * Update dental advice.
 *
 * PUT /dental-advices/{id}
 */
export const updateDentalAdvice = async (
  id: number,
  payload: UpdateDentalAdvicePayload,
): Promise<DentalAdvice> => {
  const response = await api.put<ApiResponse<DentalAdvice>>(
    `/dental-advices/${id}`,
    payload,
  );

  return response.data.data;
};

/**
 * Activate or deactivate dental advice.
 *
 * PATCH /dental-advices/{id}/status
 */
export const updateDentalAdviceStatus = async (
  id: number,
  is_active: boolean,
): Promise<DentalAdvice> => {
  const response = await api.patch<ApiResponse<DentalAdvice>>(
    `/dental-advices/${id}/status`,
    { is_active },
  );

  return response.data.data;
};
