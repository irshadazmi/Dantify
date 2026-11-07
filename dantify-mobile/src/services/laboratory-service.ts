import api from '@/config/api';

import type {
  ApiResponse,
  PaginationParams,
} from '@/types/api';

import type {
  Laboratory,
  LaboratoryCreatePayload,
  LaboratoryUpdatePayload,
  MyLaboratoryProfileResponse,
  PaginatedLaboratoriesResponse,
} from '@/types/laboratory';

/* ======================================================
   LABORATORY SERVICE
====================================================== */

export const laboratoryService = {

  /**
   * Get the authenticated laboratory user's profile.
   *
   * GET /my/laboratory-profile
   */
  async getMyProfile(): Promise<MyLaboratoryProfileResponse> {
    const response = await api.get<MyLaboratoryProfileResponse>(
      '/my/laboratory-profile',
    );

    return response.data;
  },

  /**
   * List laboratories.
   * Intended for authorized administrative use.
   *
   * GET /laboratories
   */
  async getAll(
    params: PaginationParams = {},
  ): Promise<PaginatedLaboratoriesResponse> {
    const response = await api.get<PaginatedLaboratoriesResponse>(
      '/laboratories',
      { params },
    );

    return response.data;
  },

  /**
   * Get a laboratory by ID.
   *
   * GET /laboratories/{id}
   */
  async getById(id: number): Promise<Laboratory> {
    const response = await api.get<ApiResponse<Laboratory>>(
      `/laboratories/${id}`,
    );

    return response.data.data;
  },

  /**
   * Create a laboratory profile.
   *
   * POST /laboratories
   */
  async create(
    payload: LaboratoryCreatePayload,
  ): Promise<Laboratory> {
    const response = await api.post<ApiResponse<Laboratory>>(
      '/laboratories',
      payload,
    );

    return response.data.data;
  },

  /**
   * Update a laboratory profile.
   *
   * PUT /laboratories/{id}
   */
  async update(
    id: number,
    payload: LaboratoryUpdatePayload,
  ): Promise<Laboratory> {
    const response = await api.put<ApiResponse<Laboratory>>(
      `/laboratories/${id}`,
      payload,
    );

    return response.data.data;
  },

  /**
   * Delete a laboratory.
   * Requires backend authorization.
   *
   * DELETE /laboratories/{id}
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/laboratories/${id}`);
  },
};

/* ======================================================
   EXPORT
====================================================== */

export default laboratoryService;