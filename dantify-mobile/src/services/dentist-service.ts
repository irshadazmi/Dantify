
import api from '@/config/api';

import type {
  Dentist,
  DentistCreatePayload,
  DentistUpdatePayload,
  MyDentistProfileResponse,
  PaginatedDentistsResponse,
} from '@/types/dentist';

interface DentistApiResponse {
  message: string;
  data: Dentist;
}

/**
 * Dentist API service.
 *
 * Routes:
 * GET    /api/my/dentist-profile
 * GET    /api/dentists
 * GET    /api/dentists/{id}
 * POST   /api/dentists
 * PUT    /api/dentists/{id}
 * PATCH  /api/dentists/{id}
 * DELETE /api/dentists/{id}
 */
export const dentistService = {
  /**
   * Get the authenticated user's dentist profile.
   * Retains next_step and data for profile-completion navigation.
   */
  async getMyProfile(): Promise<MyDentistProfileResponse> {
    const response = await api.get<MyDentistProfileResponse>(
      '/my/dentist-profile',
    );

    return response.data;
  },

  /**
   * List dentist profiles.
   * Response shape must match the Laravel pagination response.
   */
  async getAll(params?: {
    page?: number;
    per_page?: number;
  }): Promise<PaginatedDentistsResponse> {
    const response = await api.get<PaginatedDentistsResponse>(
      '/dentists',
      { params },
    );

    return response.data;
  },

  /**
   * Get a dentist by ID.
   * Unwraps the Laravel { message, data } response.
   */
  async getById(id: number): Promise<Dentist> {
    const response = await api.get<DentistApiResponse>(
      `/dentists/${id}`,
    );

    return response.data.data;
  },

  /**
   * Create the authenticated user's dentist profile.
   */
  async create(payload: DentistCreatePayload): Promise<Dentist> {
    const response = await api.post<DentistApiResponse>(
      '/dentists',
      payload,
    );

    return response.data.data;
  },

  /**
   * Update a dentist profile.
   */
  async update(
    id: number,
    payload: DentistUpdatePayload,
  ): Promise<Dentist> {
    const response = await api.put<DentistApiResponse>(
      `/dentists/${id}`,
      payload,
    );

    return response.data.data;
  },

  /**
   * Partially update a dentist profile.
   */
  async patch(
    id: number,
    payload: DentistUpdatePayload,
  ): Promise<Dentist> {
    const response = await api.patch<DentistApiResponse>(
      `/dentists/${id}`,
      payload,
    );

    return response.data.data;
  },

  /**
   * Delete a dentist profile.
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/dentists/${id}`);
  },
};

export default dentistService;
