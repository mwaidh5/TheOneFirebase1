
import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, CustomCourseRequest, AthleteSubmission, DiagnosticTest } from '../types';
import { MOCK_CUSTOM_REQUESTS } from '../constants';

interface AthleteDiagnosticsProps {
  currentUser: User | null;
}

const AthleteDiagnostics: React.FC<AthleteDiagnosticsProps> = ({ currentUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const request = MOCK_CUSTOM_REQUESTS.find(r => r.id === 'REQ-6WK')!; 
  
  const allTests: DiagnosticTest[] = [
    ...(request.diagnostics || []),
    { id: 'd-3', title: 'Injury History', instruction: 'Please list any past or current injuries we should know about.', inputType: 'TEXT', required: true }
  ];

  const [submissions, setSubmissions] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const completedCount = allTests.filter(t => submissions[t.id]?.trim()).length;
  const progress = (completedCount / allTests.length) * 100;
  const isAllFilled = completedCount === allTests.length;

  const handleFileUpload = (testId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSubmissions(prev => ({ ...prev, [testId]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleTextChange = (testId: string, val: string) => {
    setSubmissions(prev => ({ ...prev, [testId]: val }));
  };

  const submitAll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllFilled) return;
    
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsFinished(true);
      
      // TRIGGER AUTOMATED MESSAGE FLAG
      localStorage.setItem('automated_msg_diagnostic', 'true');
    }, 2000);
  };

  if (isFinished) {
    return (
      <div className="flex-grow bg-white flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-700 min-h-[80vh]">
        <div className="max-w-2xl space-y-10">
          <div className="w-24 h-24 bg-accent rounded-[2.5rem] flex items-center justify-center text-white mx-auto shadow-2xl animate-bounce">
            <span className="material-symbols-outlined text-4xl filled">hourglass_top</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-black font-display uppercase tracking-tight text-black">Workout in the making</h1>
            <p className="text-xl text-neutral-500 font-medium leading-relaxed">
              Your answers and videos are with <span className="text-black font-bold">Coach Mercer</span>. 
              It usually takes <span className="text-accent font-bold">2 to 4 days</span> to finish your custom workout.
            </p>
          </div>
          <div className="p-8 bg-neutral-50 rounded-[3rem] border border-neutral-100 flex items-center gap-6 text-left">
             <span className="material-symbols-outlined text-4xl text-accent">notifications_active</span>
             <div>
                <p className="text-sm font-black uppercase text-black">What happens now?</p>
                <p className="text-xs text-neutral-400 font-medium">We will notify you here and via email as soon as your workout is ready to start.</p>
             </div>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="px-12 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-800 transition-all shadow-xl"
          >
            Go to My Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-screen pb-24 text-left animate-in fade-in duration-700">
      <div className="bg-white border-b border-neutral-100 sticky top-20 z-40">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="space-y-1">
              <nav className="flex items-center gap-3 text-[10px] font-black text-accent uppercase tracking-[0.3em]">
                 <span className="w-2 h-2 rounded-full bg-accent animate-ping"></span>
                 Custom Workout Questions
              </nav>
              <h1 className="text-3xl font-black font-display uppercase text-black leading-none">Athlete Assessment</h1>
           </div>
           <div className="flex items-center gap-6 min-w-[300px]">
              <div className="flex-1 space-y-2">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-neutral-400">Progress</span>
                    <span className="text-accent">{Math.round(progress)}%</span>
                 </div>
                 <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden border border-neutral-50">
                    <div className="h-full bg-black transition-all duration-700" style={{ width: `${progress}%` }}></div>
                 </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-black text-lg shadow-lg">
                 {completedCount}/{allTests.length}
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-12">
        <form onSubmit={submitAll} className="space-y-10">
          <div className="space-y-6">
             <div className="p-8 bg-accent/5 border border-accent/10 rounded-[2.5rem]">
                <p className="text-sm font-medium text-accent leading-relaxed italic">
                  "Please answer everything below. Coach Mercer uses these to build a workout that fits you perfectly."
                </p>
             </div>

             {allTests.map((test, idx) => (
                <div key={test.id} className="bg-white rounded-[3rem] border border-neutral-100 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                   <div className="p-10 grid grid-cols-1 md:grid-cols-12 gap-10">
                      <div className="md:col-span-7 space-y-6">
                         <div className="space-y-2">
                            <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Step {idx + 1}</span>
                            <h3 className="text-2xl font-black font-display uppercase tracking-tight text-black">{test.title}</h3>
                            <p className="text-sm text-neutral-500 font-medium leading-relaxed italic border-l-4 border-accent pl-6">
                               "{test.instruction}"
                            </p>
                         </div>

                         {(test.inputType === 'VIDEO' || test.inputType === 'IMAGE') && (
                            <div className="aspect-video bg-neutral-900 rounded-[2rem] overflow-hidden relative border-8 border-neutral-50 shadow-inner group">
                               <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-100 group-hover:bg-black/20 transition-all cursor-pointer">
                                  <span className="material-symbols-outlined text-white text-5xl group-hover:scale-110 transition-transform">play_circle</span>
                               </div>
                               <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                  <p className="text-white text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                                     <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Coach Demo
                                  </p>
                               </div>
                            </div>
                         )}
                      </div>

                      <div className="md:col-span-5 flex flex-col justify-center">
                         {test.inputType === 'TEXT' ? (
                            <div className="space-y-4">
                               <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest ml-1">Your Answer</label>
                               <textarea 
                                  required={test.required}
                                  value={submissions[test.id] || ''}
                                  onChange={(e) => handleTextChange(test.id, e.target.value)}
                                  rows={6}
                                  placeholder="Type here..."
                                  className="w-full p-6 bg-neutral-50 border border-neutral-100 rounded-3xl text-sm font-medium focus:border-black focus:bg-white outline-none transition-all resize-none shadow-inner"
                               />
                            </div>
                         ) : (
                            <div className="space-y-4">
                               <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest ml-1">Upload File</label>
                               <div 
                                  onClick={() => fileInputRefs.current[test.id]?.click()}
                                  className={`aspect-square rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all hover:bg-neutral-50 ${submissions[test.id] ? 'border-accent bg-accent/5 shadow-xl shadow-accent/10' : 'border-neutral-200 bg-neutral-50 hover:border-black'}`}
                               >
                                  <input 
                                     type="file" 
                                     ref={el => fileInputRefs.current[test.id] = el}
                                     className="hidden" 
                                     onChange={(e) => handleFileUpload(test.id, e)} 
                                     accept={test.inputType === 'VIDEO' ? 'video/*' : 'image/*'} 
                                  />
                                  {submissions[test.id] ? (
                                     <>
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-accent text-white flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                                           <span className="material-symbols-outlined text-3xl filled">check</span>
                                        </div>
                                        <div className="text-center">
                                           <p className="text-[10px] font-black uppercase text-accent tracking-[0.2em]">File Uploaded</p>
                                           <button type="button" className="text-[8px] font-black text-neutral-300 uppercase underline mt-1">Change File</button>
                                        </div>
                                     </>
                                  ) : (
                                     <>
                                        <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center text-neutral-300 group-hover:text-black transition-colors">
                                           <span className="material-symbols-outlined text-2xl">{test.inputType === 'VIDEO' ? 'videocam' : 'photo_camera'}</span>
                                        </div>
                                        <div className="text-center px-6">
                                           <p className="text-[10px] font-black uppercase tracking-widest text-black">Click to Upload</p>
                                           <p className="text-[9px] font-medium text-neutral-400 mt-1 max-w-[140px] mx-auto leading-tight">Please upload a {test.inputType.toLowerCase()} for the coach.</p>
                                        </div>
                                     </>
                                  )}
                               </div>
                            </div>
                         )}
                      </div>
                   </div>
                </div>
             ))}
          </div>

          <div className="pt-12 border-t border-neutral-100">
             <button 
                type="submit"
                disabled={!isAllFilled || isSubmitting}
                className="w-full py-8 bg-black text-white rounded-[3rem] font-black uppercase tracking-[0.3em] text-sm hover:bg-neutral-800 transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-20 disabled:cursor-not-allowed group"
             >
                {isSubmitting ? (
                   <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                   <>
                      <span className="material-symbols-outlined text-xl group-hover:translate-y-[-2px] transition-transform">send</span>
                      Submit All Answers
                   </>
                )}
             </button>
             {!isAllFilled && (
                <p className="text-center text-[10px] font-black uppercase text-neutral-300 tracking-widest mt-6 animate-pulse">
                   Please finish all {allTests.length} questions to submit
                </p>
             )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AthleteDiagnostics;
