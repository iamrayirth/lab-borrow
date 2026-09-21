import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export interface ApiErrorBody {
  error: string;
  details?: Array<{ path: string; message: string }>;
}

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(err)) {
    const body = err.response?.data;
    if (body?.details?.length) {
      return body.details.map((d) => d.message).join(', ');
    }
    if (body?.error) {
      return body.error;
    }
  }
  return 'Something went wrong. Please try again.';
}
