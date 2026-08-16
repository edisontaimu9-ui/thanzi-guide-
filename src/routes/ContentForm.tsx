import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getContentSchema, FieldSchema } from '@/lib/contentSchemas';
import { getContentById, createContent, updateContent, publishContent, GenericDoc } from '@/lib/genericContent';
import { uploadImage, uploadFile, getFileViewUrl } from '@/lib/storage';

type Status = 'loading' | 'idle' | 'error';
type FormValues = Record<string, string>;

function docToFormValues(fields: FieldSchema[], doc: GenericDoc | null): FormValues {
  const values: FormValues = {};
  for (const field of fields) {
    const raw = doc?.[field.key];
    if (field.type === 'lines') {
      values[field.key] = Array.isArray(raw) ? raw.join('\n') : '';
    } else if (field.type === 'boolean') {
      values[field.key] = raw === true ? 'true' : 'false';
    } else if (raw === undefined || raw === null) {
      values[field.key] = doc === null ? (field.defaultValue ?? '') : '';
    } else {
      values[field.key] = String(raw);
    }
  }
  return values;
}

function formValuesToData(fields: FieldSchema[], values: FormValues): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = values[field.key] ?? '';
    if (field.type === 'number') {
      data[field.key] = raw === '' ? undefined : Number(raw);
    } else if (field.type === 'lines') {
      data[field.key] = raw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    } else if (field.type === 'boolean') {
      data[field.key] = raw === 'true';
    } else {
      data[field.key] = raw;
    }
  }
  return data;
}

