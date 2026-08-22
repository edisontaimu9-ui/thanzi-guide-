import { FormEvent, useEffect, useRef, useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ragAsk, writeMemory, RagAskResult } from '@/lib/chakudya';
import { TypewriterText } from '@/lib/markdown';

const SOURCE_LABELS: Record<string, string> = {
  knowledge_base: 'Knowledge base',
  malawi_fct: 'Malawi food composition table',
  packaged_foods: 'Packaged foods',
  diabetes_exchange: 'Diabetes exchange list',
  renal_exchange: 'Renal exchange list',
  enteral_formula: 'Enteral formula',
  session_memory: 'This conversation'
};

function sourceLabel(source: string): string {
  if (SOURCE_LABELS[source]) return SOURCE_LABELS[source];
  if (source?.startsWith('barcode_')) return `Barcode · ${source.replace('barcode_', '')}`;
  if (source?.startsWith('external_')) return source.replace('external_', '').replace(/_/g, ' ');
  return source || 'Source';
}

// The LLM is instructed to cite with ASCII brackets ([2]) but occasionally
// reaches for full-width ones instead (【2】) — visually inconsistent, and it
// silently broke citedSourceIds' match below (no Sources block at all, even
// though the answer visibly cited things). Normalize before anything else
// touches the text so rendering and citation-matching both see plain [N].
function normalizeCitationBrackets(text: string): string {
  return text.replace(/[\u3010\uFF3B]/g, '[').replace(/[\u3011\uFF3D]/g, ']');
}

// /rag/ask returns every candidate chunk the reranker fed the LLM (up to
// top_k), but the LLM only cites the ones it actually drew from — several
// candidates commonly come from the same source document and go unused.
// Showing all of them under "Sources" overstates what backs the answer, so
// this pulls out just the [N] numbers that appear in the answer text.
function citedSourceIds(answer: string): Set<number> {
  const ids = new Set<number>();
  const regex = /\[(\d+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(answer)) !== null) {
    ids.add(parseInt(match[1], 10));
  }
  return ids;
}

interface GroupedSource {
  ids: number[];
  title: string;
  source: string;
}

// Several cited chunks are often different snippets of the very same
// document (e.g. five rows out of one food composition table) — listing
// each with its own repeated citation line is noisy. Groups them by
// title+source so each unique document appears once, with every bracket
// number that points to it, in the order it was first cited.
function groupCitedSources(list: RagAskResult['sources']): GroupedSource[] {
  const map = new Map<string, GroupedSource>();
  const order: string[] = [];
  for (const s of list) {
    const key = `${s.title}\u0000${s.source}`;
    if (!map.has(key)) {
      map.set(key, { ids: [], title: s.title, source: s.source });
      order.push(key);
    }
    map.get(key)!.ids.push(s.id);
  }
  return order.map((k) => map.get(k)!);
}

// A larger pool than we actually show at once. A handful of disease/medicine
// topics are mixed in with food/nutrition ones so people unfamiliar with the
// format see what kind of thing they can ask, in both shapes ("explain this"
// and plain questions). Randomly sampled down to SUGGESTED_COUNT per visit
// (see pickSuggested) so the panel doesn't look identical every time.
const suggestedPool = [
  'What nutrients are in nsima?',
  'What causes anaemia?',
  'Explain diabetes: causes, symptoms, and nutrition considerations.',
  'How much water should I drink daily?',
  'Is groundnut flour good for a baby?',
  'What foods help manage high blood pressure?',
  'Explain metformin: uses, side effects, and food interactions.',
  'What should I eat during pregnancy?',
  'Is soya flour a good protein source?',
  'What causes malnutrition in children?',
  'Explain hypertension: causes, symptoms, and nutrition considerations.',
  'How can I tell if a baby is underweight?',
  'What foods are good for breastfeeding mothers?',
  'Is mgaiwa nsima healthier than white nsima?',
  'What causes kwashiorkor?',
  'Explain iron-deficiency anaemia and which foods help.',
  'How much protein does a growing child need?',
  'What foods should a diabetic avoid?'
];

const SUGGESTED_COUNT = 7;

