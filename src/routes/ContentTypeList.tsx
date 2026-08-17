import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { getContentSchema } from '@/lib/contentSchemas';
import { listAllContent, publishContent, unpublishContent, deleteContent, GenericDoc } from '@/lib/genericContent';
import { LoadingRunner } from '@/components/LoadingRunner';

type Status = 'loading' | 'idle' | 'error';

export function ContentTypeList() {
  const { typeKey } = useParams<{ typeKey: string }>();
  const schema = typeKey ? getContentSchema(typeKey) : undefined;
  useDocumentTitle(schema?.label ?? 'Content');
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'ADMIN';

  const [items, setItems] = useState<GenericDoc[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function load() {
    if (!schema) return;
    setStatus('loading');
    try {
      const docs = await listAllContent(schema);
      setItems(docs);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeKey]);

  if (!schema) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-brand-700 dark:text-sand-100">Unknown content type.</p>
      </main>
    );
  }

  async function handlePublish(id: string) {
    if (!schema) return;
    setPendingId(id);
    try {
      await publishContent(schema, id);
      await load();
    } finally {
      setPendingId(null);
    }
  }

  async function handleUnpublish(id: string) {
    if (!schema) return;
    setPendingId(id);
    try {
      await unpublishContent(schema, id);
      await load();
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!schema) return;
    if (!confirm('Delete this permanently? This cannot be undone.')) return;
    setPendingId(id);
    try {
      await deleteContent(schema, id);
      await load();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/admin/content" className="text-sm text-brand-500 underline dark:text-brand-100">
        ← Content Manager
      </Link>

      <div className="mt-4 flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-brand-700 dark:text-sand-100">{schema.label}</h1>
        <Link
          to={`/admin/content/${schema.key}/new`}
          className="shrink-0 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          + New
        </Link>
      </div>

      {status === 'loading' && <LoadingRunner className="mt-8" />}
      {status === 'error' && (
        <p role="alert" className="mt-8 text-sm text-clay-500 dark:text-clay-400">
          Couldn't load this content right now.
        </p>
      )}

      {status === 'idle' && items.length === 0 && (
        <p className="mt-8 text-brand-500 dark:text-brand-100">Nothing here yet.</p>
      )}

      {status === 'idle' && items.length > 0 && (
        <ul className="mt-6 space-y-2">
          {items.map((item) => {
            const title = String(item[schema.titleField] ?? item.$id);
            const isDraft = item.status === 'draft';
            const isPending = pendingId === item.$id;

            return (
              <li
                key={item.$id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-950"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                      isDraft
                        ? 'bg-clay-400/20 text-clay-500 dark:text-clay-400'
                        : 'bg-brand-100 text-brand-700 dark:bg-ink-800 dark:text-brand-100'
                    }`}
                  >
                    {item.status ? String(item.status) : 'published'}
                  </span>
                  <span className="text-sm font-medium text-brand-700 dark:text-sand-100">{title}</span>
                  {schema.key === 'providers' && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                        item.userId
                          ? 'bg-brand-100 text-brand-700 dark:bg-ink-800 dark:text-brand-100'
                          : 'bg-clay-400/20 text-clay-500 dark:text-clay-400'
                      }`}
                    >
                      {item.userId ? 'Linked' : 'Unclaimed'}
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <Link
                    to={`/admin/content/${schema.key}/${item.$id}`}
                    className="rounded-md border border-brand-100 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-sand-50 dark:border-ink-800 dark:text-sand-100"
                  >
                    Edit
                  </Link>
                  {isAdmin && !schema.manageOwnStatus && isDraft && (
                    <button
                      onClick={() => handlePublish(item.$id)}
                      disabled={isPending}
                      className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      Publish
                    </button>
                  )}
                  {isAdmin && !schema.manageOwnStatus && !isDraft && (
                    <button
                      onClick={() => handleUnpublish(item.$id)}
                      disabled={isPending}
                      className="rounded-md border border-brand-100 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-sand-50 disabled:opacity-50 dark:border-ink-800 dark:text-sand-100"
                    >
                      Unpublish
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(item.$id)}
                      disabled={isPending}
                      className="rounded-md border border-clay-500 px-3 py-1.5 text-xs font-medium text-clay-500 hover:bg-clay-400/10 disabled:opacity-50 dark:text-clay-400"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
