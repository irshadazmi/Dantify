import api from '@/config/api';

import type {
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';

import type {
  ClinicDentistInviteStatus,
} from '@/types/clinic-dentist-invite';

/* ======================================================
   DISCOVERABLE CLINIC
====================================================== */

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

  invite_status: ClinicDentistInviteStatus | null;
  invite_id: number | null;
  invite_initiated_by_user_id: number | null;
}

/* ======================================================
   DISCOVERABLE DENTIST
====================================================== */

export interface DiscoverableDentist {
  id: number;
  user_id?: number;
  name: string;

  specialization?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;

  is_associated: boolean;

  invite_status: ClinicDentistInviteStatus | null;
  invite_id: number | null;
  invite_initiated_by_user_id: number | null;
}

/* ======================================================
   DISCOVERY PARAMETERS
====================================================== */

export interface DiscoveryParams {
  query?: string;
  location?: string;
  search_all?: boolean;
  page?: number;
}

/* ======================================================
   RESPONSE TYPES
====================================================== */

export type DiscoveryListResponse<T> =
  ApiResponse<PaginatedResponse<T>>;

/* ======================================================
   PARAMETER BUILDER
====================================================== */

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

/* ======================================================
   ASSOCIATION DISCOVERY SERVICE
====================================================== */

const associationDiscoveryService = {

  /* ====================================================
     DISCOVER DENTISTS

     GET /api/dentists/discover
  ==================================================== */

  async discoverDentists(
    params: DiscoveryParams = {},
  ): Promise<DiscoveryListResponse<DiscoverableDentist>> {
    const response = await api.get<
      DiscoveryListResponse<DiscoverableDentist>
    >(
      '/dentists/discover',
      { params: buildDiscoveryParams(params) },
    );

    return response.data;
  },

  /* ====================================================
     DISCOVER CLINICS

     GET /api/clinics/discover
  ==================================================== */

  async discoverClinics(
    params: DiscoveryParams = {},
  ): Promise<DiscoveryListResponse<DiscoverableClinic>> {
    const response = await api.get<
      DiscoveryListResponse<DiscoverableClinic>
    >(
      '/clinics/discover',
      { params: buildDiscoveryParams(params) },
    );

    return response.data;
  },
};

export default associationDiscoveryService;