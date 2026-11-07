import { Platform } from 'react-native';
import api from '@/config/api';

import type {
  ApiResponse,
  PaginationParams,
} from '@/types/api';

import type {
  Dentist,
  DentistCreatePayload,
  DentistUpdatePayload,
  MyDentistProfileResponse,
  PaginatedDentistsResponse,
} from '@/types/dentist';

/* ======================================================
   HELPERS
====================================================== */

type DentistFormPayload =
  | DentistCreatePayload
  | DentistUpdatePayload;

/**
 * Convert dentist payload into FormData.
 *
 * Handles:
 * - Text and numeric fields
 * - Boolean fields as 1 or 0
 * - Profile photo as a React Native file object
 * - Undefined and null values by omitting them
 */
type DentistPhotoFile = {
  uri: string;
  name: string;
  type: string;
};

const toFormData = async (
  payload: DentistFormPayload,
): Promise<FormData> => {
  const formData = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (key === 'profile_photo') {
      const photo = value as DentistPhotoFile;

      if (Platform.OS === 'web') {
        const response = await fetch(photo.uri);

        if (!response.ok) {
          throw new Error(
            'Unable to read the selected dentist profile photo.',
          );
        }

        const blob = await response.blob();
        const mimeType = photo.type || blob.type || 'image/jpeg';

        if (
          !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)
        ) {
          throw new Error(
            `Unsupported dentist photo format: ${mimeType}`,
          );
        }

        const imageFile = new File(
          [blob],
          photo.name || 'dentist-profile.jpg',
          { type: mimeType },
        );

        formData.append('profile_photo', imageFile);
      } else {
        formData.append(
          'profile_photo',
          {
            uri: photo.uri,
            name: photo.name || 'dentist-profile.jpg',
            type: photo.type || 'image/jpeg',
          } as any,
        );
      }

      continue;
    }

    formData.append(
      key,
      typeof value === 'boolean'
        ? value ? '1' : '0'
        : String(value),
    );
  }

  return formData;
};

/* ======================================================
   DENTIST SERVICE
====================================================== */

export const dentistService = {

  /**
   * Get the authenticated dentist's profile.
   *
   * GET /my/dentist-profile
   */
  async getMyProfile(): Promise<MyDentistProfileResponse> {
    const response = await api.get<MyDentistProfileResponse>(
      '/my/dentist-profile',
    );

    return response.data;
  },

  /**
   * Get dentists.
   *
   * GET /dentists
   */
  async getAll(
    params: PaginationParams = {},
  ): Promise<PaginatedDentistsResponse> {
    const response = await api.get<PaginatedDentistsResponse>(
      '/dentists',
      { params },
    );

    return response.data;
  },

  /**
   * Get a dentist by ID.
   *
   * GET /dentists/{id}
   */
  async getById(id: number): Promise<Dentist> {
    const response = await api.get<ApiResponse<Dentist>>(
      `/dentists/${id}`,
    );

    return response.data.data;
  },

  /**
   * Create a dentist profile.
   *
   * POST /dentists
   */
  async create(payload: DentistCreatePayload): Promise<Dentist> {
    const formData = await toFormData(payload);

    const response = await api.post<ApiResponse<Dentist>>(
      '/dentists',
      formData,
    );

    return response.data.data;
  },

  /**
   * Update a dentist profile.
   *
   * Uses Laravel method spoofing because multipart
   * PUT requests may not be parsed reliably by PHP.
   *
   * POST /dentists/{id} with _method=PUT
   */
  async update(
    id: number,
    payload: DentistUpdatePayload,
  ): Promise<Dentist> {
    const formData = await toFormData(payload);
    formData.append('_method', 'PUT');

    const response = await api.post<ApiResponse<Dentist>>(
      `/dentists/${id}`,
      formData,
    );

    return response.data.data;
  },

  /**
   * Partially update a dentist profile.
   *
   * Uses Laravel method spoofing.
   *
   * POST /dentists/{id} with _method=PATCH
   */
  async patch(
    id: number,
    payload: DentistUpdatePayload,
  ): Promise<Dentist> {
    const formData = await toFormData(payload);
    formData.append('_method', 'PATCH');

    const response = await api.post<ApiResponse<Dentist>>(
      `/dentists/${id}`,
      formData,
    );

    return response.data.data;
  },

  /**
   * Delete a dentist profile.
   *
   * DELETE /dentists/{id}
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/dentists/${id}`);
  },
};

/* ======================================================
   EXPORT
====================================================== */

export default dentistService;