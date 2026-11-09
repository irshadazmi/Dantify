import api from '@/config/api';

import type {
  BookingCreatePayload,
  BookingUpdatePayload,
  BookingResponse,
  BookingListResponse,
  BookingListParams,
  BookingServicePayload,
  BookingStatusHistory,
  BookingChangeRequest,
  BookingChangeRequestPayload,
  BookingStatusUpdatePayload,
  BookingChangeRequestReviewPayload,
} from '@/types/booking';

const BASE_URL = '/bookings';

export interface PublicClinicServiceOffering {
  id: number;
  clinic_id: number;
  dental_service_id: number;
  price: string | number;
  duration_minutes: number;
  is_active: boolean;
  dental_service: {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
  };
}

export interface PublicClinicServicesResponse {
  message: string;
  data: {
    current_page: number;
    data: PublicClinicServiceOffering[];
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface BookingAvailabilityParams {
  dentist_id: number;
  clinic_id: number;
  date: string;
  services: BookingServicePayload[];
  exclude_booking_id?: number;
}

export interface BookingAvailableSlot {
  start_time: string;
  end_time: string;
  duration_minutes: number;
  available: boolean;
}

export interface BookingAvailabilityResponse {
  message: string;
  data: {
    dentist_id?: number;
    clinic_id?: number;
    date: string;
    duration_minutes: number;
    slots: BookingAvailableSlot[];
  };
}

export interface BookingCheckSlotParams {
  dentist_id: number;
  clinic_id: number;
  date: string;
  start_time: string;
  services: BookingServicePayload[];
  exclude_booking_id?: number;
}

export interface BookingCheckSlotResponse {
  message: string;
  data: {
    available: boolean;
    date?: string;
    start_time?: string;
    end_time?: string;
    duration_minutes?: number;
    reason?: string | null;
  };
}

function buildServiceQueryParams(
  services: BookingServicePayload[],
): Record<string, number> {
  const params: Record<string, number> = {};
  services.forEach((service, index) => {
    params[`services[${index}][clinic_service_offering_id]`] =
      service.clinic_service_offering_id;
    params[`services[${index}][quantity]`] = service.quantity ?? 1;
  });
  return params;
}

export const bookingService = {
  async getAll(params?: BookingListParams): Promise<BookingListResponse> {
    const response = await api.get<BookingListResponse>(BASE_URL, { params });
    return response.data;
  },

  async getById(bookingId: number): Promise<BookingResponse> {
    const response = await api.get<BookingResponse>(`${BASE_URL}/${bookingId}`);
    return response.data;
  },

  async getPublicClinicServices(
    clinicId: number,
    page = 1,
  ): Promise<PublicClinicServicesResponse> {
    const response = await api.get<PublicClinicServicesResponse>(
      `/public/clinics/${clinicId}/services`,
      { params: { page } },
    );
    return response.data;
  },

  async getAvailability(
    params: BookingAvailabilityParams,
  ): Promise<BookingAvailabilityResponse> {
    const response = await api.get<BookingAvailabilityResponse>(
      `${BASE_URL}/availability`,
      {
        params: {
          dentist_id: params.dentist_id,
          clinic_id: params.clinic_id,
          date: params.date,
          ...buildServiceQueryParams(params.services),
          ...(params.exclude_booking_id ? { exclude_booking_id: params.exclude_booking_id } : {}),
        },
      },
    );
    return response.data;
  },

  async checkSlot(
    params: BookingCheckSlotParams,
  ): Promise<BookingCheckSlotResponse> {
    const response = await api.get<BookingCheckSlotResponse>(
      `${BASE_URL}/check-slot`,
      {
        params: {
          dentist_id: params.dentist_id,
          clinic_id: params.clinic_id,
          date: params.date,
          start_time: params.start_time,
          ...buildServiceQueryParams(params.services),
          ...(params.exclude_booking_id ? { exclude_booking_id: params.exclude_booking_id } : {}),
        },
      },
    );
    return response.data;
  },

  async create(payload: BookingCreatePayload): Promise<BookingResponse> {
    const response = await api.post<BookingResponse>(BASE_URL, payload);
    return response.data;
  },

  async update(
    bookingId: number,
    payload: BookingUpdatePayload,
  ): Promise<BookingResponse> {
    const response = await api.put<BookingResponse>(
      `${BASE_URL}/${bookingId}`,
      payload,
    );
    return response.data;
  },

  async updateStatus(
    bookingId: number,
    payload: BookingStatusUpdatePayload,
  ): Promise<BookingResponse> {
    const response = await api.patch<BookingResponse>(
      `${BASE_URL}/${bookingId}/status`, payload,
    );
    return response.data;
  },

  async getHistory(bookingId: number): Promise<{ data: BookingStatusHistory[] }> {
    const response = await api.get<{ data: BookingStatusHistory[] }>(
      `${BASE_URL}/${bookingId}/history`,
    );
    return response.data;
  },

  async getChangeRequests(bookingId: number): Promise<{ data: BookingChangeRequest[] }> {
    const response = await api.get<{ data: BookingChangeRequest[] }>(
      `${BASE_URL}/${bookingId}/change-requests`,
    );
    return response.data;
  },

  async createChangeRequest(
    bookingId: number,
    payload: BookingChangeRequestPayload,
  ): Promise<{ message: string; data: BookingChangeRequest }> {
    const response = await api.post<{ message: string; data: BookingChangeRequest }>(
      `${BASE_URL}/${bookingId}/change-requests`, payload,
    );
    return response.data;
  },

  async reviewChangeRequest(
    requestId: number,
    payload: BookingChangeRequestReviewPayload,
  ): Promise<{ message: string; data: BookingChangeRequest; replacement_booking?: unknown }> {
    const response = await api.patch(
      `/booking-change-requests/${requestId}/review`, payload,
    );
    return response.data;
  },
};

export default bookingService;
