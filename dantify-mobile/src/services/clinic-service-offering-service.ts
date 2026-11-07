import api from '@/config/api';

import type {
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

import type { DentalService } from '@/types/dental-service';

import type {
  ClinicServiceOffering,
  ClinicServiceOfferingListParams,
  AddClinicServiceOfferingPayload,
  UpdateClinicServiceOfferingPayload,
} from '@/types/clinic-service-offering';

/* ======================================================
   HELPERS
====================================================== */

/**
 * Build query parameters for clinic service offering
 * and dental service catalogue requests.
 *
 * Laravel boolean validation/filtering supports 0 and 1.
 */
const buildParams = (
  params: ClinicServiceOfferingListParams = {},
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
   CLINIC SERVICE OFFERINGS
====================================================== */

/**
 * Get services offered by the authenticated clinic.
 *
 * GET /clinic/services
 */
export const getClinicServiceOfferings = async (
  params: ClinicServiceOfferingListParams = {},
): Promise<PaginatedResponse<ClinicServiceOffering>> => {
  const response = await api.get<
    ApiResponse<PaginatedResponse<ClinicServiceOffering>>
  >('/clinic/services', {
    params: buildParams(params),
  });

  return response.data.data;
};

/**
 * Get available services from the master dental
 * service catalogue.
 *
 * GET /clinic/services/catalogue
 */
export const getAvailableDentalServices = async (
  params: ClinicServiceOfferingListParams = {},
): Promise<PaginatedResponse<DentalService>> => {
  const response = await api.get<
    ApiResponse<PaginatedResponse<DentalService>>
  >('/clinic/services/catalogue', {
    params: buildParams(params),
  });

  return response.data.data;
};

/**
 * Add a master dental service to the clinic's
 * service offerings.
 *
 * POST /clinic/services
 */
export const addClinicServiceOffering = async (
  payload: AddClinicServiceOfferingPayload,
): Promise<ClinicServiceOffering> => {
  const response = await api.post<ApiResponse<ClinicServiceOffering>>(
    '/clinic/services',
    payload,
  );

  return response.data.data;
};

/**
 * Update pricing, duration or other editable
 * details of a clinic service offering.
 *
 * PUT /clinic/services/{id}
 */
export const updateClinicServiceOffering = async (
  id: number,
  payload: UpdateClinicServiceOfferingPayload,
): Promise<ClinicServiceOffering> => {
  const response = await api.put<ApiResponse<ClinicServiceOffering>>(
    `/clinic/services/${id}`,
    payload,
  );

  return response.data.data;
};

/**
 * Activate or deactivate a clinic service offering.
 *
 * PATCH /clinic/services/{id}/status
 */
export const updateClinicServiceOfferingStatus = async (
  id: number,
  is_active: boolean,
): Promise<ClinicServiceOffering> => {
  const response = await api.patch<ApiResponse<ClinicServiceOffering>>(
    `/clinic/services/${id}/status`,
    { is_active },
  );

  return response.data.data;
};