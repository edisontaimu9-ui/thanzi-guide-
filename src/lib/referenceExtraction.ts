// Extracts plain text from uploaded reference files, entirely client-side
// (no server/Worker needed for this). Returns chunks tagged with a page
// number (PDFs only, since page boundaries are meaningful there) or a
// section label (everything else, since DOCX/TXT/CSV don't have fixed
// pages — chunked by character count instead).

export interface ExtractedChunk {
  text: string;
  pageNumber?: number;
  sectionLabel?: string;
}

const CHUNK_SIZE = 1200;

function chunkText(text: string, labelPrefix: string): ExtractedChunk[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const chunks: ExtractedChunk[] = [];
  for (let i = 0; i < clean.length; i += CHUNK_SIZE) {
    const slice = clean.slice(i, i + CHUNK_SIZE).trim();
    if (slice) {
      chunks.push({ text: slice, sectionLabel: `${labelPrefix} ${chunks.length + 1}` });
    }
  }
  return chunks;
}

async function extractPdf(file: File): Promise<ExtractedChunk[]> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.mjs';

  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;

  const chunks: ExtractedChunk[] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => ('str' in item ? item.str : '')).join(' ');
    const clean = pageText.replace(/\s+/g, ' ').trim();
    if (!clean) continue;
    // Split long pages into sub-chunks, all tagged with the same page number.
    for (let i = 0; i < clean.length; i += CHUNK_SIZE) {
      const slice = clean.slice(i, i + CHUNK_SIZE).trim();
      if (slice) chunks.push({ text: slice, pageNumber: pageNum });
    }
  }
  return chunks;
}

async function extractDocx(file: File): Promise<ExtractedChunk[]> {
  const mammoth = await import('mammoth/mammoth.browser.js');
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return chunkText(result.value, 'Section');
}

async function extractPlainText(file: File): Promise<ExtractedChunk[]> {
  const text = await file.text();
  return chunkText(text, 'Part');
}

export type SupportedFileType = 'pdf' | 'docx' | 'txt' | 'csv' | 'image';

export function detectFileType(file: File): SupportedFileType | null {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx')) return 'docx';
  if (name.endsWith('.txt')) return 'txt';
  if (name.endsWith('.csv')) return 'csv';
  if (/\.(jpe?g|png|webp)$/.test(name)) return 'image';
  return null;
}

// Returns null chunks for images — no text content to index, they're
// stored as attachments only. Throws if extraction fails so the caller
// can mark the reference as failed rather than silently having no content.
export async function extractChunks(file: File, type: SupportedFileType): Promise<ExtractedChunk[] | null> {
  switch (type) {
    case 'pdf':
      return extractPdf(file);
    case 'docx':
      return extractDocx(file);
    case 'txt':
    case 'csv':
      return extractPlainText(file);
    case 'image':
      return null;
  }
}
