import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { listPartnerInquiries, deletePartnerInquiry, PartnerInquiryDoc } from '@/lib/partnerInquiries';
import { LoadingRunner } from '@/components/LoadingRunner';

type Status = 'loading' | 'idle' | 'error';

export function PartnerInquiries() {
  useDocumentTitle('Partner Inquiries');
  const [inquiries, setInquiries] = useState<PartnerInquiryDoc[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function load() {
    setStatus('loading');
    try {
      const docs = await listPartnerInquiries();
      setInquiries(docs);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this inquiry permanently?')) return;
    setPendingId(id);
    try {
      await deletePartnerInquiry(id);
      await load();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link to="/admin" className="text-sm text-brand-500 underline dark:text-brand-100">
        ← Content Review
      </Link>
      <h1 className="mt-4 font-display text-3xl text-brand-700 dark:text-sand-100">Partner Inquiries</h1>
      <p className="mt-2 text-brand-500 dark:text-brand-100">Submissions from the "Partner with us" form.</p>

      {status === 'loading' && <LoadingRunner className="mt-8" />}
      {status === 'error' && (
        <p role="alert" className="mt-8 text-sm text-clay-500 dark:text-clay-400">
          Couldn't load inquiries right now.
        </p>
      )}
      {status === 'idle' && inquiries.length === 0 && (
        <p className="mt-8 text-brand-500 dark:text-brand-100">No inquiries yet.</p>
      )}

      {status === 'idle' && inquiries.length > 0 && (
        <ul className="mt-6 space-y-3">
          {inquiries.map((inquiry) => (
            <li
              key={inquiry.$id}
              className="rounded-lg border border-brand-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-950"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-brand-700 dark:text-sand-100">
                    {inquiry.name}
                    {inquiry.organization && (
                      <span className="text-brand-500 dark:text-brand-100"> — {inquiry.organization}</span>
                    )}
                  </p>
                  <p className="text-xs text-brand-300 dark:text-brand-100">
                    {new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(
                      new Date(inquiry.$createdAt)
                    )}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(inquiry.$id)}
                  disabled={pendingId === inquiry.$id}
                  className="rounded-md border border-clay-500 px-3 py-1.5 text-xs font-medium text-clay-500 hover:bg-clay-400/10 disabled:opacity-50 dark:text-clay-400"
                >
                  Delete
                </button>
              </div>

              <p className="mt-3 text-sm text-brand-900 dark:text-sand-50">{inquiry.message}</p>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-brand-500 dark:text-brand-100">
                <a href={`mailto:${inquiry.email}`} className="underline">
                  {inquiry.email}
                </a>
                {inquiry.phone && <span>{inquiry.phone}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
