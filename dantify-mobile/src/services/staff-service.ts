
import api from '@/config/api';

import type {
  Staff,
  StaffCreatePayload,
  StaffUpdatePayload,
  MyStaffProfileResponse,
  PaginatedStaffResponse,
} from '@/types/staff';

const staffService = {
  /**
   * Get the authenticated user's staff profile.
   * Expected endpoint: GET /api/my/staff-profile
   */
  async getMyProfile(): Promise<MyStaffProfileResponse> {
    const response = await api.get<MyStaffProfileResponse>(
      '/my/staff-profile'
    );

    return response.data;
  },

  /**
   * Get all staff members accessible to the authenticated user.
   * Expected endpoint: GET /api/staff
   */
  async getAll(params?: {
    page?: number;
    per_page?: number;
    clinic_id?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<PaginatedStaffResponse> {
    const response = await api.get<PaginatedStaffResponse>(
      '/staff',
      { params }
    );

    return response.data;
  },

  /**
   * Get a staff member by ID.
   * Expected endpoint: GET /api/staff/{id}
   */
  async getById(id: number): Promise<Staff> {
    const response = await api.get<Staff>(`/staff/${id}`);

    return response.data;
  },

  /**
   * Create a staff profile.
   * Expected endpoint: POST /api/staff
   */
  async create(payload: StaffCreatePayload): Promise<Staff> {
    const response = await api.post<Staff>('/staff', payload);

    return response.data;
  },

  /**
   * Update a staff member.
   * Expected endpoint: PUT /api/staff/{id}
   */
  async update(
    id: number,
    payload: StaffUpdatePayload
  ): Promise<Staff> {
    const response = await api.put<Staff>(
      `/staff/${id}`,
      payload
    );

    return response.data;
  },

  /**
   * Partially update a staff member.
   * Expected endpoint: PATCH /api/staff/{id}
   */
  async patch(
    id: number,
    payload: StaffUpdatePayload
  ): Promise<Staff> {
    const response = await api.patch<Staff>(
      `/staff/${id}`,
      payload
    );

    return response.data;
  },

  /**
   * Delete a staff member.
   * Expected endpoint: DELETE /api/staff/{id}
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/staff/${id}`);
  },
};

export default staffService;
