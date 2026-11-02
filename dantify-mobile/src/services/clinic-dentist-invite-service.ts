
import api from '@/config/api';

import type {
  ClinicDentistInvite,
  ClinicDentistInviteApiResponse,
  ClinicDentistInviteListResponse,
  CreateClinicInvitePayload,
  CreateDentistInvitePayload,
  RespondToInvitePayload,
} from '@/types/clinic-dentist-invite';

const clinicDentistInviteService = {
  /**
   * Clinic initiates an invitation to a dentist.
   * POST /clinics/{clinicId}/dentist-invites
   */
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

  /**
   * Dentist initiates an invitation to a clinic.
   * POST /dentists/{dentistId}/clinic-invites
   */
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

  /**
   * Get invitations for the authenticated dentist.
   * GET /my/dentist-invites
   */
  async getMyDentistInvites(
    page = 1,
  ): Promise<ClinicDentistInviteListResponse> {
    const response = await api.get<ClinicDentistInviteListResponse>(
      '/my/dentist-invites',
      { params: { page } },
    );

    return response.data;
  },

  /**
   * Get invitations for the authenticated clinic.
   * GET /my/clinic-dentist-invites
   */
  async getMyClinicInvites(
    page = 1,
  ): Promise<ClinicDentistInviteListResponse> {
    const response = await api.get<ClinicDentistInviteListResponse>(
      '/my/clinic-dentist-invites',
      { params: { page } },
    );

    return response.data;
  },

  /**
   * Accept or decline a pending invitation.
   * PATCH /dentist-invites/{inviteId}/respond
   */
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

export default clinicDentistInviteService;
