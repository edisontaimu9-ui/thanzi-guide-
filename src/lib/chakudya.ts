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

// A food returned by the /foods/lookup cascade. Local hits share the same
// shape as ChakudyaFood (plus a few always-present extras); hits that fall
// through to USDA / Open Food Facts / FatSecret only have the external
// fields — measure/weight_g/kj/kcal are Malawi-FCT-only columns and won't
// be present, so callers should read energy_kcal, not kcal, for those.
export interface CascadeFood {
  id?: number;
  food_name: string;
  category: string;
  measure?: string;
  weight_g?: number;
  kcal?: number;
  kj?: number;
  energy_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  barcode: string | null;
  source: string;
  external_id: string | null;
}

export interface FoodLookupResult {
  food: CascadeFood;
  source: string;
  cached: boolean;
  freshlyCached: boolean;
}

/**
 * Hits the cascade: local `foods` -> local `packaged_foods` -> previously
 * cached external result -> USDA FDC / Open Food Facts / FatSecret (name
 * searches go USDA -> FatSecret). Use this as a fallback when a plain
 * `searchFoods` call comes back empty — it's a single best match, not a
 * list, so it's not a drop-in replacement for `searchFoods`.
 * Returns null on a genuine "not found anywhere" (API responds 404).
 */
export async function lookupFood(query: string): Promise<FoodLookupResult | null> {
  const res = await fetch(`${BASE_URL}/foods/lookup?q=${encodeURIComponent(query)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Chakudya API error (${res.status})`);
  }
  const json: { status: string; source: string; cached: boolean; freshly_cached: boolean; data: CascadeFood; message?: string } =
    await res.json();
  if (json.status !== 'success') {
    throw new Error(json.message || 'Chakudya API returned an error');
  }
  return { food: json.data, source: json.source, cached: json.cached, freshlyCached: json.freshly_cached };
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
