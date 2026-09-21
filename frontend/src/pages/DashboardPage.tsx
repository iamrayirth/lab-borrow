import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listComponents } from '../services/components';
import { listRentals } from '../services/rentals';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/ui/States';

const TERMINAL_STATUSES = ['REJECTED', 'CANCELLED', 'COMPLETED'];

export function DashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [counts, setCounts] = useState({
    myComponents: 0,
    myPendingRequests: 0,
    activeRentals: 0,
    returnRequests: 0,
    history: 0,
  });

  useEffect(() => {
    Promise.all([listComponents({ mine: true, limit: 1 }), listRentals('renter'), listRentals('owner')])
      .then(([components, asRenter, asOwner]) => {
        const activeRentals =
          asRenter.filter((r) => r.status === 'ACTIVE').length + asOwner.filter((r) => r.status === 'ACTIVE').length;
        const history =
          asRenter.filter((r) => TERMINAL_STATUSES.includes(r.status)).length +
          asOwner.filter((r) => TERMINAL_STATUSES.includes(r.status)).length;
        setCounts({
          myComponents: components.total,
          myPendingRequests: asRenter.filter((r) => r.status === 'PENDING').length,
          activeRentals,
          returnRequests: asOwner.filter((r) => r.status === 'RETURN_REQUESTED').length,
          history,
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingState label="Loading your dashboard..." />;

  const cards = [
    { label: 'My Components', value: counts.myComponents, to: '/my-components' },
    { label: 'My Rental Requests', value: counts.myPendingRequests, to: '/my-rentals?role=renter&status=pending' },
    { label: 'Active Rentals', value: counts.activeRentals, to: '/my-rentals?status=active' },
    { label: 'Return Requests', value: counts.returnRequests, to: '/my-rentals?role=owner&status=return_requested' },
    { label: 'Rental History', value: counts.history, to: '/my-rentals?status=history' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name.split(' ')[0]}</h1>
        <p className="text-sm text-gray-500">Here's what's happening with your rentals.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-3xl font-bold text-brand-700">{card.value}</p>
            <p className="mt-1 text-sm font-medium text-gray-600">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
