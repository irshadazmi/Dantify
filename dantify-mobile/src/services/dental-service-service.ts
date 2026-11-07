import api from '@/config/api';

import type {
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

import type {
  DentalService,
  DentalServiceListParams,
  CreateDentalServicePayload,
  UpdateDentalServicePayload,
} from '@/types/dental-service';

/* ======================================================
   HELPERS
====================================================== */

/**
 * Prepare query parameters for the dental service list.
 * Convert boolean is_active into 1 or 0 for the API.
 */
const buildParams = (
  params: DentalServiceListParams = {},
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
   DENTAL SERVICE CATALOGUE
====================================================== */

/**
 * Get the master dental service catalogue.
 *
 * GET /services
 */
export const getDentalServices = async (
  params: DentalServiceListParams = {},
): Promise<PaginatedResponse<DentalService>> => {
  const response = await api.get<
    ApiResponse<PaginatedResponse<DentalService>>
  >('/services', {
    params: buildParams(params),
  });

  return response.data.data;
};

/**
 * Get a dental service by ID.
 *
 * GET /services/{id}
 */
export const getDentalService = async (
  id: number,
): Promise<DentalService> => {
  const response = await api.get<ApiResponse<DentalService>>(
    `/services/${id}`,
  );

  return response.data.data;
};

/**
 * Create a master dental service.
 *
 * POST /services
 */
export const createDentalService = async (
  payload: CreateDentalServicePayload,
): Promise<DentalService> => {
  const response = await api.post<ApiResponse<DentalService>>(
    '/services',
    payload,
  );

  return response.data.data;
};

/**
 * Update a master dental service.
 *
 * PUT /services/{id}
 */
export const updateDentalService = async (
  id: number,
  payload: UpdateDentalServicePayload,
): Promise<DentalService> => {
  const response = await api.put<ApiResponse<DentalService>>(
    `/services/${id}`,
    payload,
  );

  return response.data.data;
};

/**
 * Activate or deactivate a master dental service.
 *
 * PATCH /services/{id}/status
 */
export const updateDentalServiceStatus = async (
  id: number,
  is_active: boolean,
): Promise<DentalService> => {
  const response = await api.patch<ApiResponse<DentalService>>(
    `/services/${id}/status`,
    { is_active },
  );

  return response.data.data;
};