
import api from '@/config/api';

import type {
  Laboratory,
  LaboratoryCreatePayload,
  LaboratoryUpdatePayload,
  MyLaboratoryProfileResponse,
  PaginatedLaboratoriesResponse,
} from '@/types/laboratory';

export const laboratoryService = {
  // Get the logged-in laboratory user's profile.
  async getMyProfile(): Promise<MyLaboratoryProfileResponse> {
    const response = await api.get<MyLaboratoryProfileResponse>(
      '/my/laboratory-profile',
    );

    return response.data;
  },

  // List laboratories. Intended for authorized administrative use.
  async getAll(
    params?: Record<string, unknown>,
  ): Promise<PaginatedLaboratoriesResponse> {
    const response = await api.get<PaginatedLaboratoriesResponse>(
      '/laboratories',
      { params },
    );

    return response.data;
  },

  // Get a laboratory by ID.
  async getById(id: number): Promise<Laboratory> {
    const response = await api.get<Laboratory>(
      `/laboratories/${id}`,
    );

    return response.data;
  },

  // Create a laboratory profile.
  async create(
    payload: LaboratoryCreatePayload,
  ): Promise<Laboratory> {
    const response = await api.post<Laboratory>(
      '/laboratories',
      payload,
    );

    return response.data;
  },

  // Update a laboratory profile.
  async update(
    id: number,
    payload: LaboratoryUpdatePayload,
  ): Promise<Laboratory> {
    const response = await api.put<Laboratory>(
      `/laboratories/${id}`,
      payload,
    );

    return response.data;
  },

  // Delete a laboratory. Requires backend authorization.
  async delete(id: number): Promise<void> {
    await api.delete(`/laboratories/${id}`);
  },
};

export default laboratoryService;