export function ContentForm() {
  const { typeKey, id } = useParams<{ typeKey: string; id?: string }>();
  const schema = typeKey ? getContentSchema(typeKey) : undefined;
  const isNew = !id || id === 'new';
  useDocumentTitle(schema ? `${isNew ? 'New' : 'Edit'} ${schema.label}` : 'Content');
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'ADMIN';

  const [values, setValues] = useState<FormValues>({});
  const [docStatus, setDocStatus] = useState<string>('draft');
  const [status, setStatus] = useState<Status>(isNew ? 'idle' : 'loading');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  useEffect(() => {
    if (!schema) return;
    if (isNew) {
      setValues(docToFormValues(schema.fields, null));
      setStatus('idle');
      return;
    }
    setStatus('loading');
    getContentById(schema, id!)
      .then((doc) => {
        setValues(docToFormValues(schema.fields, doc));
        setDocStatus(String(doc.status ?? 'draft'));
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeKey, id]);

  if (!schema) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-brand-700 dark:text-sand-100">Unknown content type.</p>
      </main>
    );
  }

  if (schema.adminOnly && !isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <Link to={`/admin/content/${schema.key}`} className="text-sm text-brand-500 underline dark:text-brand-100">
          ← {schema.label}
        </Link>
        <h1 className="mt-4 font-display text-2xl text-brand-700 dark:text-sand-100">Admin only</h1>
        <p className="mt-2 text-brand-500 dark:text-brand-100">
          Only admins can create or edit {schema.label.toLowerCase()}, including uploading files.
        </p>
      </main>
    );
  }

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImageUpload(field: FieldSchema, file: File) {
    setUploadingField(field.key);
    setError(null);
    try {
      const url = await uploadImage(field.bucketId ?? 'avatars', file);
      handleChange(field.key, url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadingField(null);
    }
  }

  async function handleFileUpload(field: FieldSchema, file: File) {
    setUploadingField(field.key);
    setError(null);
    try {
      const fileId = await uploadFile(field.bucketId ?? 'reference_documents', file);
      setValues((prev) => {
        const next = { ...prev, [field.key]: fileId };
        if (field.pairedNameKey) next[field.pairedNameKey] = file.name;
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'File upload failed.');
    } finally {
      setUploadingField(null);
    }
  }

  async function handleSave(publishAfter: boolean) {
    if (!schema) return;
    setSaving(true);
    setError(null);
    try {
      const data = formValuesToData(schema.fields, values);
      let savedId = id;
      if (isNew) {
        const created = await createContent(schema, data);
        savedId = created.$id;
      } else {
        await updateContent(schema, id!, data);
      }
      if (publishAfter && savedId) {
        await publishContent(schema, savedId);
      }
      navigate(`/admin/content/${schema.key}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong saving this.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link to={`/admin/content/${schema.key}`} className="text-sm text-brand-500 underline dark:text-brand-100">
        ← {schema.label}
      </Link>

      <h1 className="mt-4 font-display text-2xl text-brand-700 dark:text-sand-100">
        {isNew ? `New ${schema.label.replace(/s$/, '')}` : `Edit ${schema.label.replace(/s$/, '')}`}
      </h1>

      {!isNew && !schema.manageOwnStatus && (
        <p className="mt-1 text-sm text-brand-500 dark:text-brand-100">
          Current status: <span className="font-medium">{docStatus}</span>
        </p>
      )}

      {status === 'loading' && <p className="mt-8 text-brand-500 dark:text-brand-100">Loading…</p>}
      {status === 'error' && (
        <p role="alert" className="mt-8 text-sm text-clay-500 dark:text-clay-400">
          Couldn't load this item right now.
        </p>
      )}

      {status === 'idle' && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave(false);
          }}
          className="mt-6 space-y-5"
        >
          {schema.fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-brand-700 dark:text-sand-100">
                {field.label}
                {field.required && <span className="text-clay-500"> *</span>}
              </label>
              {field.helpText && (
                <p className="text-xs text-brand-300 dark:text-brand-100">{field.helpText}</p>
              )}
              {field.type === 'textarea' || field.type === 'lines' ? (
                <textarea
                  value={values[field.key] ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  required={field.required}
                  rows={field.type === 'lines' ? 4 : 6}
                  className="mt-1 w-full rounded-md border border-brand-100 bg-white p-2 text-sm text-brand-900 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
                />
              ) : field.type === 'select' ? (
                <select
                  value={values[field.key] ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  required={field.required}
                  className="mt-1 w-full rounded-md border border-brand-100 bg-white p-2 text-sm text-brand-900 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.type === 'image' ? (
                <div className="mt-1 flex items-center gap-4">
                  {values[field.key] && (
                    <img
                      src={values[field.key]}
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
                        if (file) handleImageUpload(field, file);
                      }}
                      disabled={uploadingField === field.key}
                      className="text-sm text-brand-500 dark:text-brand-100"
                    />
                    {uploadingField === field.key && (
                      <p className="text-xs text-brand-300 dark:text-brand-100">Uploading…</p>
                    )}
                  </div>
                </div>
              ) : field.type === 'file' ? (
                <div className="mt-1 flex items-center gap-4">
                  {values[field.key] && (
                    <a
                      href={getFileViewUrl(field.bucketId ?? 'reference_documents', values[field.key])}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-brand-500 underline dark:text-brand-100"
                    >
                      View current file
                    </a>
                  )}
                  <div>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,.csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(field, file);
                      }}
                      disabled={uploadingField === field.key}
                      className="text-sm text-brand-500 dark:text-brand-100"
                    />
                    {uploadingField === field.key && (
                      <p className="text-xs text-brand-300 dark:text-brand-100">Uploading…</p>
                    )}
                  </div>
                </div>
              ) : field.type === 'boolean' ? (
                <label className="mt-2 flex items-center gap-2 text-sm text-brand-900 dark:text-sand-50">
                  <input
                    type="checkbox"
                    checked={values[field.key] === 'true'}
                    onChange={(e) => handleChange(field.key, e.target.checked ? 'true' : 'false')}
                    className="h-4 w-4 rounded border-brand-100 dark:border-ink-800"
                  />
                  Yes
                </label>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={values[field.key] ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  required={field.required}
                  className="mt-1 w-full rounded-md border border-brand-100 bg-white p-2 text-sm text-brand-900 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
                />
              )}
            </div>
          ))}

          {error && (
            <p role="alert" className="text-sm text-clay-500 dark:text-clay-400">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || !!uploadingField}
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : schema.manageOwnStatus ? 'Save' : 'Save as Draft'}
            </button>
            {isAdmin && !schema.manageOwnStatus && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving || !!uploadingField}
                className="rounded-md border border-brand-500 px-4 py-2 text-sm font-medium text-brand-500 hover:bg-sand-50 disabled:opacity-50 dark:text-brand-100"
              >
                Save & Publish
              </button>
            )}
          </div>
        </form>
      )}
    </main>
  );
}
