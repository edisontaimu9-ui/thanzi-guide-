import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/lib/auth-context';
import {
  submitPackagedFood,
  checkKcalConsistency,
  scaleToPer100,
  scanPackagedFoodLabel,
  PackagedFoodSubmission
} from '@/lib/chakudya';
import { resizeAndEncodeImage } from '@/lib/imageEncode';
import { listMySubmissions, recordMySubmission, MySubmissionEntry } from '@/lib/mySubmissions';
import { BarcodeScanner } from '@/components/BarcodeScanner';

const MAX_SCAN_PHOTOS = 5;

const inputClasses =
  'mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-900 focus:border-brand-500 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50';
const labelClasses = 'block text-sm font-medium text-brand-700 dark:text-sand-100';

type Basis = '100' | 'serving';

interface FieldState {
  productName: string;
  brand: string;
  barcode: string;
  servingSize: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  saturatedFat: string;
  sugar: string;
  fiber: string;
  sodium: string;
  salt: string;
}

const EMPTY_FIELDS: FieldState = {
  productName: '',
  brand: '',
  barcode: '',
  servingSize: '',
  kcal: '',
  protein: '',
  carbs: '',
  fat: '',
  saturatedFat: '',
  sugar: '',
  fiber: '',
  sodium: '',
  salt: ''
};

