import React, { useEffect, useRef, useState } from 'react';

interface Props {
  ar: boolean;
  onDetect: (code: string) => void;
  onClose: () => void;
}

// EAN/UPC only — those are the formats on food packaging, and restricting the
// set makes decoding both faster and far less prone to misreads.
const FORMAT_NAMES = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

/**
 * Live barcode scanning over the camera stream.
 *
 * Deliberately not a native plugin: the ML Kit scanner is a heavy native
 * dependency, and custom native plugins are what broke the iOS build before.
 * This runs entirely in the WebView, so it also works in a desktop browser.
 *
 * Uses the platform BarcodeDetector where it exists (Android/Chrome — it is
 * hardware-accelerated and free), and lazy-loads ZXing everywhere else, which
 * is the path iOS takes since Safari has no BarcodeDetector.
 */
const BarcodeScanner: React.FC<Props> = ({ ar, onDetect, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const doneRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const hit = (raw: string) => {
      const code = raw.replace(/\D/g, '');
      // A valid EAN/UPC is 8, 12 or 13 digits; anything else is a misread.
      if (doneRef.current || ![8, 12, 13].includes(code.length)) return;
      doneRef.current = true;
      try { navigator.vibrate?.(60); } catch {}
      onDetect(code);
    };

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');   // iOS refuses fullscreen-less play without it
        await video.play().catch(() => {});
        if (cancelled) return;
        setStarting(false);

        const Detector = (window as any).BarcodeDetector;
        if (Detector) {
          const detector = new Detector({ formats: FORMAT_NAMES });
          let raf = 0;
          const tick = async () => {
            if (cancelled || doneRef.current) return;
            try {
              const codes = await detector.detect(video);
              if (codes?.[0]?.rawValue) hit(String(codes[0].rawValue));
            } catch { /* a frame failing to decode is normal */ }
            raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
          stopRef.current = () => cancelAnimationFrame(raf);
          return;
        }

        // iOS path: ZXing, pulled in only when the scanner actually opens.
        const [{ BrowserMultiFormatReader }, { DecodeHintType, BarcodeFormat }] = await Promise.all([
          import('@zxing/browser'),
          import('@zxing/library'),
        ]);
        if (cancelled) return;
        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
        ]);
        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
        const controls = await reader.decodeFromVideoElement(video, (result) => {
          if (result) hit(result.getText());
        });
        stopRef.current = () => controls.stop();
      } catch (e) {
        if (cancelled) return;
        const name = (e as Error).name;
        setError(
          name === 'NotAllowedError'
            ? (ar ? 'تم رفض إذن الكاميرا. فعّله من إعدادات الجهاز.' : 'Camera permission denied — enable it in Settings.')
            : name === 'NotFoundError'
              ? (ar ? 'لا توجد كاميرا.' : 'No camera found.')
              : (ar ? 'تعذّر تشغيل الكاميرا.' : 'Could not start the camera.')
        );
        setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      try { stopRef.current?.(); } catch {}
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [ar, onDetect]);

  return (
    <div className="fixed inset-0 z-[10000] bg-black flex flex-col">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline />

      {/* Aiming window */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[78%] max-w-sm aspect-[5/3] rounded-3xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
      </div>

      <div className="relative z-10 flex items-center justify-between p-4" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
        <span className="text-[11px] font-black uppercase tracking-widest rtl:tracking-normal text-white/90">
          {ar ? 'امسح الباركود' : 'Scan barcode'}
        </span>
        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur text-white flex items-center justify-center">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="relative z-10 mt-auto p-6 text-center" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        {error ? (
          <div className="space-y-3">
            <p className="text-sm font-bold text-white bg-red-500/80 rounded-2xl px-4 py-3">{error}</p>
            <button onClick={onClose} className="px-5 py-3 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-widest rtl:tracking-normal">
              {ar ? 'أدخل الرقم يدوياً' : 'Type it instead'}
            </button>
          </div>
        ) : (
          <p className="text-[11px] font-bold text-white/70">
            {starting
              ? (ar ? 'جارٍ تشغيل الكاميرا…' : 'Starting camera…')
              : (ar ? 'وجّه الكاميرا نحو الباركود' : 'Point the camera at the barcode')}
          </p>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;
