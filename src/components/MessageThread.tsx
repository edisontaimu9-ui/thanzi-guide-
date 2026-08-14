import { useEffect, useRef, useState } from 'react';
import { listMessages, sendMessage, MessageDoc, SenderRole } from '@/lib/messages';

type Status = 'loading' | 'idle' | 'error';

interface MessageThreadProps {
  appointmentId: string;
  currentUserId: string;
  currentRole: SenderRole;
  isClosed: boolean;
  closedReason?: string;
}

export function MessageThread({
  appointmentId,
  currentUserId,
  currentRole,
  isClosed,
  closedReason
}: MessageThreadProps) {
  const [messages, setMessages] = useState<MessageDoc[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    setStatus('loading');
    try {
      const docs = await listMessages(appointmentId);
      setMessages(docs);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError(null);
    try {
      await sendMessage({
        appointmentId,
        senderId: currentUserId,
        senderRole: currentRole,
        body
      });
      setDraft('');
      await load();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Message failed to send. Try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[60vh] flex-col rounded-lg border border-brand-100 dark:border-ink-800">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {status === 'loading' && <p className="text-sm text-brand-500 dark:text-brand-100">Loading…</p>}
        {status === 'error' && (
          <p role="alert" className="text-sm text-clay-500 dark:text-clay-400">
            Couldn't load messages right now.
          </p>
        )}
        {status === 'idle' && messages.length === 0 && (
          <p className="text-sm text-brand-500 dark:text-brand-100">No messages yet, say hello.</p>
        )}
        {status === 'idle' &&
          messages.map((msg) => {
            const isMine = msg.senderId === currentUserId;
            return (
              <div key={msg.$id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    isMine
                      ? 'bg-brand-500 text-white'
                      : 'bg-sand-100 text-brand-900 dark:bg-ink-900 dark:text-sand-50'
                  }`}
                >
                  {msg.body}
                </div>
              </div>
            );
          })}
        <div ref={bottomRef} />
      </div>

      {isClosed ? (
        <p className="border-t border-brand-100 p-4 text-center text-sm text-brand-500 dark:border-ink-800 dark:text-brand-100">
          {closedReason ?? 'This conversation is closed.'}
        </p>
      ) : (
        <div className="border-t border-brand-100 dark:border-ink-800">
          {sendError && (
            <p role="alert" className="px-3 pt-2 text-xs text-clay-500 dark:text-clay-400">
              {sendError}
            </p>
          )}
          <form onSubmit={handleSend} className="flex gap-2 p-3">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 rounded-md border border-brand-100 bg-white p-2 text-sm text-brand-900 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              className="shrink-0 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
