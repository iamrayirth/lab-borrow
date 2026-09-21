import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listComponents } from '../services/components';
import { getErrorMessage } from '../services/api';
import type { Component, ComponentCategory } from '../types';
import { CATEGORY_LABELS } from '../types';
import { ComponentCard } from '../components/ComponentCard';
import { SelectField, InputField } from '../components/ui/Field';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';

export function ComponentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Component[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const search = searchParams.get('search') ?? '';
  const category = (searchParams.get('category') ?? '') as ComponentCategory | '';
  const availability = searchParams.get('availability') ?? '';
  const page = Number(searchParams.get('page') ?? '1');

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    listComponents({
      search: search || undefined,
      category: category || undefined,
      availability: (availability || undefined) as never,
      page,
      limit: 12,
    })
      .then((res) => {
        setItems(res.items);
        setTotalPages(res.totalPages ?? 1);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [search, category, availability, page]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Browse components</h1>
        <p className="text-sm text-gray-500">Find what your project needs from fellow students.</p>
      </div>

      <div className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <InputField
          label="Search"
          placeholder="e.g. ESP32"
          value={search}
          onChange={(e) => updateParam('search', e.target.value)}
        />
        <SelectField label="Category" value={category} onChange={(e) => updateParam('category', e.target.value)}>
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Availability"
          value={availability}
          onChange={(e) => updateParam('availability', e.target.value)}
        >
          <option value="">Any availability</option>
          <option value="AVAILABLE">Available</option>
          <option value="RENTED">Rented</option>
        </SelectField>
      </div>

      {isLoading && <LoadingState label="Loading components..." />}
      {error && <ErrorState message={error} />}
      {!isLoading && !error && items.length === 0 && (
        <EmptyState title="No components found" description="Try a different search or filter." />
      )}

      {!isLoading && !error && items.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((component) => (
              <ComponentCard key={component.id} component={component} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button variant="secondary" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button variant="secondary" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
