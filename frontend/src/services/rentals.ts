import { api } from './api';
import type { Rental, RentalStatus } from '../types';

export interface CreateRentalInput {
  componentId: string;
  startDate: string;
  endDate: string;
  message?: string;
}

export async function createRental(input: CreateRentalInput): Promise<Rental> {
  const res = await api.post<{ rental: Rental }>('/rentals', input);
  return res.data.rental;
}

export async function listRentals(role: 'renter' | 'owner'): Promise<Rental[]> {
  const res = await api.get<{ items: Rental[] }>('/rentals', { params: { role } });
  return res.data.items;
}

export async function updateRentalStatus(id: string, status: RentalStatus): Promise<Rental> {
  const res = await api.patch<{ rental: Rental }>(`/rentals/${id}/status`, { status });
  return res.data.rental;
}
