import React from 'react';
import { useT } from '../i18n/I18nContext';

// MOCKUP — athlete transformations (before/after + feedback). Static sample
// data for now; later this can read from a Firestore `results` collection
// managed from the admin panel.
const RESULTS = [
  {
    name: 'Ahmed K.',
    result: { en: '-14 kg · 16 weeks', ar: '-١٤ كغم · ١٦ أسبوع' },
    program: 'Engine Builder',
    before: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=400',
    after: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=400',
    quote: {
      en: 'The plan was clear and the coach checked on me every week. Best shape of my life.',
      ar: 'الخطة كانت واضحة والمدرب يتابعني كل أسبوع. أفضل لياقة وصلت لها في حياتي.',
    },
  },
  {
    name: 'Sara M.',
    result: { en: '+45 kg squat · 12 weeks', ar: '+٤٥ كغم سكوات · ١٢ أسبوع' },
    program: 'Strength Foundation',
    before: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400',
    after: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=400',
    quote: {
      en: 'I never thought I could lift like this. The progression was perfectly paced.',
      ar: 'ما توقعت أرفع هذي الأوزان يوماً. التدرّج كان مدروساً بشكل ممتاز.',
    },
  },
  {
    name: 'Omar T.',
    result: { en: '-9% body fat · 20 weeks', ar: '-٩٪ دهون · ٢٠ أسبوع' },
    program: 'Hybrid Athlete',
    before: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?q=80&w=400',
    after: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400',
    quote: {
      en: 'Training + nutrition in one app made it easy to stay consistent.',
      ar: 'التمرين والتغذية بتطبيق واحد خلّى الالتزام سهلاً.',
    },
  },
];

const ResultsShowcase: React.FC = () => {
  const { t, lang } = useT();
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between ml-1">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-neutral-400">
          {lang === 'ar' ? 'نتائج حقيقية' : 'Real results'}
        </p>
        <span className="text-[9px] font-black uppercase tracking-widest text-neutral-300">
          {lang === 'ar' ? 'قبل / بعد' : 'Before / After'}
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 snap-x snap-mandatory theone-hide-scrollbar">
        {RESULTS.map((r, i) => (
          <div key={i} className="snap-start shrink-0 w-72 bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm">
            {/* Before / After split */}
            <div className="grid grid-cols-2 h-40 relative">
              <div className="relative">
                <img src={r.before} alt="" className="w-full h-full object-cover grayscale" />
                <span className="absolute bottom-2 start-2 bg-black/70 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest">
                  {lang === 'ar' ? 'قبل' : 'Before'}
                </span>
              </div>
              <div className="relative">
                <img src={r.after} alt="" className="w-full h-full object-cover" />
                <span className="absolute bottom-2 end-2 bg-accent text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest">
                  {lang === 'ar' ? 'بعد' : 'After'}
                </span>
              </div>
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-accent">sync_alt</span>
              </span>
            </div>

            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black uppercase tracking-tight text-black">{r.name}</p>
                <span className="bg-green-50 text-green-700 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide whitespace-nowrap">{r.result[lang]}</span>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-neutral-300">{r.program}</p>
              <p className="text-xs font-medium text-neutral-500 leading-relaxed">
                <span className="material-symbols-outlined text-[14px] text-accent align-middle me-1 filled">format_quote</span>
                {r.quote[lang]}
              </p>
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, s) => (
                  <span key={s} className="material-symbols-outlined text-[14px] filled">star</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsShowcase;
