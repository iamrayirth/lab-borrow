import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deactivateComponent, listComponents } from '../services/components';
import { getErrorMessage } from '../services/api';
import type { Component } from '../types';
import { CATEGORY_LABELS } from '../types';
import { AvailabilityBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';

export function MyComponentsPage() {
  const [items, setItems] = useState<Component[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeactivate, setPendingDeactivate] = useState<Component | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  function load() {
    setIsLoading(true);
    listComponents({ mine: true, limit: 50 })
      .then((res) => setItems(res.items))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  async function handleDeactivate() {
    if (!pendingDeactivate) return;
    setIsDeactivating(true);
    try {
      await deactivateComponent(pendingDeactivate.id);
      setPendingDeactivate(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsDeactivating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My components</h1>
          <p className="text-sm text-gray-500">Manage the components you've listed for rent.</p>
        </div>
        <Link to="/my-components/new">
          <Button>+ New listing</Button>
        </Link>
      </div>

      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && items.length === 0 && (
        <EmptyState title="No listings yet" description="Create your first listing to start lending components." />
      )}

      {!isLoading && items.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price/day</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <Link to={`/components/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{CATEGORY_LABELS[c.category]}</td>
                  <td className="px-4 py-3 text-gray-600">₹{c.dailyPrice}</td>
                  <td className="px-4 py-3">
                    <AvailabilityBadge availability={c.availability} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.isActive ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/my-components/${c.id}/edit`}>
                        <Button variant="secondary">Edit</Button>
                      </Link>
                      {c.isActive && (
                        <Button variant="danger" onClick={() => setPendingDeactivate(c)}>
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDeactivate}
        title="Deactivate this listing?"
        description={`"${pendingDeactivate?.name}" will no longer be visible to other students. This won't affect its rental history.`}
        confirmLabel="Deactivate"
        variant="danger"
        isLoading={isDeactivating}
        onConfirm={handleDeactivate}
        onCancel={() => setPendingDeactivate(null)}
      />
    </div>
  );
}
