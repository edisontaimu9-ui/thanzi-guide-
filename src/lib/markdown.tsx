import { Fragment, ReactNode, useEffect, useRef, useState } from 'react';

// Minimal Markdown renderer — no dependency, just enough for RAG answers:
// **bold**, *italics*, `code`, and "* "/"- " bullet lists. Deliberately not
// a full CommonMark parser; /rag/ask answers don't use headings, tables,
// links, or nested lists.

let keySeed = 0;

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[2] !== undefined) {
      nodes.push(<strong key={keySeed++}>{match[2]}</strong>);
    } else if (match[4] !== undefined) {
      nodes.push(<em key={keySeed++}>{match[4]}</em>);
    } else if (match[6] !== undefined) {
      nodes.push(
        <code
          key={keySeed++}
          className="rounded bg-brand-100/60 px-1 py-0.5 text-[0.85em] dark:bg-ink-800"
        >
          {match[6]}
        </code>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');
  const blocks: ReactNode[] = [];
  let listBuffer: string[] = [];
  let paraBuffer: string[] = [];

  function flushList() {
    if (listBuffer.length) {
      blocks.push(
        <ul key={keySeed++} className="my-2 list-disc space-y-1 pl-5">
          {listBuffer.map((item) => (
            <li key={keySeed++}>{parseInline(item)}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  }

  function flushPara() {
    if (paraBuffer.length) {
      blocks.push(
        <p key={keySeed++} className="mb-2 last:mb-0">
          {paraBuffer.map((line, i) => (
            <Fragment key={keySeed++}>
              {i > 0 && <br />}
              {parseInline(line)}
            </Fragment>
          ))}
        </p>
      );
      paraBuffer = [];
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const listMatch = /^[*-]\s+(.*)/.exec(line);
    if (listMatch) {
      flushPara();
      listBuffer.push(listMatch[1]);
    } else if (line === '') {
      flushList();
      flushPara();
    } else {
      flushList();
      paraBuffer.push(line);
    }
  }
  flushList();
  flushPara();

  return <div className="text-sm leading-relaxed text-brand-700 dark:text-sand-50">{blocks}</div>;
}

// Reveals `text` a chunk at a time through MarkdownText, for a typewriter
// effect on freshly-arrived answers. `animate={false}` (e.g. answers
// restored from a saved conversation) renders instantly — nobody wants to
// re-watch history type itself out on every page load.
//
// Chunk size scales with total length so a one-line and a 400-word answer
// both finish in roughly the same ~2.5s, instead of long answers crawling.
export function TypewriterText({
  text,
  animate,
  onTick
}: {
  text: string;
  animate: boolean;
  onTick?: () => void;
}) {
  const [shownLength, setShownLength] = useState(animate ? 0 : text.length);
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    if (!animate) {
      setShownLength(text.length);
      return;
    }
    setShownLength(0);
    const totalTicks = 60;
    const intervalMs = 30;
    const chunkSize = Math.max(1, Math.ceil(text.length / totalTicks));
    let shown = 0;
    const id = setInterval(() => {
      shown = Math.min(text.length, shown + chunkSize);
      setShownLength(shown);
      onTickRef.current?.();
      if (shown >= text.length) clearInterval(id);
    }, intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, animate]);

  return <MarkdownText text={text.slice(0, shownLength)} />;
}
