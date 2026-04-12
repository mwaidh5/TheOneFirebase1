
import React, { useState } from 'react';
import { WeekProgram } from '../types';
import { jsonrepair } from 'jsonrepair';

interface AICourseGeneratorProps {
  onGenerated: (weeks: WeekProgram[]) => void;
  onClose: () => void;
  context?: 'course' | 'custom';
  currentWeeks?: WeekProgram[];
}

interface ClaudeResponse {
  mode: 'replace' | 'merge';
  weeks: WeekProgram[];
}

const EXAMPLE_PROMPT = `Week 1:
  Monday (Session A - Lower Body):
    Back Squat 5 sets x 5 reps, rest 3 min
    Romanian Deadlift 3 sets x 10 reps, rest 90s
    Leg Press 3 sets x 12 reps, rest 60s
  Wednesday (Session B - Upper Push):
    Bench Press 4 sets x 8 reps, rest 2 min
    Overhead Press 3 sets x 10 reps, rest 90s
    Tricep Dips 3 sets x AMRAP, rest 60s
  Friday (Session C - Pull):
    Deadlift 4 sets x 5 reps, rest 3 min
    Pull-ups 3 sets x AMRAP, rest 90s
    Barbell Row 3 sets x 8 reps, rest 90s

Week 2:
  Monday: Same as Week 1 Session A but add 2.5kg to squat

--- Surgical edit examples ---
Add a Saturday cardio day to week 4 only.
Change week 2 day 3 to focus on shoulders.
Add week 5 with a deload structure.`;

function mergeWeeks(current: WeekProgram[], patches: WeekProgram[]): WeekProgram[] {
  const result = current.map(w => ({ ...w }));
  for (const patch of patches) {
    const idx = result.findIndex(w => w.weekNumber === patch.weekNumber);
    if (idx >= 0) {
      result[idx] = patch;
    } else {
      result.push(patch);
    }
  }
  return result.sort((a, b) => a.weekNumber - b.weekNumber);
}

function buildPrompt(text: string, context: 'course' | 'custom', currentWeeks?: WeekProgram[]): string {
  const contextNote = context === 'custom'
    ? 'This is a bespoke program for a specific athlete. Be precise with coaching notes.'
    : 'This is a public course for multiple athletes. Keep descriptions general but motivating.';

  const hasExisting = !!(currentWeeks && currentWeeks.length > 0 && currentWeeks[0]?.days?.[0]?.exercises?.length);

  const currentProgramSection = hasExisting
    ? `\nCURRENT PROGRAM STATE (JSON):\n${JSON.stringify(currentWeeks, null, 2)}\n`
    : '';

  const modeInstructions = hasExisting
    ? `MODE SELECTION:
- Use "mode": "merge" when the request targets specific weeks or days (e.g. "add a day to week 4", "change week 2 day 3", "add a rest day to week 1"). Return ONLY the modified weeks — all other weeks are automatically preserved.
- Use "mode": "replace" only when the user wants a completely new program or full overhaul.
- For "merge": return the COMPLETE week data (all days) for any week that changed, not just the modified day.`
    : `MODE SELECTION:
- Always use "mode": "replace" since there is no existing program yet.`;

  return `You are an elite strength & conditioning coach. ${contextNote}

Convert the following workout instruction into a structured JSON response.${currentProgramSection}

RESPONSE FORMAT — return a single JSON object:
{
  "mode": "replace" | "merge",
  "weeks": WeekProgram[]
}

${modeInstructions}

RULES:
- Return ONLY valid JSON, no markdown, no explanations.
- Every exercise must have a unique "id" (format: "ex_" + random 6 digits).
- Every day must have a unique "id" (format: "d_" + random 6 digits).
- Every week must have a unique "id" (format: "w_" + random 6 digits).
- "format" must be one of: REGULAR, EMOM, SUPER_SET, CIRCUIT, DROP_SET, AMRAP, FOR_TIME, HIIT, CARDIO, MAX_EFFORT
- Use REGULAR for standard sets/reps. Use AMRAP when reps say "AMRAP". Use MAX_EFFORT for 1RM/3RM.
- "reps" is always a string (e.g. "10", "AMRAP", "5-8").
- "rest" is always a string (e.g. "90s", "3 min", "2:00").
- "sets" is always a number.
- Add a brief "description" coaching note per exercise (1 sentence max). No double quotes inside strings — use single quotes. No newlines inside strings.
- Rest/Recovery days: empty exercises array, title "Rest Day".

SCHEMA:
interface Exercise { id: string; name: string; format: string; sets?: number; reps?: string; rest?: string; description?: string; durationMinutes?: number; rounds?: number; distance?: string; time?: string; }
interface DayProgram { id: string; dayNumber: number; title: string; exercises: Exercise[]; }
interface WeekProgram { id: string; weekNumber: number; days: DayProgram[]; }

INSTRUCTION:
${text}

Return the JSON object:`;
}