// Fisher-Yates shuffle, then take the first n. Keeps suggestedPool as the
// single source of truth for what's eligible, while what's shown varies.
function pickSuggested(pool: string[], n: number): string[] {
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

type Message =
  | { role: 'user'; text: string }
  | { role: 'answer'; result: RagAskResult; animate?: boolean; feedback?: 'like' | 'dislike' }
  | { role: 'error'; message: string };

// A "thread" is one saved conversation: its own message list and its own
// Chakudya session id (session ids are how /rag/ask's server-side memory
// recall is scoped, so each thread needs a distinct one — sharing one
// across threads would bleed memory between unrelated conversations).
interface Thread {
  id: string;
  sessionId: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

const THREADS_STORAGE_KEY = 'thanzi-ask-threads';
const ACTIVE_THREAD_STORAGE_KEY = 'thanzi-ask-active-thread';
// Legacy single-conversation keys from before multi-thread history existed.
// Only read once, to migrate anyone's in-progress chat into thread form.
const LEGACY_SESSION_KEY = 'thanzi-ask-session-id';
const LEGACY_MESSAGES_KEY = 'thanzi-ask-messages';

function makeId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function threadTitle(messages: Message[]): string {
  const firstUser = messages.find((m): m is Extract<Message, { role: 'user' }> => m.role === 'user');
  if (!firstUser) return 'New chat';
  return firstUser.text.length > 48 ? `${firstUser.text.slice(0, 48)}…` : firstUser.text;
}

function newThread(): Thread {
  return { id: makeId(), sessionId: makeId(), title: 'New chat', messages: [], updatedAt: Date.now() };
}

// Loads saved threads, migrating the old single-conversation storage format
// (from before branching existed) into a thread the first time this runs.
function loadThreads(): Thread[] {
  try {
    const raw = localStorage.getItem(THREADS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Thread[];
      // Restored history should never re-play the typewriter animation.
      return parsed.map((t) => ({
        ...t,
        messages: t.messages.map((m) => (m.role === 'answer' ? { ...m, animate: false } : m))
      }));
    }
  } catch {
    // Corrupt/unavailable storage — fall through to migration or a blank thread.
  }

  try {
    const legacySession = localStorage.getItem(LEGACY_SESSION_KEY);
    const legacyRaw = localStorage.getItem(LEGACY_MESSAGES_KEY);
    if (legacyRaw) {
      const legacyMessages = (JSON.parse(legacyRaw) as Message[]).map((m) =>
        m.role === 'answer' ? { ...m, animate: false } : m
      );
      if (legacyMessages.length) {
        const migrated: Thread = {
          id: makeId(),
          sessionId: legacySession || makeId(),
          title: threadTitle(legacyMessages),
          messages: legacyMessages,
          updatedAt: Date.now()
        };
        localStorage.removeItem(LEGACY_MESSAGES_KEY);
        localStorage.removeItem(LEGACY_SESSION_KEY);
        return [migrated];
      }
    }
  } catch {
    // Ignore — worst case the old conversation is lost, not corrupted.
  }

  return [];
}

function loadActiveThreadId(threads: Thread[]): string {
  try {
    const stored = localStorage.getItem(ACTIVE_THREAD_STORAGE_KEY);
    if (stored && threads.some((t) => t.id === stored)) return stored;
  } catch {
    // Fall through.
  }
  return threads[0]?.id ?? '';
}

function relativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

// ---- Small inline icons (no icon library dependency in this project) ----

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
function LikeIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}
function DislikeIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(180deg)' }}>
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.59 13.51 6.83 3.98M15.41 6.51 8.59 10.49" />
    </svg>
  );
}
function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}
function RetryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}
function BranchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v12" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="6" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}
function HistoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

