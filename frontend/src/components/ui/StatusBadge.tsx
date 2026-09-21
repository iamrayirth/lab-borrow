import type { ComponentAvailability, RentalStatus } from '../../types';

const RENTAL_STATUS_STYLES: Record<RentalStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  RETURN_REQUESTED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-gray-200 text-gray-800',
};

const RENTAL_STATUS_LABELS: Record<RentalStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  ACTIVE: 'Active',
  RETURN_REQUESTED: 'Return Requested',
  COMPLETED: 'Completed',
};

export function RentalStatusBadge({ status }: { status: RentalStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${RENTAL_STATUS_STYLES[status]}`}>
      {RENTAL_STATUS_LABELS[status]}
    </span>
  );
}

const AVAILABILITY_STYLES: Record<ComponentAvailability, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-800',
  RENTED: 'bg-amber-100 text-amber-800',
  INACTIVE: 'bg-gray-200 text-gray-600',
};

const AVAILABILITY_LABELS: Record<ComponentAvailability, string> = {
  AVAILABLE: 'Available',
  RENTED: 'Rented',
  INACTIVE: 'Inactive',
};

export function AvailabilityBadge({ availability }: { availability: ComponentAvailability }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${AVAILABILITY_STYLES[availability]}`}
    >
      {AVAILABILITY_LABELS[availability]}
    </span>
  );
}
