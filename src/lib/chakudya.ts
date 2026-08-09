// Client for the Chakudya Nutrition Registry (CNR) — Ed's own Malawi food
// & nutrition API (Cloudflare Worker + Supabase). Public GET/RAG routes are
// open (CORS: *), so we call the Worker directly from the browser — no SDK
// install needed for what Thanzi Guide uses.

const BASE_URL = 'https://chakudya-api.edisontaimu9.workers.dev';

export interface ChakudyaFood {
  id: number;
  food_name: string;
  category: string;
  measure: string;
  weight_g: number;
  kcal: number;
  kj: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

interface ListResponse<T> {
  status: 'success' | 'error';
  count: number;
  limit: number;
  offset: number;
  data: T[];
  message?: string;
}

export interface FoodSearchParams {
  search?: string;
  category?: string;
  limit?: number;
}

export async function searchFoods(params: FoodSearchParams = {}): Promise<ChakudyaFood[]> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category) query.set('category', params.category);
  query.set('limit', String(params.limit ?? 24));

  const res = await fetch(`${BASE_URL}/foods?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Chakudya API error (${res.status})`);
  }
  const json: ListResponse<ChakudyaFood> = await res.json();
  if (json.status !== 'success') {
    throw new Error(json.message || 'Chakudya API returned an error');
  }
  return json.data;
}

export async function getFood(id: number): Promise<ChakudyaFood> {
  const res = await fetch(`${BASE_URL}/foods/${id}`);
  if (!res.ok) {
    throw new Error(`Chakudya API error (${res.status})`);
  }
  const json: { status: string; data: ChakudyaFood; message?: string } = await res.json();
  if (json.status !== 'success') {
    throw new Error(json.message || 'Chakudya API returned an error');
  }
  return json.data;
}

export interface RagAskResult {
  answer: string;
  intent: string;
  barcode_detected: string | null;
  sources: { id: number; source: string; title: string }[];
}

/**
 * Grounded AI answer for a nutrition/food question, sourced from CNR's
 * knowledge base (Malawi FCT, exchange lists, packaged foods, etc).
 * `context: 'general'` is the right value for Thanzi Guide's public,
 * non-clinical audience — 'clinical' is for Oasis CNST.
 */
export async function ragAsk(query: string, topK = 6): Promise<RagAskResult> {
  const res = await fetch(`${BASE_URL}/rag/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, context: 'general', top_k: topK })
  });
  if (!res.ok) {
    throw new Error(`Chakudya API error (${res.status})`);
  }
  const json: { status: string; data: RagAskResult; message?: string } = await res.json();
  if (json.status !== 'success') {
    throw new Error(json.message || 'Chakudya API returned an error');
  }
  return json.data;
}
