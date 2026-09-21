import { useEffect, useState } from 'react';
import { listAdminRentals } from '../../services/admin';
import { getErrorMessage } from '../../services/api';
import type { AdminRentalSummary } from '../../types';
import { RentalStatusBadge } from '../../components/ui/StatusBadge';
import { ErrorState, LoadingState } from '../../components/ui/States';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function AdminRentalsPage() {
  const [items, setItems] = useState<AdminRentalSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAdminRentals(1)
      .then((res) => setItems(res.items))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Rentals</h1>
      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!isLoading && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Component</th>
                <th className="px-4 py-3">Renter</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{r.component.name}</td>
                  <td className="px-4 py-3 text-gray-600">{r.renter.name}</td>
                  <td className="px-4 py-3 text-gray-600">{r.owner.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(r.startDate)} → {formatDate(r.endDate)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">₹{r.totalAmount}</td>
                  <td className="px-4 py-3">
                    <RentalStatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
