import api from '@/config/api';

import type {
  AssociationSchedule,
  AssociationScheduleApiResponse,
  AssociationScheduleListResponse,
  AssociationScheduleReviewResponse,
  CreateAssociationSchedulePayload,
} from '@/types/association-schedule';

import type { PaginationParams } from '@/types/api';

/* ======================================================
   ASSOCIATION SCHEDULE SERVICE
====================================================== */

const BASE_URL = '/associations';
const SCHEDULE_BASE_URL = '/association-schedules';

const associationScheduleService = {

  /* ====================================================
     GET ASSOCIATION SCHEDULES

     GET /associations/{inviteId}/schedules
  ==================================================== */

  async getSchedules(
    inviteId: number,
    params: PaginationParams = {},
  ): Promise<AssociationScheduleListResponse> {
    const response = await api.get<AssociationScheduleListResponse>(
      `${BASE_URL}/${inviteId}/schedules`,
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
     CREATE SCHEDULE PROPOSAL

     POST /associations/{inviteId}/schedules
  ==================================================== */

  async createSchedule(
    inviteId: number,
    payload: CreateAssociationSchedulePayload,
  ): Promise<AssociationSchedule> {
    const response = await api.post<AssociationScheduleApiResponse>(
      `${BASE_URL}/${inviteId}/schedules`,
      payload,
    );

    return response.data.data;
  },

  /* ====================================================
     REVIEW SCHEDULE PROPOSAL

     PATCH /association-schedules/{scheduleId}/review
  ==================================================== */

  async reviewSchedule(
    scheduleId: number,
    responseType: AssociationScheduleReviewResponse,
  ): Promise<AssociationSchedule> {
    const response = await api.patch<AssociationScheduleApiResponse>(
      `${SCHEDULE_BASE_URL}/${scheduleId}/review`,
      {
        response: responseType,
      },
    );

    return response.data.data;
  },

  /* ====================================================
     CANCEL SCHEDULE PROPOSAL

     PATCH /association-schedules/{scheduleId}/cancel
  ==================================================== */

  async cancelSchedule(
    scheduleId: number,
  ): Promise<AssociationSchedule> {
    const response = await api.patch<AssociationScheduleApiResponse>(
      `${SCHEDULE_BASE_URL}/${scheduleId}/cancel`,
    );

    return response.data.data;
  },
};

export default associationScheduleService;