import { useEffect, useRef, useState } from 'react';

// Ported from Oasis CNST's barcode scanner (index.html hpBarcodeOpen /
// _startDetection / _scanImageFile). Same detection strategy: prefer the
// browser's native BarcodeDetector; fall back to ZXing (lazy-loaded from
// CDN, never bundled) when it isn't available. Live camera scan is the
// primary path; gallery photo decode is the fallback for a barcode that's
// hard to hold steady under the camera, or when camera access is denied.

const ZXING_CDN_URL = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';
const HISTORY_KEY = 'thanzi:barcodeScanHistory';
const MAX_HISTORY = 30;
const BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf', 'qr_code'];

interface ScanHistoryEntry {
  barcode: string;
  ts: number;
}

function loadHistory(): ScanHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function pushHistory(barcode: string) {
  try {
    const next = [{ barcode, ts: Date.now() }, ...loadHistory().filter((h) => h.barcode !== barcode)].slice(
      0,
      MAX_HISTORY
    );
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Non-critical — a missed history write shouldn't block the scan result.
  }
}

let zxingLoadPromise: Promise<void> | null = null;
function loadZXing(): Promise<void> {
  if (typeof (window as any).ZXing !== 'undefined') return Promise.resolve();
  if (zxingLoadPromise) return zxingLoadPromise;
  zxingLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = ZXING_CDN_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Scanner library failed to load.'));
    document.head.appendChild(script);
  });
  return zxingLoadPromise;
}

function vibrate(pattern: number[]) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch {
    // Vibration is a nicety, not a requirement.
  }
}

interface CornerPoint {
  x: number;
  y: number;
}

