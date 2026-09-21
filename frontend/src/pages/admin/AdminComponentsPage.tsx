import { useEffect, useState } from 'react';
import { listAdminComponents, setComponentActive } from '../../services/admin';
import { getErrorMessage } from '../../services/api';
import type { Component } from '../../types';
import { CATEGORY_LABELS } from '../../types';
import { AvailabilityBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { ErrorState, LoadingState } from '../../components/ui/States';

export function AdminComponentsPage() {
  const [items, setItems] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    listAdminComponents(1)
      .then((res) => setItems(res.items))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  async function toggleActive(component: Component) {
    setUpdatingId(component.id);
    try {
      await setComponentActive(component.id, !component.isActive);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Components</h1>
      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!isLoading && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Availability</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.owner.name}</td>
                  <td className="px-4 py-3 text-gray-600">{CATEGORY_LABELS[c.category]}</td>
                  <td className="px-4 py-3">
                    <AvailabilityBadge availability={c.availability} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.isActive ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant={c.isActive ? 'danger' : 'secondary'}
                      isLoading={updatingId === c.id}
                      onClick={() => toggleActive(c)}
                    >
                      {c.isActive ? 'Disable' : 'Enable'}
                    </Button>
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
