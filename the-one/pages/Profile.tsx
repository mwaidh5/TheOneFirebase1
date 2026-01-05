
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MOCK_USER, COURSES, COACHES } from '../constants';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const data = [
    { name: 'M', val: 40 },
    { name: 'T', val: 65 },
    { name: 'W', val: 30 },
    { name: 'T', val: 85 },
    { name: 'F', val: 50 },
    { name: 'S', val: 90 },
    { name: 'S', val: 20 },
  ];

  const handleMessageCoach = (instructorName: string) => {
    const coach = COACHES.find(c => c.name.includes(instructorName.split(' ')[0]));
    if (coach) {
      navigate(`/profile/messages?coachId=${coach.id}`);
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
              <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden border-8 border-neutral-50 shadow-2xl">
                <img src={MOCK_USER.avatar} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <button className="absolute -bottom-2 -right-2 bg-black text-white p-3 rounded-2xl shadow-xl hover:bg-accent transition-all">
                <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              </button>
            </div>
            <h2 className="text-3xl font-black text-black font-display uppercase tracking-tight">{MOCK_USER.firstName} {MOCK_USER.lastName}</h2>
            <p className="text-sm font-bold text-neutral-400 mt-1 uppercase tracking-widest">{MOCK_USER.email}</p>
            <div className="mt-8 flex gap-3">
              <span className="bg-neutral-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">RX Level</span>
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
                { label: 'Body Weight', val: '185 lbs', trend: '-2%', up: false },
                { label: 'Body Fat %', val: '14.5%', trend: 'Good', up: true },
                { label: 'Training Goal', val: 'Hypertrophy', trend: null }
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between pb-6 border-b border-neutral-50 last:border-0 last:pb-0">
                  <div>
                    <p className="text-[10px] text-neutral-300 uppercase font-black tracking-widest mb-1">{stat.label}</p>
                    <p className="text-xl font-black text-black uppercase">{stat.val}</p>
                  </div>
                  {stat.trend && (
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${stat.up ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
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
                  <button className="px-6 py-2 bg-white text-black text-[10px] font-black rounded-xl uppercase tracking-widest shadow-xl">Weekly</button>
                  <button className="px-6 py-2 text-neutral-500 text-[10px] font-black uppercase tracking-widest hover:text-white">Monthly</button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
                {[
                  { l: 'Workouts', v: '42', t: '+5%' },
                  { l: 'Min Logged', v: '1,240', t: 'Elite' },
                  { l: 'Calories', v: '14.5k', t: 'Optimal' }
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

          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-black font-display uppercase tracking-tight">Active Programs</h2>
            <Link to="/courses" className="text-[10px] font-black text-accent uppercase tracking-[0.3em] hover:underline">Browse All</Link>
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
