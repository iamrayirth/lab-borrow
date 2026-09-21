import { useEffect, useState } from 'react';
import { listAdminReports } from '../../services/admin';
import { getErrorMessage } from '../../services/api';
import type { Report } from '../../types';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function AdminReportsPage() {
  const [items, setItems] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAdminReports(1)
      .then((res) => setItems(res.items))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      {isLoading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && items.length === 0 && (
        <EmptyState title="No reports" description="Reports submitted by students will show up here." />
      )}

      <div className="flex flex-col gap-3">
        {items.map((r) => (
          <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                {r.targetType === 'USER' ? `User: ${r.targetUser}` : `Component: ${r.targetComponent}`}
              </span>
              <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-900">{r.reason}</p>
            <p className="mt-1 text-sm text-gray-600">{r.description}</p>
            <p className="mt-2 text-xs text-gray-400">Reported by {r.reporter.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
