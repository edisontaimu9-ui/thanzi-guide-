import { FormEvent, useEffect, useRef, useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ragAsk, RagAskResult } from '@/lib/chakudya';
import { MarkdownText } from '@/lib/markdown';

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

// A couple of disease/medicine topics up front give the field the same
// "explain this" shape as the free-text questions below, so people
// unfamiliar with the format see what kind of thing they can ask.
const suggested = [
  'What nutrients are in nsima?',
  'What causes anaemia?',
  "Explain diabetes: causes, symptoms, and nutrition considerations.",
  'How much water should I drink daily?',
  'Is groundnut flour good for a baby?',
  'What foods help manage high blood pressure?',
  'Explain metformin: uses, side effects, and food interactions.'
];

type Message =
  | { role: 'user'; text: string }
  | { role: 'answer'; result: RagAskResult }
  | { role: 'error'; message: string };

// One session id per page load so /rag/ask can pull this session's own
// recalled context into later answers, without persisting anything once
// the tab closes.
function makeSessionId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function Ask() {
  useDocumentTitle('Ask');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const sessionId = useRef(makeSessionId());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const result = await ragAsk(q, 6, sessionId.current);
      setMessages((m) => [...m, { role: 'answer', result }]);
    } catch {
      setMessages((m) => [...m, { role: 'error', message: "Couldn't get an answer right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ask(input);
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">Ask</h1>
      <p className="mt-2 text-brand-500 dark:text-brand-100">
        Ask health and nutrition questions and get answers grounded in Thanzi Guide's own content.
      </p>

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
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-brand-500 px-4 py-2.5 text-sm text-white">
                  {m.text}
                </div>
              </div>
            );
          }
          if (m.role === 'error') {
            return (
              <div key={i} className="rounded-lg border border-clay-400/40 bg-clay-400/10 px-4 py-3 text-sm text-clay-500 dark:text-clay-400">
                {m.message}
              </div>
            );
          }
          const { answer, sources } = m.result;
          return (
            <div key={i} className="rounded-2xl rounded-tl-sm border border-brand-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-950">
              <MarkdownText text={answer} />

              {sources.length > 0 && (
                <div className="mt-3 border-t border-brand-100 pt-3 dark:border-ink-800">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-300 dark:text-brand-100">
                    Sources
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {sources.map((s) => (
                      <li key={s.id} className="text-xs text-brand-300 dark:text-brand-100">
                        <span className="font-mono text-brand-500 dark:text-brand-100">[{s.id}]</span> {s.title}{' '}
                        <span className="opacity-75">· {sourceLabel(s.source)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-3 rounded-lg bg-clay-400/10 px-3 py-2 text-xs text-clay-500 dark:text-clay-400">
                Educational information only — not a diagnosis. Speak with a clinician for personal medical advice.
              </div>
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
