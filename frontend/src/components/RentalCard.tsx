import { Link } from 'react-router-dom';
import type { Rental, RentalStatus } from '../types';
import { RentalStatusBadge } from './ui/StatusBadge';
import { Button } from './ui/Button';

interface RentalCardProps {
  rental: Rental;
  viewAs: 'renter' | 'owner';
  onAction?: (rentalId: string, status: RentalStatus) => void;
  actionLoading?: boolean;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function RentalCard({ rental, viewAs, onAction, actionLoading }: RentalCardProps) {
  const image = rental.component.images[0]?.url;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No image</div>
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Link to={`/components/${rental.component.id}`} className="font-semibold text-gray-900 hover:underline">
            {rental.component.name}
          </Link>
          <RentalStatusBadge status={rental.status} />
        </div>
        <p className="text-sm text-gray-500">
          {viewAs === 'owner' ? `Renter: ${rental.renter.name}` : `Owner: ${rental.component.owner.name}`}
        </p>
        <p className="text-sm text-gray-500">
          {formatDate(rental.startDate)} → {formatDate(rental.endDate)} ({rental.days} day
          {rental.days > 1 ? 's' : ''})
        </p>
        {rental.message && <p className="mt-1 text-sm italic text-gray-500">"{rental.message}"</p>}
        <p className="mt-1 text-sm font-medium text-gray-800">
          ₹{rental.rentalAmount} rent + ₹{rental.securityDeposit} deposit = ₹{rental.totalAmount} total
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {viewAs === 'owner' && rental.status === 'PENDING' && (
          <>
            <Button isLoading={actionLoading} onClick={() => onAction?.(rental.id, 'ACTIVE')}>
              Accept
            </Button>
            <Button variant="danger" isLoading={actionLoading} onClick={() => onAction?.(rental.id, 'REJECTED')}>
              Reject
            </Button>
          </>
        )}
        {viewAs === 'renter' && rental.status === 'PENDING' && (
          <Button variant="danger" isLoading={actionLoading} onClick={() => onAction?.(rental.id, 'CANCELLED')}>
            Cancel request
          </Button>
        )}
        {viewAs === 'renter' && rental.status === 'ACTIVE' && (
          <Button isLoading={actionLoading} onClick={() => onAction?.(rental.id, 'RETURN_REQUESTED')}>
            Request return
          </Button>
        )}
        {viewAs === 'owner' && rental.status === 'RETURN_REQUESTED' && (
          <Button isLoading={actionLoading} onClick={() => onAction?.(rental.id, 'COMPLETED')}>
            Confirm return
          </Button>
        )}
      </div>
    </div>
  );
}
