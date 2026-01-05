
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_CUSTOM_REQUESTS } from '../../constants';

interface Athlete {
  id: string;
  name: string;
  email: string;
  phone: string;
  progress: number;
  level: string;
  status: string;
  lastSeen: string;
  isCustomClient?: boolean;
  vitals: { weight: string; height: string; age: number | string };
  recentPrs: { lift: string; weight: string; date: string }[];
}

const CoachAthletes: React.FC = () => {
  const navigate = useNavigate();
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

  const standardAthletes: Athlete[] = [
    { 
      id: 'ath-1', 
      name: 'Sarah Jenkins', 
      email: 'sarah@gym.com', 
      phone: '+1 (555) 123-4567',
      progress: 85, 
      level: 'RX', 
      status: 'On Track', 
      lastSeen: '2h ago',
      vitals: { weight: '145 lbs', height: "5'6\"", age: 28 },
      recentPrs: [
        { lift: 'Back Squat', weight: '215 lbs', date: 'Oct 20' },
        { lift: 'Clean & Jerk', weight: '155 lbs', date: 'Oct 15' }
      ]
    },
    { 
      id: 'ath-2', 
      name: 'Mike Johnson', 
      email: 'mike@example.com', 
      phone: '+1 (555) 987-6543',
      progress: 42, 
      level: 'Beginner', 
      status: 'Improving', 
      lastSeen: '5h ago',
      vitals: { weight: '195 lbs', height: "6'0\"", age: 34 },
      recentPrs: [
        { lift: 'Deadlift', weight: '315 lbs', date: 'Oct 22' }
      ]
    },
    { 
      id: 'ath-3', 
      name: 'Diana Prince', 
      email: 'diana@warrior.com', 
      phone: '+1 (555) 444-5555',
      progress: 98, 
      level: 'Elite', 
      status: 'Peak', 
      lastSeen: '10m ago',
      vitals: { weight: '135 lbs', height: "5'8\"", age: 26 },
      recentPrs: [
        { lift: 'Snatch', weight: '145 lbs', date: 'Oct 24' },
        { lift: 'Fran', weight: '2:45', date: 'Oct 10' }
      ]
    }
  ];

  const allAthletes = useMemo(() => {
    const customAthletes: Athlete[] = MOCK_CUSTOM_REQUESTS.map(req => ({
      id: req.athleteId,
      name: req.athleteName,
      email: 'custom@request.com',
      phone: req.phone,
      progress: req.status === 'COMPLETED' ? 100 : req.status === 'BUILDING' ? 10 : 0,
      level: req.sport.toUpperCase(),
      status: req.status,
      lastSeen: 'New Intake',
      isCustomClient: true,
      vitals: { weight: `${req.biometrics.weight}kg`, height: `${req.biometrics.height}cm`, age: req.biometrics.age },
      recentPrs: []
    }));
    return [...standardAthletes, ...customAthletes];
  }, []);

  const handleMessageAthlete = (e: React.MouseEvent, athleteId: string) => {
    e.stopPropagation();
    navigate(`/coach/messages?athleteId=${athleteId}`);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 text-left">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">My Athletes</h1>
          <p className="text-neutral-400 font-medium">Full visibility into your standard and bespoke client rosters.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300">search</span>
            <input type="text" placeholder="Search athletes..." className="bg-white border border-neutral-100 rounded-2xl pl-12 pr-6 py-4 text-sm focus:border-black outline-none w-64 shadow-sm transition-all" />
          </div>
          <button className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-neutral-800 transition-all shadow-xl">
            Assign Program
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {allAthletes.map((athlete, i) => (
          <div 
            key={athlete.id} 
            onClick={() => setSelectedAthlete(athlete)}
            className={`bg-white rounded-[2.5rem] p-8 border shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden ${athlete.isCustomClient ? 'border-accent/30 ring-1 ring-accent/5' : 'border-neutral-100'}`}
          >
            {athlete.isCustomClient && (
              <div className="absolute top-0 right-0 p-4">
                <span className="px-3 py-1 bg-accent text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl rounded-tr-xl">Bespoke Client</span>
              </div>
            )}
            
            <div className="flex items-center gap-6 mb-8">
              <div className={`w-16 h-16 rounded-full overflow-hidden border-4 shadow-md ${athlete.isCustomClient ? 'border-accent/20' : 'border-neutral-50'}`}>
                <img src={`https://picsum.photos/100/100?random=${i+50}`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-black uppercase tracking-tight group-hover:text-accent transition-colors">{athlete.name}</h3>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{athlete.level} Specialty</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-neutral-300">Phase Progress</span>
                  <span className="text-black">{athlete.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-50 rounded-full overflow-hidden border border-neutral-100">
                  <div className={`h-full rounded-full transition-all duration-1000 ${athlete.isCustomClient ? 'bg-accent' : 'bg-black'}`} style={{ width: `${athlete.progress}%` }}></div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-neutral-50">
                <div className="flex gap-4">
                  <div>
                    <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Status</p>
                    <p className={`text-xs font-bold uppercase ${athlete.status === 'At Risk' ? 'text-red-500' : 'text-green-600'}`}>{athlete.status}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Engagement</p>
                    <p className="text-xs font-bold text-black uppercase tracking-tight">{athlete.lastSeen}</p>
                  </div>
                </div>
                
                <button 
                  onClick={(e) => handleMessageAthlete(e, athlete.id)}
                  className="w-10 h-10 rounded-xl bg-neutral-50 text-neutral-400 hover:bg-black hover:text-white transition-all flex items-center justify-center group/msg shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px] filled">chat</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Athlete Detail Modal */}
      {selectedAthlete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setSelectedAthlete(null)}
              className="absolute top-8 right-8 w-12 h-12 rounded-xl bg-neutral-50 flex items-center justify-center hover:bg-black hover:text-white transition-all z-20 shadow-sm"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="p-12 overflow-y-auto no-scrollbar">
              <div className="flex items-center gap-8 mb-12">
                <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-neutral-50 shadow-xl">
                  <img src={`https://picsum.photos/150/150?u=${selectedAthlete.id}`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-2">
                  <span className={`px-3 py-1 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg ${selectedAthlete.isCustomClient ? 'bg-accent' : 'bg-black'}`}>
                    {selectedAthlete.isCustomClient ? 'Custom Athlete' : selectedAthlete.level}
                  </span>
                  <h2 className="text-4xl font-black font-display uppercase tracking-tight text-black">{selectedAthlete.name}</h2>
                  <div className="flex gap-4 text-xs font-bold text-neutral-400 uppercase tracking-widest">
                    <span>{selectedAthlete.phone}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-12">
                <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
                  <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">Weight</p>
                  <p className="text-xl font-black text-black uppercase">{selectedAthlete.vitals.weight}</p>
                </div>
                <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
                  <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">Height</p>
                  <p className="text-xl font-black text-black uppercase">{selectedAthlete.vitals.height}</p>
                </div>
                <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
                  <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-1">Age</p>
                  <p className="text-xl font-black text-black uppercase">{selectedAthlete.vitals.age}</p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h3 className={`text-lg font-black uppercase tracking-tight mb-6 border-l-4 pl-4 ${selectedAthlete.isCustomClient ? 'border-accent' : 'border-black'}`}>
                    {selectedAthlete.isCustomClient ? 'Bespoke Cycle Intent' : 'Recent Performance Records'}
                  </h3>
                  {selectedAthlete.isCustomClient ? (
                    <div className="p-8 bg-neutral-50 rounded-[2.5rem] italic text-neutral-500 text-sm leading-relaxed border border-neutral-100">
                      This athlete is on a personalized {selectedAthlete.level} cycle. Logs and PRs will populate as the architecture is finalized.
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {selectedAthlete.recentPrs.map((pr, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-white border border-neutral-100 rounded-2xl shadow-sm">
                          <div>
                            <p className="text-sm font-black text-black uppercase tracking-tight">{pr.lift}</p>
                            <p className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest mt-1">Logged on {pr.date}</p>
                          </div>
                          <p className="text-xl font-black text-accent">{pr.weight}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t border-neutral-100 flex gap-4">
                  <button 
                    onClick={(e) => {
                      handleMessageAthlete(e, selectedAthlete.id);
                      setSelectedAthlete(null);
                    }}
                    className="flex-1 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-800 transition-all shadow-xl flex items-center justify-center gap-3"
                  >
                    <span className="material-symbols-outlined filled">chat</span>
                    Open Chat
                  </button>
                  <button className="flex-1 py-5 border border-neutral-100 text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-50 transition-all flex items-center justify-center gap-3">
                    <span className="material-symbols-outlined">assignment_ind</span>
                    Audit History
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachAthletes;
