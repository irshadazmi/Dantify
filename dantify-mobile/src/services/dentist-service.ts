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

type DentistFormPayload = DentistCreatePayload | DentistUpdatePayload;

function toFormData(payload: DentistFormPayload): FormData {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (key === 'profile_photo') {
      const photo = value as NonNullable<DentistCreatePayload['profile_photo']>;
      formData.append('profile_photo', {
        uri: photo.uri,
        name: photo.name,
        type: photo.type,
      } as unknown as Blob);
      return;
    }

    formData.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
  });

  return formData;
}

export const dentistService = {
  async getMyProfile(): Promise<MyDentistProfileResponse> {
    const response = await api.get<MyDentistProfileResponse>('/my/dentist-profile');
    return response.data;
  },

  async getAll(params?: { page?: number; per_page?: number }): Promise<PaginatedDentistsResponse> {
    const response = await api.get<PaginatedDentistsResponse>('/dentists', { params });
    return response.data;
  },

  async getById(id: number): Promise<Dentist> {
    const response = await api.get<DentistApiResponse>(`/dentists/${id}`);
    return response.data.data;
  },

  async create(payload: DentistCreatePayload): Promise<Dentist> {
    const response = await api.post<DentistApiResponse>('/dentists', toFormData(payload));
    return response.data.data;
  },

  async update(id: number, payload: DentistUpdatePayload): Promise<Dentist> {
    // Laravel/PHP does not reliably parse multipart PUT bodies. Use method
    // spoofing so Laravel receives the multipart fields as a POST request.
    const formData = toFormData(payload);
    formData.append('_method', 'PUT');
    const response = await api.post<DentistApiResponse>(`/dentists/${id}`, formData);
    return response.data.data;
  },

  async patch(id: number, payload: DentistUpdatePayload): Promise<Dentist> {
    const formData = toFormData(payload);
    formData.append('_method', 'PATCH');
    const response = await api.post<DentistApiResponse>(`/dentists/${id}`, formData);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/dentists/${id}`);
  },
};

export default dentistService;
