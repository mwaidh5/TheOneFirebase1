import React, { useEffect, useState } from 'react';
import { useT } from '../i18n/I18nContext';

// Set by vite.config.ts at build time; the same id is written to /version.json.
declare const __BUILD_ID__: string;

const CHECK_EVERY_MS = 5 * 60 * 1000;

/**
 * "A new version is ready — Refresh". The app loads the live site, so a deploy
 * reaches it on the next launch; this tells someone who already has it open.
 * It compares this build's id with the deployed /version.json (served
 * no-cache) on open, every few minutes, and whenever the app comes back to
 * the foreground. Nothing reloads on its own — a workout or an editor may be
 * mid-way — the user taps Refresh when it suits them.
 */
const UpdateBanner: React.FC<{ bottom: string }> = ({ bottom }) => {
  const { t } = useT();
  const [newId, setNewId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    const check = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const { id } = (await res.json()) as { id?: string };
        if (!stop && id && id !== __BUILD_ID__) setNewId(id);
      } catch { /* offline — try again later */ }
    };
    const first = setTimeout(check, 10_000);
    const timer = setInterval(check, CHECK_EVERY_MS);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
    return () => {
      stop = true;
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('focus', check);
    };
  }, []);

  if (!newId || dismissed === newId) return null;

  return (
    <div className="fixed inset-x-0 z-[130] flex justify-center px-4 pointer-events-none" style={{ bottom }}>
      <div className="pointer-events-auto w-full max-w-md flex items-center gap-3 bg-black text-white rounded-2xl shadow-2xl ps-4 pe-2 py-2 animate-in slide-in-from-bottom fade-in duration-300">
        <span className="material-symbols-outlined text-accent text-[20px] shrink-0">system_update</span>
        <p className="flex-1 min-w-0 text-[12px] font-bold leading-tight">{t('app.update.ready')}</p>
        <button
          onClick={() => window.location.reload()}
          className="shrink-0 px-4 py-2 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
        >
          {t('app.update.refresh')}
        </button>
        <button
          onClick={() => setDismissed(newId)}
          aria-label={t('common.close')}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  );
};

export default UpdateBanner;
