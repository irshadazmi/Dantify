import api from "@/config/api";

import type {
  AssociationSchedule,
  AssociationScheduleApiResponse,
  AssociationScheduleListResponse,
  AssociationScheduleReviewResponse,
  CreateAssociationSchedulePayload,
} from "@/types/association-schedule";

const associationScheduleService = {
  /**
   * Get schedule proposals and history for an accepted association.
   * GET /associations/{inviteId}/schedules
   */
  async getSchedules(
    inviteId: number,
    page = 1,
  ): Promise<AssociationScheduleListResponse> {
    const response = await api.get<AssociationScheduleListResponse>(
      `/associations/${inviteId}/schedules`,
      { params: { page } },
    );

    return response.data;
  },

  /**
   * Submit a new schedule proposal.
   * POST /associations/{inviteId}/schedules
   */
  async createSchedule(
    inviteId: number,
    payload: CreateAssociationSchedulePayload,
  ): Promise<AssociationSchedule> {
    const response = await api.post<AssociationScheduleApiResponse>(
      `/associations/${inviteId}/schedules`,
      payload,
    );

    return response.data.data;
  },

  /**
   * Confirm a proposal or request changes.
   * PATCH /association-schedules/{scheduleId}/review
   */
  async reviewSchedule(
    scheduleId: number,
    responseType: AssociationScheduleReviewResponse,
  ): Promise<AssociationSchedule> {
    const response = await api.patch<AssociationScheduleApiResponse>(
      `/association-schedules/${scheduleId}/review`,
      { response: responseType },
    );

    return response.data.data;
  },

  /**
   * Cancel a proposal submitted by the current user.
   * PATCH /association-schedules/{scheduleId}/cancel
   */
  async cancelSchedule(
    scheduleId: number,
  ): Promise<AssociationSchedule> {
    const response = await api.patch<AssociationScheduleApiResponse>(
      `/association-schedules/${scheduleId}/cancel`,
    );

    return response.data.data;
  },
};

export default associationScheduleService;