export function SubmitFood() {
  useDocumentTitle('Submit a food');
  const { user } = useAuth();
  const [fields, setFields] = useState<FieldState>(EMPTY_FIELDS);
  const [basis, setBasis] = useState<Basis>('100');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mismatchWarning, setMismatchWarning] = useState<string | null>(null);
  const [result, setResult] = useState<{ alreadyExists: boolean; message: string } | null>(null);
  const [history, setHistory] = useState<MySubmissionEntry[]>([]);

  // ── Scan-a-label shortcut (secondary path — manual form remains the default) ──
  const [scanPhotos, setScanPhotos] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<{ message: string; tone: 'info' | 'success' | 'warn' | 'error' } | null>(
    null
  );
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setHistory(listMySubmissions(user.$id));
  }, [user]);

  async function handleAddScanPhotos(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    const remaining = MAX_SCAN_PHOTOS - scanPhotos.length;
    if (remaining <= 0) {
      setScanStatus({ message: `You can add up to ${MAX_SCAN_PHOTOS} photos.`, tone: 'warn' });
      return;
    }
    const toAdd = files.slice(0, remaining);
    if (files.length > toAdd.length) {
      setScanStatus({ message: `Only added ${toAdd.length} — max ${MAX_SCAN_PHOTOS} photos per submission.`, tone: 'warn' });
    }
    try {
      const encoded = await Promise.all(toAdd.map((f) => resizeAndEncodeImage(f)));
      setScanPhotos((prev) => [...prev, ...encoded]);
    } catch {
      setScanStatus({ message: 'Could not read one of those photos. Try again.', tone: 'error' });
    }
  }

  function removeScanPhoto(index: number) {
    setScanPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleScanSubmit() {
    if (!scanPhotos.length || !user) return;
    setScanning(true);
    setScanStatus({
      message: `Reading ${scanPhotos.length} photo${scanPhotos.length > 1 ? 's' : ''} — this can take up to 15-20 seconds…`,
      tone: 'info'
    });
    try {
      const res = await scanPackagedFoodLabel(scanPhotos, fields.barcode);
      if (res.status === 'success') {
        setScanStatus({
          message: res.alreadyExists
            ? res.message || 'This barcode already has an entry — not submitting a duplicate.'
            : res.needsReview
              ? '✓ Submitted for review — scan confidence was low, an admin will double-check.'
              : '✓ Submitted for review. Thanks for contributing to Chakudya!',
          tone: res.alreadyExists ? 'warn' : 'success'
        });
        const data = res.data || {};
        recordMySubmission(user.$id, {
          barcode: String(data.barcode ?? fields.barcode ?? '').replace(/\D/g, ''),
          productName: String(data.product_name ?? data.name ?? 'Scanned product'),
          brand: data.brand ? String(data.brand) : undefined,
          submittedAt: new Date().toISOString(),
          alreadyExisted: !!res.alreadyExists
        });
        setHistory(listMySubmissions(user.$id));
        setScanPhotos([]);
      } else if (res.status === 'needs_retry') {
        setScanStatus({
          message: res.message || "Couldn't read a label clearly. Try clearer photos or fill in the fields manually.",
          tone: 'warn'
        });
      } else {
        setScanStatus({ message: res.message || 'Scan failed. Try again or fill in the fields manually.', tone: 'error' });
      }
    } catch (err) {
      setScanStatus({
        message: `Scan failed: ${err instanceof Error ? err.message : String(err)} — try again or fill in manually.`,
        tone: 'error'
      });
    } finally {
      setScanning(false);
    }
  }

  function updateField<K extends keyof FieldState>(key: K, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function num(value: string): number | null {
    if (value.trim() === '') return null;
    const n = parseFloat(value);
    return Number.isNaN(n) ? null : n;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMismatchWarning(null);
    setResult(null);

    const productName = fields.productName.trim();
    const barcode = fields.barcode.replace(/\D/g, '');
    if (!productName) return setError('Product name is required.');
    if (!barcode) return setError('Barcode is required — Chakudya uses it to avoid duplicate entries.');

    const servingGrams = parseFloat(fields.servingSize);
    if (basis === 'serving' && (!servingGrams || servingGrams <= 0)) {
      return setError('Enter a serving size in grams to convert per-serving values to per-100g/ml.');
    }

    const scale = (v: number | null) => (basis === 'serving' ? scaleToPer100(v, servingGrams) : v);

    const kcal = scale(num(fields.kcal));
    const protein = scale(num(fields.protein));
    const carbs = scale(num(fields.carbs));
    const fat = scale(num(fields.fat));

    const consistency = checkKcalConsistency(kcal, protein, carbs, fat);
    if (consistency.checked && !consistency.consistent) {
      setMismatchWarning(
        `Heads up: ${consistency.providedKcal} kcal doesn't closely match protein/carbs/fat (~${consistency.expectedKcal} kcal calculated). ` +
          `You can still submit — Chakudya double-checks the label during review — but it's worth a second look if you have the packaging handy.`
      );
    }

    const payload: PackagedFoodSubmission = {
      barcode,
      product_name: productName,
      brand: fields.brand.trim() || undefined,
      serving_size: fields.servingSize.trim() || null,
      energy_kcal: kcal,
      protein_g: protein,
      carbs_g: carbs,
      fat_g: fat,
      saturated_fat_g: scale(num(fields.saturatedFat)),
      sugar_g: scale(num(fields.sugar)),
      fiber_g: scale(num(fields.fiber)),
      sodium_mg: num(fields.sodium),
      salt_g: scale(num(fields.salt))
    };

    setSubmitting(true);
    try {
      const res = await submitPackagedFood(payload);
      setResult({ alreadyExists: res.alreadyExists, message: res.message });
      if (user) {
        recordMySubmission(user.$id, {
          barcode,
          productName,
          brand: fields.brand.trim() || undefined,
          submittedAt: new Date().toISOString(),
          alreadyExisted: res.alreadyExists
        });
        setHistory(listMySubmissions(user.$id));
      }
      if (!res.alreadyExists) {
        setFields(EMPTY_FIELDS);
        setBasis('100');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Try again shortly.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-6 py-16 text-center">
        <h1 className="font-display text-2xl text-brand-700 dark:text-sand-100">Submit a food</h1>
        <p className="mt-3 text-brand-500 dark:text-brand-100">
          Sign in to contribute a packaged food to Chakudya's database.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-block rounded-md bg-brand-500 px-5 py-2 font-medium text-white"
        >
          Log in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl text-brand-700 dark:text-sand-100">Submit a food</h1>
      <p className="mt-2 text-brand-500 dark:text-brand-100">
        Can't find a packaged product in search? Add it here — it goes into Chakudya's review queue and helps
        everyone using Thanzi Guide and Oasis CNST.
      </p>

      {result && (
        <div
          className={`mt-6 rounded-lg border p-4 text-sm ${
            result.alreadyExists
              ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200'
              : 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-200'
          }`}
        >
          {result.message}
        </div>
      )}

      {/* Scan-a-label shortcut — optional, secondary path. Manual form below remains the default way in. */}
      <div className="mt-6 rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-300">
          Optional — got the packet on hand?
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-md border border-blue-300 bg-blue-100/50 px-3 py-2 text-sm font-medium text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300"
          >
            Add photo
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="flex flex-1 min-w-[140px] items-center justify-center gap-2 rounded-md border border-blue-300 bg-blue-100/50 px-3 py-2 text-sm font-medium text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300"
          >
            Choose from gallery
          </button>
        </div>
        <p className="mt-2 text-xs text-blue-600/80 dark:text-blue-300/80">
          Add up to {MAX_SCAN_PHOTOS} photos of the same product — e.g. one of the nutrition panel and one of the
          barcode, if they're on different sides. Good lighting and a flat, in-focus label give the best results.
        </p>

        {scanPhotos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {scanPhotos.map((photo, i) => (
              <div key={i} className="relative h-14 w-14">
                <img src={photo} alt="" className="h-14 w-14 rounded-md border border-blue-300/60 object-cover dark:border-blue-900/50" />
                <button
                  type="button"
                  onClick={() => removeScanPhoto(i)}
                  aria-label="Remove photo"
                  className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-clay-500 text-[10px] font-bold leading-none text-white"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {scanPhotos.length > 0 && (
          <button
            type="button"
            onClick={handleScanSubmit}
            disabled={scanning}
            className="mt-3 w-full rounded-md bg-blue-500 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {scanning ? 'Scanning…' : `Scan ${scanPhotos.length} photo${scanPhotos.length > 1 ? 's' : ''}`}
          </button>
        )}

        {scanStatus && (
          <p
            role="status"
            className={`mt-2 rounded-md px-3 py-2 text-xs ${
              scanStatus.tone === 'success'
                ? 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200'
                : scanStatus.tone === 'warn'
                  ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
                  : scanStatus.tone === 'error'
                    ? 'bg-clay-50 text-clay-700 dark:bg-clay-950/30 dark:text-clay-300'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
            }`}
          >
            {scanStatus.message}
          </p>
        )}

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleAddScanPhotos}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleAddScanPhotos}
        />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="sf-name" className={labelClasses}>
            Product name
          </label>
          <input
            id="sf-name"
            required
            value={fields.productName}
            onChange={(e) => updateField('productName', e.target.value)}
            className={inputClasses}
            placeholder="e.g. Cheerios Original"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sf-brand" className={labelClasses}>
              Brand
            </label>
            <input
              id="sf-brand"
              value={fields.brand}
              onChange={(e) => updateField('brand', e.target.value)}
              className={inputClasses}
              placeholder="e.g. General Mills"
            />
          </div>
          <div>
            <label htmlFor="sf-barcode" className={labelClasses}>
              Barcode
            </label>
            <div className="flex gap-2">
              <input
                id="sf-barcode"
                required
                inputMode="numeric"
                value={fields.barcode}
                onChange={(e) => updateField('barcode', e.target.value)}
                className={inputClasses}
                placeholder="Numbers on the package barcode"
              />
              <button
                type="button"
                onClick={() => setBarcodeScannerOpen(true)}
                aria-label="Scan barcode"
                title="Scan barcode"
                className="flex shrink-0 items-center justify-center rounded-md border border-brand-100 px-3 text-brand-500 dark:border-ink-800 dark:text-brand-100"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M4 7V5a1 1 0 0 1 1-1h2M4 17v2a1 1 0 0 0 1 1h2M20 7V5a1 1 0 0 0-1-1h-2M20 17v2a1 1 0 0 1-1 1h-2M6 8v8M9 8v8M12 8v8M15 8v8M18 8v8" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {barcodeScannerOpen && (
          <BarcodeScanner
            onDetect={(code) => {
              updateField('barcode', code);
              setBarcodeScannerOpen(false);
            }}
            onClose={() => setBarcodeScannerOpen(false)}
          />
        )}

        <div>
          <span className={labelClasses}>Nutrition values are per</span>
          <div className="mt-1 inline-flex overflow-hidden rounded-md border border-brand-100 dark:border-ink-800">
            <button
              type="button"
              onClick={() => setBasis('100')}
              className={`px-3 py-1.5 text-sm font-medium ${
                basis === '100'
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-brand-700 dark:bg-ink-950 dark:text-sand-100'
              }`}
            >
              100g / 100ml
            </button>
            <button
              type="button"
              onClick={() => setBasis('serving')}
              className={`px-3 py-1.5 text-sm font-medium ${
                basis === 'serving'
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-brand-700 dark:bg-ink-950 dark:text-sand-100'
              }`}
            >
              Serving
            </button>
          </div>
          {basis === 'serving' && (
            <div className="mt-3">
              <label htmlFor="sf-serving" className={labelClasses}>
                Serving size (grams)
              </label>
              <input
                id="sf-serving"
                inputMode="decimal"
                value={fields.servingSize}
                onChange={(e) => updateField('servingSize', e.target.value)}
                className={inputClasses}
                placeholder="e.g. 30"
              />
              <p className="mt-1 text-xs text-brand-300 dark:text-brand-100">
                Values below will be scaled up to per-100g/ml automatically before submitting.
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="sf-kcal" className={labelClasses}>
              Energy (kcal)
            </label>
            <input
              id="sf-kcal"
              inputMode="decimal"
              value={fields.kcal}
              onChange={(e) => updateField('kcal', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="sf-protein" className={labelClasses}>
              Protein (g)
            </label>
            <input
              id="sf-protein"
              inputMode="decimal"
              value={fields.protein}
              onChange={(e) => updateField('protein', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="sf-carbs" className={labelClasses}>
              Carbohydrate (g)
            </label>
            <input
              id="sf-carbs"
              inputMode="decimal"
              value={fields.carbs}
              onChange={(e) => updateField('carbs', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="sf-fat" className={labelClasses}>
              Fat (g)
            </label>
            <input
              id="sf-fat"
              inputMode="decimal"
              value={fields.fat}
              onChange={(e) => updateField('fat', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="sf-satfat" className={labelClasses}>
              Saturated fat (g)
            </label>
            <input
              id="sf-satfat"
              inputMode="decimal"
              value={fields.saturatedFat}
              onChange={(e) => updateField('saturatedFat', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="sf-sugar" className={labelClasses}>
              Sugar (g)
            </label>
            <input
              id="sf-sugar"
              inputMode="decimal"
              value={fields.sugar}
              onChange={(e) => updateField('sugar', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="sf-fiber" className={labelClasses}>
              Fiber (g)
            </label>
            <input
              id="sf-fiber"
              inputMode="decimal"
              value={fields.fiber}
              onChange={(e) => updateField('fiber', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="sf-sodium" className={labelClasses}>
              Sodium (mg)
            </label>
            <input
              id="sf-sodium"
              inputMode="decimal"
              value={fields.sodium}
              onChange={(e) => updateField('sodium', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="sf-salt" className={labelClasses}>
              Salt (g)
            </label>
            <input
              id="sf-salt"
              inputMode="decimal"
              value={fields.salt}
              onChange={(e) => updateField('salt', e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>

        {mismatchWarning && (
          <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">
            {mismatchWarning}
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm text-clay-500 dark:text-clay-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-brand-500 py-2 font-medium text-white disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit for review'}
        </button>
        <p className="text-center text-xs text-brand-300 dark:text-brand-100">
          Submissions are reviewed before appearing in search — thanks for contributing to Chakudya.
        </p>
      </form>

      {history.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-lg text-brand-700 dark:text-sand-100">Your recent submissions</h2>
          <p className="mt-1 text-xs text-brand-300 dark:text-brand-100">
            Tracked on this device only — a receipt of what you've sent in, not a live review status.
          </p>
          <div className="mt-3 space-y-2">
            {history.map((entry, i) => (
              <div
                key={`${entry.barcode}-${entry.submittedAt}-${i}`}
                className="flex items-center justify-between rounded-lg border border-brand-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-950"
              >
                <div>
                  <p className="font-medium text-brand-700 dark:text-sand-100">{entry.productName}</p>
                  <p className="text-xs text-brand-300 dark:text-brand-100">
                    {entry.brand ? `${entry.brand} · ` : ''}Barcode {entry.barcode}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      entry.alreadyExisted
                        ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
                        : 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200'
                    }`}
                  >
                    {entry.alreadyExisted ? 'Already exists' : 'Submitted'}
                  </span>
                  <p className="mt-1 text-xs text-brand-300 dark:text-brand-100">
                    {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(
                      new Date(entry.submittedAt)
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
