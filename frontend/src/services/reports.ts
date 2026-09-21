import { api } from './api';

export interface CreateReportInput {
  targetType: 'USER' | 'COMPONENT';
  targetId: string;
  reason: string;
  description: string;
}

export async function createReport(input: CreateReportInput): Promise<void> {
  await api.post('/reports', input);
}