interface BarcodeScannerProps {
  onDetect: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onDetect, onClose }: BarcodeScannerProps) {
  const [tab, setTab] = useState<'camera' | 'gallery'>('camera');
  const [status, setStatus] = useState('Requesting camera access…');
  const [scanning, setScanning] = useState(true);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [galleryStatus, setGalleryStatus] = useState('');
  const [galleryBusy, setGalleryBusy] = useState(false);
  const [galleryPreview, setGalleryPreview] = useState<string | null>(null);
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const torchTrackRef = useRef<MediaStreamTrack | null>(null);
  const lastCodeRef = useRef<string | null>(null);
  const scanningRef = useRef(true);
  const zxingReaderRef = useRef<any>(null);

  useEffect(() => {
    setHistory(loadHistory());
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const track = stream.getVideoTracks().find((t) => {
        const caps = t.getCapabilities?.();
        return caps && 'torch' in caps;
      });
      torchTrackRef.current = track || null;
      setTorchSupported(!!track);
      setStatus('Point camera at a barcode…');
      scanningRef.current = true;
      setScanning(true);
      startDetectionLoop();
    } catch (err) {
      setCameraError(
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Camera access was denied. Allow camera access, or use "Choose from gallery" instead.'
          : 'Could not access the camera. Try "Choose from gallery" instead.'
      );
    }
  }

  function stopCamera() {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    torchTrackRef.current = null;
    try {
      zxingReaderRef.current?.reset?.();
    } catch {
      // Reader may not be initialized yet.
    }
  }

  function startDetectionLoop() {
    const video = videoRef.current;
    if (!video) return;

    if ('BarcodeDetector' in window) {
      try {
        detectorRef.current = new (window as any).BarcodeDetector({ formats: BARCODE_FORMATS });
      } catch {
        detectorRef.current = new (window as any).BarcodeDetector();
      }
      const tick = async () => {
        if (scanningRef.current && video.readyState >= 2) {
          try {
            const codes = await detectorRef.current.detect(video);
            if (codes.length > 0) handleDetected(codes[0].rawValue);
          } catch {
            // A transient decode failure — keep looping.
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      setStatus('Loading scanner library…');
      loadZXing()
        .then(() => {
          const ZXing = (window as any).ZXing;
          const reader = new ZXing.BrowserMultiFormatReader(new Map(), { delayBetweenScanAttempts: 200 });
          zxingReaderRef.current = reader;
          reader.decodeFromVideoElement(video, (result: any) => {
            if (result && scanningRef.current) handleDetected(result.getText());
          });
          setStatus('Point camera at a barcode…');
        })
        .catch(() => setStatus('Scanner unavailable on this device — try "Choose from gallery" instead.'));
    }
  }

  function handleDetected(code: string) {
    if (!scanningRef.current || code === lastCodeRef.current) return;
    lastCodeRef.current = code;
    scanningRef.current = false;
    setScanning(false);
    vibrate([60]);
    setStatus(`Barcode detected: ${code}`);
    pushHistory(code);
    stopCamera();
    setTimeout(() => onDetect(code), 250);
  }

  async function toggleTorch() {
    if (!torchTrackRef.current) return;
    try {
      const next = !torchOn;
      await torchTrackRef.current.applyConstraints({ advanced: [{ torch: next } as any] });
      setTorchOn(next);
    } catch {
      // Torch control isn't universally supported — fail quietly.
    }
  }

  function switchTab(next: 'camera' | 'gallery') {
    setTab(next);
    if (next === 'camera') {
      scanningRef.current = true;
      setScanning(true);
      lastCodeRef.current = null;
    } else {
      scanningRef.current = false;
      setScanning(false);
    }
  }

  function drawHighlight(img: HTMLImageElement, points: CornerPoint[]) {
    const canvas = canvasRef.current;
    if (!canvas || !points?.length) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0F6B63';
    ctx.lineWidth = Math.max(2, canvas.width * 0.005);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.stroke();
  }

  async function zxingDecodeImageUrl(url: string): Promise<string | null> {
    try {
      await loadZXing();
      const ZXing = (window as any).ZXing;
      const reader = new ZXing.BrowserMultiFormatReader();
      const result = await reader.decodeFromImageUrl(url).catch(() => null);
      return result ? result.getText() : null;
    } catch {
      return null;
    }
  }

  async function handleGalleryFile(file: File) {
    setGalleryBusy(true);
    setGalleryStatus('Analysing image…');
    const objectUrl = URL.createObjectURL(file);
    setGalleryPreview(objectUrl);

    const img = new Image();
    img.src = objectUrl;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });

    try {
      let detectedCode: string | null = null;
      let cornerPoints: CornerPoint[] | null = null;

      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({ formats: BARCODE_FORMATS });
          const bitmap = await createImageBitmap(file);
          const codes = await detector.detect(bitmap);
          bitmap.close?.();
          if (codes.length > 0) {
            detectedCode = codes[0].rawValue;
            cornerPoints = codes[0].cornerPoints || null;
          }
        } catch {
          // Fall through to ZXing.
        }
      }

      if (!detectedCode) {
        detectedCode = await zxingDecodeImageUrl(objectUrl);
      }

      if (detectedCode) {
        if (cornerPoints) drawHighlight(img, cornerPoints);
        setGalleryStatus(`Barcode found: ${detectedCode}`);
        pushHistory(detectedCode);
        await new Promise((r) => setTimeout(r, 400));
        onDetect(detectedCode);
      } else {
        setGalleryStatus('No barcode detected in this image. Try a clearer, closer photo.');
      }
    } catch (err) {
      setGalleryStatus(`Scan error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setGalleryBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="font-display text-lg text-white">Scan a barcode</h2>
        <button onClick={onClose} aria-label="Close scanner" className="p-1 text-2xl leading-none text-white/70">
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => switchTab('camera')}
          className={`flex-1 py-3 text-sm font-medium ${
            tab === 'camera' ? 'border-b-2 border-brand-300 text-brand-300' : 'text-white/50'
          }`}
        >
          Camera
        </button>
        <button
          onClick={() => switchTab('gallery')}
          className={`flex-1 py-3 text-sm font-medium ${
            tab === 'gallery' ? 'border-b-2 border-brand-300 text-brand-300' : 'text-white/50'
          }`}
        >
          Gallery
        </button>
      </div>

      {/* Camera panel */}
      {tab === 'camera' && (
        <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="mx-6 rounded-lg border border-white/20 bg-white/5 p-6 text-center text-sm text-white/80">
              {cameraError}
            </div>
          ) : (
            <>
              <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
              {/* Viewfinder frame */}
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-1/3 w-4/5 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-brand-300/80" />
              {torchSupported && (
                <button
                  onClick={toggleTorch}
                  className={`absolute right-4 top-4 rounded-full border px-3 py-2 text-xs font-medium ${
                    torchOn ? 'border-clay-400 bg-clay-400/20 text-clay-400' : 'border-white/30 text-white/80'
                  }`}
                >
                  {torchOn ? 'Torch on' : 'Torch'}
                </button>
              )}
            </>
          )}
          <p role="status" className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm text-white">
            {scanning && <span className="h-2 w-2 animate-pulse rounded-full bg-brand-300" />}
            {status}
          </p>
        </div>
      )}

      {/* Gallery panel */}
      {tab === 'gallery' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          {galleryPreview ? (
            <div className="relative max-h-[60vh] max-w-full">
              <img src={galleryPreview} alt="" className="max-h-[60vh] max-w-full rounded-lg object-contain" />
              <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
            </div>
          ) : (
            <p className="text-center text-sm text-white/60">Choose a photo that clearly shows the barcode.</p>
          )}

          {galleryStatus && <p className="text-center text-sm text-white/80">{galleryStatus}</p>}

          <label className="cursor-pointer rounded-md bg-brand-500 px-5 py-2 text-sm font-semibold text-white">
            {galleryBusy ? 'Analysing…' : galleryPreview ? 'Choose a different photo' : 'Choose from gallery'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={galleryBusy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) handleGalleryFile(file);
              }}
            />
          </label>
        </div>
      )}

      {/* Recent scans */}
      {history.length > 0 && (
        <div className="border-t border-white/10 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-white/40">Recent scans</p>
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {history.slice(0, 10).map((h) => (
              <button
                key={h.barcode + h.ts}
                onClick={() => onDetect(h.barcode)}
                className="shrink-0 rounded-md border border-white/20 px-3 py-1.5 font-mono text-xs text-white/80"
              >
                {h.barcode}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
