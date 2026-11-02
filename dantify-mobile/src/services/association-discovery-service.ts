import api from '@/config/api';

export type AssociationInviteStatus = 'pending' | 'accepted' | 'declined' | null;

export interface DiscoverableClinic {
  id: number;
  user_id?: number;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
  is_active?: boolean;
  is_associated: boolean;
  invite_status: AssociationInviteStatus;
  invite_id: number | null;
  invite_initiated_by_user_id: number | null;
}

export interface DiscoverableDentist {
  id: number;
  user_id?: number;
  name: string;
  specialization?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  is_associated: boolean;
  invite_status: string | null;
  invite_id: number | null;
  invite_initiated_by_user_id: number | null;
}

export interface PaginatedData<T> {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
}

interface ApiListResponse<T> {
  message: string;
  data: PaginatedData<T>;
}

interface DiscoveryParams {
  query?: string;
  location?: string;
  search_all?: boolean;
  page?: number;
}

function buildDiscoveryParams(params: DiscoveryParams = {}) {
  return {
    per_page: 15,
    page: params.page ?? 1,
    ...(params.query?.trim()
      ? { query: params.query.trim() }
      : {}),
    ...(params.location?.trim()
      ? { location: params.location.trim() }
      : {}),
    ...(params.search_all !== undefined
      ? { search_all: params.search_all ? 1 : 0 }
      : {}),
  };
}

const associationDiscoveryService = {
  async discoverDentists(params: DiscoveryParams = {}) {
    const response = await api.get<ApiListResponse<DiscoverableDentist>>(
      '/dentists/discover',
      { params: buildDiscoveryParams(params) },
    );

    return response.data;
  },

  async discoverClinics(params: DiscoveryParams = {}) {
    const response = await api.get<ApiListResponse<DiscoverableClinic>>(
      '/clinics/discover',
      { params: buildDiscoveryParams(params) },
    );

    return response.data;
  },
};

export default associationDiscoveryService;