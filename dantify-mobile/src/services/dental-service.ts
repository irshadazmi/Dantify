import api from '@/config/api';

import type {
  ApiResponse,
  PaginatedResponse,
  Service,
  ClinicService,
  ServiceListParams,
  CreateServicePayload,
  UpdateServicePayload,
  AddClinicServicePayload,
  UpdateClinicServicePayload,
} from '@/types/service';

function buildParams(params: ServiceListParams = {}) {
  return {
    ...params,
    is_active:
      params.is_active === undefined
        ? undefined
        : Number(params.is_active),
  };
}

/* ======================================================
   SUPER ADMIN — COMMON SERVICE CATALOGUE
====================================================== */

export const getServices = async (
  params: ServiceListParams = {},
) => {
  const response = await api.get<
    ApiResponse<PaginatedResponse<Service>>
  >('/services', {
    params: buildParams(params),
  });

  return response.data.data;
};

export const getService = async (id: number) => {
  const response = await api.get<ApiResponse<Service>>(
    `/services/${id}`,
  );

  return response.data.data;
};

export const createService = async (
  payload: CreateServicePayload,
) => {
  const response = await api.post<ApiResponse<Service>>(
    '/services',
    payload,
  );

  return response.data.data;
};

export const updateService = async (
  id: number,
  payload: UpdateServicePayload,
) => {
  const response = await api.put<ApiResponse<Service>>(
    `/services/${id}`,
    payload,
  );

  return response.data.data;
};

export const updateServiceStatus = async (
  id: number,
  is_active: boolean,
) => {
  const response = await api.patch<ApiResponse<Service>>(
    `/services/${id}/status`,
    { is_active },
  );

  return response.data.data;
};

/* ======================================================
   CLINIC — CLINIC SERVICES
====================================================== */

export const getClinicServices = async (
  params: ServiceListParams = {},
) => {
  const response = await api.get<
    ApiResponse<PaginatedResponse<ClinicService>>
  >('/clinic/services', {
    params: buildParams(params),
  });

  return response.data.data;
};

export const getAvailableServiceCatalogue = async (
  params: ServiceListParams = {},
) => {
  const response = await api.get<
    ApiResponse<PaginatedResponse<Service>>
  >('/clinic/services/catalogue', {
    params: buildParams(params),
  });

  return response.data.data;
};

export const addClinicService = async (
  payload: AddClinicServicePayload,
) => {
  const response = await api.post<ApiResponse<ClinicService>>(
    '/clinic/services',
    payload,
  );

  return response.data.data;
};

export const updateClinicService = async (
  id: number,
  payload: UpdateClinicServicePayload,
) => {
  const response = await api.put<ApiResponse<ClinicService>>(
    `/clinic/services/${id}`,
    payload,
  );

  return response.data.data;
};

export const updateClinicServiceStatus = async (
  id: number,
  is_active: boolean,
) => {
  const response = await api.patch<ApiResponse<ClinicService>>(
    `/clinic/services/${id}/status`,
    { is_active },
  );

  return response.data.data;
};