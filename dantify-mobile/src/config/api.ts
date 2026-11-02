
import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import Constants from 'expo-constants';

/* ======================================================
   BASE URL
   Expected value ends with /api
====================================================== */

const API_BASE_URL: string =
  Constants.expoConfig?.extra?.API_BASE_URL ??
  'http://192.168.29.62/api';

/* ======================================================
   TOKEN PROVIDER
   Auth context/service sets this provider.
====================================================== */

let getAccessToken: (() => Promise<string | null>) | null = null;

export const setAccessTokenProvider = (
  provider: () => Promise<string | null>,
): void => {
  getAccessToken = provider;
};

/* ======================================================
   AXIOS INSTANCE
====================================================== */

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

/* ======================================================
   REQUEST INTERCEPTOR
====================================================== */

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await getAccessToken?.();

      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    } catch (error) {
      console.warn('[API] Could not retrieve access token:', error);
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

/* ======================================================
   RESPONSE INTERCEPTOR
====================================================== */

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      console.log(
        '[API] Error:',
        error.response.status,
        error.config?.method?.toUpperCase(),
        error.config?.url,
        JSON.stringify(error.response.data, null, 2),
      );
    } else {
      console.log('[API] Network error:', error.message);
    }

    return Promise.reject(error);
  },
);

export default api;
