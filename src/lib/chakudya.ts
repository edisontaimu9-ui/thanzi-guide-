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
 *
 * The API takes `q` (name) and `barcode` as genuinely separate params —
 * a barcode string sent as `q` only runs the name ilike-search branch and
 * never reaches the barcode-specific local/Open Food Facts/FatSecret
 * lookups. So an 8-14 digit query (a barcode/EAN/UPC) is sent as
 * `barcode` instead of `q`; anything else is sent as `q` as before.
 *
 * Returns null on a genuine "not found anywhere" (API responds 404).
 */
export async function lookupFood(query: string): Promise<FoodLookupResult | null> {
  const trimmed = query.trim();
  const isBarcode = /^\d{8,14}$/.test(trimmed);
  const param = isBarcode ? `barcode=${encodeURIComponent(trimmed)}` : `q=${encodeURIComponent(trimmed)}`;
  const res = await fetch(`${BASE_URL}/foods/lookup?${param}`);
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

// ── Community packaged-food submissions ────────────────────────────────────
// Ported from Oasis CNST's packaged-foods submission flow (per-100
// normalization, Atwater kcal-consistency check), adapted to call Chakudya
// directly instead of going through Oasis's IndexedDB-backed cache layer.

// Matches packaged_foods DB column names exactly (POST /packaged/submit
// writes these columns directly — see chakudya-api's PACKAGED_FOOD_DB_
// NUTRIENT_FIELDS). `barcode` and `product_name` are the only two the API
// requires; everything else is optional.
export interface PackagedFoodSubmission {
  barcode: string;
  product_name: string;
  brand?: string;
  serving_size?: string | null;
  energy_kcal?: number | null;
  protein_g?: number | null;
  fat_g?: number | null;
  saturated_fat_g?: number | null;
  carbs_g?: number | null;
  sugar_g?: number | null;
  fiber_g?: number | null;
  sodium_mg?: number | null;
  salt_g?: number | null;
}

export interface PackagedFoodSubmitResult {
  alreadyExists: boolean;
  message: string;
  data: Record<string, unknown>;
}

/**
 * Atwater estimate: protein 4 kcal/g, carbs 4 kcal/g, fat 9 kcal/g.
 * Mirrors Oasis's `calcExpectedKcal` — used client-side to give the
 * submitter an early heads-up before the server's own check runs.
 */
export function calcExpectedKcal(
  proteinG: number | null,
  carbsG: number | null,
  fatG: number | null
): number | null {
  if (proteinG == null || carbsG == null || fatG == null) return null;
  return Math.round((proteinG * 4 + carbsG * 4 + fatG * 9) * 100) / 100;
}

/**
 * Same tolerance formula Chakudya's server uses (checkMacrosMatchCalories):
 * greater of 20 kcal flat or 15% relative — absorbs normal label rounding
 * without flagging every legitimate submission.
 */
export function checkKcalConsistency(
  kcal: number | null,
  proteinG: number | null,
  carbsG: number | null,
  fatG: number | null
): { checked: boolean; expectedKcal?: number; providedKcal?: number; diffKcal?: number; consistent?: boolean } {
  const expected = calcExpectedKcal(proteinG, carbsG, fatG);
  if (expected == null || kcal == null) return { checked: false };
  const diff = Math.round(Math.abs(expected - kcal) * 100) / 100;
  const tolerance = Math.round(Math.max(20, kcal * 0.15) * 100) / 100;
  return { checked: true, expectedKcal: expected, providedKcal: kcal, diffKcal: diff, consistent: diff <= tolerance };
}

/**
 * Scales a per-serving value up to per-100g/ml. Mirrors Oasis's
 * `_pkgScaleToPer100` — used when the submitter enters values off the
 * label's "per serving" column instead of "per 100g/ml".
 */
export function scaleToPer100(value: number | null, servingGrams: number): number | null {
  if (value == null || !servingGrams) return value;
  return Math.round(value * (100 / servingGrams) * 100) / 100;
}

/**
 * POST /packaged/submit — public, rate-limited community contribution.
 * Requires `barcode` and `product_name`; everything else is optional.
 * The server does its own per-100 normalization and Atwater check too, so
 * this never blocks a submission — it inserts as status "pending" for
 * admin review either way. A 409 means this barcode already has an
 * approved/pending entry; that's surfaced as `alreadyExists`, not thrown.
 */
export async function submitPackagedFood(payload: PackagedFoodSubmission): Promise<PackagedFoodSubmitResult> {
  const res = await fetch(`${BASE_URL}/packaged/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json: { status: string; message?: string; already_exists?: boolean; data?: Record<string, unknown> } =
    await res.json();
  if (res.status === 409 && json.already_exists) {
    return { alreadyExists: true, message: json.message || 'This barcode already has an entry.', data: json.data || {} };
  }
  if (!res.ok || json.status !== 'success') {
    throw new Error(json.message || `Chakudya API error (${res.status})`);
  }
  return { alreadyExists: false, message: json.message || 'Submitted for review', data: json.data || {} };
}

export interface ScanLabelResult {
  status: 'success' | 'needs_retry' | 'error';
  message?: string;
  needsReview?: boolean;
  alreadyExists?: boolean;
  data?: Record<string, unknown>;
}

/**
 * POST /packaged/scan — photo-based submission shortcut, ported from
 * Oasis CNST's packaged-foods scanner. Send up to 5 resized/base64
 * (data URL) photos of a nutrition label, plus the barcode if it's known.
 * Chakudya OCRs and parses them server-side and — unlike the manual form —
 * inserts the result directly as a "pending" packaged_foods row on
 * success, so this bypasses filling in the fields entirely rather than
 * just autofilling them. `needs_retry` means the label couldn't be read
 * confidently and nothing was submitted; `needsReview` on a *success*
 * means it went in but with lower OCR confidence (or the declared calories
 * don't closely match protein/carbs/fat), flagged for closer admin review.
 * Same as `/packaged/submit`, a barcode that already has an
 * approved/pending entry comes back as `status: "success"` (HTTP 409) with
 * `alreadyExists: true` and the existing row in `data` — not an error.
 */
export async function scanPackagedFoodLabel(images: string[], barcode?: string): Promise<ScanLabelResult> {
  const cleanBarcode = barcode ? barcode.replace(/\D/g, '') : '';
  const res = await fetch(`${BASE_URL}/packaged/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      images: images.slice(0, 5),
      ...(cleanBarcode ? { barcode: cleanBarcode } : {})
    })
  });
  const json: {
    status: string;
    message?: string;
    needs_review?: boolean;
    already_exists?: boolean;
    data?: Record<string, unknown>;
  } = await res.json();
  return {
    status: (json.status as ScanLabelResult['status']) || 'error',
    message: json.message,
    needsReview: json.needs_review,
    alreadyExists: json.already_exists,
    data: json.data
  };
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
export async function ragAsk(query: string, topK = 6, sessionId?: string): Promise<RagAskResult> {
  const res = await fetch(`${BASE_URL}/rag/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      context: 'general',
      top_k: topK,
      ...(sessionId ? { session_id: sessionId } : {})
    })
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
