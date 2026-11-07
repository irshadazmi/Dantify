import { Platform } from 'react-native';
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
   FORM DATA HELPER
====================================================== */

type ClinicFormPayload =
  | ClinicCreatePayload
  | ClinicUpdatePayload;

type ClinicPhotoFile = {
  uri: string;
  name: string;
  type: string;
};

async function toFormData(payload: ClinicFormPayload): Promise<FormData> {
  const formData = new FormData();

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (key === 'profile_photo') {
      const photo = value as ClinicPhotoFile;

      if (Platform.OS === 'web') {
        const response = await fetch(photo.uri);

        if (!response.ok) {
          throw new Error('Unable to read the selected clinic profile photo.');
        }

        const blob = await response.blob();
        const mimeType = photo.type || blob.type || 'image/jpeg';

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
          throw new Error(`Unsupported clinic photo format: ${mimeType}`);
        }

        const imageFile = new File(
          [blob],
          photo.name || 'clinic-profile.jpg',
          { type: mimeType },
        );

        formData.append('profile_photo', imageFile);
      } else {
        formData.append(
          'profile_photo',
          {
            uri: photo.uri,
            name: photo.name || 'clinic-profile.jpg',
            type: photo.type || 'image/jpeg',
          } as any,
        );
      }

      continue;
    }

    formData.append(
      key,
      typeof value === 'boolean' ? (value ? '1' : '0') : String(value),
    );
  }

  return formData;
}

/* ======================================================
   CLINIC SERVICE
====================================================== */

export const clinicService = {
  /**
   * GET /my/clinic-profile
   */
  async getMyProfile(): Promise<MyClinicProfileResponse> {
    const response = await api.get<MyClinicProfileResponse>(
      '/my/clinic-profile',
    );

    return response.data;
  },

  /**
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
   * GET /clinics/{id}
   */
  async getById(id: number): Promise<Clinic> {
    const response = await api.get<ApiResponse<Clinic>>(`/clinics/${id}`);

    return response.data.data;
  },

  /**
   * POST /clinics
   */
  async create(payload: ClinicCreatePayload): Promise<Clinic> {
    const formData = await toFormData(payload);
    const response = await api.post<ApiResponse<Clinic>>(
      '/clinics',
      formData,
    );

    return response.data.data;
  },

  /**
   * POST /clinics/{id} with _method=PUT
   */
  async update(
    id: number,
    payload: ClinicUpdatePayload,
  ): Promise<Clinic> {
    const formData = await toFormData(payload);
    formData.append('_method', 'PUT');

    const response = await api.post<ApiResponse<Clinic>>(
      `/clinics/${id}`,
      formData,
    );

    return response.data.data;
  },

  /**
   * POST /clinics/{id} with _method=PATCH
   */
  async patch(
    id: number,
    payload: ClinicUpdatePayload,
  ): Promise<Clinic> {
    const formData = await toFormData(payload);
    formData.append('_method', 'PATCH');

    const response = await api.post<ApiResponse<Clinic>>(
      `/clinics/${id}`,
      formData,
    );

    return response.data.data;
  },

  /**
   * Administrative deletion only. Do not expose in self-service screens.
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/clinics/${id}`);
  },
};

export default clinicService;
