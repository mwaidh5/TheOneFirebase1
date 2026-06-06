import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { setDoc, doc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { WeekProgram, DayProgram, Exercise, MediaAsset, ExerciseTemplate, WorkoutTemplate } from '../types';
import AICourseGenerator from './AICourseGenerator';

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const renumber = (days: DayProgram[]) => days.map((d, i) => ({ ...d, dayNumber: i + 1 }));

interface Props {
  weeks: WeekProgram[];
  setWeeks: React.Dispatch<React.SetStateAction<WeekProgram[]>>;
  exerciseLibrary: ExerciseTemplate[];
  workoutLibrary: WorkoutTemplate[];
  mediaLibrary: MediaAsset[];
}

type PickerState = { type: 'exercise' | 'workout' | 'media'; exIdx: number | null; field?: 'imageUrl' | 'videoUrl' } | null;

// ───────────────────────────── Day card (draggable square) ──────────────────
const DayCard: React.FC<{ day: DayProgram; weekId: string; onOpen: () => void; onClone: () => void; onDelete: () => void; }> = ({ day, weekId, onOpen, onClone, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: day.id, data: { type: 'day', weekId } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const stop = (e: React.SyntheticEvent) => { e.stopPropagation(); };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onOpen}
      className="group/card relative bg-white border border-neutral-200 rounded-2xl p-4 cursor-pointer hover:border-black hover:shadow-md transition-all select-none touch-none"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[8px] font-black uppercase tracking-widest text-accent">Day {day.dayNumber}</span>
        <div className="flex gap-1 opacity-100 md:opacity-0 group-hover/card:opacity-100 transition-opacity">
          <button onPointerDown={stop} onClick={(e) => { stop(e); onClone(); }} className="w-6 h-6 rounded-lg bg-neutral-50 text-neutral-400 flex items-center justify-center hover:bg-accent hover:text-white transition-all" title="Clone day">
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
          </button>
          <button onPointerDown={stop} onClick={(e) => { stop(e); onDelete(); }} className="w-6 h-6 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all" title="Delete day">
            <span className="material-symbols-outlined text-[14px]">delete</span>
          </button>
        </div>
      </div>
      <p className="font-black uppercase text-sm text-black truncate leading-tight">{day.title || 'Untitled'}</p>
      <div className="flex items-center gap-1.5 mt-3 text-neutral-400">
        <span className="material-symbols-outlined text-[14px]">exercise</span>
        <span className="text-[10px] font-bold uppercase tracking-wider">{day.exercises.length} {day.exercises.length === 1 ? 'block' : 'blocks'}</span>
      </div>
    </div>
  );
};

// ───────────────────────────── Week column ──────────────────────────────────
const WeekColumn: React.FC<{
  week: WeekProgram;
  onAddDay: () => void;
  onClone: () => void;
  onDelete: () => void;
  onOpenDay: (dayId: string) => void;
  onCloneDay: (dayId: string) => void;
  onDeleteDay: (dayId: string) => void;
}> = ({ week, onAddDay, onClone, onDelete, onOpenDay, onCloneDay, onDeleteDay }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${week.id}`, data: { type: 'column', weekId: week.id } });
  return (
    <div className="shrink-0 w-60 flex flex-col">
      <div className="flex items-center justify-between px-2 mb-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-black">Week {week.weekNumber}</h3>
        <div className="flex gap-1">
          <button onClick={onClone} className="w-6 h-6 rounded-lg bg-accent/10 text-accent flex items-center justify-center hover:bg-accent hover:text-white transition-all" title="Duplicate week">
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
          </button>
          <button onClick={onDelete} className="w-6 h-6 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all" title="Delete week">
            <span className="material-symbols-outlined text-[14px]">delete</span>
          </button>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[120px] rounded-2xl p-2 space-y-2 transition-colors ${isOver ? 'bg-accent/5 ring-2 ring-accent/30' : 'bg-neutral-100/60'}`}
      >
        <SortableContext items={week.days.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {week.days.map((day) => (
            <DayCard
              key={day.id}
              day={day}
              weekId={week.id}
              onOpen={() => onOpenDay(day.id)}
              onClone={() => onCloneDay(day.id)}
              onDelete={() => onDeleteDay(day.id)}
            />
          ))}
        </SortableContext>
        <button onClick={onAddDay} className="w-full py-2.5 rounded-xl border-2 border-dashed border-neutral-300 text-[10px] font-black uppercase text-neutral-400 hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-sm">add</span> Day
        </button>
      </div>
    </div>
  );
};

