import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { databases, DB } from '@/lib/appwrite';
import { uploadImage } from '@/lib/storage';
import type { ProviderDoc } from '@/lib/providers';

const EDITABLE_FIELDS = ['title', 'specialty', 'bio', 'location', 'phone', 'whatsapp'] as const;

export function ProviderProfile({ provider }: { provider: ProviderDoc }) {
  useDocumentTitle('Your Profile');

  const [values, setValues] = useState({
    title: provider.title ?? '',
    specialty: provider.specialty ?? '',
    bio: provider.bio ?? '',
    location: provider.location ?? '',
    phone: provider.phone ?? '',
    whatsapp: provider.whatsapp ?? ''
  });
  const [photoUrl, setPhotoUrl] = useState(provider.photoUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleChange(key: (typeof EDITABLE_FIELDS)[number], value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handlePhotoChange(file: File) {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage('food_images', file);
      setPhotoUrl(url);
      setSaved(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await databases.updateDocument(DB.databaseId, DB.collections.providers, provider.$id, {
        ...values,
        photoUrl
      });
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't save. If this keeps happening, ask your admin to double check your account is linked."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <Link to="/provider" className="text-sm text-brand-500 underline dark:text-brand-100">
        ← Your Appointments
      </Link>

      <h1 className="mt-4 font-display text-2xl text-brand-700 dark:text-sand-100">Your Profile</h1>
      <p className="mt-1 text-sm text-brand-500 dark:text-brand-100">
        This is what patients see when browsing providers.
      </p>

      <form onSubmit={handleSave} className="mt-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-brand-700 dark:text-sand-100">Photo</label>
          <div className="mt-1 flex items-center gap-4">
            {photoUrl && (
              <img
                src={photoUrl}
                alt=""
                className="h-16 w-16 rounded-full border border-brand-100 object-cover dark:border-ink-800"
              />
            )}
            <div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoChange(file);
                }}
                disabled={uploading}
                className="text-sm text-brand-500 dark:text-brand-100"
              />
              {uploading && <p className="text-xs text-brand-300 dark:text-brand-100">Uploading…</p>}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 dark:text-sand-100">Title</label>
          <input
            type="text"
            value={values.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-100 bg-white p-2 text-sm text-brand-900 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 dark:text-sand-100">Specialty</label>
          <input
            type="text"
            value={values.specialty}
            onChange={(e) => handleChange('specialty', e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-100 bg-white p-2 text-sm text-brand-900 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 dark:text-sand-100">Bio</label>
          <textarea
            value={values.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-md border border-brand-100 bg-white p-2 text-sm text-brand-900 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 dark:text-sand-100">Location</label>
          <input
            type="text"
            value={values.location}
            onChange={(e) => handleChange('location', e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-100 bg-white p-2 text-sm text-brand-900 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 dark:text-sand-100">Phone</label>
          <input
            type="text"
            value={values.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-100 bg-white p-2 text-sm text-brand-900 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-700 dark:text-sand-100">WhatsApp</label>
          <input
            type="text"
            value={values.whatsapp}
            onChange={(e) => handleChange('whatsapp', e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-100 bg-white p-2 text-sm text-brand-900 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-clay-500 dark:text-clay-400">
            {error}
          </p>
        )}
        {saved && <p className="text-sm text-brand-500 dark:text-brand-100">Saved.</p>}

        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </main>
  );
}
