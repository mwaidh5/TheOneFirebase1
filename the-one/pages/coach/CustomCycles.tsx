
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_CUSTOM_REQUESTS, COACHES } from '../../constants';

const CoachCustomCycles: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 text-left animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">Custom Workouts</h1>
          <p className="text-neutral-400 font-medium">Manage your private clients and review their submitted videos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {MOCK_CUSTOM_REQUESTS.map((req) => {
          const isPendingReview = req.status === 'DIAGNOSTIC';
          const isBuilding = req.status === 'BUILDING';
          const isFinished = req.status === 'COMPLETED';

          return (
            <div key={req.id} className={`bg-white rounded-[2.5rem] p-10 border transition-all group relative overflow-hidden flex flex-col ${isPendingReview ? 'border-accent shadow-accent/5 ring-1 ring-accent/10' : 'border-neutral-100 shadow-sm hover:shadow-2xl'}`}>
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="space-y-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isPendingReview ? 'text-accent' : 'text-neutral-300'}`}>
                    {req.sport} Custom Plan
                  </span>
                  <h3 className="text-3xl font-black text-black uppercase tracking-tight leading-none">{req.athleteName}</h3>
                </div>
                <div className="flex -space-x-3">
                  {req.assignedCoachIds.map(cid => (
                    <div key={cid} className="w-12 h-12 rounded-full border-4 border-white overflow-hidden shadow-xl ring-2 ring-neutral-50">
                      <img src={COACHES.find(c => c.id === cid)?.avatar} className="w-full h-full object-cover" alt="" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-neutral-50 rounded-3xl border border-neutral-100 mb-8 space-y-4 relative z-10">
                 <p className="italic text-xs font-medium text-neutral-500 leading-relaxed">Goal: "{req.goal}"</p>
                 {isPendingReview && (
                   <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
                      <span className="material-symbols-outlined text-accent animate-pulse">new_releases</span>
                      <p className="text-[10px] font-black uppercase text-accent tracking-widest">New videos ready for review</p>
                   </div>
                 )}
              </div>

              <div className="mt-auto flex items-center justify-between pt-8 border-t border-neutral-50 relative z-20">
                 <div>
                   <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Current Stage</p>
                   <p className={`text-sm font-black uppercase tracking-tight ${isPendingReview ? 'text-accent' : isBuilding ? 'text-orange-600' : 'text-green-600'}`}>
                     {isPendingReview ? 'Reviewing Athlete' : isBuilding ? 'Building Workout' : 'Plan Active'}
                   </p>
                 </div>
                 <button 
                  onClick={() => navigate(`/coach/programmer/${req.id}`)}
                  className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 ${isPendingReview ? 'bg-accent text-white hover:bg-blue-600' : 'bg-black text-white hover:bg-neutral-800'}`}
                 >
                   <span className="material-symbols-outlined text-[18px]">{isPendingReview ? 'visibility' : 'edit_square'}</span>
                   {isPendingReview ? 'Review & Build' : 'Edit Workout'}
                 </button>
              </div>
              
              {/* Added pointer-events-none to prevent icon from blocking button clicks */}
              <span className={`material-symbols-outlined text-[160px] absolute -bottom-10 -right-10 select-none -rotate-12 transition-transform duration-700 pointer-events-none ${isPendingReview ? 'text-accent/5 group-hover:rotate-0' : 'text-neutral-50 group-hover:rotate-0'}`}>
                {isPendingReview ? 'reviews' : 'edit_note'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CoachCustomCycles;
