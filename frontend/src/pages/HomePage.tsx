import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center gap-8 py-12 text-center">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Borrow what you need. <span className="text-brand-600">Lend what you don't.</span>
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Rent unused electronics and components from students on your campus for your next project — an ESP32,
          a motor driver, a sensor kit — without buying new.
        </p>
      </div>

      <div className="flex gap-3">
        <Link to="/components">
          <Button variant="primary">Browse components</Button>
        </Link>
        {!user && (
          <Link to="/register">
            <Button variant="secondary">Get started</Button>
          </Link>
        )}
      </div>

      <ol className="mt-8 grid max-w-4xl gap-4 text-left sm:grid-cols-3">
        {[
          { step: '1. List or find', text: 'List your unused parts, or search for what your project needs.' },
          { step: '2. Request & accept', text: 'Send a rental request with your dates — the owner accepts or declines.' },
          { step: '3. Borrow & return', text: 'Use it for your project, then request a return once you are done.' },
        ].map((item) => (
          <li key={item.step} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="font-semibold text-brand-700">{item.step}</p>
            <p className="mt-1 text-sm text-gray-600">{item.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
