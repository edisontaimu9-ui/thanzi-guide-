import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getContentSchema, FieldSchema } from '@/lib/contentSchemas';
import { getContentById, createContent, updateContent, publishContent, GenericDoc } from '@/lib/genericContent';

type Status = 'loading' | 'idle' | 'error';
type FormValues = Record<string, string>;

function docToFormValues(fields: FieldSchema[], doc: GenericDoc | null): FormValues {
  const values: FormValues = {};
  for (const field of fields) {
    const raw = doc?.[field.key];
    if (field.type === 'lines') {
      values[field.key] = Array.isArray(raw) ? raw.join('\n') : '';
    } else if (raw === undefined || raw === null) {
      values[field.key] = '';
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

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
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

      {!isNew && (
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
              disabled={saving}
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save as Draft'}
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
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
