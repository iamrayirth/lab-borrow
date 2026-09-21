import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listNotifications, markNotificationRead } from '../services/notifications';
import { getErrorMessage } from '../services/api';
import type { Notification } from '../types';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listNotifications()
      .then(setItems)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleMarkRead(id: string) {
    try {
      const updated = await markNotificationRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch {
      // no-op: keep current state, user can retry
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>

      <div className="mt-6 flex flex-col gap-2">
        {isLoading && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!isLoading && !error && items.length === 0 && (
          <EmptyState title="No notifications yet" description="Updates about your rentals will appear here." />
        )}
        {items.map((n) => (
          <div
            key={n.id}
            className={`flex items-start justify-between gap-3 rounded-xl border p-4 shadow-sm ${
              n.isRead ? 'border-gray-200 bg-white' : 'border-brand-200 bg-brand-50'
            }`}
          >
            <div>
              <p className="text-sm text-gray-800">{n.message}</p>
              <p className="mt-1 text-xs text-gray-400">{formatDate(n.createdAt)}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              {!n.isRead && (
                <button onClick={() => handleMarkRead(n.id)} className="text-xs font-medium text-brand-700 hover:underline">
                  Mark read
                </button>
              )}
              <Link to="/my-rentals" className="text-xs text-gray-400 hover:underline">
                View rentals
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
