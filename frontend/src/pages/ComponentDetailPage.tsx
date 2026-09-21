import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getComponent } from '../services/components';
import { createRental } from '../services/rentals';
import { createReport } from '../services/reports';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Component } from '../types';
import { CATEGORY_LABELS, CONDITION_LABELS } from '../types';
import { AvailabilityBadge } from '../components/ui/StatusBadge';
import { Button } from '../components/ui/Button';
import { InputField, TextAreaField } from '../components/ui/Field';
import { ErrorState, LoadingState } from '../components/ui/States';

function daysBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 0;
}

export function ComponentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [component, setComponent] = useState<Component | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportStatus, setReportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getComponent(id)
      .then(setComponent)
      .catch((err) => setLoadError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [id]);

  const days = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate]);
  const rentalAmount = component ? days * Number(component.dailyPrice) : 0;
  const totalAmount = component ? rentalAmount + Number(component.securityDeposit) : 0;

  const isOwner = user && component && user.id === component.ownerId;

  async function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!component) return;
    setRequestError(null);
    setIsSubmitting(true);
    try {
      await createRental({ componentId: component.id, startDate, endDate, message: message || undefined });
      setRequestSuccess(true);
      setTimeout(() => navigate('/my-rentals'), 1200);
    } catch (err) {
      setRequestError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!component) return;
    setReportStatus(null);
    try {
      await createReport({
        targetType: 'COMPONENT',
        targetId: component.id,
        reason: reportReason,
        description: reportDescription,
      });
      setReportStatus('Report submitted. Thank you.');
      setReportReason('');
      setReportDescription('');
      setShowReport(false);
    } catch (err) {
      setReportStatus(getErrorMessage(err));
    }
  }

  if (isLoading) return <LoadingState label="Loading component..." />;
  if (loadError) return <ErrorState message={loadError} />;
  if (!component) return null;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        <div className="aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
          {component.images.length > 0 ? (
            <img
              src={component.images[activeImage]?.url}
              alt={component.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">No image</div>
          )}
        </div>
        {component.images.length > 1 && (
          <div className="flex gap-2">
            {component.images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(idx)}
                className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                  idx === activeImage ? 'border-brand-600' : 'border-transparent'
                }`}
              >
                <img src={img.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{component.name}</h1>
            <AvailabilityBadge availability={component.availability} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {CATEGORY_LABELS[component.category]} · {CONDITION_LABELS[component.condition]} · Listed by{' '}
            {component.owner.name}
          </p>
        </div>

        <p className="whitespace-pre-line text-sm text-gray-700">{component.description}</p>

        <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-sm">
          <div>
            <p className="text-gray-500">Daily price</p>
            <p className="text-lg font-bold text-brand-700">₹{component.dailyPrice}</p>
          </div>
          <div>
            <p className="text-gray-500">Security deposit</p>
            <p className="text-lg font-bold text-gray-900">₹{component.securityDeposit}</p>
          </div>
        </div>

        {isOwner ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">This is your listing.</p>
            <Link to={`/my-components/${component.id}/edit`}>
              <Button variant="secondary" className="mt-3">
                Edit listing
              </Button>
            </Link>
          </div>
        ) : !user ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
            <Link to="/login" className="font-medium text-brand-700 hover:underline">
              Log in
            </Link>{' '}
            to request this component.
          </div>
        ) : component.availability !== 'AVAILABLE' || !component.isActive ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 shadow-sm">
            This component is not currently available for rent.
          </div>
        ) : (
          <form
            onSubmit={handleRequestSubmit}
            className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <h2 className="font-semibold text-gray-900">Request this component</h2>
            {requestError && <ErrorState message={requestError} />}
            {requestSuccess && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                Request sent! Redirecting to your rentals...
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <InputField
                label="Start date"
                type="date"
                required
                min={today}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <InputField
                label="End date"
                type="date"
                required
                min={startDate || today}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <TextAreaField
              label="Message (optional)"
              placeholder="Let the owner know about your project..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {days > 0 && (
              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                <p>
                  {days} day{days > 1 ? 's' : ''} × ₹{component.dailyPrice} ={' '}
                  <span className="font-semibold">₹{rentalAmount}</span>
                </p>
                <p>
                  + ₹{component.securityDeposit} deposit = <span className="font-semibold">₹{totalAmount} total</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">Payment processing is not implemented in this MVP.</p>
              </div>
            )}
            <Button type="submit" isLoading={isSubmitting} disabled={days <= 0}>
              Send request
            </Button>
          </form>
        )}

        <div className="text-xs text-gray-400">
          {showReport ? (
            <form onSubmit={handleReportSubmit} className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3">
              <InputField
                label="Reason"
                required
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              />
              <TextAreaField
                label="Description"
                required
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <Button type="submit" variant="danger">
                  Submit report
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowReport(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : user && !isOwner ? (
            <button onClick={() => setShowReport(true)} className="underline">
              Report this listing
            </button>
          ) : null}
          {reportStatus && <p className="mt-2 text-emerald-600">{reportStatus}</p>}
        </div>
      </div>
    </div>
  );
}
