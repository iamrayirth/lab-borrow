import { api } from './api';
import type { Component, ComponentAvailability, ComponentCategory, PaginatedResult } from '../types';

export interface ListComponentsParams {
  search?: string;
  category?: ComponentCategory;
  availability?: ComponentAvailability;
  mine?: boolean;
  page?: number;
  limit?: number;
}

export async function listComponents(params: ListComponentsParams = {}): Promise<PaginatedResult<Component>> {
  const res = await api.get<PaginatedResult<Component>>('/components', {
    params: {
      ...params,
      mine: params.mine ? 'true' : undefined,
    },
  });
  return res.data;
}

export async function getComponent(id: string): Promise<Component> {
  const res = await api.get<{ component: Component }>(`/components/${id}`);
  return res.data.component;
}

export interface ComponentFormInput {
  name: string;
  category: ComponentCategory;
  description: string;
  condition: string;
  dailyPrice: number;
  securityDeposit: number;
}

export async function createComponent(input: ComponentFormInput): Promise<Component> {
  const res = await api.post<{ component: Component }>('/components', input);
  return res.data.component;
}

export async function updateComponent(id: string, input: Partial<ComponentFormInput>): Promise<Component> {
  const res = await api.patch<{ component: Component }>(`/components/${id}`, input);
  return res.data.component;
}

export async function deactivateComponent(id: string): Promise<Component> {
  const res = await api.delete<{ component: Component }>(`/components/${id}`);
  return res.data.component;
}

export async function uploadComponentImage(id: string, file: File): Promise<{ id: string; url: string }> {
  const form = new FormData();
  form.append('image', file);
  const res = await api.post<{ image: { id: string; url: string } }>(`/components/${id}/images`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.image;
}

export async function deleteComponentImage(componentId: string, imageId: string): Promise<void> {
  await api.delete(`/components/${componentId}/images/${imageId}`);
}
