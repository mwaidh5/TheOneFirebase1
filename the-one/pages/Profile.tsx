
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { COURSES, COACHES } from '../constants';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';
import { User } from '../types';
import { doc, onSnapshot, setDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ProfileProps {
  currentUser: User;
}

const Profile: React.FC<ProfileProps> = ({ currentUser }) => {
  const [userData, setUserData] = useState<any>(currentUser);
  const [isUploading, setIsUploading] = useState(false);
  const [workoutLogs, setWorkoutLogs] = useState<any[]>([]);

  useEffect(() => {
     if (currentUser?.id) {
         const unsub = onSnapshot(doc(db, 'users', currentUser.id), (doc) => {
             if (doc.exists()) {
                 setUserData({ ...currentUser, ...doc.data() });
             }
         });
         return () => unsub();
     }
  }, [currentUser]);

  // Load workout logs
  useEffect(() => {
    if (!currentUser?.id) return;
    const logsRef = collection(db, 'users', currentUser.id, 'workout_logs');
    getDocs(query(logsRef, orderBy('loggedAt', 'desc'), limit(10)))
      .then(snap => {
        setWorkoutLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      })
      .catch(() => setWorkoutLogs([]));
  }, [currentUser]);
  const [activityView, setActivityView] = useState<'weekly' | 'monthly'>('weekly');
  const navigate = useNavigate();

  // Firestore stores activityChart Mon-first (index 0=Mon … 6=Sun).
  // Always remap to Sat-first for display.
  const storedChart = userData?.activityChart;
  const weeklyData: { name: string; val: number }[] =
    storedChart && storedChart.length === 7
      ? [
          { name: 'S', val: storedChart[5]?.val ?? 0 }, // Sat
          { name: 'S', val: storedChart[6]?.val ?? 0 }, // Sun
          { name: 'M', val: storedChart[0]?.val ?? 0 }, // Mon
          { name: 'T', val: storedChart[1]?.val ?? 0 }, // Tue
          { name: 'W', val: storedChart[2]?.val ?? 0 }, // Wed
          { name: 'T', val: storedChart[3]?.val ?? 0 }, // Thu
          { name: 'F', val: storedChart[4]?.val ?? 0 }, // Fri
        ]
      : [
          { name: 'S', val: 0 },
          { name: 'S', val: 0 },
          { name: 'M', val: 0 },
          { name: 'T', val: 0 },
          { name: 'W', val: 0 },
          { name: 'T', val: 0 },
          { name: 'F', val: 0 },
        ];

  // Monthly: aggregate workoutLogs into 4 weekly buckets for the current month.
  const monthlyData: { name: string; val: number }[] = (() => {
    const now = new Date();
    const weeks = [
      { name: 'W1', val: 0 },
      { name: 'W2', val: 0 },
      { name: 'W3', val: 0 },
      { name: 'W4', val: 0 },
    ];
    workoutLogs.forEach(log => {
      if (!log.loggedDate) return;
      const d = new Date(log.loggedDate + 'T12:00:00');
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        const week = Math.min(Math.floor((d.getDate() - 1) / 7), 3);
        weeks[week].val += 1;
      }
    });
    return weeks;
  })();

  const data = activityView === 'weekly' ? weeklyData : monthlyData;

  const handleMessageCoach = (instructorName: string) => {
    const coach = COACHES.find(c => c.name.includes(instructorName.split(' ')[0]));
    if (coach) {
      navigate(`/profile/messages?coachId=${coach.id}`);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !currentUser?.id) return;
      
      setIsUploading(true);
      try {
          // Use cache-busting timestamp for uniqueness
          const fileRef = ref(storage, `avatars/${currentUser.id}_${Date.now()}`);
          await uploadBytes(fileRef, file, { contentType: file.type || 'image/jpeg' });
          const url = await getDownloadURL(fileRef);
          
          await setDoc(doc(db, 'users', currentUser.id), {
              avatar: url
          }, { merge: true });
      } catch (error: any) {
          console.error("Error uploading avatar", error);
          alert("Firebase rejected the upload: " + error.code + " - " + error.message);
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
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                { label: 'Body Weight', val: userData.weight ? `${userData.weight} lbs` : '—', trend: null },
                { label: 'Body Fat %', val: userData.bodyFat ? `${userData.bodyFat}%` : '—', trend: null },
                { label: 'Training Goal', val: userData.trainingGoal || 'General', trend: null }
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between pb-6 border-b border-neutral-50 last:border-0 last:pb-0">
                  <div>
                    <p className="text-[10px] text-neutral-300 uppercase font-black tracking-widest mb-1">{stat.label}</p>
                    <p className="text-xl font-black text-black uppercase">{stat.val}</p>
                  </div>
                  {stat.trend && (
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest bg-neutral-50 text-neutral-600`}>
                      {stat.trend}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-12">
          <div className="bg-black text-white rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-12">
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
                {[
                  { l: 'Workouts', v: userData?.workoutsCompleted || '0', t: userData?.workoutsCompleted ? '+Active' : 'Baseline' },
                  { l: 'Min Logged', v: userData?.minutesLogged || '0', t: userData?.minutesLogged ? 'On Track' : 'Baseline' },
                  { l: 'Calories', v: userData?.caloriesBurned || '0', t: userData?.caloriesBurned ? 'Optimal' : 'Baseline' }
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

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10, fontWeight: 900}} dy={10} />
                    <Bar dataKey="val" radius={[8, 8, 0, 0]}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.val > 70 ? '#137fec' : '#333'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <span className="material-symbols-outlined text-[200px] absolute -bottom-20 -right-20 text-white/5 rotate-12">analytics</span>
          </div>

          {/* ── Recent Workout Activity ── */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-black font-display uppercase tracking-tight">Recent Activity</h2>
            </div>
            {workoutLogs.length === 0 ? (
              <div className="bg-neutral-50 rounded-[2rem] p-10 border border-neutral-100 text-center">
                <span className="material-symbols-outlined text-4xl text-neutral-300 mb-3 block">fitness_center</span>
                <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">No sessions logged yet.<br/>Complete a workout to see your history here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workoutLogs.map((log) => {
                  const mins = Math.round((log.durationSeconds || 0) / 60);
                  const secs = (log.durationSeconds || 0) % 60;
                  const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                  const dateStr = log.loggedDate
                    ? new Date(log.loggedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—';
                  return (
                    <div key={log.id} className="bg-white rounded-2xl border border-neutral-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                      <div className="w-12 h-12 bg-black text-white rounded-xl flex flex-col items-center justify-center shrink-0 shadow-lg">
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/50 leading-none">{log.loggedDayName?.slice(0,3) ?? '—'}</span>
                        <span className="text-lg font-black leading-tight">{log.loggedDate ? new Date(log.loggedDate + 'T12:00:00').getDate() : '—'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400 mb-0.5">{log.courseTitle || 'Session'} · Wk {log.weekNum} · Day {log.dayNumber}</p>
                        <p className="text-base font-black uppercase text-black leading-tight truncate">{log.dayTitle || 'Training Session'}</p>
                        <p className="text-[9px] font-bold text-neutral-400 mt-0.5">{dateStr}</p>
                      </div>
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
                    </div>
                  );
                })}
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
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
                      <div className="bg-black h-full rounded-full w-[65%] transition-all duration-1000"></div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Link to={`/workout/${course.id}`} className="flex-[2] text-center bg-black text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-xl">
                      Resume
                    </Link>
                    <button 
                      onClick={() => handleMessageCoach(course.instructor)}
                      className="flex-1 bg-neutral-50 text-black py-4 rounded-2xl hover:bg-accent hover:text-white transition-all border border-neutral-100 flex items-center justify-center group/btn"
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
