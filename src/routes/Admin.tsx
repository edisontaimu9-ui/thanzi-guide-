import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import type { ArticleDoc } from '@/lib/articles';
import type { CourseDoc } from '@/lib/courses';
import {
  listDraftArticles,
  listDraftFoods,
  listDraftCourses,
  publishArticle,
  publishFood,
  publishCourse,
  deleteArticle,
  deleteFood,
  deleteCourse,
  FoodAdminDoc
} from '@/lib/admin';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

type Status = 'loading' | 'idle' | 'error';

export function Admin() {
  useDocumentTitle('Content Review');
  const { profile } = useAuth();
  const canDelete = profile?.role === 'ADMIN';

  const [articles, setArticles] = useState<ArticleDoc[]>([]);
  const [foods, setFoods] = useState<FoodAdminDoc[]>([]);
  const [courses, setCourses] = useState<CourseDoc[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function loadAll() {
    setStatus('loading');
    try {
      const [a, f, c] = await Promise.all([listDraftArticles(), listDraftFoods(), listDraftCourses()]);
      setArticles(a);
      setFoods(f);
      setCourses(c);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handlePublish(kind: 'article' | 'food' | 'course', id: string) {
    setPendingId(id);
    try {
      if (kind === 'article') await publishArticle(id);
      if (kind === 'food') await publishFood(id);
      if (kind === 'course') await publishCourse(id);
      await loadAll();
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(kind: 'article' | 'food' | 'course', id: string) {
    if (!confirm('Delete this permanently? This cannot be undone.')) return;
    setPendingId(id);
    try {
      if (kind === 'article') await deleteArticle(id);
      if (kind === 'food') await deleteFood(id);
      if (kind === 'course') await deleteCourse(id);
      await loadAll();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700">Content Review</h1>
      <p className="mt-2 text-brand-500">
        Draft content awaiting publish. Editing still happens in the Appwrite console — this is for
        approving what's ready.
      </p>

      {status === 'loading' && <p className="mt-8 text-brand-500">Loading…</p>}
      {status === 'error' && (
        <p role="alert" className="mt-8 text-sm text-clay-500">
          Couldn't load draft content right now.
        </p>
      )}

      {status === 'idle' && (
        <div className="mt-8 space-y-10">
          <ReviewSection
            title="Articles"
            emptyLabel="No draft articles."
            items={articles.map((a) => ({ id: a.$id, label: a.title, href: `/learn/${a.slug}` }))}
            pendingId={pendingId}
            canDelete={canDelete}
            onPublish={(id) => handlePublish('article', id)}
            onDelete={(id) => handleDelete('article', id)}
          />
          <ReviewSection
            title="Foods"
            emptyLabel="No draft foods."
            items={foods.map((f) => ({ id: f.$id, label: f.name }))}
            pendingId={pendingId}
            canDelete={canDelete}
            onPublish={(id) => handlePublish('food', id)}
            onDelete={(id) => handleDelete('food', id)}
          />
          <ReviewSection
            title="Courses"
            emptyLabel="No draft courses."
            items={courses.map((c) => ({ id: c.$id, label: c.title, href: `/courses/${c.slug}` }))}
            pendingId={pendingId}
            canDelete={canDelete}
            onPublish={(id) => handlePublish('course', id)}
            onDelete={(id) => handleDelete('course', id)}
          />
        </div>
      )}
    </main>
  );
}

function ReviewSection({
  title,
  emptyLabel,
  items,
  pendingId,
  canDelete,
  onPublish,
  onDelete
}: {
  title: string;
  emptyLabel: string;
  items: { id: string; label: string; href?: string }[];
  pendingId: string | null;
  canDelete: boolean;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section>
      <h2 className="font-display text-lg text-brand-700">{title}</h2>

      {items.length === 0 && <p className="mt-2 text-sm text-brand-500">{emptyLabel}</p>}

      {items.length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-brand-100 bg-white p-4"
            >
              {item.href ? (
                <Link to={item.href} className="text-sm font-medium text-brand-700 underline">
                  {item.label}
                </Link>
              ) : (
                <span className="text-sm font-medium text-brand-700">{item.label}</span>
              )}

              <div className="flex shrink-0 gap-2">
                <button
                  onClick={() => onPublish(item.id)}
                  disabled={pendingId === item.id}
                  className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  Publish
                </button>
                {canDelete && (
                  <button
                    onClick={() => onDelete(item.id)}
                    disabled={pendingId === item.id}
                    className="rounded-md border border-clay-500 px-3 py-1.5 text-xs font-medium text-clay-500 hover:bg-clay-400/10 disabled:opacity-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
