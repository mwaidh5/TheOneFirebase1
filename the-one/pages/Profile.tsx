
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { COURSES, COACHES } from '../constants';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { User } from '../types';
import { doc, onSnapshot, setDoc, collection, query, orderBy } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ProfileProps {
  currentUser: User;
}

interface UserProfile extends User {
  weight?: string;
  bodyFat?: string;
  trainingGoal?: string;
  avatar?: string;
  fitnessLevel?: string;
  workoutsCompleted?: number;
  minutesLogged?: number;
  caloriesBurned?: number;
}

interface WorkoutLog {
  id: string;
  courseId?: string;
  courseTitle?: string;
  weekNum?: number;
  dayId?: string;
  dayTitle?: string;
  dayNumber?: number;
  loggedAt?: number;
  loggedDayName?: string;
  results?: Record<string, { weight?: string; reps?: string } | string>;
  durationSeconds?: number;
  rpe?: number;
  completed?: boolean;
}

interface ChartEntry {
  name: string;
  val: number;
  isToday: boolean;
}

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_ABBREVS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getWeekMonday(weekOffset: number): Date {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function fmtShort(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const Profile: React.FC<ProfileProps> = ({ currentUser }) => {
  const [userData, setUserData] = useState<UserProfile>(currentUser as UserProfile);
  const [isUploading, setIsUploading] = useState(false);
  const [allLogs, setAllLogs] = useState<WorkoutLog[]>([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [activityView, setActivityView] = useState<'weekly' | 'monthly'>('weekly');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = onSnapshot(doc(db, 'users', currentUser.id), (snap) => {
      if (snap.exists()) setUserData({ ...currentUser, ...snap.data() } as UserProfile);
    });
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const logsRef = collection(db, 'users', currentUser.id, 'workout_logs');
    const unsub = onSnapshot(query(logsRef, orderBy('loggedAt', 'desc')), (snap) => {
      setAllLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkoutLog)));
    });
    return () => unsub();
  }, [currentUser]);

  // ── Weekly chart ──────────────────────────────────────────────────────────────
  const { weeklyData, weekLabel } = useMemo(() => {
    const monday = getWeekMonday(weekOffset);
    const sunday = new Date(monday.getTime() + 6 * 86400000);
    sunday.setHours(23, 59, 59, 999);

    const minutesByDay = new Map<string, number>();
    allLogs.forEach(log => {
      if (!log.loggedAt) return;
      const d = new Date(log.loggedAt);
      if (d < monday || d > sunday) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      minutesByDay.set(key, (minutesByDay.get(key) ?? 0) + Math.round((log.durationSeconds ?? 0) / 60));
    });

    const today = new Date();
    const days: ChartEntry[] = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday.getTime() + i * 86400000);
      const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
      return {
        name: `${DAY_LETTERS[day.getDay()]}|${day.getDate()}`,
        val: minutesByDay.get(key) ?? 0,
        isToday: isSameCalendarDay(day, today),
      };
    });

    return {
      weeklyData: days,
      weekLabel: `${fmtShort(monday)} – ${fmtShort(new Date(monday.getTime() + 6 * 86400000))}`,
    };
  }, [allLogs, weekOffset]);

  // ── Monthly chart ─────────────────────────────────────────────────────────────
  const { monthlyData, monthLabel } = useMemo(() => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const year = target.getFullYear();
    const month = target.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    lastDay.setHours(23, 59, 59, 999);

    const weeks: ChartEntry[] = [];
    let cursor = new Date(year, month, 1);
    while (cursor <= lastDay) {
      const wStart = new Date(cursor);
      const wEnd = new Date(cursor.getTime() + 6 * 86400000);
      if (wEnd > lastDay) wEnd.setTime(lastDay.getTime());
      wEnd.setHours(23, 59, 59, 999);

      const minutes = allLogs
        .filter(log => {
          if (!log.loggedAt) return false;
          const d = new Date(log.loggedAt);
          return d >= wStart && d <= wEnd;
        })
        .reduce((s, log) => s + Math.round((log.durationSeconds ?? 0) / 60), 0);

      weeks.push({ name: `${wStart.getDate()}–${wEnd.getDate()}`, val: minutes, isToday: false });
      cursor = new Date(cursor.getTime() + 7 * 86400000);
    }

    return { monthlyData: weeks, monthLabel: `${MONTH_NAMES[month]} ${year}` };
  }, [allLogs, monthOffset]);

  const chartData = activityView === 'weekly' ? weeklyData : monthlyData;
  const navLabel = activityView === 'weekly' ? weekLabel : monthLabel;
  const isCurrentPeriod = activityView === 'weekly' ? weekOffset >= 0 : monthOffset >= 0;

  const renderTick = ({ x, y, payload }: { x: number; y: number; payload: { value: string; index: number } }) => {
    const item = chartData[payload.index];
    const isToday = item?.isToday ?? false;
    if (activityView === 'weekly') {
      const [letter, date] = payload.value.split('|');
      return (
        <g transform={`translate(${x},${y})`}>
          <text x={0} y={0} dy={14} textAnchor="middle" fill={isToday ? '#137fec' : '#6b7280'} fontSize={9} fontWeight={900}>{letter}</text>
          <text x={0} y={0} dy={26} textAnchor="middle" fill={isToday ? '#137fec' : '#52525b'} fontSize={8}>{date}</text>
        </g>
      );
    }
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={14} textAnchor="middle" fill="#6b7280" fontSize={8} fontWeight={700}>{payload.value}</text>
      </g>
    );
  };

  const logsToShow = allLogs.slice(0, visibleCount);

  const handleMessageCoach = (instructorName: string) => {
    const coach = COACHES.find(c => c.name.includes(instructorName.split(' ')[0]));
    if (coach) navigate(`/profile/messages?coachId=${coach.id}`);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id) return;
    setIsUploading(true);
    try {
      const fileRef = ref(storage, `avatars/${currentUser.id}_${Date.now()}`);
      await uploadBytes(fileRef, file, { contentType: file.type || 'image/jpeg' });
      const url = await getDownloadURL(fileRef);
      await setDoc(doc(db, 'users', currentUser.id), { avatar: url }, { merge: true });
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      alert('Firebase rejected the upload: ' + err.code + ' - ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-left animate-in fade-in duration-500">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tight text-black font-display uppercase">Athlete Profile</h1>
          <p className="text-neutral-400 font-medium">Monitoring your path to elite performance.</p>
        </div>
        <Link to="/profile/settings" className="text-[10px] font-black uppercase tracking-widest text-black hover:bg-neutral-50 px-6 py-3 border border-neutral-100 rounded-xl transition-all flex items-center gap-3">
          <span className="material-symbols-outlined text-[18px]">settings</span>
          Manage Account
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-10">
          <div className="bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-sm flex flex-col items-center text-center">
            <div className="relative mb-8">
              <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-8 border-neutral-50 shadow-2xl relative bg-neutral-100 flex items-center justify-center">
                {userData.avatar ? (
                  <img src={userData.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[64px] text-neutral-300">person</span>
                )}
              </div>
              <label className={`absolute -bottom-2 -right-2 bg-black text-white p-3 rounded-2xl shadow-xl hover:bg-accent transition-all cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploading} />
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                )}
              </label>
            </div>
            <h2 className="text-3xl font-black text-black font-display uppercase tracking-tight">{userData.firstName} {userData.lastName}</h2>
            <p className="text-sm font-bold text-neutral-400 mt-1 uppercase tracking-widest">{userData.email}</p>
            <div className="mt-8 flex gap-3">
              <span className="bg-neutral-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">{userData.fitnessLevel || 'Athlete'} Level</span>
              <span className="bg-accent text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Active Member</span>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-sm space-y-8">
            <h3 className="text-xl font-black text-black flex items-center gap-3 font-display uppercase tracking-tight">
              <span className="material-symbols-outlined text-accent filled">monitoring</span>
              Core Vitals
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Body Weight', val: userData.weight ? `${userData.weight} lbs` : '—' },
                { label: 'Body Fat %', val: userData.bodyFat ? `${userData.bodyFat}%` : '—' },
                { label: 'Training Goal', val: userData.trainingGoal || 'General' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between pb-6 border-b border-neutral-50 last:border-0 last:pb-0">
                  <div>
                    <p className="text-[10px] text-neutral-300 uppercase font-black tracking-widest mb-1">{stat.label}</p>
                    <p className="text-xl font-black text-black uppercase">{stat.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-12">

          {/* ── Activity Cycle ── */}
          <div className="bg-black text-white rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              {/* Header + view toggle */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black font-display uppercase tracking-tight">Activity Cycle</h2>
                <div className="flex gap-2 bg-white/5 p-1 rounded-2xl">
                  <button
                    onClick={() => setActivityView('weekly')}
                    className={`px-6 py-2 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${activityView === 'weekly' ? 'bg-white text-black shadow-xl' : 'text-white/50 hover:text-white'}`}
                  >Weekly</button>
                  <button
                    onClick={() => setActivityView('monthly')}
                    className={`px-6 py-2 text-[10px] font-black rounded-xl uppercase tracking-widest transition-all ${activityView === 'monthly' ? 'bg-white text-black shadow-xl' : 'text-white/50 hover:text-white'}`}
                  >Monthly</button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
                {[
                  { l: 'Workouts', v: userData.workoutsCompleted ?? 0, t: userData.workoutsCompleted ? '+Active' : 'Baseline' },
                  { l: 'Min Logged', v: userData.minutesLogged ?? 0, t: userData.minutesLogged ? 'On Track' : 'Baseline' },
                  { l: 'Calories', v: userData.caloriesBurned ?? 0, t: userData.caloriesBurned ? 'Optimal' : 'Baseline' },
                ].map(s => (
                  <div key={s.l} className="p-8 bg-white/5 rounded-[2rem] border border-white/5 space-y-2">
                    <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em]">{s.l}</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-black text-white font-display">{s.v}</span>
                      <span className="text-[10px] font-black text-accent uppercase tracking-widest">{s.t}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Period navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => activityView === 'weekly' ? setWeekOffset(w => w - 1) : setMonthOffset(m => m - 1)}
                  className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{navLabel}</span>
                <button
                  onClick={() => activityView === 'weekly' ? setWeekOffset(w => Math.min(w + 1, 0)) : setMonthOffset(m => Math.min(m + 1, 0))}
                  disabled={isCurrentPeriod}
                  className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>

              {/* Chart */}
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ bottom: 16 }}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={(props: { x: number; y: number; payload: { value: string; index: number } }) => renderTick(props)}
                      height={40}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const val = payload[0]?.value as number;
                        return (
                          <div className="bg-neutral-800 px-3 py-2 rounded-xl text-[10px] font-black text-white shadow-xl border border-white/10">
                            {val > 0 ? `${val} min` : 'No session'}
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="val" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isToday ? '#137fec' : entry.val > 0 ? '#e4e4e7' : '#3f3f46'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <span className="material-symbols-outlined text-[200px] absolute -bottom-20 -right-20 text-white/5 rotate-12">analytics</span>
          </div>

          {/* ── Recent Activity ── */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-black font-display uppercase tracking-tight">Recent Activity</h2>
            </div>
            {allLogs.length === 0 ? (
              <div className="bg-neutral-50 rounded-[2rem] p-10 border border-neutral-100 text-center">
                <span className="material-symbols-outlined text-4xl text-neutral-300 mb-3 block">fitness_center</span>
                <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">No sessions logged yet.<br />Complete a workout to see your history here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logsToShow.map((log) => {
                  const mins = Math.round((log.durationSeconds ?? 0) / 60);
                  const secs = (log.durationSeconds ?? 0) % 60;
                  const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                  const logDate = log.loggedAt ? new Date(log.loggedAt) : null;
                  const dateStr = logDate
                    ? logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—';
                  const dayAbbrev = logDate ? DAY_ABBREVS[logDate.getDay()] : (log.loggedDayName?.slice(0, 3) ?? '—');
                  // Show duration only for completed workouts (completed !== false handles old logs without the field)
                  const showDuration = log.completed !== false && (log.durationSeconds ?? 0) > 0;
                  const resultEntries = log.results ? Object.entries(log.results) : [];

                  return (
                    <div key={log.id} className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                      <div className="flex items-center gap-4 p-5">
                        <div className="w-12 h-12 bg-black text-white rounded-xl flex flex-col items-center justify-center shrink-0 shadow-lg">
                          <span className="text-[8px] font-black uppercase tracking-widest text-white/50 leading-none">{dayAbbrev}</span>
                          <span className="text-lg font-black leading-tight">{logDate?.getDate() ?? '—'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400 mb-0.5">{log.courseTitle || 'Session'} · Wk {log.weekNum} · Day {log.dayNumber}</p>
                          <p className="text-base font-black uppercase text-black leading-tight truncate">{log.dayTitle || 'Training Session'}</p>
                          <p className="text-[9px] font-bold text-neutral-400 mt-0.5">{dateStr}</p>
                        </div>
                        {showDuration ? (
                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-1 justify-end">
                              <span className="material-symbols-outlined text-xs text-accent">timer</span>
                              <span className="text-sm font-black text-black tabular-nums">{durationStr}</span>
                            </div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-neutral-300">Duration</p>
                            {log.rpe && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-neutral-100 rounded-full text-[7px] font-black uppercase tracking-widest text-neutral-500">RPE {log.rpe}</span>
                            )}
                          </div>
                        ) : log.rpe ? (
                          <div className="text-right shrink-0">
                            <span className="px-2 py-0.5 bg-neutral-100 rounded-full text-[7px] font-black uppercase tracking-widest text-neutral-500">RPE {log.rpe}</span>
                          </div>
                        ) : null}
                      </div>

                      {resultEntries.length > 0 && (
                        <div className="border-t border-neutral-50 px-5 py-3 bg-neutral-50/50">
                          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-neutral-300 mb-2">Logged Results</p>
                          <div className="flex flex-wrap gap-2">
                            {resultEntries.map(([exId, result]) => {
                              const r = typeof result === 'object' ? result : null;
                              const display = r
                                ? [r.weight ? `${r.weight} kg` : null, r.reps ? `${r.reps} reps` : null].filter(Boolean).join(' × ')
                                : typeof result === 'string' ? result : null;
                              if (!display) return null;
                              return (
                                <span key={exId} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-100 rounded-xl shadow-sm">
                                  <span className="material-symbols-outlined text-[10px] text-accent">fitness_center</span>
                                  <span className="text-[9px] font-black uppercase tracking-widest text-black">{display}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {allLogs.length > visibleCount && (
                  <button
                    onClick={() => setVisibleCount(c => c + 10)}
                    className="w-full py-4 bg-neutral-50 rounded-3xl text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:bg-neutral-100 transition-all border border-neutral-100"
                  >
                    Show More · {allLogs.length - visibleCount} remaining
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Active Programs ── */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-black font-display uppercase tracking-tight">Active Programs</h2>
              <Link to="/courses" className="text-[10px] font-black text-accent uppercase tracking-[0.3em] hover:underline">Browse All</Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {COURSES.map(course => (
              <div key={course.id} className="bg-white rounded-[3rem] overflow-hidden border border-neutral-100 shadow-sm group hover:shadow-2xl transition-all duration-500">
                <div className="relative h-56 overflow-hidden">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-6 left-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-lg">
                      <img src={COACHES.find(c => c.name.includes(course.instructor.split(' ')[0]))?.avatar} alt="Coach" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Coach {course.instructor.split(' ')[0]}</span>
                  </div>
                </div>
                <div className="p-10 space-y-8">
                  <div>
                    <h3 className="text-2xl font-black text-black uppercase tracking-tight mb-2 font-display">{course.title}</h3>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Progress</span>
                      <span className="text-sm font-black text-black">65%</span>
                    </div>
                    <div className="w-full bg-neutral-50 rounded-full h-2 border border-neutral-100 overflow-hidden">
                      <div className="bg-black h-full rounded-full w-[65%] transition-all duration-1000" />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Link to={`/workout/${course.id}`} className="flex-[2] text-center bg-black text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-xl">
                      Resume
                    </Link>
                    <button
                      onClick={() => handleMessageCoach(course.instructor)}
                      className="flex-1 bg-neutral-50 text-black py-4 rounded-2xl hover:bg-accent hover:text-white transition-all border border-neutral-100 flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[20px] filled">chat</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
