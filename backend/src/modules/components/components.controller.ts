import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import { publicUploadPath } from '../../middleware/upload';
import * as componentsService from './components.service';
import { toOwnerSummary } from '../../utils/serialize';

function serializeComponent(component: Awaited<ReturnType<typeof componentsService.getComponentById>>) {
  return {
    id: component.id,
    name: component.name,
    category: component.category,
    description: component.description,
    condition: component.condition,
    dailyPrice: component.dailyPrice,
    securityDeposit: component.securityDeposit,
    availability: component.availability,
    isActive: component.isActive,
    images: component.images.map((img) => ({ id: img.id, url: img.url })),
    owner: toOwnerSummary(component.owner),
    ownerId: component.ownerId,
    createdAt: component.createdAt,
    updatedAt: component.updatedAt,
  };
}

export const listComponents = asyncHandler(async (req: Request, res: Response) => {
  const result = await componentsService.listComponents(req.query as never, req.user?.id);
  res.json({
    items: result.items.map(serializeComponent),
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  });
});

export const getComponent = asyncHandler(async (req: Request, res: Response) => {
  const component = await componentsService.getComponentById(req.params.id, req.user?.id);
  res.json({ component: serializeComponent(component) });
});

export const createComponent = asyncHandler(async (req: Request, res: Response) => {
  const component = await componentsService.createComponent(req.user!.id, req.body);
  res.status(201).json({ component: serializeComponent(component) });
});

export const updateComponent = asyncHandler(async (req: Request, res: Response) => {
  const component = await componentsService.updateComponent(req.params.id, req.user!.id, req.body);
  res.json({ component: serializeComponent(component) });
});

export const deactivateComponent = asyncHandler(async (req: Request, res: Response) => {
  const component = await componentsService.deactivateComponent(req.params.id, req.user!.id);
  res.json({ component: serializeComponent(component) });
});

export const uploadComponentImageHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw AppError.badRequest('No image file provided');
  }
  const image = await componentsService.addComponentImage(
    req.params.id,
    req.user!.id,
    publicUploadPath(req.file.filename),
  );
  res.status(201).json({ image });
});

export const deleteComponentImage = asyncHandler(async (req: Request, res: Response) => {
  await componentsService.removeComponentImage(req.params.id, req.params.imageId, req.user!.id);
  res.status(204).send();
});
