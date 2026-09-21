import { useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, uploadProfileImage } from '../services/profile';
import { getErrorMessage } from '../services/api';
import { Button } from '../components/ui/Button';
import { InputField } from '../components/ui/Field';
import { ErrorState } from '../components/ui/States';

export function ProfilePage() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [college, setCollege] = useState(user?.college ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    try {
      await updateProfile({ name, college });
      await refresh();
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      await uploadProfileImage(file);
      await refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900">My profile</h1>

      <div className="mt-6 flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-gray-100">
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-gray-400">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              disabled={isUploading}
              className="text-sm"
            />
            <p className="text-xs text-gray-400">JPEG, PNG, or WEBP, up to 5MB.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <ErrorState message={error} />}
          {success && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Profile updated.</p>}
          <InputField label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
          <InputField label="College" required value={college} onChange={(e) => setCollege(e.target.value)} />
          <InputField label="Email" value={user.email} disabled />
          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-fit">
            Save changes
          </Button>
        </form>
      </div>
    </div>
  );
}
