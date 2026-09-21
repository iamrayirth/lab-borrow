import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createComponent,
  deleteComponentImage,
  getComponent,
  updateComponent,
  uploadComponentImage,
} from '../services/components';
import { getErrorMessage } from '../services/api';
import type { Component, ComponentCategory, ComponentCondition } from '../types';
import { CATEGORY_LABELS, CONDITION_LABELS } from '../types';
import { Button } from '../components/ui/Button';
import { InputField, SelectField, TextAreaField } from '../components/ui/Field';
import { ErrorState, LoadingState } from '../components/ui/States';

const emptyForm = {
  name: '',
  category: 'MICROCONTROLLERS' as ComponentCategory,
  description: '',
  condition: 'GOOD' as ComponentCondition,
  dailyPrice: '',
  securityDeposit: '',
};

export function ComponentFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [component, setComponent] = useState<Component | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    getComponent(id)
      .then((c) => {
        setComponent(c);
        setForm({
          name: c.name,
          category: c.category,
          description: c.description,
          condition: c.condition,
          dailyPrice: c.dailyPrice,
          securityDeposit: c.securityDeposit,
        });
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [id]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const payload = {
      name: form.name,
      category: form.category,
      description: form.description,
      condition: form.condition,
      dailyPrice: Number(form.dailyPrice),
      securityDeposit: Number(form.securityDeposit),
    };
    try {
      if (isEditing && id) {
        await updateComponent(id, payload);
        navigate('/my-components');
      } else {
        const created = await createComponent(payload);
        navigate(`/my-components/${created.id}/edit`, { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setIsUploading(true);
    setError(null);
    try {
      await uploadComponentImage(id, file);
      const refreshed = await getComponent(id);
      setComponent(refreshed);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleImageDelete(imageId: string) {
    if (!id) return;
    try {
      await deleteComponentImage(id, imageId);
      const refreshed = await getComponent(id);
      setComponent(refreshed);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (isLoading) return <LoadingState label="Loading listing..." />;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit listing' : 'New listing'}</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {error && <ErrorState message={error} />}
        <InputField label="Component name" required value={form.name} onChange={(e) => update('name', e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Category"
            value={form.category}
            onChange={(e) => update('category', e.target.value as ComponentCategory)}
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Condition"
            value={form.condition}
            onChange={(e) => update('condition', e.target.value as ComponentCondition)}
          >
            {Object.entries(CONDITION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
        </div>

        <TextAreaField
          label="Description"
          required
          minLength={10}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <InputField
            id="daily-price"
            label="Daily price (₹)"
            type="number"
            min="1"
            step="0.01"
            required
            value={form.dailyPrice}
            onChange={(e) => update('dailyPrice', e.target.value)}
          />
          <InputField
            id="security-deposit"
            label="Security deposit (₹)"
            type="number"
            min="0"
            step="0.01"
            required
            value={form.securityDeposit}
            onChange={(e) => update('securityDeposit', e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Create listing'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/my-components')}>
            Cancel
          </Button>
        </div>
      </form>

      {isEditing && component && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900">Photos</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {component.images.map((img) => (
              <div key={img.id} className="relative h-24 w-24 overflow-hidden rounded-lg border border-gray-200">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => handleImageDelete(img.id)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white"
                  type="button"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            disabled={isUploading}
            className="mt-4 text-sm"
          />
          <p className="mt-1 text-xs text-gray-400">JPEG, PNG, or WEBP, up to 5MB.</p>
        </div>
      )}
    </div>
  );
}
