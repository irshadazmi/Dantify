// src/services/appointment-service.ts

import api from '@/config/api';

import type {
  AppointmentCreateSchema,
  AppointmentUpdateSchema,
  AppointmentResponseSchema,
  AppointmentCancelSchema,
  AppointmentRescheduleSchema,
} from '@/types/appointment-schema';

const BASE_URL = '/appointments';

/* ======================================================
   RESPONSE NORMALIZATION

   Supports:
   - Direct array: [...]
   - Laravel resource collection: { data: [...] }
   - Nested collection: { data: { data: [...] } }
   - Direct resource: { id: 1, ... }
   - Laravel resource: { data: { id: 1, ... } }
====================================================== */

type ApiRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ApiRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function unwrapCollection<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (isRecord(response)) {
    const data = response.data;

    if (Array.isArray(data)) {
      return data as T[];
    }

    if (isRecord(data) && Array.isArray(data.data)) {
      return data.data as T[];
    }
  }

  throw new Error(
    'Invalid appointments response: expected an array or Laravel collection.'
  );
}

function unwrapResource<T>(response: unknown): T {
  if (!isRecord(response)) {
    throw new Error(
      'Invalid appointment response: expected an appointment object.'
    );
  }

  const data = response.data;

  if (isRecord(data)) {
    return data as T;
  }

  return response as T;
}

/* ======================================================
   APPOINTMENT SERVICE
====================================================== */

export const appointmentService = {
  /* ====================================================
     READ
  ==================================================== */

  async getAll(): Promise<AppointmentResponseSchema[]> {
    const res = await api.get<unknown>(BASE_URL);

    return unwrapCollection<AppointmentResponseSchema>(
      res.data
    );
  },

  async getById(
    appointmentId: number
  ): Promise<AppointmentResponseSchema> {
    const res = await api.get<unknown>(
      `${BASE_URL}/${appointmentId}`
    );

    return unwrapResource<AppointmentResponseSchema>(
      res.data
    );
  },

  async getByPatient(
    patientId: number
  ): Promise<AppointmentResponseSchema[]> {
    const res = await api.get<unknown>(
      `${BASE_URL}/patient/${patientId}`
    );

    return unwrapCollection<AppointmentResponseSchema>(
      res.data
    );
  },

  async getByClinic(
    clinicId: number
  ): Promise<AppointmentResponseSchema[]> {
    const res = await api.get<unknown>(
      `${BASE_URL}/clinic/${clinicId}`
    );

    return unwrapCollection<AppointmentResponseSchema>(
      res.data
    );
  },

  async getByDentist(
    dentistId: number
  ): Promise<AppointmentResponseSchema[]> {
    const res = await api.get<unknown>(
      `${BASE_URL}/dentist/${dentistId}`
    );

    return unwrapCollection<AppointmentResponseSchema>(
      res.data
    );
  },

  /* ====================================================
     CREATE
  ==================================================== */

  async create(
    payload: AppointmentCreateSchema
  ): Promise<AppointmentResponseSchema> {
    const res = await api.post<unknown>(
      BASE_URL,
      payload
    );

    return unwrapResource<AppointmentResponseSchema>(
      res.data
    );
  },

  /* ====================================================
     UPDATE
  ==================================================== */

  async update(
    appointmentId: number,
    payload: AppointmentUpdateSchema
  ): Promise<AppointmentResponseSchema> {
    const res = await api.put<unknown>(
      `${BASE_URL}/${appointmentId}`,
      payload
    );

    return unwrapResource<AppointmentResponseSchema>(
      res.data
    );
  },

  /* ====================================================
     CANCEL
  ==================================================== */

  async cancel(
    appointmentId: number,
    payload: AppointmentCancelSchema
  ): Promise<AppointmentResponseSchema> {
    const res = await api.post<unknown>(
      `${BASE_URL}/${appointmentId}/cancel`,
      payload
    );

    return unwrapResource<AppointmentResponseSchema>(
      res.data
    );
  },

  /* ====================================================
     RESCHEDULE
  ==================================================== */

  async reschedule(
    appointmentId: number,
    payload: AppointmentRescheduleSchema
  ): Promise<AppointmentResponseSchema> {
    const res = await api.post<unknown>(
      `${BASE_URL}/${appointmentId}/reschedule`,
      payload
    );

    return unwrapResource<AppointmentResponseSchema>(
      res.data
    );
  },

  /* ====================================================
     DELETE

     Assumes the Laravel endpoint uses DELETE and
     performs a soft delete if that is backend policy.
  ==================================================== */

  async remove(appointmentId: number): Promise<void> {
    await api.delete<unknown>(
      `${BASE_URL}/${appointmentId}`
    );
  },
};