/* src/services/auth-service.ts */
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
  UpdateUserRequest,
  UserResponse,
} from '@/types/auth';

function unwrapUser(response: UserResponse): AuthUser {
  return 'user' in response ? response.user : response;
}

class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    const payload: LoginRequest = {
      email: email.trim(),
      password,
      device_name: 'Dantify Mobile',
    };

    const { data } = await api.post<LoginResponse>('/login', payload);
    return data;
  }

  async sendOtp(phone: string): Promise<OtpSendResponse> {
    const payload: OtpSendRequest = { phone: phone.trim() };
    const { data } = await api.post<OtpSendResponse>('/otp/send', payload);
    return data;
  }

  async verifyOtp(phone: string, otp: string): Promise<OtpVerifyResponse> {
    const payload: OtpVerifyRequest = {
      phone: phone.trim(),
      otp: otp.trim(),
    };

    const { data } = await api.post<OtpVerifyResponse>('/otp/verify', payload);
    return data;
  }

  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    // The shared api instance already has /api in its baseURL.
    console.log('[Registration] Role in payload:', payload.role);

    const { data } = await api.post<RegisterResponse>(
      '/register',
      payload
    );

    return data;
  }

  async me(token?: string): Promise<AuthUser> {
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined;
    const { data } = await api.get<UserResponse>('/me', config);
    return unwrapUser(data);
  }

  async getCurrentUser(): Promise<AuthUser> {
    return this.me();
  }

  async getById(userId: number, token?: string): Promise<AuthUser> {
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined;
    const { data } = await api.get<UserResponse>(`/users/${userId}`, config);
    return unwrapUser(data);
  }

  async update(
    userId: number,
    payload: UpdateUserRequest,
    token?: string,
  ): Promise<AuthUser> {
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined;
    const { data } = await api.put<UserResponse>(`/users/${userId}`, payload, config);
    return unwrapUser(data);
  }

  async logout(token?: string): Promise<void> {
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined;
    await api.post('/logout', {}, config);
  }

  async forgotPassword(payload: ForgotPasswordRequest): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/forgot-password', payload);
    return data;
  }

  async resetPassword(payload: ResetPasswordRequest): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/reset-password', payload);
    return data;
  }
}

export const authService = new AuthService();
