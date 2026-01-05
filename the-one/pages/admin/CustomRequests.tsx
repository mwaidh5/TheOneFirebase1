
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomCourseRequest } from '../../types';
import { COACHES, CUSTOM_DISCIPLINES } from '../../constants';

const AdminCustomRequests: React.FC = () => {
  const navigate = useNavigate();
  const [requests] = useState<CustomCourseRequest[]>([
    {
      id: 'REQ-101',
      athleteId: 'u1',
      athleteName: 'John Doe',
      phone: '+1 (555) 123-4567',
      sport: 'muaythai',
      goal: 'Prepare for amateur fight. Focus on stamina.',
      biometrics: { height: '180', weight: '85', age: '28' },
      status: 'PENDING_PAYMENT',
      assignedCoachIds: ['c2'],
      price: 350,
      createdAt: '2024-10-24',
      durationWeeks: 6,
      hasMealPlan: false
    },
    {
      id: 'REQ-102',
      athleteId: 'u2',
      athleteName: 'Jane Smith',
      phone: '+1 (555) 987-6543',
      sport: 'crossfit',
      goal: 'Improve gymnastic volume. Muscle ups are the goal.',
      biometrics: { height: '165', weight: '62', age: '31' },
      status: 'BUILDING',
      assignedCoachIds: ['c1'],
      price: 299,
      createdAt: '2024-10-25',
      durationWeeks: 4,
      hasMealPlan: true,
      diagnostics: [
        { id: 'd-1', title: 'Ring Muscle Up Max Reps', instruction: 'Record your best set of unbroken muscle ups.', inputType: 'VIDEO', required: true }
      ],
      submissions: [
        { testId: 'd-1', data: 'VIDEO_MOCK_PAYLOAD', submittedAt: Date.now() }
      ]
    }
  ]);

  const [inspectingReq, setInspectingReq] = useState<CustomCourseRequest | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'INTAKE' | 'RESULTS'>('INTAKE');

  const openInspector = (req: CustomCourseRequest) => {
    setInspectingReq(req);
    setActiveModalTab('INTAKE');
  };

  return (
    <div className="space-y-12 text-left animate-in fade-in duration-500 pb-20">
      <div className="space-y-1">
        <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">Custom Lead Management</h1>
        <p className="text-neutral-400 font-medium">Auto-assigned bespoke cycles based on modality expertise.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-neutral-100 overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-neutral-50 border-b border-neutral-100">
            <tr>
              <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Athlete Intelligence</th>
              <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Game & Progress</th>
              <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Dedicated Coach</th>
              <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {requests.map((req) => {
              const assignedCoach = COACHES.find(c => c.id === req.assignedCoachIds[0]);
              const game = CUSTOM_DISCIPLINES.find(d => d.id === req.sport);

              return (
                <tr key={req.id} className="hover:bg-neutral-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <p className="font-black text-black uppercase text-sm tracking-tight">{req.athleteName}</p>
                      <button 
                        onClick={() => openInspector(req)}
                        className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1 hover:text-black"
                      >
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                        Inspect Dossier
                      </button>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      <span className={`w-fit px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                        req.status === 'PENDING_PAYMENT' ? 'bg-orange-50 text-orange-600' : 
                        req.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {req.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">${req.price} • {game?.name || req.sport}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {assignedCoach ? (
                       <div className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-100 rounded-2xl w-fit shadow-sm">
                          <img src={assignedCoach.avatar} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="" />
                          <div>
                             <p className="text-[10px] font-black uppercase text-black leading-tight">{assignedCoach.name}</p>
                             <p className="text-[8px] font-bold text-accent uppercase tracking-widest mt-0.5">{game?.name || 'Master Coach'}</p>
                          </div>
                       </div>
                    ) : (
                       <span className="text-[10px] font-black text-neutral-300 uppercase italic">Awaiting Auto-Assign</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => navigate(`/admin/custom-view/${req.id}`)}
                      className="px-6 py-3 bg-neutral-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all shadow-lg flex items-center gap-2 ml-auto"
                    >
                      <span className="material-symbols-outlined text-[16px]">audit</span>
                      Audit Program
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Inspector Modal Same as before but with "Coach" labels */}
      {inspectingReq && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 text-left">
          <div className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
               <div className="space-y-1 text-left">
                  <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Athlete Investigation</p>
                  <h3 className="text-4xl font-black font-display uppercase text-black leading-none">{inspectingReq.athleteName}</h3>
               </div>
               <button 
                onClick={() => setInspectingReq(null)}
                className="w-14 h-14 bg-white border border-neutral-100 rounded-2xl flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-sm"
               >
                  <span className="material-symbols-outlined">close</span>
               </button>
            </div>

            <div className="flex border-b border-neutral-100 bg-white">
              <button 
                onClick={() => setActiveModalTab('INTAKE')}
                className={`flex-1 py-6 text-center text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${activeModalTab === 'INTAKE' ? 'border-black text-black bg-neutral-50/50' : 'border-transparent text-neutral-300 hover:text-black'}`}
              >
                Inquiry Profile
              </button>
              <button 
                onClick={() => setActiveModalTab('RESULTS')}
                className={`flex-1 py-6 text-center text-[10px] font-black uppercase tracking-widest transition-all border-b-4 ${activeModalTab === 'RESULTS' ? 'border-black text-black bg-neutral-50/50' : 'border-transparent text-neutral-300 hover:text-black'}`}
              >
                Assigned Test Submissions ({inspectingReq.submissions?.length || 0})
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 no-scrollbar">
               {activeModalTab === 'INTAKE' ? (
                 <div className="space-y-10 animate-in fade-in duration-300">
                    <div className="grid grid-cols-3 gap-6">
                       {[
                          { l: 'Height', v: `${inspectingReq.biometrics.height}cm` },
                          { l: 'Weight', v: `${inspectingReq.biometrics.weight}kg` },
                          { l: 'Age', v: inspectingReq.biometrics.age }
                       ].map(s => (
                          <div key={s.l} className="p-8 bg-neutral-50 rounded-[2.5rem] border border-neutral-100 text-center shadow-inner">
                             <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{s.l}</p>
                             <p className="text-3xl font-black text-black">{s.v}</p>
                          </div>
                       ))}
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-xl font-black uppercase tracking-tight border-l-4 border-accent pl-6">Stimulus Directive</h3>
                       <div className="p-10 bg-neutral-50 rounded-[3rem] border border-neutral-100 italic text-neutral-600 leading-relaxed font-medium text-lg">
                         "{inspectingReq.goal}"
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="py-24 text-center space-y-8 animate-in slide-in-from-right-4 duration-300">
                    <span className="material-symbols-outlined text-7xl text-neutral-100 animate-pulse">monitoring</span>
                    <p className="text-neutral-300 font-black uppercase tracking-[0.3em] text-sm">Waiting for athlete to complete assigned game tests</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomRequests;
