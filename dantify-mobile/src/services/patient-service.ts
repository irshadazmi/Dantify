import api from '@/config/api';

import type {
  ApiResponse,
  PaginationParams,
} from '@/types/api';

import type {
  Patient,
  PatientCreatePayload,
  PatientUpdatePayload,
  MyPatientProfileResponse,
  PaginatedPatientsResponse,
} from '@/types/patient';
import { Platform } from 'react-native';

/* ======================================================
   HELPERS
====================================================== */

type PatientFormPayload =
  | PatientCreatePayload
  | PatientUpdatePayload;

/**
 * Convert patient payload into FormData.
 *
 * Handles:
 * - Text and numeric fields
 * - Boolean fields as 1 or 0
 * - Profile photo as a React Native file object
 * - Undefined and null values by omitting them
 */
type PatientPhotoFile = {
  uri: string;
  name: string;
  type: string;
};

const toFormData = async (
  payload: PatientFormPayload,
): Promise<FormData> => {
  const formData = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (key === 'profile_photo') {
      const photo = value as PatientPhotoFile;

      if (Platform.OS === 'web') {
        const response = await fetch(photo.uri);

        if (!response.ok) {
          throw new Error(
            'Unable to read the selected patient profile photo.',
          );
        }

        const blob = await response.blob();
        const mimeType = photo.type || blob.type || 'image/jpeg';

        if (
          !['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)
        ) {
          throw new Error('Please select a JPG, PNG or WebP image.');
        }

        const imageFile = new File(
          [blob],
          photo.name || 'patient-profile.jpg',
          { type: mimeType },
        );

        formData.append('profile_photo', imageFile);
      } else {
        formData.append(
          'profile_photo',
          {
            uri: photo.uri,
            name: photo.name || 'patient-profile.jpg',
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

export const patientService = {

  /**
   * Get the authenticated patient's profile.
   *
   * GET /my/patient-profile
   */
  async getMyProfile(): Promise<MyPatientProfileResponse> {
    const response = await api.get<MyPatientProfileResponse>(
      '/my/patient-profile',
    );

    return response.data;
  },

  /**
   * Get patients.
   *
   * GET /patients
   */
  async getAll(
    params: PaginationParams = {},
  ): Promise<PaginatedPatientsResponse> {
    const response = await api.get<PaginatedPatientsResponse>(
      '/patients',
      { params },
    );

    return response.data;
  },

  /**
   * Get a patient by ID.
   *
   * GET /patients/{id}
   */
  async getById(id: number): Promise<Patient> {
    const response = await api.get<ApiResponse<Patient>>(
      `/patients/${id}`,
    );

    return response.data.data;
  },

  /**
   * Create a patient profile.
   *
   * POST /patients
   */
  async create(payload: PatientCreatePayload): Promise<Patient> {
    const formData = await toFormData(payload);

    const response = await api.post<ApiResponse<Patient>>(
      '/patients',
      formData,
    );

    return response.data.data;
  },

  /**
   * Update a patient profile.
   *
   * Uses Laravel method spoofing because multipart
   * PUT requests may not be parsed reliably by PHP.
   *
   * POST /patients/{id} with _method=PUT
   */
  async update(
    id: number,
    payload: PatientUpdatePayload,
  ): Promise<Patient> {
    const formData = await toFormData(payload);
    formData.append('_method', 'PUT');

    const response = await api.post<ApiResponse<Patient>>(
      `/patients/${id}`,
      formData,
    );

    return response.data.data;
  },

  /**
   * Partially update a patient profile.
   *
   * Uses Laravel method spoofing.
   *
   * POST /patients/{id} with _method=PATCH
   */
  async patch(
    id: number,
    payload: PatientUpdatePayload,
  ): Promise<Patient> {
    const formData = await toFormData(payload);
    formData.append('_method', 'PATCH');

    const response = await api.post<ApiResponse<Patient>>(
      `/patients/${id}`,
      formData,
    );

    return response.data.data;
  },

  /**
   * Delete a patient profile.
   *
   * DELETE /patients/{id}
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/patients/${id}`);
  },
};

/* ======================================================
   EXPORT
====================================================== */

export default patientService;