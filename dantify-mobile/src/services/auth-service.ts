import api from '@/config/api';

import type {
  AuthUser,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  OtpSendRequest,
  OtpSendResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  UserResponse,
} from '@/types/auth';

/* ======================================================
   RESPONSE HELPERS
====================================================== */

/**
 * Supports either:
 * - AuthUser
 * - { user: AuthUser }
 */
function unwrapUser(response: UserResponse): AuthUser {
  return 'user' in response ? response.user : response;
}

/**
 * Optional bearer-token configuration.
 */
function getAuthConfig(token?: string) {
  return token
    ? {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
    : undefined;
}

/* ======================================================
   AUTHENTICATION SERVICE
====================================================== */

class AuthService {

  /* ====================================================
     LOGIN

     POST /api/login
  ==================================================== */

  async login(
    email: string,
    password: string,
  ): Promise<LoginResponse> {
    const payload: LoginRequest = {
      email: email.trim(),
      password,
      device_name: 'Dantify Mobile',
    };

    const { data } = await api.post<LoginResponse>(
      '/login',
      payload,
    );

    return data;
  }

  /* ====================================================
     SEND OTP

     POST /api/otp/send
  ==================================================== */

  async sendOtp(
    phone: string,
  ): Promise<OtpSendResponse> {
    const payload: OtpSendRequest = {
      phone: phone.trim(),
    };

    const { data } = await api.post<OtpSendResponse>(
      '/otp/send',
      payload,
    );

    return data;
  }

  /* ====================================================
     VERIFY OTP

     POST /api/otp/verify
  ==================================================== */

  async verifyOtp(
    phone: string,
    otp: string,
  ): Promise<OtpVerifyResponse> {
    const payload: OtpVerifyRequest = {
      phone: phone.trim(),
      otp: otp.trim(),
    };

    const { data } = await api.post<OtpVerifyResponse>(
      '/otp/verify',
      payload,
    );

    return data;
  }

  /* ====================================================
     REGISTER

     POST /api/register
  ==================================================== */

  async register(
    payload: RegisterRequest,
  ): Promise<RegisterResponse> {
    const { data } = await api.post<RegisterResponse>(
      '/register',
      payload,
    );

    return data;
  }

  /* ====================================================
     CURRENT AUTHENTICATED USER

     GET /api/me
  ==================================================== */

  async me(token?: string): Promise<AuthUser> {
    const config = getAuthConfig(token);

    const { data } = await api.get<UserResponse>(
      '/me',
      config,
    );

    return unwrapUser(data);
  }

  /**
   * Alias for retrieving the current authenticated user.
   */
  async getCurrentUser(): Promise<AuthUser> {
    return this.me();
  }

  /* ====================================================
     LOGOUT

     POST /api/logout
  ==================================================== */

  async logout(token?: string): Promise<void> {
    await api.post(
      '/logout',
      {},
      getAuthConfig(token),
    );
  }

  /* ====================================================
     FORGOT PASSWORD

     POST /api/forgot-password
  ==================================================== */

  async forgotPassword(
    payload: ForgotPasswordRequest,
  ): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(
      '/forgot-password',
      payload,
    );

    return data;
  }

  /* ====================================================
     RESET PASSWORD

     POST /api/reset-password
  ==================================================== */

  async resetPassword(
    payload: ResetPasswordRequest,
  ): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>(
      '/reset-password',
      payload,
    );

    return data;
  }
}

/* ======================================================
   EXPORT
====================================================== */

export const authService = new AuthService();