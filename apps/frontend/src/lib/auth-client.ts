import { createAuthClient } from 'better-auth/react';
import { phoneNumberClient, adminClient } from 'better-auth/client/plugins';
import type {} from 'better-auth/plugins/access';

export const authClient = createAuthClient({
  // Kosong = relative URL, Vite proxy akan forward /api ke backend
  baseURL: '',
  basePath: '/api/v1/auth',
  plugins: [phoneNumberClient(), adminClient()],
});
