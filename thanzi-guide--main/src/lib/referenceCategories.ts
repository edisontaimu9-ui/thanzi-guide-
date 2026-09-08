// Single source of truth for reference "shelves" — used both as the
// admin Content Manager's category dropdown options (contentSchemas.ts)
// and as the public library's folder cards (routes/References.tsx). The
// string values are stored verbatim in the `category` attribute on each
// reference document, so keep them in sync with the Appwrite attribute
// if this list ever changes.
export const REFERENCE_CATEGORIES = [
  'Books',
  'Clinical Nutrition Guidelines',
  'Research Articles',
  'Academic Materials',
  'Malawi Nutrition Resources',
  'Global Nutrition',
  'Food & Nutrition Data',
  'Clinical Tools'
] as const;

export type ReferenceCategory = (typeof REFERENCE_CATEGORIES)[number];