// ───────────────────────────── Exercise editor (in day modal) ───────────────
const ExerciseEditor: React.FC<{ ex: any; exIdx: number; updateExercise: (i: number, f: keyof Exercise, v: any) => void; removeExercise: (i: number) => void; openPicker: (p: PickerState) => void; }> = ({ ex, exIdx, updateExercise, removeExercise, openPicker }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: ex.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100 relative space-y-6">
      <div className="absolute top-4 left-4 cursor-grab" {...attributes} {...listeners}>
        <span className="material-symbols-outlined text-neutral-400 hover:text-black">drag_indicator</span>
      </div>
      <div className="absolute top-4 right-4 flex gap-3">
        <button onClick={() => openPicker({ type: 'exercise', exIdx })} className="text-[9px] font-black text-accent uppercase flex items-center gap-1"><span className="material-symbols-outlined text-base">menu_book</span> Library</button>
        <button onClick={() => removeExercise(exIdx)} className="text-neutral-300 hover:text-red-500"><span className="material-symbols-outlined text-lg">delete</span></button>
      </div>
      <div className="space-y-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[8px] font-black text-neutral-300 ml-1">Name</label>
            <input type="text" value={ex.name} onChange={(e) => updateExercise(exIdx, 'name', e.target.value)} className="w-full bg-white border border-neutral-100 rounded-xl p-3 font-bold text-xs" />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-black text-neutral-300 ml-1">Type</label>
            <select value={ex.format} onChange={(e) => updateExercise(exIdx, 'format', e.target.value as any)} className="w-full bg-white border border-neutral-100 rounded-xl p-3 text-[9px] font-black uppercase outline-none">
              <option value="REGULAR">Standard (Straight Sets)</option>
              <option value="SUPER_SET">Superset / Circuit</option>
              <option value="EMOM">EMOM</option>
              <option value="AMRAP">AMRAP</option>
              <option value="HIIT">HIIT (Intervals)</option>
              <option value="CARDIO">Cardio (Monostructural)</option>
              <option value="MAX_EFFORT">Max Effort (1RM/3RM)</option>
              <option value="FOR_TIME">For Time</option>
              <option value="HOLD">Hold (Timed Position)</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            {(ex.format === 'REGULAR' || ex.format === 'MAX_EFFORT' || ex.format === 'DROP_SET' || ex.format === 'SUPER_SET') && (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Sets</label><input type="number" value={ex.sets} onChange={(e) => updateExercise(exIdx, 'sets', parseInt(e.target.value))} className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
                <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Reps</label><input type="text" value={ex.reps} onChange={(e) => updateExercise(exIdx, 'reps', e.target.value)} className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
                <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Rest</label><input type="text" value={ex.rest} onChange={(e) => updateExercise(exIdx, 'rest', e.target.value)} className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
              </div>
            )}
            {(ex.format === 'CARDIO' || ex.format === 'FOR_TIME') && (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Distance</label><input type="text" value={ex.distance || ''} onChange={(e) => updateExercise(exIdx, 'distance', e.target.value)} placeholder="5km" className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
                <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Time Cap</label><input type="text" value={ex.time || ''} onChange={(e) => updateExercise(exIdx, 'time', e.target.value)} placeholder="20:00" className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
                <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Pace/Cals</label><input type="text" value={ex.speed || ex.calories || ''} onChange={(e) => updateExercise(exIdx, 'speed', e.target.value)} placeholder="Zone 2" className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
              </div>
            )}
            {ex.format === 'FOR_TIME' && (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
                <p className="text-[8px] font-black uppercase text-blue-400">Movements To Complete</p>
                {(ex.forTimeItems || []).map((item: any, itemIdx: number) => (
                  <div key={item.id} className="flex gap-2 items-center">
                    <input type="text" value={item.name} onChange={(e) => { const items = [...(ex.forTimeItems || [])]; items[itemIdx] = { ...items[itemIdx], name: e.target.value }; updateExercise(exIdx, 'forTimeItems', items); }} placeholder="Exercise name" className="flex-1 bg-white border border-blue-100 rounded-lg p-2 font-bold text-[10px] outline-none" />
                    <input type="text" value={item.reps || ''} onChange={(e) => { const items = [...(ex.forTimeItems || [])]; items[itemIdx] = { ...items[itemIdx], reps: e.target.value }; updateExercise(exIdx, 'forTimeItems', items); }} placeholder="21 reps" className="w-20 bg-white border border-blue-100 rounded-lg p-2 text-center font-black text-[10px] outline-none" />
                    <button onClick={() => updateExercise(exIdx, 'forTimeItems', (ex.forTimeItems || []).filter((_: any, i: number) => i !== itemIdx))} className="text-blue-300 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-base">close</span></button>
                  </div>
                ))}
                <button onClick={() => updateExercise(exIdx, 'forTimeItems', [...(ex.forTimeItems || []), { id: uid(), name: '', reps: '' }])} className="text-[8px] font-black uppercase text-blue-400 flex items-center gap-1 hover:text-blue-600 transition-colors"><span className="material-symbols-outlined text-sm">add_circle</span> Add Movement</button>
              </div>
            )}
            {ex.format === 'HOLD' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Sets</label><input type="number" value={ex.sets || ''} onChange={(e) => updateExercise(exIdx, 'sets', parseInt(e.target.value))} className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
                <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Target Hold</label><input type="text" value={ex.time || ''} onChange={(e) => updateExercise(exIdx, 'time', e.target.value)} placeholder="01:00 (optional)" className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
              </div>
            )}
            {(ex.format === 'EMOM' || ex.format === 'AMRAP' || ex.format === 'HIIT') && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Total Time (Min)</label><input type="number" value={ex.durationMinutes || ''} onChange={(e) => updateExercise(exIdx, 'durationMinutes', parseInt(e.target.value))} className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
                  <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Rounds</label><input type="number" value={ex.rounds || ''} onChange={(e) => updateExercise(exIdx, 'rounds', parseInt(e.target.value))} className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
                </div>
                {ex.format === 'HIIT' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Work</label><input type="text" value={ex.workInterval || ''} onChange={(e) => updateExercise(exIdx, 'workInterval', e.target.value)} placeholder="20s" className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
                    <div className="text-center"><label className="text-[8px] font-black text-neutral-300 uppercase">Rest</label><input type="text" value={ex.restInterval || ''} onChange={(e) => updateExercise(exIdx, 'restInterval', e.target.value)} placeholder="10s" className="w-full bg-white border border-neutral-100 rounded-xl p-2.5 text-center font-black text-[10px]" /></div>
                  </div>
                )}
                {ex.format === 'EMOM' && (
                  <div className="p-3 bg-orange-50 rounded-xl border border-orange-100 space-y-2">
                    <p className="text-[8px] font-black uppercase text-orange-400">Exercises Per Round</p>
                    {(ex.emomItems || []).map((item: any, itemIdx: number) => (
                      <div key={item.id} className="flex gap-2 items-center">
                        <input type="text" value={item.name} onChange={(e) => { const items = [...(ex.emomItems || [])]; items[itemIdx] = { ...items[itemIdx], name: e.target.value }; updateExercise(exIdx, 'emomItems', items); }} placeholder="Exercise name" className="flex-1 bg-white border border-orange-100 rounded-lg p-2 font-bold text-[10px] outline-none" />
                        <input type="text" value={item.time} onChange={(e) => { const items = [...(ex.emomItems || [])]; items[itemIdx] = { ...items[itemIdx], time: e.target.value }; updateExercise(exIdx, 'emomItems', items); }} placeholder="30s" className="w-16 bg-white border border-orange-100 rounded-lg p-2 text-center font-black text-[10px] outline-none" />
                        <button onClick={() => updateExercise(exIdx, 'emomItems', (ex.emomItems || []).filter((_: any, i: number) => i !== itemIdx))} className="text-orange-300 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-base">close</span></button>
                      </div>
                    ))}
                    <button onClick={() => updateExercise(exIdx, 'emomItems', [...(ex.emomItems || []), { id: uid(), name: '', time: '' }])} className="text-[8px] font-black uppercase text-orange-400 flex items-center gap-1 hover:text-orange-600 transition-colors"><span className="material-symbols-outlined text-sm">add_circle</span> Add Exercise</button>
                  </div>
                )}
              </div>
            )}
            {ex.format === 'SUPER_SET' && (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 mt-2">
                <p className="text-[8px] font-black uppercase text-blue-400 mb-2">Circuit Grouping</p>
                <input type="text" value={ex.supersetId || ''} onChange={(e) => updateExercise(exIdx, 'supersetId', e.target.value)} placeholder="Group A" className="w-full bg-white border border-blue-100 rounded-lg p-2 text-[10px] font-bold" />
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => openPicker({ type: 'media', exIdx, field: 'imageUrl' })} className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${ex.imageUrl ? 'bg-accent text-white border-accent' : 'bg-white border-neutral-100 text-neutral-300'}`}><span className="material-symbols-outlined text-base">image</span><span className="text-[8px] font-black uppercase">Photo</span></button>
              <button onClick={() => openPicker({ type: 'media', exIdx, field: 'videoUrl' })} className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${ex.videoUrl ? 'bg-accent text-white border-accent' : 'bg-white border-neutral-100 text-neutral-300'}`}><span className="material-symbols-outlined text-base">videocam</span><span className="text-[8px] font-black uppercase">Video</span></button>
            </div>
            <textarea rows={2} value={ex.description} onChange={(e) => updateExercise(exIdx, 'description', e.target.value)} className="w-full bg-white border border-neutral-100 rounded-xl p-3 text-[10px] font-medium resize-none" placeholder="Coaching Notes..." />
          </div>
        </div>
      </div>
    </div>
  );
};

