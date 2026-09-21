import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listRentals, updateRentalStatus } from '../services/rentals';
import { getErrorMessage } from '../services/api';
import type { Rental, RentalStatus } from '../types';
import { RentalCard } from '../components/RentalCard';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';

const TERMINAL_STATUSES: RentalStatus[] = ['REJECTED', 'CANCELLED', 'COMPLETED'];

type StatusFilter = 'all' | 'pending' | 'active' | 'return_requested' | 'history';

export function MyRentalsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const role = (searchParams.get('role') ?? 'renter') as 'renter' | 'owner';
  const statusFilter = (searchParams.get('status') ?? 'all') as StatusFilter;

  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    listRentals(role)
      .then(setRentals)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [role]);

  async function handleAction(rentalId: string, status: RentalStatus) {
    setActioningId(rentalId);
    setError(null);
    try {
      await updateRentalStatus(rentalId, status);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActioningId(null);
    }
  }

  function setRole(nextRole: 'renter' | 'owner') {
    const next = new URLSearchParams(searchParams);
    next.set('role', nextRole);
    setSearchParams(next);
  }

  function setStatus(nextStatus: StatusFilter) {
    const next = new URLSearchParams(searchParams);
    next.set('status', nextStatus);
    setSearchParams(next);
  }

  const filtered = rentals.filter((r) => {
    switch (statusFilter) {
      case 'pending':
        return r.status === 'PENDING';
      case 'active':
        return r.status === 'ACTIVE';
      case 'return_requested':
        return r.status === 'RETURN_REQUESTED';
      case 'history':
        return TERMINAL_STATUSES.includes(r.status);
      default:
        return true;
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My rentals</h1>
        <p className="text-sm text-gray-500">Track requests you've made and requests on your components.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <TabButton active={role === 'renter'} onClick={() => setRole('renter')}>
          Requests I made
        </TabButton>
        <TabButton active={role === 'owner'} onClick={() => setRole('owner')}>
          Requests on my items
        </TabButton>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <FilterChip active={statusFilter === 'all'} onClick={() => setStatus('all')}>
          All
        </FilterChip>
        <FilterChip active={statusFilter === 'pending'} onClick={() => setStatus('pending')}>
          Pending
        </FilterChip>
        <FilterChip active={statusFilter === 'active'} onClick={() => setStatus('active')}>
          Active
        </FilterChip>
        <FilterChip active={statusFilter === 'return_requested'} onClick={() => setStatus('return_requested')}>
          Return requested
        </FilterChip>
        <FilterChip active={statusFilter === 'history'} onClick={() => setStatus('history')}>
          History
        </FilterChip>
      </div>

      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && filtered.length === 0 && (
        <EmptyState title="Nothing here yet" description="Rentals matching this filter will show up here." />
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((rental) => (
          <RentalCard
            key={rental.id}
            rental={rental}
            viewAs={role}
            onAction={handleAction}
            actionLoading={actioningId === rental.id}
          />
        ))}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 font-medium transition-colors ${
        active ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}
