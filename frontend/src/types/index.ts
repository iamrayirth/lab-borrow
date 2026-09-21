export type Role = 'STUDENT' | 'ADMIN';

export type ComponentCategory =
  | 'MICROCONTROLLERS'
  | 'DEVELOPMENT_BOARDS'
  | 'SENSORS'
  | 'MOTORS'
  | 'MOTOR_DRIVERS'
  | 'POWER_SUPPLIES'
  | 'MODULES'
  | 'TOOLS'
  | 'OTHER';

export type ComponentCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'USED';

export type ComponentAvailability = 'AVAILABLE' | 'RENTED' | 'INACTIVE';

export type RentalStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'ACTIVE'
  | 'RETURN_REQUESTED'
  | 'COMPLETED';

export type NotificationType =
  | 'RENTAL_REQUEST_RECEIVED'
  | 'REQUEST_ACCEPTED'
  | 'REQUEST_REJECTED'
  | 'RETURN_REQUESTED'
  | 'RENTAL_COMPLETED';

export interface User {
  id: string;
  name: string;
  email: string;
  college: string;
  profileImage: string | null;
  role: Role;
  createdAt: string;
  isDisabled?: boolean;
}

export interface ComponentImage {
  id: string;
  url: string;
}

export interface OwnerSummary {
  id: string;
  name: string;
  college?: string;
}

export interface Component {
  id: string;
  name: string;
  category: ComponentCategory;
  description: string;
  condition: ComponentCondition;
  dailyPrice: string;
  securityDeposit: string;
  availability: ComponentAvailability;
  isActive: boolean;
  images: ComponentImage[];
  owner: OwnerSummary;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Rental {
  id: string;
  status: RentalStatus;
  startDate: string;
  endDate: string;
  days: number;
  message: string | null;
  rentalAmount: string;
  securityDeposit: string;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  renter: { id: string; name: string; college: string };
  component: {
    id: string;
    name: string;
    category: ComponentCategory;
    condition: ComponentCondition;
    dailyPrice: string;
    images: ComponentImage[];
    ownerId: string;
    owner: { id: string; name: string };
  };
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  relatedRentalId: string | null;
  createdAt: string;
}

export interface Report {
  id: string;
  reason: string;
  description: string;
  targetType: 'USER' | 'COMPONENT';
  reporter: { id: string; name: string };
  targetUser: string | null;
  targetComponent: string | null;
  createdAt: string;
}

export interface AdminRentalSummary {
  id: string;
  status: RentalStatus;
  startDate: string;
  endDate: string;
  days: number;
  totalAmount: string;
  component: { id: string; name: string };
  renter: { id: string; name: string };
  owner: { id: string; name: string };
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  MICROCONTROLLERS: 'Microcontrollers',
  DEVELOPMENT_BOARDS: 'Development Boards',
  SENSORS: 'Sensors',
  MOTORS: 'Motors',
  MOTOR_DRIVERS: 'Motor Drivers',
  POWER_SUPPLIES: 'Power Supplies',
  MODULES: 'Modules',
  TOOLS: 'Tools',
  OTHER: 'Other',
};

export const CONDITION_LABELS: Record<ComponentCondition, string> = {
  NEW: 'New',
  LIKE_NEW: 'Like New',
  GOOD: 'Good',
  USED: 'Used',
};