const AICourseGenerator: React.FC<AICourseGeneratorProps> = ({
  onGenerated,
  onClose,
  context = 'course',
  currentWeeks,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<WeekProgram[] | null>(null);
  const [mergeMode, setMergeMode] = useState(false);
  const [changedWeekNums, setChangedWeekNums] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [showExample, setShowExample] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError('');
    setPreview(null);

    try {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in your .env file.');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 8192,
          messages: [{ role: 'user', content: buildPrompt(prompt, context, currentWeeks) }],
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Claude API error ${response.status}: ${errBody}`);
      }

      const data = await response.json();
      let rawText: string = data.content[0].text.trim();

      // Strip markdown fences if present
      if (rawText.startsWith('```json')) {
        rawText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (rawText.startsWith('```')) {
        rawText = rawText.replace(/^```/, '').replace(/```$/, '').trim();
      }

      let parsed: ClaudeResponse;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        const repaired = jsonrepair(rawText);
        parsed = JSON.parse(repaired);
      }

      if (!parsed || !Array.isArray(parsed.weeks) || parsed.weeks.length === 0) {
        throw new Error('Claude returned an empty or invalid program.');
      }

      const isMerge = parsed.mode === 'merge' && currentWeeks && currentWeeks.length > 0;

      if (isMerge) {
        const merged = mergeWeeks(currentWeeks!, parsed.weeks);
        setMergeMode(true);
        setChangedWeekNums(parsed.weeks.map(w => w.weekNumber));
        setPreview(merged);
      } else {
        setMergeMode(false);
        setChangedWeekNums([]);
        setPreview(parsed.weeks);
      }
    } catch (err: any) {
      console.error('AI generation error:', err);
      setError(err.message ?? 'Unknown error occurred.');
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
              <h3 className="text-xl font-black font-display uppercase text-white tracking-tight">AI Course Generator</h3>
            </div>
            <p className="text-neutral-400 text-xs font-medium ml-11">
              Paste your program or describe changes — Claude will handle it precisely.
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all">
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
                    Your Program or Edit Instructions
                  </label>
                  <button
                    onClick={() => setShowExample(!showExample)}
                    className="text-[9px] font-black uppercase tracking-widest text-accent hover:underline"
                  >
                    {showExample ? 'Hide Example' : 'See Example Format'}
                  </button>
                </div>

                {showExample && (
                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 text-[10px] font-mono text-neutral-500 whitespace-pre-wrap">
                    {EXAMPLE_PROMPT}
                  </div>
                )}

                {currentWeeks && currentWeeks.length > 0 && currentWeeks[0]?.days?.[0]?.exercises?.length > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-2xl border border-violet-100">
                    <span className="material-symbols-outlined text-violet-500 text-sm">edit_note</span>
                    <p className="text-[10px] font-bold text-violet-600">
                      Existing program detected — you can describe surgical changes (e.g. "add a cardio day to week 4 only") and all other weeks will be preserved.
                    </p>
                  </div>
                )}

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`Describe your program or edit in plain English...\n\nExamples:\n• "Week 1, Monday (Leg Day): Back Squat 5x5, rest 3 min..."\n• "Add a Saturday HIIT day to week 4 only"\n• "Change week 2 day 3 to a full upper body session"\n• "Add a deload week 5 with 60% intensity across all exercises"`}
                  rows={12}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-5 text-sm font-medium resize-none outline-none focus:border-black transition-all leading-relaxed"
                />
                <p className="text-[9px] text-neutral-300 font-medium">
                  {prompt.length} characters · Be as specific as you like
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
                className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-800 transition-all shadow-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Generating with Claude...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                    Generate Program
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
                    Surgical edit — only Week{changedWeekNums.length > 1 ? 's' : ''} {changedWeekNums.join(', ')} modified. All other weeks preserved.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-neutral-50 rounded-2xl border border-neutral-100">
                  <span className="material-symbols-outlined text-neutral-400 text-sm">refresh</span>
                  <p className="text-[10px] font-bold text-neutral-500">Full program generated.</p>
                </div>
              )}

              {/* Stats bar */}
              <div className="flex gap-4">
                {[
                  { label: 'Weeks', value: preview.length, icon: 'calendar_month' },
                  { label: 'Days', value: preview.reduce((s, w) => s + w.days.length, 0), icon: 'today' },
                  { label: 'Exercises', value: totalExercises, icon: 'fitness_center' },
                ].map(stat => (
                  <div key={stat.label} className="flex-1 bg-neutral-50 rounded-2xl p-4 border border-neutral-100 text-center">
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
                        <p className="text-[10px] font-black uppercase tracking-widest text-white">Week {week.weekNumber}</p>
                        {isChanged && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-violet-200 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">edit</span> Modified
                          </span>
                        )}
                      </div>
                      <div className="divide-y divide-neutral-50">
                        {week.days.map((day) => (
                          <div key={day.id} className="px-5 py-3">
                            <p className="text-xs font-black uppercase text-black mb-2">Day {day.dayNumber}: {day.title}</p>
                            {day.exercises.length === 0 ? (
                              <p className="text-[10px] text-neutral-300 font-medium italic">Rest Day</p>
                            ) : (
                              <div className="space-y-1">
                                {day.exercises.map((ex) => (
                                  <div key={ex.id} className="flex items-center gap-3 text-[10px] text-neutral-500">
                                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                                    <span className="font-bold text-black">{ex.name}</span>
                                    {ex.sets && ex.reps && (
                                      <span className="text-neutral-400">{ex.sets}×{ex.reps}</span>
                                    )}
                                    {ex.rest && <span className="text-neutral-300">· {ex.rest} rest</span>}
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
                  className="flex-1 py-4 bg-neutral-100 text-neutral-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-200 transition-all"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-accent transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  Apply to Builder
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
