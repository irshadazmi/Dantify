import api from '@/config/api';

import type {
  ClinicDentistInvite,
  ClinicDentistInviteApiResponse,
  ClinicDentistInviteListResponse,
  CreateClinicInvitePayload,
  CreateDentistInvitePayload,
  RespondToInvitePayload,
} from '@/types/clinic-dentist-invite';

import type { PaginationParams } from '@/types/api';

/* ======================================================
   CLINIC-DENTIST INVITATION SERVICE
====================================================== */

const clinicDentistInviteService = {

  /* ====================================================
     CLINIC INVITES DENTIST

     POST /clinics/{clinicId}/dentist-invites
  ==================================================== */

  async inviteDentist(
    clinicId: number,
    payload: CreateClinicInvitePayload,
  ): Promise<ClinicDentistInvite> {
    const response = await api.post<ClinicDentistInviteApiResponse>(
      `/clinics/${clinicId}/dentist-invites`,
      payload,
    );

    return response.data.data;
  },

  /* ====================================================
     DENTIST INVITES CLINIC

     POST /dentists/{dentistId}/clinic-invites
  ==================================================== */

  async inviteClinic(
    dentistId: number,
    payload: CreateDentistInvitePayload,
  ): Promise<ClinicDentistInvite> {
    const response = await api.post<ClinicDentistInviteApiResponse>(
      `/dentists/${dentistId}/clinic-invites`,
      payload,
    );

    return response.data.data;
  },

  /* ====================================================
     GET DENTIST INVITATIONS

     GET /my/dentist-invites
  ==================================================== */

  async getMyDentistInvites(
    params: PaginationParams = {},
  ): Promise<ClinicDentistInviteListResponse> {
    const response = await api.get<ClinicDentistInviteListResponse>(
      '/my/dentist-invites',
      {
        params: {
          page: params.page ?? 1,
          ...(params.per_page !== undefined
            ? { per_page: params.per_page }
            : {}),
        },
      },
    );

    return response.data;
  },

  /* ====================================================
     GET CLINIC INVITATIONS

     GET /my/clinic-dentist-invites
  ==================================================== */

  async getMyClinicInvites(
    params: PaginationParams = {},
  ): Promise<ClinicDentistInviteListResponse> {
    const response = await api.get<ClinicDentistInviteListResponse>(
      '/my/clinic-dentist-invites',
      {
        params: {
          page: params.page ?? 1,
          ...(params.per_page !== undefined
            ? { per_page: params.per_page }
            : {}),
        },
      },
    );

    return response.data;
  },

  /* ====================================================
     RESPOND TO INVITATION

     PATCH /dentist-invites/{inviteId}/respond
  ==================================================== */

  async respondToInvite(
    inviteId: number,
    payload: RespondToInvitePayload,
  ): Promise<ClinicDentistInvite> {
    const response = await api.patch<ClinicDentistInviteApiResponse>(
      `/dentist-invites/${inviteId}/respond`,
      payload,
    );

    return response.data.data;
  },
};

/* ======================================================
   EXPORT
====================================================== */

export default clinicDentistInviteService;