import api from '@/config/api';

import type {
  ApiResponse,
  PaginationParams,
} from '@/types/api';

import type {
  Clinic,
  ClinicCreatePayload,
  ClinicUpdatePayload,
  MyClinicProfileResponse,
  PaginatedClinicsResponse,
} from '@/types/clinic';

/* ======================================================
   CLINIC SERVICE
====================================================== */

const clinicService = {

  /**
   * Get the authenticated user's clinic profile.
   *
   * GET /my/clinic-profile
   */
  async getMyProfile(): Promise<MyClinicProfileResponse> {
    const response = await api.get<MyClinicProfileResponse>(
      '/my/clinic-profile',
    );

    return response.data;
  },

  /**
   * Get clinics accessible to the authenticated user.
   *
   * GET /clinics
   */
  async getAll(
    params: PaginationParams = {},
  ): Promise<PaginatedClinicsResponse> {
    const response = await api.get<PaginatedClinicsResponse>(
      '/clinics',
      { params },
    );

    return response.data;
  },

  /**
   * Get a clinic by ID.
   *
   * GET /clinics/{id}
   */
  async getById(id: number): Promise<Clinic> {
    const response = await api.get<ApiResponse<Clinic>>(
      `/clinics/${id}`,
    );

    return response.data.data;
  },

  /**
   * Create a clinic profile.
   *
   * POST /clinics
   */
  async create(
    payload: ClinicCreatePayload,
  ): Promise<Clinic> {
    const response = await api.post<ApiResponse<Clinic>>(
      '/clinics',
      payload,
    );

    return response.data.data;
  },

  /**
   * Update a clinic profile.
   *
   * PUT /clinics/{id}
   */
  async update(
    id: number,
    payload: ClinicUpdatePayload,
  ): Promise<Clinic> {
    const response = await api.put<ApiResponse<Clinic>>(
      `/clinics/${id}`,
      payload,
    );

    return response.data.data;
  },

  /**
   * Partially update a clinic profile.
   *
   * PATCH /clinics/{id}
   */
  async patch(
    id: number,
    payload: ClinicUpdatePayload,
  ): Promise<Clinic> {
    const response = await api.patch<ApiResponse<Clinic>>(
      `/clinics/${id}`,
      payload,
    );

    return response.data.data;
  },

  /**
   * Delete a clinic.
   *
   * DELETE /clinics/{id}
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/clinics/${id}`);
  },
};

/* ======================================================
   EXPORT
====================================================== */

export default clinicService;