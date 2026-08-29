import { api } from './api';

export interface RequestOtpPayload {
  phoneNumber: string;
}

export interface VerifyOtpPayload {
  phoneNumber: string;
  otp: string;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  phoneNumber: string;
  fullName: string;
  role: string;
  permissions: Record<string, { create: boolean; read: boolean; update: boolean; delete: boolean }>;
}

// Request OTP ke nomor telepon
export async function requestOtp(payload: RequestOtpPayload): Promise<{ message: string }> {
  const { data } = await api.post('/auth/otp/request', payload);
  return data.data;
}

// Verify OTP dan dapat tokens
export async function verifyOtp(payload: VerifyOtpPayload): Promise<AuthTokensResponse> {
  const { data } = await api.post('/auth/otp/verify', payload);
  return data.data;
}

// Refresh access token
export async function refreshToken(token: string): Promise<AuthTokensResponse> {
  const { data } = await api.post('/auth/refresh', { refreshToken: token });
  return data.data;
}

// Get profil user yang sedang login
export async function getProfile(): Promise<UserProfile> {
  const { data } = await api.get('/auth/me');
  return data.data;
}

// Logout — invalidate refresh token di server
export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}
