import api from '@/config/api';
import { Platform } from 'react-native';

import type { ApiResponse } from '@/types/api';

import type {
  Staff,
  StaffCreatePayload,
  StaffUpdatePayload,
  MyStaffProfileResponse,
  PaginatedStaffsResponse,
} from '@/types/staff';

/* ======================================================
   STAFF LIST PARAMETERS
====================================================== */

export interface StaffListParams {
  page?: number;
  per_page?: number;
  clinic_id?: number;
  search?: string;
  is_active?: boolean;
}

const buildParams = (params: StaffListParams = {}) => ({
  ...params,
  is_active:
    params.is_active === undefined
      ? undefined
      : params.is_active
        ? 1
        : 0,
});

/* ======================================================
   MULTIPART FORM DATA
====================================================== */

type PhotoFile = {
  uri: string;
  name: string;
  type: string;
};

/**
 * Build multipart FormData for Expo Web and native platforms.
 *
 * Web: Converts the image URI into a Blob.
 * Native: Uses React Native's { uri, name, type } file object.
 */
async function buildStaffFormData(
  payload: StaffCreatePayload | StaffUpdatePayload,
  methodOverride?: 'PUT' | 'PATCH',
): Promise<FormData> {
  const formData = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) {
      continue;
    }

    // Profile photo upload.
    if (key === 'profile_photo') {
      const photo = value as PhotoFile;

      if (Platform.OS === 'web') {
        const response = await fetch(photo.uri);

        if (!response.ok) {
          throw new Error('Unable to read the selected profile photo.');
        }

        const blob = await response.blob();

        const mimeType = photo.type || blob.type || 'image/jpeg';

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
          throw new Error(`Unsupported profile photo format: ${mimeType}`);
        }

        const imageFile = new File(
          [blob],
          photo.name || 'staff-profile.jpg',
          { type: mimeType },
        );

        formData.append('profile_photo', imageFile);
      } else {
        formData.append(
          'profile_photo',
          {
            uri: photo.uri,
            name: photo.name,
            type: photo.type,
          } as any,
        );
      }

      continue;
    }

    // Boolean values must be sent in Laravel-compatible format.
    if (typeof value === 'boolean') {
      formData.append(key, value ? '1' : '0');
      continue;
    }

    formData.append(key, String(value));
  }

  // Laravel method spoofing for multipart PUT/PATCH requests.
  if (methodOverride) {
    formData.append('_method', methodOverride);
  }

  return formData;
}

/* ======================================================
   STAFF SERVICE
====================================================== */

const staffService = {
  /**
   * Get the authenticated user's staff profile.
   * GET /my/staff-profile
   */
  async getMyProfile(): Promise<MyStaffProfileResponse> {
    const response = await api.get<MyStaffProfileResponse>(
      '/my/staff-profile',
    );

    return response.data;
  },

  /**
   * Get staff members accessible to the authenticated user.
   * GET /staffs
   */
  async getAll(
    params: StaffListParams = {},
  ): Promise<PaginatedStaffsResponse> {
    const response = await api.get<PaginatedStaffsResponse>(
      '/staffs',
      {
        params: buildParams(params),
      },
    );

    return response.data;
  },

  /**
   * Get a staff member by ID.
   * GET /staffs/{id}
   */
  async getById(id: number): Promise<Staff> {
    const response = await api.get<ApiResponse<Staff>>(
      `/staffs/${id}`,
    );

    return response.data.data;
  },

  /**
   * Create a Staff account and profile.
   * POST /staffs
   */
  async create(payload: StaffCreatePayload): Promise<Staff> {
    const formData = await buildStaffFormData(payload);

    const response = await api.post<ApiResponse<Staff>>(
      '/staffs',
      formData,
    );

    return response.data.data;
  },

  /**
   * Update a Staff profile.
   * POST /staffs/{id} with _method=PUT
   */
  async update(
    id: number,
    payload: StaffUpdatePayload,
  ): Promise<Staff> {
    const formData = await buildStaffFormData(payload, 'PUT');

    const response = await api.post<ApiResponse<Staff>>(
      `/staffs/${id}`,
      formData,
    );

    return response.data.data;
  },

  /**
   * Partially update a Staff profile.
   * POST /staffs/{id} with _method=PATCH
   */
  async patch(
    id: number,
    payload: StaffUpdatePayload,
  ): Promise<Staff> {
    const formData = await buildStaffFormData(payload, 'PATCH');

    const response = await api.post<ApiResponse<Staff>>(
      `/staffs/${id}`,
      formData,
    );

    return response.data.data;
  },

  /**
   * Do not expose deletion in clinic-facing UI.
   * Backend restricts this endpoint to SuperAdmin.
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/staffs/${id}`);
  },
};

export default staffService;