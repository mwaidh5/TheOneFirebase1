
import React, { useEffect, useState } from 'react';
import { WeekProgram } from '../types';
import { jsonrepair } from 'jsonrepair';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { AI_PROTOCOL, applyAiResult, hasProgram, slimWeeks, streamProgress, type AiResult } from '../utils/aiProgram';
import { useT } from '../i18n/I18nContext';

interface AICourseGeneratorProps {
  onGenerated: (weeks: WeekProgram[]) => void;
  onClose: () => void;
  context?: 'course' | 'custom';
  currentWeeks?: WeekProgram[];
}

const AICourseGenerator: React.FC<AICourseGeneratorProps> = ({
  onGenerated,
  onClose,
  context = 'course',
  currentWeeks,
}) => {
  const { t, lang } = useT();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<WeekProgram[] | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [changedWeekNums, setChangedWeekNums] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [showExample, setShowExample] = useState(false);
  // Live progress while Claude streams the program.
  const [progress, setProgress] = useState<{ exercises: number; week: number | null }>({ exercises: 0, week: null });
  const [startedAt, setStartedAt] = useState(0);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!isGenerating) return;
    const t = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError('');
    setPreview(null);
    setProgress({ exercises: 0, week: null });
    setStartedAt(Date.now());

    try {
      const functions = getFunctions(getApp(), 'me-central1');
      type Input = { text: string; context: 'course' | 'custom'; currentWeeks?: unknown[]; protocol: number };
      const generateCourse = httpsCallable<Input, { text: string }>(functions, 'generateCourseWithClaude', { timeout: 540000 });

      // Ids and video URLs stay here; the model only needs the training content.
      const input: Input = {
        text: prompt,
        context: context as 'course' | 'custom',
        currentWeeks: hasProgram(currentWeeks) ? slimWeeks(currentWeeks) : undefined,
        protocol: AI_PROTOCOL,
      };

      let accumulated = '';
      let finalText = '';

      try {
        const streamResult = await generateCourse.stream(input);
        for await (const chunk of streamResult.stream) {
          const c = chunk as { delta?: string };
          if (c.delta) {
            accumulated += c.delta;
            setProgress(streamProgress(accumulated));
          }
        }
        const final = await streamResult.data;
        finalText = final.text || accumulated;
      } catch (streamErr) {
        console.warn('Streaming failed, falling back to non-streaming:', streamErr);
        const callResult = await generateCourse(input);
        finalText = callResult.data.text;
      }

      let rawText: string = finalText.trim();

      // Strip markdown fences if present
      if (rawText.startsWith('```json')) {
        rawText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```/, '').replace(/```$/, '').trim();
      }

      let parsed: AiResult;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        const repaired = jsonrepair(rawText);
        parsed = JSON.parse(repaired);
      }

      if (!parsed || !Array.isArray(parsed.weeks) || parsed.weeks.length === 0) {
        throw new Error(t('builder.ai_err_empty'));
      }

      const result = applyAiResult(currentWeeks, parsed);
      setMergeMode(result.merged);
      setChangedWeekNums(result.merged ? result.changed : []);
      setPreview(result.weeks);
    } catch (err: any) {
      console.error('AI generation error:', err);
      setError(err.message ?? t('builder.ai_err_unknown'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (preview) {
      onGenerated(preview);
      onClose();
    }
  };

  const totalExercises = preview?.reduce(
    (sum, w) => sum + w.days.reduce((ds, d) => ds + d.exercises.length, 0), 0
  ) ?? 0;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-8 border-b border-neutral-100 flex justify-between items-start bg-gradient-to-r from-neutral-950 to-neutral-800">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-lg">auto_awesome</span>
              </div>
              <h3 className="text-xl font-black font-display uppercase text-white tracking-tight">{t('builder.ai_title')}</h3>
            </div>
            <p className="text-neutral-400 text-xs font-medium ms-11">
              {t('builder.ai_sub')}
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {!preview ? (
            /* Input Phase */
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    {t('builder.ai_input_label')}
                  </label>
                  <button
                    onClick={() => setShowExample(!showExample)}
                    className="text-[9px] font-black uppercase tracking-widest text-accent hover:underline"
                  >
                    {showExample ? t('builder.ai_hide_example') : t('builder.ai_see_example')}
                  </button>
                </div>

                {showExample && (
                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 text-[10px] font-mono text-neutral-500 whitespace-pre-wrap">
                    {t('builder.ai_example')}
                  </div>
                )}

                {currentWeeks && currentWeeks.length > 0 && currentWeeks[0]?.days?.[0]?.exercises?.length > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-2xl border border-violet-100">
                    <span className="material-symbols-outlined text-violet-500 text-sm">edit_note</span>
                    <p className="text-[10px] font-bold text-violet-600">
                      {t('builder.ai_existing')}
                    </p>
                  </div>
                )}

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('builder.ai_placeholder')}
                  dir={prompt ? 'auto' : undefined}
                  rows={12}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-5 text-sm font-medium resize-none outline-none focus:border-black transition leading-relaxed"
                />
                <p className="text-[9px] text-neutral-300 font-medium">
                  {t('builder.ai_chars', { n: prompt.length })}
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                  <span className="material-symbols-outlined text-red-500 text-lg shrink-0">error</span>
                  <p className="text-xs font-medium text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-800 transition shadow-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    {progress.exercises > 0
                      ? `${progress.week ? t('builder.ai_writing_week', { n: progress.week }) : t('builder.ai_writing')} · ${progress.exercises === 1 ? t('builder.ai_ex_one', { n: 1 }) : t('builder.ai_ex_many', { n: progress.exercises })}`
                      : t('builder.ai_generating')}
                    <span className="text-white/40 tabular-nums">{t('builder.ai_seconds', { n: Math.max(0, Math.round((Date.now() - startedAt) / 1000)) })}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                    {t('builder.ai_generate_program')}
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Preview Phase */
            <div className="p-8 space-y-6">
              {/* Mode badge */}
              {mergeMode ? (
                <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-2xl border border-violet-100">
                  <span className="material-symbols-outlined text-violet-500 text-sm">merge</span>
                  <p className="text-[10px] font-bold text-violet-600">
                    {t(changedWeekNums.length > 1 ? 'builder.ai_surgical_many' : 'builder.ai_surgical_one', { list: changedWeekNums.join(lang === 'ar' ? '، ' : ', ') })}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <span className="material-symbols-outlined text-neutral-400 text-sm">refresh</span>
                  <p className="text-[10px] font-bold text-neutral-500">{t('builder.ai_full_generated')}</p>
                </div>
              )}

              {/* Stats bar */}
              <div className="flex gap-4">
                {[
                  { label: t('builder.ai_weeks'), value: preview.length, icon: 'calendar_month' },
                  { label: t('builder.ai_days'), value: preview.reduce((s, w) => s + w.days.length, 0), icon: 'today' },
                  { label: t('builder.exercises'), value: totalExercises, icon: 'fitness_center' },
                ].map(stat => (
                  <div key={stat.icon} className="flex-1 bg-neutral-50 rounded-2xl p-4 border border-neutral-100 text-center">
                    <span className="material-symbols-outlined text-accent text-lg">{stat.icon}</span>
                    <p className="text-2xl font-black text-black">{stat.value}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Week preview */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto no-scrollbar">
                {preview.map((week) => {
                  const isChanged = mergeMode && changedWeekNums.includes(week.weekNumber);
                  return (
                    <div key={week.id} className={`border rounded-2xl overflow-hidden ${isChanged ? 'border-violet-300' : 'border-neutral-100'}`}>
                      <div className={`px-5 py-3 flex items-center justify-between ${isChanged ? 'bg-violet-600' : 'bg-neutral-900'}`}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white">{t('builder.week_n', { n: week.weekNumber })}</p>
                        {isChanged && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-violet-200 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">edit</span> {t('builder.ai_modified')}
                          </span>
                        )}
                      </div>
                      <div className="divide-y divide-neutral-50">
                        {week.days.map((day) => (
                          <div key={day.id} className="px-5 py-3">
                            <p className="text-xs font-black uppercase text-black mb-2">{t('builder.day_title', { n: day.dayNumber, title: day.title })}</p>
                            {day.exercises.length === 0 ? (
                              <p className="text-[10px] text-neutral-300 font-medium italic">{t('builder.ai_rest_day')}</p>
                            ) : (
                              <div className="space-y-1">
                                {day.exercises.map((ex) => (
                                  <div key={ex.id} className="flex items-center gap-3 text-[10px] text-neutral-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                                    <span className="font-bold text-black">{ex.name}</span>
                                    {ex.sets && ex.reps && (
                                      <span className="text-neutral-400" dir="ltr">{ex.sets}×{ex.reps}</span>
                                    )}
                                    {ex.rest && <span className="text-neutral-300">· {t('builder.ai_rest_suffix', { v: ex.rest })}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setPreview(null); setMergeMode(false); setChangedWeekNums([]); }}
                  className="flex-1 py-4 bg-neutral-100 text-neutral-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-200 transition"
                >
                  {t('builder.ai_regenerate')}
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-accent transition shadow-xl flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  {t('builder.ai_apply')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AICourseGenerator;