export function Ask() {
  useDocumentTitle('Ask');
  const [threads, setThreads] = useState<Thread[]>(loadThreads);
  const [activeThreadId, setActiveThreadId] = useState<string>(() => loadActiveThreadId(loadThreads()));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  // Transient "Copied" confirmation, keyed by message index in the active thread.
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Tracks which answer messages have finished typing, so the Sources list
  // and disclaimer only appear once the typewriter is done — otherwise they
  // render immediately under a still-animating answer and visibly jump.
  // Keyed by "threadId:index" so switching threads and coming back doesn't
  // re-trigger a visible flicker (already-typed messages stay marked done).
  const [typingDone, setTypingDone] = useState<Record<string, boolean>>({});
  // Index (within the active thread) of the user message currently being
  // edited, if any — null when nothing's being edited. Editing is exclusive:
  // only one message at a time, and it resets whenever the thread changes.
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  // Picked once per mount (lazy initializer, not re-rolled on every render)
  // so the panel doesn't reshuffle mid-visit — only when the Ask page is
  // freshly opened.
  const [suggested] = useState(() => pickSuggested(suggestedPool, SUGGESTED_COUNT));

  function markTypingDone(key: string) {
    setTypingDone((d) => (d[key] ? d : { ...d, [key]: true }));
  }

  let activeThread = threads.find((t) => t.id === activeThreadId);
  if (!activeThread) {
    // First run (no saved threads) or the stored active id no longer
    // exists — fall back to an in-memory blank thread. It gets persisted
    // for real the moment the person asks something (see updateThread).
    activeThread = newThread();
  }
  const messages = activeThread.messages;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, loading]);

  useEffect(() => {
    try {
      localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
    } catch {
      // Storage full/unavailable — conversation just won't survive a reload this time.
    }
  }, [threads]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_THREAD_STORAGE_KEY, activeThreadId);
    } catch {
      // Best-effort.
    }
  }, [activeThreadId]);

  // Applies `updater` to the given thread's message list, creating the
  // thread in the saved list if this is its first message.
  function updateThread(id: string, updater: (msgs: Message[]) => Message[]) {
    setThreads((prev) => {
      const exists = prev.some((t) => t.id === id);
      const base = exists ? prev : [...prev, id === activeThread!.id ? activeThread! : newThread()];
      return base.map((t) => {
        if (t.id !== id) return t;
        const nextMessages = updater(t.messages);
        return {
          ...t,
          messages: nextMessages,
          title: t.title === 'New chat' ? threadTitle(nextMessages) : t.title,
          updatedAt: Date.now()
        };
      });
    });
  }

  function startNewChat() {
    const t = newThread();
    setThreads((prev) => [...prev, t]);
    setActiveThreadId(t.id);
    setHistoryOpen(false);
    setEditingIndex(null);
  }

  function switchThread(id: string) {
    setActiveThreadId(id);
    setHistoryOpen(false);
    setEditingIndex(null);
  }

  function deleteThread(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setThreads((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (id === activeThreadId) {
        setActiveThreadId(next[0]?.id ?? '');
      }
      return next;
    });
  }

  // Shared tail end of asking a question: hits /rag/ask for `q` in `sid`,
  // appends the answer (or error) to `threadId`. Callers are responsible for
  // getting the user-facing question message into place first — `ask` below
  // appends a new one, `saveEdit` replaces an existing one in place — since
  // those two cases need different message-list edits before the same
  // network round trip.
  async function runQuery(threadId: string, sid: string, q: string) {
    setLoading(true);
    try {
      const result = await ragAsk(q, 6, sid);
      updateThread(threadId, (msgs) => [...msgs, { role: 'answer', result, animate: true }]);
      // Fire-and-forget: record this turn as session memory so later
      // questions in the same thread can recall it. Never blocks or
      // affects the UI if it fails.
      writeMemory(sid, `Q: ${q}\nA: ${result.answer}`);
    } catch {
      updateThread(threadId, (msgs) => [
        ...msgs,
        { role: 'error', message: "Couldn't get an answer right now. Please try again." }
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function ask(question: string, threadId: string = activeThreadId) {
    const q = question.trim();
    if (!q || loading) return;
    const sid = (threads.find((t) => t.id === threadId) ?? activeThread!).sessionId;
    setInput('');
    updateThread(threadId, (msgs) => [...msgs, { role: 'user', text: q }]);
    await runQuery(threadId, sid, q);
  }

  // Regenerates the answer at `index`: drops it (and anything after it,
  // since later turns may have relied on that answer's context) and re-asks
  // the question that preceded it.
  function retry(index: number) {
    if (loading) return;
    const question = messages[index - 1];
    if (!question || question.role !== 'user') return;
    updateThread(activeThreadId, (msgs) => msgs.slice(0, index));
    ask(question.text, activeThreadId);
  }

  // Edits the user question at `index` in place, drops everything after it
  // (the old answer, and any later turns — they were grounded in the old
  // wording), and re-asks with the new text. Same "later turns get dropped"
  // rule as retry, just also rewriting the question itself.
  function saveEdit(index: number, newText: string) {
    const q = newText.trim();
    if (!q || loading) return;
    const sid = activeThread!.sessionId;
    updateThread(activeThreadId, (msgs) => [...msgs.slice(0, index), { role: 'user', text: q }]);
    setEditingIndex(null);
    runQuery(activeThreadId, sid, q);
  }

  function startEdit(index: number, currentText: string) {
    if (loading) return;
    setEditingIndex(index);
    setEditValue(currentText);
  }

  function cancelEdit() {
    setEditingIndex(null);
  }

  function toggleFeedback(index: number, kind: 'like' | 'dislike') {
    updateThread(activeThreadId, (msgs) =>
      msgs.map((m, i) => {
        if (i !== index || m.role !== 'answer') return m;
        return { ...m, feedback: m.feedback === kind ? undefined : kind };
      })
    );
  }

  async function copyAnswer(index: number, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((i) => (i === index ? null : i)), 1500);
    } catch {
      // Clipboard permission denied or unavailable — silently do nothing
      // rather than throwing an error over a non-critical convenience action.
    }
  }

  async function shareAnswer(text: string) {
    // The share sheet gets text + a link back to Ask (most apps — WhatsApp,
    // SMS, etc. — append the url after the text automatically). The
    // clipboard fallback has to combine them itself since there's no
    // separate "url" field when just copying plain text.
    const url = `${window.location.origin}${import.meta.env.BASE_URL}ask`;
    if (navigator.share) {
      try {
        await navigator.share({ text, url });
      } catch {
        // Person cancelled the share sheet, or it's unsupported — nothing to do.
      }
    } else {
      copyAnswer(-1, `${text}\n\n${url}`);
    }
  }

  // Forks the conversation up to and including `index` into a brand-new
  // thread with its own session id, then replays that prefix into the new
  // session's server-side memory so /rag/ask's recall still has the same
  // context the original thread had at that point.
  function branchAt(index: number) {
    const prefix = messages.slice(0, index + 1).map((m) => (m.role === 'answer' ? { ...m, animate: false } : m));
    const t: Thread = {
      id: makeId(),
      sessionId: makeId(),
      title: threadTitle(prefix),
      messages: prefix,
      updatedAt: Date.now()
    };
    setThreads((prev) => [...prev, t]);
    setActiveThreadId(t.id);
    setHistoryOpen(false);
    setEditingIndex(null);

    for (let i = 0; i < prefix.length; i++) {
      const m = prefix[i];
      if (m.role === 'answer') {
        const q = prefix[i - 1];
        if (q?.role === 'user') {
          writeMemory(t.sessionId, `Q: ${q.text}\nA: ${m.result.answer}`);
        }
      }
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ask(input);
  }

  const sortedThreads = [...threads].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <main className="mx-auto flex max-w-2xl flex-col px-6 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">Ask</h1>
          <p className="mt-2 text-brand-500 dark:text-brand-100">
            Ask health and nutrition questions and get answers grounded in Thanzi Guide's own content.
          </p>
        </div>
        <div className="relative flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setHistoryOpen((o) => !o)}
            aria-label="Chat history"
            className="mt-1 flex items-center gap-1 rounded-full border border-brand-100 px-3 py-1.5 text-xs font-semibold text-brand-500 hover:border-brand-500 hover:text-brand-700 dark:border-ink-800 dark:text-brand-100"
          >
            <HistoryIcon />
          </button>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={startNewChat}
              className="mt-1 rounded-full border border-brand-100 px-3 py-1.5 text-xs font-semibold text-brand-500 hover:border-brand-500 hover:text-brand-700 dark:border-ink-800 dark:text-brand-100"
            >
              New chat
            </button>
          )}

          {historyOpen && (
            <div className="absolute right-0 top-10 z-10 max-h-80 w-72 overflow-y-auto rounded-xl border border-brand-100 bg-white p-1.5 shadow-lg dark:border-ink-800 dark:bg-ink-950">
              {sortedThreads.length === 0 && (
                <p className="px-3 py-3 text-xs text-brand-300 dark:text-brand-100">No conversations yet.</p>
              )}
              {sortedThreads.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => switchThread(t.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-brand-100/40 dark:hover:bg-ink-800/60 ${
                    t.id === activeThreadId ? 'bg-brand-100/60 dark:bg-ink-800' : ''
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-brand-700 dark:text-sand-50">{t.title}</span>
                    <span className="text-[10px] text-brand-300 dark:text-brand-100">{relativeTime(t.updatedAt)}</span>
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => deleteThread(t.id, e)}
                    className="shrink-0 rounded-full px-1.5 py-0.5 text-brand-300 hover:bg-clay-400/20 hover:text-clay-500 dark:text-brand-100"
                    aria-label="Delete conversation"
                  >
                    ✕
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {messages.length === 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-300 dark:text-brand-100">
            Try asking
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggested.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="rounded-full border border-brand-100 bg-white px-3 py-1.5 text-sm text-brand-700 hover:border-brand-500 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex-1 space-y-4">
        {messages.map((m, i) => {
          if (m.role === 'user') {
            if (editingIndex === i) {
              return (
                <div key={i} className="flex justify-end">
                  <div className="w-full max-w-[80%] rounded-2xl rounded-tr-sm border border-brand-500 bg-white p-2 dark:bg-ink-950">
                    <textarea
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          saveEdit(i, editValue);
                        } else if (e.key === 'Escape') {
                          cancelEdit();
                        }
                      }}
                      rows={Math.min(6, Math.max(2, Math.ceil(editValue.length / 40)))}
                      className="w-full resize-none rounded-lg bg-transparent px-1.5 py-1 text-sm text-brand-700 focus:outline-none dark:text-sand-50"
                    />
                    <div className="mt-1 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-full px-3 py-1 text-xs font-semibold text-brand-300 hover:text-brand-700 dark:text-brand-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(i, editValue)}
                        disabled={!editValue.trim()}
                        className="rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div key={i} className="flex flex-col items-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-brand-500 px-4 py-2.5 text-sm text-white">
                  {m.text}
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(i, m.text)}
                  disabled={loading}
                  aria-label="Edit message"
                  title="Edit"
                  className="mt-1 rounded-full p-1 text-brand-300 hover:text-brand-700 disabled:opacity-40 dark:text-brand-100"
                >
                  <EditIcon />
                </button>
              </div>
            );
          }
          if (m.role === 'error') {
            return (
              <div key={i} className="rounded-lg border border-clay-400/40 bg-clay-400/10 px-4 py-3 text-sm text-clay-500 dark:text-clay-400">
                {m.message}
                <button
                  type="button"
                  onClick={() => retry(i)}
                  disabled={loading}
                  className="ml-2 font-semibold underline underline-offset-2 disabled:opacity-50"
                >
                  Retry
                </button>
              </div>
            );
          }
          const { answer: rawAnswer, sources } = m.result;
          const answer = normalizeCitationBrackets(rawAnswer);
          const citedIds = citedSourceIds(answer);
          const citedSources = sources.filter((s) => citedIds.has(s.id));
          const key = `${activeThreadId}:${i}`;
          const done = !!typingDone[key];
          return (
            <div key={i} className="rounded-2xl rounded-tl-sm border border-brand-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-950">
              <TypewriterText
                text={answer}
                animate={!!m.animate}
                onTick={() => bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })}
                onComplete={() => markTypingDone(key)}
              />

              {done && citedSources.length > 0 && (
                <div className="mt-3 border-t border-brand-100 pt-3 dark:border-ink-800">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-300 dark:text-brand-100">
                    Sources
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {groupCitedSources(citedSources).map((g) => (
                      <li key={g.ids.join(',')} className="text-xs text-brand-300 dark:text-brand-100">
                        <span className="font-mono text-brand-500 dark:text-brand-100">
                          {g.ids.map((id) => `[${id}]`).join('')}
                        </span>{' '}
                        {g.title}
                        {/* "Knowledge base" is an internal category tag, not
                            something a reader needs — the citation title
                            (e.g. a textbook chapter) speaks for itself. */}
                        {g.source !== 'knowledge_base' && (
                          <span className="opacity-75"> · {sourceLabel(g.source)}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {done && (
                <div className="mt-3 rounded-lg bg-clay-400/10 px-3 py-2 text-xs text-clay-500 dark:text-clay-400">
                  Educational information only — not a diagnosis. Speak with a clinician for personal medical advice.
                </div>
              )}

              {done && (
                <div className="mt-2 flex items-center gap-1 border-t border-brand-100 pt-2 dark:border-ink-800">
                  <button
                    type="button"
                    onClick={() => copyAnswer(i, answer)}
                    aria-label="Copy answer"
                    title={copiedIndex === i ? 'Copied!' : 'Copy'}
                    className="rounded-full p-1.5 text-brand-300 hover:bg-brand-100/50 hover:text-brand-700 dark:text-brand-100 dark:hover:bg-ink-800"
                  >
                    <CopyIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFeedback(i, 'like')}
                    aria-label="Good response"
                    className={`rounded-full p-1.5 hover:bg-brand-100/50 dark:hover:bg-ink-800 ${
                      m.feedback === 'like' ? 'text-brand-500' : 'text-brand-300 dark:text-brand-100'
                    }`}
                  >
                    <LikeIcon filled={m.feedback === 'like'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFeedback(i, 'dislike')}
                    aria-label="Bad response"
                    className={`rounded-full p-1.5 hover:bg-brand-100/50 dark:hover:bg-ink-800 ${
                      m.feedback === 'dislike' ? 'text-clay-500' : 'text-brand-300 dark:text-brand-100'
                    }`}
                  >
                    <DislikeIcon filled={m.feedback === 'dislike'} />
                  </button>
                  <button
                    type="button"
                    onClick={() => shareAnswer(answer)}
                    aria-label="Share answer"
                    title={copiedIndex === -1 ? 'Copied!' : 'Share'}
                    className="rounded-full p-1.5 text-brand-300 hover:bg-brand-100/50 hover:text-brand-700 dark:text-brand-100 dark:hover:bg-ink-800"
                  >
                    <ShareIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => retry(i)}
                    disabled={loading}
                    aria-label="Retry"
                    className="rounded-full p-1.5 text-brand-300 hover:bg-brand-100/50 hover:text-brand-700 disabled:opacity-50 dark:text-brand-100 dark:hover:bg-ink-800"
                  >
                    <RetryIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => branchAt(i)}
                    aria-label="Branch in new chat"
                    title="Branch in new chat"
                    className="rounded-full p-1.5 text-brand-300 hover:bg-brand-100/50 hover:text-brand-700 dark:text-brand-100 dark:hover:bg-ink-800"
                  >
                    <BranchIcon />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="rounded-2xl rounded-tl-sm border border-brand-100 bg-white px-4 py-3 text-sm text-brand-300 dark:border-ink-800 dark:bg-ink-950 dark:text-brand-100">
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="sticky bottom-4 mt-6 flex gap-2 rounded-full border border-brand-100 bg-white p-1.5 shadow-lg dark:border-ink-800 dark:bg-ink-950">
        <label htmlFor="ask-input" className="sr-only">
          Ask a question
        </label>
        <input
          id="ask-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a health or nutrition question…"
          disabled={loading}
          className="flex-1 rounded-full bg-transparent px-3 py-2 text-sm text-brand-700 placeholder:text-brand-300 focus:outline-none dark:text-sand-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </main>
  );
}
