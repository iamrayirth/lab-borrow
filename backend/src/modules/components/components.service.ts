import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { AppError } from '../../utils/AppError';
import type { CreateComponentInput, ListComponentsQuery, UpdateComponentInput } from './components.schemas';

const componentWithRelations = {
  owner: true,
  images: true,
} satisfies Prisma.ComponentInclude;

export async function listComponents(query: ListComponentsQuery, requesterId?: string) {
  const { search, category, availability, mine, page, limit } = query;

  const where: Prisma.ComponentWhereInput = {};

  if (mine === 'true') {
    if (!requesterId) {
      throw AppError.unauthorized('Authentication required to view your own listings');
    }
    where.ownerId = requesterId;
  } else {
    where.isActive = true;
  }

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }
  if (category) {
    where.category = category;
  }
  if (availability) {
    where.availability = availability;
  }

  const [items, total] = await prisma.$transaction([
    prisma.component.findMany({
      where,
      include: componentWithRelations,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.component.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getComponentById(id: string, requesterId?: string) {
  const component = await prisma.component.findUnique({
    where: { id },
    include: componentWithRelations,
  });

  if (!component) {
    throw AppError.notFound('Component not found');
  }

  const isOwner = requesterId === component.ownerId;
  if (!component.isActive && !isOwner) {
    throw AppError.notFound('Component not found');
  }

  return component;
}

export async function createComponent(ownerId: string, input: CreateComponentInput) {
  return prisma.component.create({
    data: {
      ...input,
      ownerId,
    },
    include: componentWithRelations,
  });
}

async function assertOwnership(componentId: string, userId: string) {
  const component = await prisma.component.findUnique({ where: { id: componentId } });
  if (!component) {
    throw AppError.notFound('Component not found');
  }
  if (component.ownerId !== userId) {
    throw AppError.forbidden('You do not have permission to modify this component');
  }
  return component;
}

export async function updateComponent(componentId: string, userId: string, input: UpdateComponentInput) {
  const component = await assertOwnership(componentId, userId);

  const { isActive, ...rest } = input;
  const data: Prisma.ComponentUpdateInput = { ...rest };

  if (isActive !== undefined) {
    data.isActive = isActive;
    if (component.availability !== 'RENTED') {
      data.availability = isActive ? 'AVAILABLE' : 'INACTIVE';
    }
  }

  return prisma.component.update({
    where: { id: componentId },
    data,
    include: componentWithRelations,
  });
}

export async function deactivateComponent(componentId: string, userId: string) {
  const component = await assertOwnership(componentId, userId);

  return prisma.component.update({
    where: { id: componentId },
    data: {
      isActive: false,
      availability: component.availability === 'RENTED' ? 'RENTED' : 'INACTIVE',
    },
    include: componentWithRelations,
  });
}

export async function addComponentImage(componentId: string, userId: string, url: string) {
  await assertOwnership(componentId, userId);
  return prisma.componentImage.create({ data: { componentId, url } });
}

export async function removeComponentImage(componentId: string, imageId: string, userId: string) {
  await assertOwnership(componentId, userId);
  const image = await prisma.componentImage.findUnique({ where: { id: imageId } });
  if (!image || image.componentId !== componentId) {
    throw AppError.notFound('Image not found');
  }
  await prisma.componentImage.delete({ where: { id: imageId } });
}
