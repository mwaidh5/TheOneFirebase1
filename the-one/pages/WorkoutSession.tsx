
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Course, Exercise, WeekProgram, DayProgram, User } from '../types';
import { logEvent } from '../hooks/useLogEvent';

interface WorkoutSessionProps {
  courses?: Course[];
  currentUser: User;
}

// ─── Timer Hook (wall-clock based — survives phone lock & tab switching) ───────
const TIMER_KEY = 'theone_session_start_ts';
const TIMER_PAUSED_KEY = 'theone_session_paused_at';
const TIMER_ACCUMULATED_KEY = 'theone_session_accumulated_ms';

function useSessionTimer(isRunning: boolean) {
  const [elapsed, setElapsed] = useState<number>(() => {
    // On mount, recover elapsed time from localStorage if a session was in progress
    const startTs = localStorage.getItem(TIMER_KEY);
    const accumulated = Number(localStorage.getItem(TIMER_ACCUMULATED_KEY) || '0');
    const pausedAt = localStorage.getItem(TIMER_PAUSED_KEY);
    if (startTs) {
      if (pausedAt) {
        // Was paused — return accumulated seconds at pause point
        return Math.floor(accumulated / 1000);
      }
      // Was running — compute how long has elapsed since start
      const bonus = Date.now() - Number(startTs);
      return Math.floor((accumulated + bonus) / 1000);
    }
    return 0;
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fmt = (s: number) => {
    const hh = String(Math.floor(s / 3600)).padStart(2, '0');
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (isRunning) {
      // Mark the start of the current running window
      if (!localStorage.getItem(TIMER_KEY)) {
        localStorage.setItem(TIMER_KEY, String(Date.now()));
      }
      // Clear any pause marker
      localStorage.removeItem(TIMER_PAUSED_KEY);

      // Every second, re-derive elapsed from wall-clock (never drifts)
      intervalRef.current = setInterval(() => {
        const startTs = Number(localStorage.getItem(TIMER_KEY) || Date.now());
        const accumulated = Number(localStorage.getItem(TIMER_ACCUMULATED_KEY) || '0');
        const totalMs = accumulated + (Date.now() - startTs);
        setElapsed(Math.floor(totalMs / 1000));
      }, 1000);
    }

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  // When paused: snapshot the accumulated time and clear the running start
  const pauseTimer = () => {
    const startTs = localStorage.getItem(TIMER_KEY);
    if (startTs) {
      const accumulated = Number(localStorage.getItem(TIMER_ACCUMULATED_KEY) || '0');
      const totalMs = accumulated + (Date.now() - Number(startTs));
      localStorage.setItem(TIMER_ACCUMULATED_KEY, String(totalMs));
      localStorage.removeItem(TIMER_KEY);
      localStorage.setItem(TIMER_PAUSED_KEY, '1');
    }
  };

  // When resuming from pause: set a fresh start timestamp
  const resumeTimer = () => {
    localStorage.setItem(TIMER_KEY, String(Date.now()));
    localStorage.removeItem(TIMER_PAUSED_KEY);
  };

  const reset = () => {
    localStorage.removeItem(TIMER_KEY);
    localStorage.removeItem(TIMER_PAUSED_KEY);
    localStorage.removeItem(TIMER_ACCUMULATED_KEY);
    setElapsed(0);
  };

  // Derived elapsed from latest state
  const elapsedRef = { current: elapsed };

  return { display: fmt(elapsed), elapsed, reset, elapsedRef, fmt, pauseTimer, resumeTimer };
}

// ─── Superset Grouping ─────────────────────────────────────────────────────────
interface SupersetGroup { type: 'superset'; ids: string[]; groupKey: string; }
interface SingleExercise { type: 'single'; id: string; }
type ExerciseBlock = SupersetGroup | SingleExercise;

function groupExercises(exercises: Exercise[]): ExerciseBlock[] {
  const blocks: ExerciseBlock[] = [];
  let i = 0;
  while (i < exercises.length) {
    const ex = exercises[i];
    if (ex.format === 'SUPER_SET') {
      const groupKey = ex.supersetId || `auto_ss_${i}`;
      const ids: string[] = [ex.id];
      let j = i + 1;
      while (j < exercises.length) {
        const next = exercises[j];
        if (next.format !== 'SUPER_SET') break;
        const nextKey = next.supersetId || null;
        if (ex.supersetId && nextKey !== ex.supersetId) break;
        if (!ex.supersetId && next.supersetId) break;
        ids.push(next.id);
        j++;
      }
      if (ids.length > 1) {
        blocks.push({ type: 'superset', ids, groupKey });
        i = j;
      } else {
        blocks.push({ type: 'single', id: ex.id });
        i++;
      }
    } else {
      blocks.push({ type: 'single', id: ex.id });
      i++;
    }
  }
  return blocks;
}

const WorkoutSession: React.FC<WorkoutSessionProps> = ({ courses = [], currentUser }) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const course = useMemo(() => courses.find(c => c.id === id), [id, courses]);

  // ── Navigation State ────────────────────────────────────────────────────────
  const [view, setView] = useState<'weeks' | 'days' | 'exercises' | 'meal'>('weeks');
  const [selectedWeek, setSelectedWeek] = useState<WeekProgram | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayProgram | null>(null);

  // ── Workout started flag ────────────────────────────────────────────────────
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  // finalTime stores the elapsed seconds when the session was finished (for display after done)
  const [finalTime, setFinalTime] = useState<number | null>(null);

  // ── Video popup state ───────────────────────────────────────────────────────
  const [videoPopupUrl, setVideoPopupUrl] = useState<string | null>(null);

  // ── UI States ───────────────────────────────────────────────────────────────
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Tracking State ──────────────────────────────────────────────────────────
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [completedWeeks, setCompletedWeeks] = useState<Set<string>>(new Set());

  // ── Active exercise ─────────────────────────────────────────────────────────
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);

  // ── Previous lift logs ──────────────────────────────────────────────────────
  const [prevLifts, setPrevLifts] = useState<Record<string, string>>({});

  // ── Log Data ────────────────────────────────────────────────────────────────
  const [logData, setLogData] = useState<{
    results: Record<string, string>;
    notes: string;
    rpe: number;
  }>({ results: {}, notes: '', rpe: 7 });

  // ── Timer — ticks when workoutStarted AND NOT paused ───────────────────────
  const { display: timerDisplay, elapsed: timerElapsed, reset: resetTimer, fmt: fmtTime, pauseTimer, resumeTimer } = useSessionTimer(workoutStarted && !isPaused);

  // ─── Load Progress ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser || !course) return;
    const progressRef = doc(db, 'users', currentUser.id, 'progress', course.id);
    const unsub = onSnapshot(progressRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.completedExercises) setCompletedExercises(new Set(data.completedExercises));
        if (data.completedDays) setCompletedDays(new Set(data.completedDays));
        if (data.completedWeeks) setCompletedWeeks(new Set(data.completedWeeks));
      }
    });
    return () => unsub();
  }, [currentUser, course]);

  // ─── Load Previous Lifts ────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser || !course || !selectedDay) return;
    const logKey = `${course.id}_${selectedWeek?.weekNumber ?? 0}_${selectedDay.id}`;
    const logRef = doc(db, 'users', currentUser.id, 'workout_logs', logKey);
    const unsub = onSnapshot(logRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPrevLifts(data.results || {});
      } else {
        setPrevLifts({});
      }
    });
    return () => unsub();
  }, [currentUser, course, selectedDay, selectedWeek]);

  // ─── Set initial active exercise when workout starts ────────────────────────
  useEffect(() => {
    if (!workoutStarted || !selectedDay) { setActiveExerciseId(null); return; }
    const firstUncompleted = selectedDay.exercises.find(ex => !completedExercises.has(ex.id));
    setActiveExerciseId(firstUncompleted?.id ?? null);
  }, [workoutStarted, selectedDay]);

  // ─── Reset workout started state when navigating away from exercises ─────────
  useEffect(() => {
    if (view !== 'exercises') {
      setWorkoutStarted(false);
      resetTimer();
    }
  }, [view]);

  const saveProgress = async (type: 'exercises' | 'days' | 'weeks', newSet: Set<string>) => {
    if (!currentUser || !course) return;
    const progressRef = doc(db, 'users', currentUser.id, 'progress', course.id);
    const updateData: any = {};
    if (type === 'exercises') updateData.completedExercises = Array.from(newSet);
    if (type === 'days') updateData.completedDays = Array.from(newSet);
    if (type === 'weeks') updateData.completedWeeks = Array.from(newSet);
    try { await setDoc(progressRef, updateData, { merge: true }); }
    catch (e) { console.error("Error saving progress", e); }
  };

  // Handle direct navigation from Curriculum links
  useEffect(() => {
    if (!course) return;
    const params = new URLSearchParams(location.search);
    const weekNum = params.get('week');
    if (weekNum && course.weeks) {
      const week = course.weeks.find(w => w.weekNumber === parseInt(weekNum));
      if (week) { setSelectedWeek(week); setView('days'); }
    }
  }, [location.search, course]);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-bold text-neutral-400 uppercase tracking-widest text-xs">Loading Course Data...</p>
          <Link to="/profile/courses" className="text-xs font-black uppercase underline">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  const handleStartWorkout = () => {
    resetTimer(); // clears any leftover localStorage state
    setIsPaused(false);
    setFinalTime(null);
    setWorkoutStarted(true);
    // Seed the wall-clock start timestamp for the new session
    localStorage.setItem(TIMER_KEY, String(Date.now()));
    localStorage.removeItem(TIMER_PAUSED_KEY);
    localStorage.removeItem(TIMER_ACCUMULATED_KEY);
    if (selectedDay) {
      const firstUncompleted = selectedDay.exercises.find(ex => !completedExercises.has(ex.id));
      setActiveExerciseId(firstUncompleted?.id ?? null);
    }
  };

  const handlePauseResume = () => {
    setIsPaused(p => {
      if (!p) {
        // Going from running → paused
        pauseTimer();
      } else {
        // Going from paused → running
        resumeTimer();
      }
      return !p;
    });
  };

  const toggleExercise = (exId: string) => {
    const next = new Set<string>(completedExercises);
    const wasCompleted = next.has(exId);
    if (wasCompleted) next.delete(exId);
    else next.add(exId);
    setCompletedExercises(next);
    saveProgress('exercises', next);

    // Auto-advance to next uncompleted
    if (!wasCompleted && selectedDay && workoutStarted) {
      const nextUncompleted = selectedDay.exercises.find(ex => !next.has(ex.id));
      setActiveExerciseId(nextUncompleted?.id ?? null);
    }
  };

  const toggleDayFinished = async (dayId: string) => {
    const next = new Set<string>(completedDays);
    const isFinishing = !next.has(dayId);
    if (isFinishing) {
      next.add(dayId);
      const captured = timerElapsed; // capture before stopping
      setFinalTime(captured);
      // Mark ALL exercises green
      if (selectedDay) {
        const nextEx = new Set<string>(completedExercises);
        selectedDay.exercises.forEach(ex => nextEx.add(ex.id));
        setCompletedExercises(nextEx);
        saveProgress('exercises', nextEx);
      }
      // Stop the timer
      setWorkoutStarted(false);
      setIsPaused(false);

      // ── Write profile stats to Firestore ──────────────────────────────────
      try {
        const now = new Date();
        const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const userRef = doc(db, 'users', currentUser.id);
        const mins = Math.round(captured / 60);
        // activity chart: map Sunday=6, Mon=0...Sat=5
        const todayIdx = now.getDay();
        const chartIdx = todayIdx === 0 ? 6 : todayIdx - 1;
        const dayLabels = ['M','T','W','T','F','S','S'];
        // Build a fresh chart array to merge
        const chartUpdate: {name:string; val:number}[] = dayLabels.map((name, i) => ({name, val: i === chartIdx ? 80 : 0}));
        const prevWorkouts = (currentUser as any).workoutsCompleted ?? 0;
        const prevMins = (currentUser as any).minutesLogged ?? 0;
        await setDoc(userRef, {
          workoutsCompleted: prevWorkouts + 1,
          minutesLogged: prevMins + mins,
          lastWorkoutDate: now.toISOString().split('T')[0],
          lastWorkoutDayName: dayNames[now.getDay()],
          activityChart: chartUpdate,
        }, { merge: true });
      } catch (err) { console.error('Error updating profile stats', err); }

        // Log workout completion to system_logs
        logEvent({
          type: 'WORKOUT_COMPLETE',
          title: 'Session Completed',
          description: `${currentUser.firstName} ${currentUser.lastName} finished "${selectedDay?.title}" (${course.title} · Wk ${selectedWeek?.weekNumber ?? 1}).`,
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          userEmail: currentUser.email,
          userAvatar: (currentUser as any).avatar,
          meta: { courseId: course.id, courseTitle: course.title, weekNumber: selectedWeek?.weekNumber, dayTitle: selectedDay?.title, durationSeconds: captured },
        });
    } else {
      // UNDO: untick all exercises for this day and restart timer
      next.delete(dayId);
      setFinalTime(null);
      if (selectedDay) {
        const nextEx = new Set<string>(completedExercises);
        selectedDay.exercises.forEach(ex => nextEx.delete(ex.id));
        setCompletedExercises(nextEx);
        saveProgress('exercises', nextEx);
      }
      // Restart timer from zero
      resetTimer();
      setIsPaused(false);
      setWorkoutStarted(true);
    }
    setCompletedDays(next);
    saveProgress('days', next);
  };

  const toggleWeekFinished = (weekId: string) => {
    const next = new Set<string>(completedWeeks);
    if (next.has(weekId)) next.delete(weekId);
    else next.add(weekId);
    setCompletedWeeks(next);
    saveProgress('weeks', next);
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // NOTE: Logging does NOT stop the session or mark exercises done.
    // It only saves the weight/intensity data the user entered.
    if (selectedDay) {
      try {
        const now = new Date();
        const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const logKey = `${course.id}_${selectedWeek?.weekNumber ?? 0}_${selectedDay.id}`;
        const logRef = doc(db, 'users', currentUser.id, 'workout_logs', logKey);
        await setDoc(logRef, {
          courseId: course.id,
          courseTitle: course.title,
          weekNum: selectedWeek?.weekNumber ?? 0,
          dayId: selectedDay.id,
          dayTitle: selectedDay.title,
          dayNumber: selectedDay.dayNumber,
          loggedAt: now.getTime(),
          loggedDate: now.toISOString().split('T')[0],
          loggedDayName: dayNames[now.getDay()],
          rpe: logData.rpe,
          results: logData.results,
          durationSeconds: timerElapsed,
        }, { merge: true });
      } catch (err) { console.error("Error saving workout log", err); }
    }

    setIsSubmitting(false);
    setIsLogModalOpen(false);
  };

  const isDayNaturallyDone = (day: DayProgram) =>
    day.exercises.length > 0 && day.exercises.every(ex => completedExercises.has(ex.id));
  const isDayMarkedDone = (day: DayProgram) =>
    completedDays.has(day.id) || isDayNaturallyDone(day);
  const isWeekNaturallyDone = (week: WeekProgram) =>
    week.days.every(day => isDayMarkedDone(day));

  // ─── Exercise Card ──────────────────────────────────────────────────────────
  const renderExerciseCard = (item: Exercise, isInSuperset: boolean = false, isThisGroupActive: boolean = false) => {
    const isDone = completedExercises.has(item.id);
    const isActive = workoutStarted && (activeExerciseId === item.id || (isInSuperset && isThisGroupActive && !isDone));
    const isSuperSet = item.format === 'SUPER_SET';
    const isEmom = item.format === 'EMOM' || item.format === 'AMRAP' || item.format === 'HIIT';
    const isCardio = item.format === 'CARDIO' || item.format === 'FOR_TIME';
    const prevLift = prevLifts[item.id];
    const hasVideo = !!item.videoUrl;
    const hasImage = !!item.imageUrl;

    let statsToRender = [
      { label: 'SETS', val: item.sets || '1' },
      { label: 'REPS', val: item.reps || '-' },
      { label: 'REST', val: item.rest || 'N/A' }
    ];
    if (isCardio) {
      statsToRender = [
        { label: 'DISTANCE', val: item.distance || '-' },
        { label: 'TIME CAP', val: item.time || '-' },
        { label: 'PACE/CALS', val: item.speed || (item.calories ? String(item.calories) : '-') }
      ];
    } else if (isEmom) {
      statsToRender = [
        { label: 'ROUNDS', val: String(item.rounds || '-') },
        { label: 'TOTAL TIME', val: item.durationMinutes ? `${item.durationMinutes}m` : '-' },
        { label: 'WORK/REST', val: item.workInterval ? `${item.workInterval}/${item.restInterval}` : '-' }
      ];
    }

    const activeRingClass = isActive && !isDone
      ? 'ring-2 ring-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.35)]'
      : '';

    let cardBorderClass = isDone
      ? 'border-green-300 bg-green-50/10'
      : isInSuperset
        ? `border-purple-200 bg-purple-50/20 ${activeRingClass}`
        : isEmom
          ? `border-orange-200 bg-orange-50/10 ${activeRingClass}`
          : isCardio
            ? `border-blue-200 bg-blue-50/20 ${activeRingClass}`
            : `border-neutral-100 shadow-sm ${activeRingClass}`;

    return (
      <div key={item.id} className={`bg-white rounded-3xl border transition-all overflow-hidden ${cardBorderClass}`} style={{ position: 'relative' }}>
        {/* Cardio left stripe */}
        {isCardio && !isDone && (
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-400 rounded-l-3xl"></div>
        )}

        {/* Active NOW badge */}
        {isActive && !isDone && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-amber-400 text-black px-2.5 py-1 rounded-full shadow-lg">
            <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">NOW</span>
          </div>
        )}

        {/* Left accent for superset */}
        {isInSuperset && (
          <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-3xl transition-colors ${isThisGroupActive && !isDone ? 'bg-amber-400' : isDone ? 'bg-green-400' : 'bg-purple-400'}`}></div>
        )}

        <div className="p-5 flex gap-4">
          {/* ── Left: Check + Info ────────────────────────────── */}
          <div className="flex flex-col gap-4 flex-1 min-w-0">
            <div className="flex items-start gap-4">
              {/* Check button */}
              <button
                onClick={() => toggleExercise(item.id)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-md shrink-0 border mt-1 ${isDone
                  ? 'bg-green-500 border-green-500 text-white'
                  : isActive
                    ? 'bg-amber-400 border-amber-400 text-black hover:bg-amber-500'
                    : 'bg-white border-neutral-100 text-neutral-200 hover:border-black'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-4 ${isDone ? 'bg-white border-white' : isActive ? 'border-black' : 'border-neutral-100'}`}></div>
              </button>

              {/* Title + format */}
              <div className="flex-1 min-w-0 pt-1">
                <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-0.5 ${isSuperSet ? 'text-purple-500' : isEmom ? 'text-orange-500' : isCardio ? 'text-blue-500' : 'text-neutral-300'}`}>
                  {item.format.replace('_', ' ')}{isSuperSet && item.supersetId ? ` · ${item.supersetId}` : ''}
                </p>
                <h3 className={`text-xl md:text-2xl font-black uppercase leading-tight font-display ${isDone ? 'text-green-800' : 'text-black'}`}>
                  {item.name}
                </h3>
              </div>

              {/* Video button — only if video exists */}
              {hasVideo && (
                <button
                  onClick={() => setVideoPopupUrl(item.videoUrl!)}
                  className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center hover:bg-accent transition-all shadow-lg shrink-0 mt-1"
                  title="Watch video demo"
                >
                  <span className="material-symbols-outlined text-base">play_circle</span>
                </button>
              )}
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-2">
              {statsToRender.map(stat => (
                <div key={stat.label} className={`bg-neutral-50/80 rounded-lg py-2 px-3 text-center border ${isSuperSet ? 'border-purple-100' : isCardio ? 'border-blue-100' : 'border-neutral-100'}`}>
                  <p className="text-[7px] uppercase font-black text-neutral-400 tracking-[0.2em] mb-0.5">{stat.label}</p>
                  <p className="text-sm font-black text-black leading-none">{stat.val}</p>
                </div>
              ))}
            </div>

            {/* Coach cue */}
            {item.description && (
              <p className="text-[11px] font-medium text-neutral-400 leading-relaxed italic border-l-2 border-neutral-200 pl-3">
                {item.description}
              </p>
            )}

            {/* Previous lift chip */}
            {prevLift && (
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs text-neutral-400">history</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Last:</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-accent">{prevLift}</span>
              </div>
            )}
          </div>

          {/* ── Right: Image (always shown) ──────────────────── */}
          {hasImage && (
            <div className="w-28 sm:w-36 shrink-0 self-stretch">
              <div className="h-full min-h-[120px] rounded-2xl overflow-hidden bg-neutral-100 relative">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                {/* Subtle overlay label */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                  <p className="text-[6px] font-black uppercase tracking-widest text-white/80 leading-none">Reference</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Render Exercise Blocks ─────────────────────────────────────────────────
  const renderExerciseBlocks = (exercises: Exercise[]) => {
    const blocks = groupExercises(exercises);
    const exMap = new Map(exercises.map(ex => [ex.id, ex]));

    return blocks.map((block) => {
      if (block.type === 'single') {
        const ex = exMap.get(block.id)!;
        return <React.Fragment key={ex.id}>{renderExerciseCard(ex, false, false)}</React.Fragment>;
      }

      // Superset group
      const groupExs = block.ids.map(bid => exMap.get(bid)!).filter(Boolean);
      const allDone = groupExs.every(ex => completedExercises.has(ex.id));
      const firstUncompleted = exercises.find(ex => !completedExercises.has(ex.id));
      const isThisGroupActive = workoutStarted && !allDone && !!firstUncompleted && groupExs.some(ex => ex.id === firstUncompleted.id);

      return (
        <div key={block.groupKey} className="relative">
          {/* Superset label */}
          <div className="flex items-center gap-2 mb-2 pl-1">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] transition-all border ${
              isThisGroupActive ? 'bg-amber-100 text-amber-700 border-amber-300'
              : allDone ? 'bg-green-100 text-green-700 border-green-300'
              : 'bg-purple-100 text-purple-700 border-purple-200'
            }`}>
              <span className="material-symbols-outlined text-xs">link</span>
              Superset · {groupExs.length} Exercises
              {isThisGroupActive && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse ml-1"></span>}
            </div>
          </div>

          {/* Bracket + cards */}
          <div className="flex gap-0">
            {/* Left bracket */}
            <div className="flex flex-col items-center pr-3" style={{ width: '28px', flexShrink: 0 }}>
              <div className={`w-4 h-4 border-l-4 border-t-4 rounded-tl-lg mt-1 transition-colors ${isThisGroupActive ? 'border-amber-400' : allDone ? 'border-green-400' : 'border-purple-400'}`}></div>
              <div className={`flex-1 min-h-[20px] transition-colors ${isThisGroupActive ? 'bg-amber-400' : allDone ? 'bg-green-400' : 'bg-purple-400'}`} style={{ width: '4px' }}></div>
              <div className={`w-4 h-4 border-l-4 border-b-4 rounded-bl-lg mb-1 transition-colors ${isThisGroupActive ? 'border-amber-400' : allDone ? 'border-green-400' : 'border-purple-400'}`}></div>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-3">
              {groupExs.map(ex => renderExerciseCard(ex, true, isThisGroupActive))}
            </div>
          </div>
        </div>
      );
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white min-h-screen text-left animate-in fade-in duration-500">

      {/* ── Video Popup Modal ──────────────────────────────────────────────── */}
      {videoPopupUrl && (
        <div
          className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200"
          onClick={() => setVideoPopupUrl(null)}
        >
          <div className="relative w-full max-w-3xl" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setVideoPopupUrl(null)}
              className="absolute -top-12 right-0 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <video
                src={videoPopupUrl}
                autoPlay
                loop
                controls
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-center text-white/40 text-[9px] font-black uppercase tracking-widest mt-4">
              Click outside to close
            </p>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-neutral-50/50 border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="space-y-4 max-w-2xl">
              <nav className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                <Link to="/profile/courses" className="hover:text-black transition-colors">Courses</Link>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
                <button onClick={() => setView('weeks')} className="hover:text-black transition-colors truncate">{course.title}</button>
                {view !== 'weeks' && view !== 'meal' && selectedWeek && (
                  <>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    <button onClick={() => setView('days')} className="hover:text-black transition-colors">Wk {selectedWeek.weekNumber}</button>
                  </>
                )}
                {view === 'exercises' && selectedDay && (
                  <>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    <span className="text-black truncate">{selectedDay.title}</span>
                  </>
                )}
                {view === 'meal' && (
                  <>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                    <span className="text-black">Nutrition</span>
                  </>
                )}
              </nav>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight text-black uppercase leading-tight">
                  {view === 'weeks' ? 'Training Hub'
                    : view === 'meal' ? 'Nutrition Plan'
                    : view === 'days' ? `Week ${selectedWeek?.weekNumber} Overview`
                    : selectedDay?.title}
                </h1>
                {view === 'exercises' && selectedDay && isDayMarkedDone(selectedDay) && (
                  <span className="bg-green-500 text-white px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1 shrink-0 h-fit">
                    <span className="material-symbols-outlined text-xs filled">check</span> Done
                  </span>
                )}
              </div>
              <p className="text-neutral-500 text-base md:text-lg leading-relaxed font-medium">
                {view === 'weeks' ? "Select a phase to continue your progression."
                  : view === 'meal' ? "Fuel your performance."
                  : "Track your intensity and log every successful set."}
              </p>
            </div>
            {course.hasMealPlan && view === 'weeks' && (
              <button
                onClick={() => setView('meal')}
                className="px-6 py-4 bg-white border border-neutral-200 rounded-2xl flex items-center gap-3 hover:border-black transition-all shadow-sm group"
              >
                <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center text-white group-hover:bg-accent transition-colors">
                  <span className="material-symbols-outlined">restaurant</span>
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Nutrition</p>
                  <p className="text-sm font-black text-black uppercase">View Meal Plan</p>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ── WEEKS VIEW ─────────────────────────────────────────────────────── */}
        {view === 'weeks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(course.weeks || []).map((week) => {
              const isFinished = completedWeeks.has(week.id) || isWeekNaturallyDone(week);
              return (
                <div
                  key={week.id}
                  onClick={() => { setSelectedWeek(week); setView('days'); }}
                  className={`p-8 rounded-3xl border transition-all cursor-pointer group relative overflow-hidden flex flex-col gap-6 ${isFinished ? 'bg-green-50/30 border-green-200' : 'bg-white border-neutral-100 hover:border-black shadow-sm hover:shadow-xl'}`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shadow-lg transition-colors ${isFinished ? 'bg-green-500 text-white' : 'bg-black text-white'}`}>
                      {week.weekNumber}
                    </span>
                    {isFinished && (
                      <div className="w-9 h-9 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg">
                        <span className="material-symbols-outlined text-base filled">check</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 text-left">
                    <h3 className="text-xl font-black uppercase text-black font-display tracking-tight">Week {week.weekNumber}</h3>
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{week.days.length} Training Sessions</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleWeekFinished(week.id); }}
                    className={`mt-auto px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isFinished ? 'bg-green-100 text-green-700' : 'bg-neutral-50 text-neutral-400 hover:bg-black hover:text-white'}`}
                  >
                    <span className="material-symbols-outlined text-sm">{isFinished ? 'check_circle' : 'circle'}</span>
                    {isFinished ? 'Week Finished' : 'Mark as Finished'}
                  </button>
                  <span className={`material-symbols-outlined text-[120px] absolute -bottom-8 -right-8 select-none opacity-30 group-hover:rotate-12 transition-transform ${isFinished ? 'text-green-500/10' : 'text-neutral-50'}`}>event_available</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── MEAL PLAN VIEW ─────────────────────────────────────────────────── */}
        {view === 'meal' && course.mealPlan && (
          <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
            <div className="bg-white rounded-[3rem] border border-neutral-100 p-10 shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                <h2 className="text-3xl font-black uppercase font-display tracking-tight">{course.mealPlan.name}</h2>
                <div className="flex gap-4">
                  <span className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest">{course.mealPlan.totalCalories} kcal</span>
                </div>
                <p className="text-neutral-500 font-medium max-w-2xl">{course.mealPlan.description || "A balanced nutrition plan designed to support your training volume."}</p>
              </div>
              <span className="material-symbols-outlined text-[200px] absolute -bottom-10 -right-10 text-neutral-50 rotate-12 select-none">restaurant</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {course.mealPlan.meals.map((meal, i) => (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6">
                  <h3 className="text-xl font-black uppercase">{meal.label}</h3>
                  <div className="space-y-4">
                    {meal.items.map((item, ii) => (
                      <div key={ii} className="flex justify-between items-center p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                        <div>
                          <p className="font-bold text-black text-sm">{item.name}</p>
                          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{item.amount}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-black text-sm">{item.calories}</p>
                          <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest">kcal</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DAYS VIEW ──────────────────────────────────────────────────────── */}
        {view === 'days' && selectedWeek && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('weeks')} className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-400 hover:text-black hover:bg-white transition-all">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h2 className="text-xl font-black uppercase text-black font-display tracking-tight">Select Training Day</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedWeek.days.map((day) => {
                const isDayDone = isDayMarkedDone(day);
                return (
                  <div
                    key={day.id}
                    onClick={() => { setSelectedDay(day); setView('exercises'); }}
                    className={`flex items-center justify-between p-6 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${isDayDone ? 'bg-green-50/50 border-green-200' : 'bg-white border-neutral-100 hover:border-black shadow-sm'}`}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black shadow-md transition-colors ${isDayDone ? 'bg-green-500 text-white' : 'bg-neutral-900 text-white'}`}>
                        {day.dayNumber}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black uppercase text-black leading-none">{day.title}</h4>
                          {isDayDone && <span className="bg-green-500 text-white px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest">Done</span>}
                        </div>
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-1">{day.exercises.length} Movements</p>
                      </div>
                    </div>
                    {isDayDone
                      ? <span className="material-symbols-outlined text-green-500 filled text-2xl relative z-10">check_circle</span>
                      : <span className="material-symbols-outlined text-neutral-300 group-hover:text-black transition-colors text-2xl relative z-10">arrow_circle_right</span>
                    }
                    {isDayDone && <span className="material-symbols-outlined text-8xl absolute -bottom-2 -right-2 text-green-500/5 select-none -rotate-12">task_alt</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── EXERCISES VIEW ─────────────────────────────────────────────────── */}
        {view === 'exercises' && selectedDay && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-right-4 duration-500">

            {/* Left: Exercise list — on mobile shows AFTER sidebar (order-2) */}
            <div className="lg:col-span-8 space-y-5 order-2 lg:order-1">
              <div className="flex items-center justify-between">
                <button onClick={() => setView('days')} className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest hover:text-black">
                  <span className="material-symbols-outlined text-sm">arrow_back</span> Back to Week
                </button>
              </div>
              {renderExerciseBlocks(selectedDay.exercises)}

              {/* ── Bottom action bar ───────────────────────────────────── */}
              <div className="pt-2 space-y-3">
                {isDayMarkedDone(selectedDay) ? (
                  <div className="flex items-center justify-between gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-green-500 filled text-2xl">check_circle</span>
                      <div>
                        <p className="text-sm font-black uppercase text-green-800">Session Complete!</p>
                        <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest">All movements finished.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleDayFinished(selectedDay.id)}
                      className="shrink-0 px-3 py-2 bg-white border border-green-200 text-green-700 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">undo</span>
                      Undo
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => toggleDayFinished(selectedDay.id)}
                    className="w-full py-5 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-neutral-800 transition-all shadow-2xl"
                  >
                    <span className="material-symbols-outlined text-lg">task_alt</span>
                    Finish Session
                  </button>
                )}
                <button
                  onClick={() => setIsLogModalOpen(true)}
                  className="w-full py-3.5 bg-accent text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-accent/20"
                >
                  <span className="material-symbols-outlined text-sm">edit_note</span>
                  Log Workout Weights &amp; Intensity
                </button>
                <button
                  onClick={() => navigate(`/profile/messages?coachId=c1`)}
                  className="w-full py-3 bg-neutral-50 border border-neutral-100 text-neutral-500 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black hover:text-white hover:border-black transition-all"
                >
                  <span className="material-symbols-outlined text-sm">chat</span>
                  Message Coach
                </button>
              </div>
            </div>

            {/* Right: Sidebar — on mobile shows FIRST (order-1) */}
            <div className="lg:col-span-4 space-y-5 order-1 lg:order-2">

              {/* ── Timer / Start card ──────────────────────────── */}
              <div className={`p-6 rounded-3xl text-white shadow-2xl relative overflow-hidden transition-all duration-500 ${workoutStarted ? (isPaused ? 'bg-amber-900' : 'bg-neutral-900') : finalTime !== null ? 'bg-green-900' : 'bg-neutral-800'}`}>
                <div className="relative z-10 space-y-4">
                  {workoutStarted ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-green-400 animate-pulse'}`}></span>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">{isPaused ? 'Paused' : 'Session Live'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handlePauseResume}
                            className="text-[8px] font-black uppercase tracking-widest text-white/50 hover:text-white/90 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
                          >
                            <span className="material-symbols-outlined text-xs">{isPaused ? 'play_arrow' : 'pause'}</span>
                            {isPaused ? 'Resume' : 'Pause'}
                          </button>
                          <button
                            onClick={() => { resetTimer(); setIsPaused(false); }}
                            className="text-[8px] font-black uppercase tracking-widest text-white/30 hover:text-white/70 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
                          >
                            <span className="material-symbols-outlined text-xs">restart_alt</span>
                            Reset
                          </button>
                        </div>
                      </div>
                      <div className="font-black text-5xl tracking-tight text-white tabular-nums">
                        {timerDisplay}
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/30">{isPaused ? 'Timer Paused' : 'Time Elapsed'}</p>
                    </>
                  ) : finalTime !== null ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-400 text-base filled">check_circle</span>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Session Complete</p>
                      </div>
                      <div className="font-black text-5xl tracking-tight text-white tabular-nums">
                        {fmtTime(finalTime)}
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Final Session Time</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Ready to Train?</p>
                      <div className="font-black text-4xl tracking-tight text-white/20 tabular-nums">00:00:00</div>
                      <button
                        onClick={handleStartWorkout}
                        className="w-full py-3.5 bg-accent hover:bg-blue-500 text-white rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent/30 mt-2"
                      >
                        <span className="material-symbols-outlined text-lg">play_arrow</span>
                        Start Workout
                      </button>
                    </>
                  )}
                </div>
                <span className="material-symbols-outlined text-[100px] absolute -bottom-6 -right-4 text-white/3 select-none">timer</span>
              </div>

              {/* ── Session Summary ─────────────────────────────── */}
              <div className={`p-6 rounded-3xl text-white shadow-2xl relative overflow-hidden transition-colors duration-500 ${isDayMarkedDone(selectedDay) ? 'bg-green-600' : 'bg-black'}`}>
                <div className="relative z-10 space-y-4">
                  <h3 className="text-base font-black uppercase font-display leading-tight">Session Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Movements Done</span>
                      <span className="text-lg font-black text-white">
                        {selectedDay.exercises.filter(ex => completedExercises.has(ex.id)).length} / {selectedDay.exercises.length}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all duration-1000"
                        style={{ width: `${(selectedDay.exercises.filter(ex => completedExercises.has(ex.id)).length / (selectedDay.exercises.length || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Up Next — only when workout started */}
                  {workoutStarted && activeExerciseId && (
                    <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                      <p className="text-[7px] font-black uppercase tracking-widest text-white/40 mb-1">Up Next</p>
                      <p className="text-sm font-black uppercase text-amber-300 leading-tight">
                        {selectedDay.exercises.find(ex => ex.id === activeExerciseId)?.name ?? '—'}
                      </p>
                    </div>
                  )}
                </div>
                <span className="material-symbols-outlined text-9xl absolute -bottom-6 -right-6 text-white/5 rotate-12">checklist</span>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ── Workout Log Modal ──────────────────────────────────────────────── */}
      {isLogModalOpen && selectedDay && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[95vh]">
            <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
              <div className="text-left space-y-1">
                <p className="text-[9px] font-black text-accent uppercase tracking-[0.2em]">Log Your Effort</p>
                <h3 className="text-xl md:text-2xl font-black font-display uppercase text-black leading-none">{selectedDay.title}</h3>
              </div>
              <div className="flex items-center gap-4">
                {workoutStarted && (
                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Session Time</p>
                    <p className="text-xl font-black tabular-nums text-black">{timerDisplay}</p>
                  </div>
                )}
                <button
                  onClick={() => setIsLogModalOpen(false)}
                  className="w-10 h-10 bg-white border border-neutral-100 rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm group"
                >
                  <span className="material-symbols-outlined group-hover:rotate-90 transition-transform text-base">close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 no-scrollbar text-left">
              <form onSubmit={handleLogSubmit} className="space-y-8">
                <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400 border-l-2 border-black pl-3">Movement Intelligence</h4>
                  <div className="grid gap-3">
                    {selectedDay.exercises.map((ex) => (
                      <div key={ex.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                        <div className="md:col-span-4">
                          <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest mb-0.5">{ex.format}</p>
                          <p className="text-base font-black text-black uppercase leading-none">{ex.name}</p>
                          {prevLifts[ex.id] && (
                            <p className="text-[8px] font-black text-accent uppercase tracking-widest mt-0.5">
                              Last: {prevLifts[ex.id]}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-3">
                          <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest mb-1">Prescribed</p>
                          <p className="text-xs font-bold text-neutral-500 uppercase">{ex.sets} Sets × {ex.reps}</p>
                        </div>
                        <div className="md:col-span-5">
                          <label className="text-[8px] font-black text-accent uppercase tracking-widest mb-1 block">Actual Result <span className="text-neutral-300 font-medium normal-case tracking-normal">(optional)</span></label>
                          <input
                            type="text"
                            placeholder={prevLifts[ex.id]
                              ? `Last: ${prevLifts[ex.id]}`
                              : (ex.format === 'CARDIO' || ex.format === 'FOR_TIME')
                                ? 'e.g. 5.2 km / 22:30'
                                : ex.format === 'EMOM' || ex.format === 'AMRAP' || ex.format === 'HIIT'
                                  ? 'e.g. 8 rounds / 12:00'
                                  : 'e.g. 80 kg × 8 reps'
                            }
                            className="w-full bg-white border border-neutral-200 rounded-lg p-3 text-sm font-black uppercase outline-none focus:border-accent transition-all"
                            value={logData.results[ex.id] || ''}
                            onChange={(e) => setLogData({
                              ...logData,
                              results: { ...logData.results, [ex.id]: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RPE slider — full width, no coach notes */}
                <div className="pt-6 border-t border-neutral-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-widest text-neutral-400">Session Intensity</label>
                    <span className="px-3 py-1 bg-black text-white rounded-full text-xs font-black">RPE {logData.rpe} / 10</span>
                  </div>
                  <input
                    type="range" min="1" max="10" step="1"
                    className="w-full h-2 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-accent"
                    value={logData.rpe}
                    onChange={(e) => setLogData({ ...logData, rpe: parseInt(e.target.value) })}
                  />
                  <div className="flex justify-between text-[9px] font-black uppercase text-neutral-300">
                    <span>1 – Easy Recovery</span>
                    <span>10 – Max Effort</span>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-sm hover:bg-neutral-800 transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting
                      ? <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> Saving...</>
                      : <><span className="material-symbols-outlined text-base">task_alt</span> Finish Session &amp; Save Log</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutSession;
