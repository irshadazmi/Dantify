
import api from '@/config/api';

import type {
  Clinic,
  ClinicCreatePayload,
  ClinicUpdatePayload,
  MyClinicProfileResponse,
  PaginatedClinicsResponse,
} from '@/types/clinic';

/**
 * Clinic API service.
 *
 * Base URL is supplied by the shared Axios instance.
 * All endpoints require authentication unless the backend
 * explicitly configures otherwise.
 */
const clinicService = {
  /**
   * Get the authenticated user's clinic profile.
   * GET /api/my/clinic-profile
   */
  async getMyProfile(): Promise<MyClinicProfileResponse> {
    const response = await api.get<MyClinicProfileResponse>(
      '/my/clinic-profile',
    );

    return response.data;
  },

  /**
   * List clinics accessible to the authenticated user.
   * GET /api/clinics
   */
  async getAll(params?: {
    page?: number;
    per_page?: number;
  }): Promise<PaginatedClinicsResponse> {
    const response = await api.get<PaginatedClinicsResponse>(
      '/clinics',
      { params },
    );

    return response.data;
  },

  /**
   * Get a clinic by ID.
   * GET /api/clinics/{id}
   */
  async getById(id: number): Promise<Clinic> {
    const response = await api.get<Clinic>(`/clinics/${id}`);

    return response.data;
  },

  /**
   * Create a clinic profile.
   * POST /api/clinics
   */
  async create(payload: ClinicCreatePayload): Promise<Clinic> {
    const response = await api.post<Clinic>('/clinics', payload);

    return response.data;
  },

  /**
   * Update a clinic profile.
   * PUT /api/clinics/{id}
   */
  async update(
    id: number,
    payload: ClinicUpdatePayload,
  ): Promise<Clinic> {
    const response = await api.put<Clinic>(
      `/clinics/${id}`,
      payload,
    );

    return response.data;
  },

  /**
   * Partially update a clinic profile.
   * PATCH /api/clinics/{id}
   */
  async patch(
    id: number,
    payload: ClinicUpdatePayload,
  ): Promise<Clinic> {
    const response = await api.patch<Clinic>(
      `/clinics/${id}`,
      payload,
    );

    return response.data;
  },

  /**
   * Delete a clinic.
   * DELETE /api/clinics/{id}
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/clinics/${id}`);
  },
};

export default clinicService;