// ───────────────────────────── Main board ───────────────────────────────────
const CourseWeekBoard: React.FC<Props> = ({ weeks, setWeeks, exerciseLibrary, workoutLibrary, mediaLibrary }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [picker, setPicker] = useState<PickerState>(null);
  const [isUploading, setIsUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findDay = (dayId: string) => {
    for (let w = 0; w < weeks.length; w++) {
      const d = weeks[w].days.findIndex((x) => x.id === dayId);
      if (d !== -1) return { weekIdx: w, dayIdx: d };
    }
    return null;
  };

  const activeDayCard = activeId ? (() => { const loc = findDay(activeId); return loc ? weeks[loc.weekIdx].days[loc.dayIdx] : null; })() : null;

  // ── Week ops ──
  const addWeek = () => setWeeks((prev) => [...prev, { id: uid(), weekNumber: prev.length + 1, days: [{ id: uid(), dayNumber: 1, title: 'Session', exercises: [] }] }]);
  const cloneWeek = (weekId: string) => setWeeks((prev) => {
    const src = prev.find((w) => w.id === weekId);
    if (!src) return prev;
    const copy: WeekProgram = { id: uid(), weekNumber: prev.length + 1, days: src.days.map((d) => ({ ...d, id: uid(), exercises: d.exercises.map((e) => ({ ...e, id: uid() })) })) };
    return [...prev, copy];
  });
  const deleteWeek = (weekId: string) => {
    if (weeks.length <= 1) { alert('You must have at least one week.'); return; }
    if (!window.confirm('Delete this week?')) return;
    setWeeks((prev) => prev.filter((w) => w.id !== weekId).map((w, i) => ({ ...w, weekNumber: i + 1 })));
  };

  // ── Day ops ──
  const addDay = (weekId: string) => setWeeks((prev) => prev.map((w) => w.id === weekId ? { ...w, days: renumber([...w.days, { id: uid(), dayNumber: 0, title: 'New Day', exercises: [] }]) } : w));
  const cloneDay = (dayId: string) => setWeeks((prev) => prev.map((w) => {
    const idx = w.days.findIndex((d) => d.id === dayId);
    if (idx === -1) return w;
    const src = w.days[idx];
    const copy: DayProgram = { ...src, id: uid(), title: `${src.title} (copy)`, exercises: src.exercises.map((e) => ({ ...e, id: uid() })) };
    const days = [...w.days]; days.splice(idx + 1, 0, copy);
    return { ...w, days: renumber(days) };
  }));
  const deleteDay = (dayId: string) => setWeeks((prev) => prev.map((w) => w.days.some((d) => d.id === dayId) ? { ...w, days: renumber(w.days.filter((d) => d.id !== dayId)) } : w));

  // ── Drag day between/within weeks ──
  const onDragEnd = (event: any) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const src = findDay(active.id);
    if (!src) return;
    const srcWeekId = weeks[src.weekIdx].id;

    let dstWeekId: string;
    let dstIdx: number;
    const overData = over.data?.current;
    if (overData?.type === 'day') {
      dstWeekId = overData.weekId;
      const dst = findDay(over.id);
      dstIdx = dst ? dst.dayIdx : weeks.find((w) => w.id === dstWeekId)!.days.length;
    } else if (String(over.id).startsWith('col-')) {
      dstWeekId = String(over.id).slice(4);
      dstIdx = weeks.find((w) => w.id === dstWeekId)!.days.length;
    } else {
      return;
    }

    if (srcWeekId === dstWeekId && src.dayIdx === dstIdx) return;

    setWeeks((prev) => {
      const next = prev.map((w) => ({ ...w, days: [...w.days] }));
      const sw = next.find((w) => w.id === srcWeekId)!;
      if (srcWeekId === dstWeekId) {
        sw.days = renumber(arrayMove(sw.days, src.dayIdx, dstIdx));
      } else {
        const dw = next.find((w) => w.id === dstWeekId)!;
        const [moved] = sw.days.splice(src.dayIdx, 1);
        dw.days.splice(dstIdx, 0, moved);
        sw.days = renumber(sw.days);
        dw.days = renumber(dw.days);
      }
      return next;
    });
  };

  // ── Selected day editing ──
  const selectedLoc = selectedDayId ? findDay(selectedDayId) : null;
  const selectedDay = selectedLoc ? weeks[selectedLoc.weekIdx].days[selectedLoc.dayIdx] : null;

  const mutateSelectedDay = (fn: (day: DayProgram) => DayProgram) => {
    if (!selectedDayId) return;
    setWeeks((prev) => prev.map((w) => ({ ...w, days: w.days.map((d) => d.id === selectedDayId ? fn(d) : d) })));
  };
  const updateExercise = (exIdx: number, field: keyof Exercise, val: any) => mutateSelectedDay((d) => ({ ...d, exercises: d.exercises.map((e, i) => i === exIdx ? { ...e, [field]: val } : e) }));
  const removeExercise = (exIdx: number) => mutateSelectedDay((d) => ({ ...d, exercises: d.exercises.filter((_, i) => i !== exIdx) }));
  const addExercise = () => mutateSelectedDay((d) => ({ ...d, exercises: [...d.exercises, { id: uid(), name: '', format: 'REGULAR', sets: 3, reps: '10', rest: '60s' } as any] }));
  const applyBlueprint = (template: WorkoutTemplate) => {
    const exs = (template.weeks[0]?.days[0]?.exercises || []).map((e: any) => ({ ...e, id: uid() }));
    mutateSelectedDay((d) => ({ ...d, exercises: [...d.exercises, ...exs] }));
    setPicker(null);
  };

  const onExerciseDragEnd = (event: any) => {
    const { active, over } = event;
    if (!selectedDay || !over || active.id === over.id) return;
    const oldIndex = selectedDay.exercises.findIndex((e) => e.id === active.id);
    const newIndex = selectedDay.exercises.findIndex((e) => e.id === over.id);
    mutateSelectedDay((d) => ({ ...d, exercises: arrayMove(d.exercises, oldIndex, newIndex) }));
  };
  const exSensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || picker?.exIdx == null) return;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `media/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      const newAsset: any = { id: Date.now().toString(), type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE', data: url, category: 'WORKOUT', title: file.name };
      await setDoc(doc(db, 'mediaLibrary', newAsset.id), newAsset);
      updateExercise(picker.exIdx, picker.field as any, url);
      setPicker(null);
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Generate — above the weeks */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black font-display uppercase tracking-tight text-black">Program Board</h2>
          <p className="text-[11px] font-medium text-neutral-400">Drag days between weeks · tap a day to edit</p>
        </div>
        <button onClick={() => setIsAIOpen(true)} className="px-5 py-3 bg-gradient-to-r from-violet-600 to-accent text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg hover:shadow-accent/30 transition-all hover:-translate-y-0.5">
          <span className="material-symbols-outlined text-base">auto_awesome</span> AI Generate
        </button>
      </div>

      {/* Board */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={(e) => setActiveId(String(e.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar items-start">
          {weeks.map((week) => (
            <WeekColumn
              key={week.id}
              week={week}
              onAddDay={() => addDay(week.id)}
              onClone={() => cloneWeek(week.id)}
              onDelete={() => deleteWeek(week.id)}
              onOpenDay={(dayId) => setSelectedDayId(dayId)}
              onCloneDay={cloneDay}
              onDeleteDay={deleteDay}
            />
          ))}
          <button onClick={addWeek} className="shrink-0 w-60 self-stretch min-h-[160px] rounded-2xl border-2 border-dashed border-neutral-300 text-neutral-400 hover:border-accent hover:text-accent transition-colors flex flex-col items-center justify-center gap-2 mt-8">
            <span className="material-symbols-outlined text-2xl">add</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Add Week</span>
          </button>
        </div>
        <DragOverlay>
          {activeDayCard ? (
            <div className="w-56 bg-white border border-black rounded-2xl p-4 shadow-2xl rotate-3">
              <span className="text-[8px] font-black uppercase tracking-widest text-accent">Day {activeDayCard.dayNumber}</span>
              <p className="font-black uppercase text-sm text-black truncate">{activeDayCard.title || 'Untitled'}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Day detail editor modal */}
      {selectedDay && selectedLoc && (
        <div className="fixed inset-0 z-[9990] flex items-stretch md:items-center justify-center md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedDayId(null)}>
          <div className="bg-white w-full md:max-w-3xl md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-screen md:max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-neutral-100 flex items-start justify-between gap-4 bg-neutral-50/60">
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black uppercase text-accent">Week {weeks[selectedLoc.weekIdx].weekNumber} · Day {selectedDay.dayNumber}</span>
                <input type="text" value={selectedDay.title} onChange={(e) => mutateSelectedDay((d) => ({ ...d, title: e.target.value }))} className="block w-full text-xl md:text-2xl font-black uppercase text-black bg-transparent outline-none mt-1" placeholder="Day title" />
              </div>
              <button onClick={() => setSelectedDayId(null)} className="w-10 h-10 bg-white border border-neutral-100 rounded-xl flex items-center justify-center shrink-0 hover:bg-black hover:text-white transition-all"><span className="material-symbols-outlined">close</span></button>
            </div>

            <div className="px-6 py-4 border-b border-neutral-100 flex gap-2 flex-wrap">
              <button onClick={() => setPicker({ type: 'workout', exIdx: null })} className="px-4 py-2 bg-neutral-50 rounded-xl text-[9px] font-black uppercase border border-neutral-100 flex items-center gap-2"><span className="material-symbols-outlined text-base">library_add</span> Blueprint</button>
              <button onClick={addExercise} className="px-4 py-2 bg-black text-white rounded-xl text-[9px] font-black uppercase flex items-center gap-2"><span className="material-symbols-outlined text-base">add</span> Exercise</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
              {selectedDay.exercises.length === 0 && (
                <div className="text-center py-16 text-neutral-300">
                  <span className="material-symbols-outlined text-4xl">exercise</span>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-2">No exercises yet</p>
                </div>
              )}
              <DndContext sensors={exSensors} collisionDetection={closestCorners} onDragEnd={onExerciseDragEnd}>
                <SortableContext items={selectedDay.exercises.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-5">
                    {selectedDay.exercises.map((ex, exIdx) => (
                      <ExerciseEditor key={ex.id} ex={ex} exIdx={exIdx} updateExercise={updateExercise} removeExercise={removeExercise} openPicker={setPicker} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>
      )}

      {/* Exercise / Workout picker */}
      {picker && picker.type !== 'media' && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 text-left"><h3 className="text-xl font-black uppercase text-black">{picker.type === 'exercise' ? 'Exercises' : 'Workouts'}</h3><button onClick={() => setPicker(null)} className="w-10 h-10 bg-white border border-neutral-100 rounded-xl flex items-center justify-center"><span className="material-symbols-outlined">close</span></button></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {picker.type === 'exercise' ? exerciseLibrary.map((ex) => (
                <button key={ex.id} onClick={() => { if (picker.exIdx != null) { updateExercise(picker.exIdx, 'name', ex.name); updateExercise(picker.exIdx, 'format', ex.defaultFormat as any); } setPicker(null); }} className="w-full flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100 hover:border-black transition-all group text-left"><div><p className="text-sm font-black uppercase">{ex.name}</p><p className="text-[8px] font-bold text-neutral-400 uppercase">{ex.defaultFormat}</p></div><span className="material-symbols-outlined text-neutral-300 group-hover:text-black">add</span></button>
              )) : workoutLibrary.map((wo) => (
                <button key={wo.id} onClick={() => applyBlueprint(wo)} className="w-full flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100 hover:border-black transition-all group text-left"><div><p className="text-sm font-black uppercase">{wo.name}</p></div><span className="material-symbols-outlined text-neutral-300 group-hover:text-black">add</span></button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Media picker */}
      {picker && picker.type === 'media' && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 text-left">
              <h3 className="text-xl font-black uppercase tracking-tight">Library Gallery</h3>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer px-4 py-2 bg-black text-white rounded-xl text-[9px] font-black uppercase flex items-center gap-2">
                  {isUploading ? 'Uploading...' : <><span className="material-symbols-outlined text-base">upload</span> Upload New</>}
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                </label>
                <button onClick={() => setPicker(null)} className="w-10 h-10 rounded-xl bg-white border border-neutral-100 flex items-center justify-center shadow-sm"><span className="material-symbols-outlined">close</span></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-4 gap-4 no-scrollbar">
              {mediaLibrary.filter((a) => a.category === 'WORKOUT').map((asset) => (
                <div key={asset.id} onClick={() => { if (picker.exIdx != null) updateExercise(picker.exIdx, picker.field as any, asset.data); setPicker(null); }} className="aspect-square rounded-2xl overflow-hidden border border-neutral-100 bg-neutral-50 cursor-pointer hover:ring-2 hover:ring-accent transition-all relative group">
                  {asset.type === 'video' || asset.data.includes('.mp4') ? (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-900"><span className="material-symbols-outlined text-white text-3xl">videocam</span></div>
                  ) : (
                    <img src={asset.data} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><span className="text-[8px] font-black uppercase text-white tracking-widest px-3 py-1.5 bg-accent rounded-full">Apply</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isAIOpen && (
        <AICourseGenerator context="course" currentWeeks={weeks} onGenerated={(generatedWeeks: WeekProgram[]) => setWeeks(generatedWeeks)} onClose={() => setIsAIOpen(false)} />
      )}
    </div>
  );
};

export default CourseWeekBoard;
