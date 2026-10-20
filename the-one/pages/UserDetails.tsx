import React, { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types';
import { useT } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';

interface Props { currentUser: User; }

interface VitalEntry {
  id: string;
  weight?: number | null;
  bodyFat?: number | null;
  restingHr?: number | null;
  loggedAt?: any;
}

const METRICS: Array<{ key: 'weight' | 'bodyFat' | 'restingHr'; labelKey: TranslationKey; unitKey: TranslationKey | null; unit: string; icon: string; goodDown: boolean }> = [
  { key: 'weight', labelKey: 'vitals.weight', unitKey: 'app.profile.unit_kg', unit: 'kg', icon: 'monitor_weight', goodDown: true },
  { key: 'bodyFat', labelKey: 'app.details.body_fat', unitKey: null, unit: '%', icon: 'percent', goodDown: true },
  { key: 'restingHr', labelKey: 'app.details.resting_hr', unitKey: 'app.details.unit_bpm', unit: 'bpm', icon: 'cardiology', goodDown: true },
];

const UserDetails: React.FC<Props> = ({ currentUser }) => {
  const { t, lang } = useT();
  const locale = lang === 'ar' ? 'ar' : 'en-GB';
  const unitOf = (m: typeof METRICS[number]) => (m.unitKey ? t(m.unitKey) : m.unit);
  const [entries, setEntries] = useState<VitalEntry[]>([]);
  const [form, setForm] = useState({ weight: '', bodyFat: '', restingHr: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users', currentUser.id, 'vitals'), orderBy('loggedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() } as VitalEntry))));
    return () => unsub();
  }, [currentUser.id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.weight && !form.bodyFat && !form.restingHr) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'users', currentUser.id, 'vitals'), {
        weight: form.weight ? Number(form.weight) : null,
        bodyFat: form.bodyFat ? Number(form.bodyFat) : null,
        restingHr: form.restingHr ? Number(form.restingHr) : null,
        loggedAt: serverTimestamp(),
      });
      setForm({ weight: '', bodyFat: '', restingHr: '' });
    } catch (err) {
      console.error('save vital', err);
      alert(t('app.details.save_failed'));
    }
    setSaving(false);
  };

  const removeEntry = async (id: string) => {
    if (!window.confirm(t('app.details.delete_confirm'))) return;
    try { await deleteDoc(doc(db, 'users', currentUser.id, 'vitals', id)); } catch (e) { console.error(e); }
  };

  const fmt = (ts: any) => (ts?.toDate ? ts.toDate().toLocaleString(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : t('app.details.just_now'));
  const latest = entries[0];
  const prev = entries[1];
  const delta = (key: 'weight' | 'bodyFat' | 'restingHr') =>
    latest && prev && latest[key] != null && prev[key] != null ? Number(latest[key]) - Number(prev[key]) : null;

  // Weight trend (oldest → newest) for the mini chart.
  const series = [...entries].reverse().filter((e) => e.weight != null).map((e) => Number(e.weight));
  const chart = (() => {
    if (series.length < 2) return null;
    const min = Math.min(...series), max = Math.max(...series);
    const span = max - min || 1;
    const W = 300, H = 70;
    const pts = series.map((v, i) => `${(i / (series.length - 1)) * W},${H - ((v - min) / span) * (H - 10) - 5}`).join(' ');
    return { pts, W, H, min, max };
  })();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:px-6 md:py-10 space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-black font-display uppercase tracking-tight text-black">{t('vitals.heading')}</h1>
        <p className="text-neutral-500 font-medium text-sm mt-1">{t('vitals.sub')}</p>
      </div>

      {/* Log a new entry */}
      <form onSubmit={save} className="bg-white rounded-3xl border border-neutral-100 shadow-sm p-5 md:p-7 space-y-4">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] rtl:tracking-normal text-neutral-400">{t('app.details.log_today')}</h2>
        <div className="grid grid-cols-3 gap-3">
          {METRICS.map((m) => (
            <div key={m.key} className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest rtl:tracking-normal text-neutral-400 ms-1">{t(m.labelKey)}</label>
              <div className="flex items-baseline gap-1 bg-neutral-50 border border-neutral-100 rounded-2xl px-3 py-2.5 focus-within:border-black">
                <input
                  type="number" inputMode="decimal" step="any" dir="ltr"
                  value={(form as any)[m.key]}
                  onChange={(e) => setForm({ ...form, [m.key]: e.target.value })}
                  placeholder="—"
                  className="w-full bg-transparent outline-none font-black text-lg text-black min-w-0"
                />
                <span className="text-[9px] font-black uppercase text-neutral-400 shrink-0">{unitOf(m)}</span>
              </div>
            </div>
          ))}
        </div>
        <button type="submit" disabled={saving} className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest rtl:tracking-normal text-[11px] hover:bg-neutral-800 transition disabled:opacity-50">
          {saving ? t('common.saving') : t('app.details.save_entry')}
        </button>
      </form>

      {/* Latest + analysis */}
      {latest && (
        <div className="bg-black text-white rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] rtl:tracking-normal text-white/50">{t('app.details.latest')}</h2>
            <span className="text-[10px] font-bold text-white/40">{fmt(latest.loggedAt)}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {METRICS.map((m) => {
              const d = delta(m.key);
              const val = latest[m.key];
              return (
                <div key={m.key}>
                  <p className="text-[9px] font-black uppercase tracking-widest rtl:tracking-normal text-white/40">{t(m.labelKey)}</p>
                  <p className="text-2xl font-black tabular-nums">{val != null ? val : '—'}<span className="text-xs text-white/40 ms-0.5">{val != null ? unitOf(m) : ''}</span></p>
                  {d != null && d !== 0 && (
                    <p className={`text-[10px] font-black ${(d < 0) === m.goodDown ? 'text-green-400' : 'text-amber-400'}`}>
                      {d > 0 ? '▲' : '▼'} {Math.abs(d).toFixed(1)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {chart && (
            <div className="pt-2">
              <p className="text-[9px] font-black uppercase tracking-widest rtl:tracking-normal text-white/40 mb-2">{t('app.details.weight_trend', { min: chart.min, max: chart.max })}</p>
              <svg viewBox={`0 0 ${chart.W} ${chart.H}`} className="w-full h-16 rtl:-scale-x-100" preserveAspectRatio="none">
                <polyline points={chart.pts} fill="none" stroke="#137fec" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* History */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] rtl:tracking-normal text-neutral-400 ms-1">{t('app.details.history')}</h2>
        {entries.length === 0 ? (
          <div className="bg-white rounded-3xl border border-neutral-100 p-10 text-center text-neutral-300 text-xs font-black uppercase tracking-widest rtl:tracking-normal">{t('app.details.no_entries')}</div>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <div key={e.id} className="group bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-4 min-w-0 flex-wrap">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest rtl:tracking-normal w-28 shrink-0">{fmt(e.loggedAt)}</span>
                  {METRICS.map((m) => e[m.key] != null && (
                    <span key={m.key} className="text-xs font-black text-black">{e[m.key]}<span className="text-[9px] text-neutral-400 ms-0.5 uppercase">{unitOf(m)}</span></span>
                  ))}
                </div>
                <button onClick={() => removeEntry(e.id)} aria-label={t('app.details.delete_entry')} title={t('app.details.delete_entry')} className="text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetails;
