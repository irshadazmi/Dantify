import api from '@/config/api';
import type {
  Patient,
  PatientCreateRequest,
  PatientUpdateRequest,
  MyPatientProfileResponse,
} from '@/types/patient';

export const patientService = {
  /**
   * Get the logged-in patient's profile.
   * Returns null when the profile does not exist.
   */
  async getMyProfile(): Promise<Patient | null> {
    try {
      const response = await api.get<MyPatientProfileResponse>(
        '/my/patient-profile',
      );

      return response.data.data ?? null;
    } catch (error: unknown) {
      const status = (
        error as { response?: { status?: number } } | null
      )?.response?.status;

      if (status === 404) {
        return null;
      }

      throw error;
    }
  },

  /**
   * Create a patient profile.
   * Expects the backend to return { data: Patient }.
   */
  async create(payload: PatientCreateRequest): Promise<Patient> {
    const response = await api.post<{ data: Patient }>(
      '/patients',
      payload,
    );

    return response.data.data;
  },

  /**
   * Update an existing patient profile.
   * Expects the backend to return { data: Patient }.
   */
  async update(
    id: number,
    payload: PatientUpdateRequest,
  ): Promise<Patient> {
    const response = await api.put<{ data: Patient }>(
      `/patients/${id}`,
      payload,
    );

    return response.data.data;
  },
};

export default patientService;