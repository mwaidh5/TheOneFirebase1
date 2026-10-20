import React, { useEffect, useRef, useState } from 'react';
import { useBlocker, type Blocker } from 'react-router-dom';
import { useT } from '../i18n/I18nContext';

/**
 * Warns before leaving an editor with changes that were not saved — the Back
 * button, the sidebar, the browser/phone back gesture, and closing the tab.
 *
 * `snapshot` is everything the editor would save. Its baseline is taken a
 * moment after `resetKey` changes (the loaded document arriving), so the
 * effects that fill the form on load don't count as edits. Call `markSaved()`
 * right after a successful save, before navigating away.
 */
export function useUnsavedChanges(snapshot: unknown, resetKey: unknown) {
  const snapRef = useRef(snapshot);
  snapRef.current = snapshot;
  const baseRef = useRef<string | null>(null);

  useEffect(() => {
    baseRef.current = null;
    const t = setTimeout(() => { baseRef.current = JSON.stringify(snapRef.current); }, 400);
    return () => clearTimeout(t);
  }, [resetKey]);

  const isDirty = () => baseRef.current !== null && JSON.stringify(snapRef.current) !== baseRef.current;
  const markSaved = () => { baseRef.current = JSON.stringify(snapRef.current); };

  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    currentLocation.pathname !== nextLocation.pathname && isDirty());

  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty()) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  return { blocker, markSaved, isDirty };
}

interface DialogProps {
  blocker: Blocker;
  /** The editor's save. Return false if it failed, so the user stays put. */
  onSave?: () => Promise<boolean | void> | boolean | void;
  saveLabel?: string;
  /** The save navigates on its own (publish → course list), so don't continue to where they were going. */
  saveNavigates?: boolean;
}

/** "You have unsaved changes" — shown while the blocker holds a navigation. */
export const UnsavedChangesDialog: React.FC<DialogProps> = ({ blocker, onSave, saveLabel, saveNavigates }) => {
  const { lang } = useT();
  const ar = lang === 'ar';
  const [saving, setSaving] = useState(false);
  if (blocker.state !== 'blocked') return null;

  const save = async () => {
    if (!onSave) return;
    if (saveNavigates) { blocker.reset(); await onSave(); return; }
    setSaving(true);
    try {
      const ok = await onSave();
      if (ok === false) blocker.reset(); else blocker.proceed();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-end md:items-center justify-center md:p-6 bg-black/60 backdrop-blur-sm" onClick={() => blocker.reset()}>
      <div
        className="bg-white w-full md:max-w-sm rounded-t-[2rem] md:rounded-3xl shadow-2xl p-6 space-y-5"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
        dir={ar ? 'rtl' : 'ltr'}
      >
        <div className="space-y-2">
          <span className="w-11 h-11 rounded-2xl bg-amber-50 flex items-center justify-center">
            <span className="material-symbols-outlined text-amber-500">warning</span>
          </span>
          <h3 className="text-lg font-black font-display uppercase text-black">{ar ? 'تغييرات غير محفوظة' : 'Unsaved changes'}</h3>
          <p className="text-sm font-medium text-neutral-500 leading-relaxed">
            {ar
              ? 'عدّلت هذا البرنامج ولم تنشره بعد. إذا خرجت الآن ستضيع تعديلاتك.'
              : "You've changed this program but haven't saved it. If you leave now, everything you edited or added will be lost."}
          </p>
        </div>
        <div className="space-y-2">
          {onSave && (
            <button onClick={save} disabled={saving} className="w-full py-4 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest rtl:tracking-normal disabled:opacity-40">
              {saving ? '…' : (saveLabel ?? (ar ? 'احفظ' : 'Save'))}
            </button>
          )}
          <button onClick={() => blocker.reset()} className="w-full py-4 bg-neutral-100 text-black rounded-2xl text-[11px] font-black uppercase tracking-widest rtl:tracking-normal">
            {ar ? 'تابع التعديل' : 'Keep editing'}
          </button>
          <button onClick={() => blocker.proceed()} className="w-full py-3 text-red-600 text-[11px] font-black uppercase tracking-widest rtl:tracking-normal">
            {ar ? 'اخرج بدون حفظ' : 'Leave without saving'}
          </button>
        </div>
      </div>
    </div>
  );
};
