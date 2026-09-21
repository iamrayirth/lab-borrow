import { Link } from 'react-router-dom';
import type { Component } from '../types';
import { CATEGORY_LABELS, CONDITION_LABELS } from '../types';
import { AvailabilityBadge } from './ui/StatusBadge';

export function ComponentCard({ component }: { component: Component }) {
  const image = component.images[0]?.url;

  return (
    <Link
      to={`/components/${component.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={component.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">No image</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900">{component.name}</h3>
          <AvailabilityBadge availability={component.availability} />
        </div>
        <p className="text-xs text-gray-500">
          {CATEGORY_LABELS[component.category]} · {CONDITION_LABELS[component.condition]}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-brand-700">₹{component.dailyPrice}/day</span>
          <span className="text-xs text-gray-500">{component.owner.name}</span>
        </div>
      </div>
    </Link>
  );
}
