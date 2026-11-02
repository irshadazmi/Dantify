import api from '@/config/api';

export interface PublicSearchClinic {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
}

export interface PublicSearchDentist {
  id: number;
  user_id: number;
  name: string;
  specialization?: string | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  clinics: PublicSearchClinic[];
}

export interface DentistSearchParams {
  query?: string;
  location?: string;
  page?: number;
  per_page?: number;
}

export interface DentistSearchPagination {
  current_page: number;
  data: PublicSearchDentist[];
  first_page_url: string | null;
  from: number | null;
  last_page: number;
  last_page_url: string | null;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface DentistSearchResponse {
  message: string;
  data: DentistSearchPagination;
}

export interface PublicDentistProfileResponse {
  message: string;
  data: PublicSearchDentist;
}

const dentistSearchService = {
  /**
   * Search dentists linked to active clinics.
   * GET /booking/dentists
   *
   * The current Laravel implementation matches query against dentist name
   * and specialization, and location against clinic city, state or postal code.
   */
  async search(
    params: DentistSearchParams = {},
  ): Promise<DentistSearchResponse> {
    const response = await api.get<DentistSearchResponse>(
      '/booking/dentists',
      { params },
    );

    return response.data;
  },

  /**
   * Retrieve one publicly discoverable dentist and active clinic associations.
   * GET /booking/dentists/{id}
   */
  async getPublicById(id: number): Promise<PublicSearchDentist> {
    const response = await api.get<PublicDentistProfileResponse>(
      `/booking/dentists/${id}`,
    );

    return response.data.data;
  },
};

export default dentistSearchService;
