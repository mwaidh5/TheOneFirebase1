import React, { useEffect, useRef, useState } from 'react';
import { searchFoods, lookupBarcode, macrosFor, type Food } from '../utils/foodDb';
import { analyzePlate, fileToBase64, type GuessedFood } from '../utils/foodVision';
import { SLOTS, type LogEntry, type MealSlot } from '../hooks/useNutritionLog';

type Tab = 'search' | 'barcode' | 'photo' | 'custom';

interface Props {
  slot: MealSlot;
  customFoods: Food[];
  recents: LogEntry[];
  ar: boolean;
  onAdd: (entry: LogEntry) => void;
  onSaveCustom: (food: Omit<Food, 'id' | 'source'>) => Promise<Food>;
  onClose: () => void;
}

const uid = () => `e${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

const blankCustom = { name: '', brand: '', barcode: '', kcal: '', protein: '', carbs: '', fat: '' };

const FoodLogSheet: React.FC<Props> = ({ slot, customFoods, recents, ar, onAdd, onSaveCustom, onClose }) => {
  const [tab, setTab] = useState<Tab>('search');
  const [targetSlot, setTargetSlot] = useState<MealSlot>(slot);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  // barcode
  const [code, setCode] = useState('');
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  // photo
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<GuessedFood[] | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  // custom form
  const [form, setForm] = useState(blankCustom);
  // portion step
  const [chosen, setChosen] = useState<Food | null>(null);
  const [grams, setGrams] = useState('100');

  // Debounced search; the in-flight request is aborted when the query moves on.
  useEffect(() => {
    if (tab !== 'search') return;
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    const ctrl = new AbortController();
    const id = setTimeout(async () => {
      setBusy(true); setError(null);
      try {
        setResults(await searchFoods(q, ctrl.signal));
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError(ar ? 'تعذّر البحث — تحقق من الاتصال.' : 'Search failed — check your connection.');
      } finally { setBusy(false); }
    }, 400);
    return () => { clearTimeout(id); ctrl.abort(); };
  }, [query, tab, ar]);

  const localMatches = query.trim().length >= 2
    ? customFoods.filter(f => `${f.name} ${f.brand ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  const commit = (name: string, brand: string | undefined, foodId: string, g: number, m: { kcal: number; protein: number; carbs: number; fat: number }) => {
    onAdd({ id: uid(), foodId, name, brand, slot: targetSlot, grams: g, ...m, loggedAt: Date.now() });
  };

  const addChosen = () => {
    if (!chosen) return;
    const g = Math.max(1, parseFloat(grams) || 0);
    commit(chosen.name, chosen.brand, chosen.id, g, macrosFor(chosen, g));
    onClose();
  };

  const runBarcode = async (raw?: string) => {
    const c = (raw ?? code).replace(/\D/g, '');
    if (!c) return;
    setBusy(true); setError(null); setNotFoundCode(null);
    try {
      const mine = customFoods.find(f => f.barcode === c);
      if (mine) { setChosen(mine); setGrams(String(mine.servingGrams ?? 100)); return; }
      const found = await lookupBarcode(c);
      if (found) { setChosen(found); setGrams(String(found.servingGrams ?? 100)); }
      else setNotFoundCode(c);
    } catch {
      setError(ar ? 'تعذّر البحث عن الباركود.' : 'Barcode lookup failed.');
    } finally { setBusy(false); }
  };

  const onPhoto = async (file: File) => {
    setPhotoUrl(URL.createObjectURL(file));
    setGuesses(null); setPicked(new Set()); setError(null); setBusy(true);
    try {
      const { base64, mimeType } = await fileToBase64(file);
      const found = await analyzePlate(base64, mimeType);
      setGuesses(found);
      setPicked(new Set(found.map((_, i) => i)));   // everything on by default
      if (found.length === 0) setError(ar ? 'لم يتم التعرف على طعام في الصورة.' : 'No food recognised in that photo.');
    } catch (e) {
      setError((e as Error).message || (ar ? 'تعذّر تحليل الصورة.' : 'Could not analyse that photo.'));
    } finally { setBusy(false); }
  };

  const addPicked = () => {
    (guesses ?? []).forEach((g, i) => {
      if (!picked.has(i)) return;
      commit(g.name, ar ? 'من الصورة' : 'From photo', `photo:${i}`, g.grams, { kcal: g.kcal, protein: g.protein, carbs: g.carbs, fat: g.fat });
    });
    onClose();
  };

  const saveCustom = async () => {
    const name = form.name.trim();
    if (!name) { setError(ar ? 'أدخل اسم الطعام.' : 'Give the food a name.'); return; }
    setBusy(true); setError(null);
    try {
      const food = await onSaveCustom({
        name,
        brand: form.brand.trim() || undefined,
        barcode: form.barcode.replace(/\D/g, '') || undefined,
        per100: {
          kcal: Math.round(parseFloat(form.kcal) || 0),
          protein: parseFloat(form.protein) || 0,
          carbs: parseFloat(form.carbs) || 0,
          fat: parseFloat(form.fat) || 0,
        },
      });
      setForm(blankCustom);
      setChosen(food);
      setGrams('100');
    } catch {
      setError(ar ? 'تعذّر الحفظ.' : 'Could not save that food.');
    } finally { setBusy(false); }
  };

  const openCustomWithBarcode = (c: string) => {
    setForm({ ...blankCustom, barcode: c });
    setNotFoundCode(null);
    setTab('custom');
  };

  const Row: React.FC<{ food: Food; mine?: boolean }> = ({ food, mine }) => (
    <button
      onClick={() => { setChosen(food); setGrams(String(food.servingGrams ?? 100)); }}
      className="w-full text-start flex items-center gap-3 p-3 rounded-2xl border border-neutral-100 bg-white hover:border-black transition"
    >
      {food.imageUrl
        ? <img src={food.imageUrl} alt="" className="w-11 h-11 rounded-xl object-cover bg-neutral-50 shrink-0" />
        : <span className="w-11 h-11 rounded-xl bg-neutral-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px] text-neutral-300">{mine ? 'bookmark' : 'nutrition'}</span>
          </span>}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-black truncate">{food.name}</p>
        <p className="text-[11px] text-neutral-400 font-medium truncate">
          {mine ? (ar ? 'طعامي' : 'My food') : food.brand || (ar ? 'عام' : 'Generic')}
          {' · '}<span dir="ltr">{food.per100.kcal} kcal / 100g</span>
        </p>
      </div>
      <span className="text-[11px] font-black text-accent tabular-nums shrink-0" dir="ltr">{food.per100.protein}g P</span>
    </button>
  );

  const field = (label: string, key: keyof typeof form, placeholder: string, numeric = false) => (
    <div className="space-y-1">
      <label className="text-[9px] font-black uppercase tracking-widest text-neutral-400">{label}</label>
      <input
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        inputMode={numeric ? 'decimal' : 'text'}
        placeholder={placeholder}
        className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-black transition"
      />
    </div>
  );

  const TABS: { id: Tab; icon: string; en: string; arLabel: string }[] = [
    { id: 'search', icon: 'search', en: 'Search', arLabel: 'بحث' },
    { id: 'barcode', icon: 'barcode_scanner', en: 'Barcode', arLabel: 'باركود' },
    { id: 'photo', icon: 'photo_camera', en: 'Photo', arLabel: 'صورة' },
    { id: 'custom', icon: 'add_circle', en: 'My food', arLabel: 'طعامي' },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center md:p-6 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-lg rounded-t-[2rem] md:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="p-5 pb-3 border-b border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black font-display uppercase">{ar ? 'سجّل طعاماً' : 'Log food'}</h3>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-neutral-50 flex items-center justify-center hover:bg-black hover:text-white transition">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          {/* Which meal */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto no-scrollbar">
            {SLOTS.map(s => (
              <button
                key={s.id}
                onClick={() => setTargetSlot(s.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition ${
                  targetSlot === s.id ? 'bg-black text-white border-black' : 'bg-white text-neutral-400 border-neutral-200'
                }`}
              >
                {ar ? s.ar : s.en}
              </button>
            ))}
          </div>
          {/* How to add */}
          <div className="grid grid-cols-4 gap-1.5">
            {TABS.map(x => (
              <button
                key={x.id}
                onClick={() => { setTab(x.id); setError(null); }}
                className={`flex flex-col items-center gap-0.5 py-2 rounded-xl border transition ${
                  tab === x.id ? 'bg-accent/10 border-accent text-accent' : 'bg-white border-neutral-100 text-neutral-400'
                }`}
              >
                <span className="material-symbols-outlined text-[19px]">{x.icon}</span>
                <span className="text-[8px] font-black uppercase tracking-widest">{ar ? x.arLabel : x.en}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {error && (
            <p className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
          )}

          {tab === 'search' && (
            <>
              <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-100 rounded-2xl px-3 focus-within:border-black transition">
                <span className="material-symbols-outlined text-neutral-400 text-[20px]">search</span>
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={ar ? 'ابحث عن طعام…' : 'Search foods…'}
                  className="w-full bg-transparent outline-none py-3 text-sm font-medium"
                />
                {busy && <span className="w-4 h-4 border-2 border-neutral-300 border-t-black rounded-full animate-spin shrink-0" />}
              </div>

              {query.trim().length < 2 && recents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 ms-1">{ar ? 'الأخيرة' : 'Recent'}</p>
                  {recents.slice(0, 6).map(r => (
                    <button
                      key={r.id}
                      onClick={() => { commit(r.name, r.brand, r.foodId, r.grams, { kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat }); onClose(); }}
                      className="w-full text-start flex items-center gap-3 p-3 rounded-2xl border border-neutral-100 bg-white hover:border-black transition"
                    >
                      <span className="w-9 h-9 rounded-xl bg-neutral-50 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px] text-neutral-300">history</span>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-black truncate">{r.name}</p>
                        <p className="text-[11px] text-neutral-400 font-medium" dir="ltr">{r.grams}g · {r.kcal} kcal</p>
                      </div>
                      <span className="material-symbols-outlined text-neutral-300 text-[20px]">replay</span>
                    </button>
                  ))}
                </div>
              )}

              {localMatches.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 ms-1">{ar ? 'أطعمتي' : 'My foods'}</p>
                  {localMatches.map(f => <Row key={f.id} food={f} mine />)}
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 ms-1">{ar ? 'قاعدة البيانات' : 'Food database'}</p>
                  {results.map(f => <Row key={f.id} food={f} />)}
                </div>
              )}

              {!busy && query.trim().length >= 2 && results.length === 0 && localMatches.length === 0 && (
                <div className="text-center py-8 space-y-3">
                  <p className="text-xs font-bold text-neutral-400">{ar ? 'لا نتائج.' : 'Nothing found.'}</p>
                  <button onClick={() => { setForm({ ...blankCustom, name: query.trim() }); setTab('custom'); }} className="px-4 py-2.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                    {ar ? 'أضفه بنفسك' : 'Add it yourself'}
                  </button>
                </div>
              )}
            </>
          )}

          {tab === 'barcode' && (
            <div className="space-y-3">
              <p className="text-[11px] font-medium text-neutral-500">
                {ar ? 'اكتب الرقم تحت الباركود على العبوة.' : 'Type the number printed under the barcode.'}
              </p>
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') runBarcode(); }}
                  inputMode="numeric"
                  placeholder="e.g. 3017624010701"
                  dir="ltr"
                  className="flex-1 bg-neutral-50 border border-neutral-100 rounded-2xl px-4 py-3 text-sm font-bold tabular-nums outline-none focus:border-black transition"
                />
                <button onClick={() => runBarcode()} disabled={busy} className="px-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40">
                  {busy ? '…' : (ar ? 'ابحث' : 'Find')}
                </button>
              </div>
              {notFoundCode && (
                <div className="text-center py-6 space-y-3 border border-dashed border-neutral-200 rounded-2xl">
                  <p className="text-xs font-bold text-neutral-400">{ar ? 'غير موجود في قاعدة البيانات.' : 'Not in the database.'}</p>
                  <button onClick={() => openCustomWithBarcode(notFoundCode)} className="px-4 py-2.5 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                    {ar ? 'احفظه بهذا الباركود' : 'Save it with this barcode'}
                  </button>
                </div>
              )}
              {customFoods.filter(f => f.barcode).length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 ms-1">{ar ? 'أطعمتي بباركود' : 'My barcoded foods'}</p>
                  {customFoods.filter(f => f.barcode).map(f => <Row key={f.id} food={f} mine />)}
                </div>
              )}
            </div>
          )}

          {tab === 'photo' && (
            <div className="space-y-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) onPhoto(f); }}
              />
              {!photoUrl && (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-10 rounded-3xl border-2 border-dashed border-neutral-200 flex flex-col items-center gap-2 hover:border-black transition"
                >
                  <span className="material-symbols-outlined text-4xl text-neutral-300">add_a_photo</span>
                  <span className="text-[11px] font-black uppercase tracking-widest text-neutral-400">
                    {ar ? 'صوّر طبقك' : 'Take a photo of your plate'}
                  </span>
                </button>
              )}

              {photoUrl && (
                <div className="relative rounded-2xl overflow-hidden">
                  <img src={photoUrl} alt="" className="w-full h-40 object-cover" />
                  <button
                    onClick={() => { setPhotoUrl(null); setGuesses(null); setError(null); }}
                    className="absolute top-2 end-2 w-8 h-8 rounded-xl bg-black/70 text-white flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              )}

              {busy && (
                <div className="flex items-center justify-center gap-2 py-6">
                  <span className="w-4 h-4 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-neutral-400">{ar ? 'يتم التحليل…' : 'Analysing…'}</span>
                </div>
              )}

              {guesses && guesses.length > 0 && (
                <>
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 ms-1">
                    {ar ? 'اختر ما في الطبق' : 'Pick what is on the plate'}
                  </p>
                  {guesses.map((g, i) => {
                    const on = picked.has(i);
                    return (
                      <div key={i} className={`p-3 rounded-2xl border-2 transition ${on ? 'border-black bg-neutral-50' : 'border-neutral-100 bg-white'}`}>
                        <button
                          onClick={() => { const n = new Set(picked); n.has(i) ? n.delete(i) : n.add(i); setPicked(n); }}
                          className="w-full text-start flex items-center gap-3"
                        >
                          <span className={`material-symbols-outlined text-[22px] shrink-0 ${on ? 'text-black filled' : 'text-neutral-300'}`}>
                            {on ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-black truncate">{g.name}</p>
                            <p className="text-[11px] text-neutral-400 font-medium" dir="ltr">
                              {g.kcal} kcal · {g.protein}g P · {g.carbs}g C · {g.fat}g F
                            </p>
                          </div>
                          {g.confidence !== 'high' && (
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full shrink-0 ${
                              g.confidence === 'low' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {g.confidence === 'low' ? (ar ? 'غير مؤكد' : 'unsure') : (ar ? 'تقريبي' : 'approx')}
                            </span>
                          )}
                        </button>
                        {on && (
                          <div className="flex items-center gap-2 mt-2 ps-8">
                            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">{ar ? 'الكمية' : 'Portion'}</span>
                            <input
                              value={String(g.grams)}
                              onChange={e => {
                                const next = Math.max(1, parseFloat(e.target.value) || 0);
                                const k = next / (g.grams || 1);
                                setGuesses(gs => (gs ?? []).map((x, j) => j === i ? {
                                  ...x, grams: next,
                                  kcal: Math.round(x.kcal * k),
                                  protein: Math.round(x.protein * k * 10) / 10,
                                  carbs: Math.round(x.carbs * k * 10) / 10,
                                  fat: Math.round(x.fat * k * 10) / 10,
                                } : x));
                              }}
                              inputMode="decimal"
                              dir="ltr"
                              className="w-20 bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-xs font-black tabular-nums outline-none focus:border-black"
                            />
                            <span className="text-[10px] font-bold text-neutral-400">g</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <p className="text-[10px] text-neutral-400 font-medium text-center pt-1">
                    {ar ? 'تقديرات تقريبية — عدّلها إذا لزم.' : 'These are estimates — adjust the portions if they look off.'}
                  </p>
                </>
              )}
            </div>
          )}

          {tab === 'custom' && (
            <div className="space-y-3">
              <p className="text-[11px] font-medium text-neutral-500">
                {ar ? 'احفظه مرة واحدة وسيظهر في البحث والباركود لاحقاً.' : 'Save it once and it shows up in search and barcode lookups from then on.'}
              </p>
              {field(ar ? 'الاسم' : 'Name', 'name', ar ? 'مثال: كبة أمي' : 'e.g. Mum’s kubba')}
              <div className="grid grid-cols-2 gap-2">
                {field(ar ? 'العلامة' : 'Brand', 'brand', ar ? 'اختياري' : 'optional')}
                {field(ar ? 'الباركود' : 'Barcode', 'barcode', ar ? 'اختياري' : 'optional', true)}
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 pt-1">{ar ? 'لكل 100 غرام' : 'Per 100 g'}</p>
              <div className="grid grid-cols-4 gap-2">
                {field('kcal', 'kcal', '0', true)}
                {field(ar ? 'بروتين' : 'Protein', 'protein', '0', true)}
                {field(ar ? 'كارب' : 'Carbs', 'carbs', '0', true)}
                {field(ar ? 'دهون' : 'Fat', 'fat', '0', true)}
              </div>
            </div>
          )}
        </div>

        {/* Footer action for the tabs that need one */}
        {tab === 'photo' && guesses && guesses.length > 0 && (
          <div className="p-4 border-t border-neutral-100">
            <button onClick={addPicked} disabled={picked.size === 0} className="w-full py-4 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest disabled:opacity-40">
              {ar ? `أضف ${picked.size}` : `Add ${picked.size} item${picked.size === 1 ? '' : 's'}`}
            </button>
          </div>
        )}
        {tab === 'custom' && (
          <div className="p-4 border-t border-neutral-100">
            <button onClick={saveCustom} disabled={busy} className="w-full py-4 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest disabled:opacity-40">
              {busy ? '…' : (ar ? 'احفظ وتابع' : 'Save & continue')}
            </button>
          </div>
        )}
      </div>

      {/* Portion step — sits above the sheet once a food is chosen */}
      {chosen && (
        <div className="absolute inset-0 z-10 flex items-end md:items-center justify-center md:p-6 bg-black/50" onClick={() => setChosen(null)}>
          <div className="bg-white w-full md:max-w-sm rounded-t-[2rem] md:rounded-3xl shadow-2xl p-5 space-y-4" onClick={e => e.stopPropagation()} style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-black text-black leading-tight">{chosen.name}</p>
                <p className="text-[11px] font-medium text-neutral-400 truncate">{chosen.brand || (chosen.source === 'custom' ? (ar ? 'طعامي' : 'My food') : (ar ? 'عام' : 'Generic'))}</p>
              </div>
              <button onClick={() => setChosen(null)} className="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                value={grams}
                onChange={e => setGrams(e.target.value)}
                inputMode="decimal"
                dir="ltr"
                className="w-24 bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-base font-black tabular-nums outline-none focus:border-black transition"
              />
              <span className="text-xs font-black uppercase tracking-widest text-neutral-400">{ar ? 'غرام' : 'grams'}</span>
              <div className="flex gap-1.5 ms-auto">
                {chosen.servingGrams && (
                  <button onClick={() => setGrams(String(chosen.servingGrams))} className="px-2.5 py-1.5 rounded-lg bg-neutral-100 text-[9px] font-black uppercase tracking-widest">
                    {ar ? 'حصة' : 'Serving'}
                  </button>
                )}
                {[100, 150, 200].map(g => (
                  <button key={g} onClick={() => setGrams(String(g))} className="px-2.5 py-1.5 rounded-lg bg-neutral-100 text-[9px] font-black tabular-nums">{g}</button>
                ))}
              </div>
            </div>

            {(() => {
              const m = macrosFor(chosen, Math.max(1, parseFloat(grams) || 0));
              return (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { l: 'kcal', v: m.kcal },
                    { l: ar ? 'بروتين' : 'Protein', v: `${m.protein}g` },
                    { l: ar ? 'كارب' : 'Carbs', v: `${m.carbs}g` },
                    { l: ar ? 'دهون' : 'Fat', v: `${m.fat}g` },
                  ].map(x => (
                    <div key={x.l} className="bg-neutral-50 rounded-xl p-2.5 text-center">
                      <p className="text-sm font-black text-black tabular-nums" dir="ltr">{x.v}</p>
                      <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400 mt-0.5">{x.l}</p>
                    </div>
                  ))}
                </div>
              );
            })()}

            <button onClick={addChosen} className="w-full py-4 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest">
              {ar ? `أضف إلى ${SLOTS.find(s => s.id === targetSlot)?.ar}` : `Add to ${SLOTS.find(s => s.id === targetSlot)?.en}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodLogSheet;
