import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listAdminComponents, listAdminRentals, listAdminReports, listAdminUsers } from '../../services/admin';
import { LoadingState } from '../../components/ui/States';

export function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [counts, setCounts] = useState({ users: 0, components: 0, rentals: 0, reports: 0 });

  useEffect(() => {
    Promise.all([listAdminUsers(1), listAdminComponents(1), listAdminRentals(1), listAdminReports(1)])
      .then(([users, components, rentals, reports]) => {
        setCounts({ users: users.total, components: components.total, rentals: rentals.total, reports: reports.total });
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingState />;

  const cards = [
    { label: 'Users', value: counts.users, to: '/admin/users' },
    { label: 'Components', value: counts.components, to: '/admin/components' },
    { label: 'Rentals', value: counts.rentals, to: '/admin/rentals' },
    { label: 'Reports', value: counts.reports, to: '/admin/reports' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
