
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { COURSES } from '../constants';

const Courses: React.FC = () => {
  const navigate = useNavigate();
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Simulated ownership for demo
  const ownedCourseIds = ['crs1']; 

  const quizQuestions = [
    {
      id: 'goal',
      question: "What is your primary training goal?",
      options: [
        { label: 'Build Aerobic Capacity', value: 'Endurance', icon: 'speed' },
        { label: 'Master Big Lifts', value: 'Weightlifting', icon: 'fitness_center' },
        { label: 'Improve Body Control', value: 'Gymnastics', icon: 'sports_gymnastics' },
        { label: 'General Fitness', value: 'All', icon: 'reorder' }
      ]
    },
    {
      id: 'level',
      question: "What is your current experience level?",
      options: [
        { label: 'Just Starting Out', value: 'Beginner', icon: 'child_care' },
        { label: 'I know my way around', value: 'Intermediate', icon: 'bolt' },
        { label: 'Elite / Competitive', value: 'Elite', icon: 'trophy' }
      ]
    }
  ];

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [quizQuestions[quizStep].id]: value };
    setAnswers(newAnswers);
    if (quizStep < quizQuestions.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      setQuizStep(quizQuestions.length); // Final step (results)
    }
  };

  const getRecommendation = () => {
    // Basic logic to find a match or return default
    const recommended = COURSES.find(c => 
      c.category === answers.goal || c.level.includes(answers.level as any)
    ) || COURSES[0];
    return recommended;
  };

  const resetQuiz = () => {
    setIsQuizOpen(false);
    setQuizStep(0);
    setAnswers({});
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-12 text-left">
      {/* Sidebar Filters */}
      <aside className="w-full lg:w-72 shrink-0">
        <div className="sticky top-28 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm">
            <h3 className="text-black text-xs font-black uppercase tracking-[0.2em] mb-8">Refine Search</h3>
            <div className="flex flex-col gap-8">
              <div>
                <p className="text-black text-[10px] font-black uppercase tracking-widest mb-4 opacity-40">Skill Level</p>
                <div className="flex flex-col gap-3">
                  {['Beginner', 'Intermediate / RX', 'Elite'].map((level) => (
                    <label key={level} className="flex items-center gap-4 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input type="checkbox" className="peer h-5 w-5 rounded-lg border-neutral-200 text-black focus:ring-black cursor-pointer appearance-none border checked:bg-black transition-all" />
                        <span className="material-symbols-outlined absolute text-[14px] text-white opacity-0 peer-checked:opacity-100 transition-opacity">check</span>
                      </div>
                      <span className="text-neutral-400 group-hover:text-black text-sm font-bold uppercase tracking-tight transition-colors">{level}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div 
            onClick={() => setIsQuizOpen(true)}
            className="bg-black rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl group cursor-pointer active:scale-[0.98] transition-all"
          >
             <div className="relative z-10 space-y-4">
               <h4 className="text-xl font-black font-display uppercase tracking-tight">Need help <br />Choosing?</h4>
               <p className="text-white/60 text-xs font-medium leading-relaxed">Take our 2-minute athlete assessment and find your perfect track.</p>
               <button className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                  Start Quiz <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
               </button>
             </div>
             <span className="material-symbols-outlined text-[100px] absolute -bottom-6 -right-6 text-white/5 group-hover:rotate-12 transition-transform duration-700">quiz</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-black text-black font-display tracking-tight uppercase">Training Tracks</h2>
            <p className="text-neutral-400 text-sm font-medium mt-2 uppercase tracking-widest">Showing {COURSES.length} Elite Programs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {COURSES.map(course => {
            const isOwned = ownedCourseIds.includes(course.id);
            return (
              <Link key={course.id} to={`/courses/${course.id}`} className="group bg-white rounded-[2.5rem] overflow-hidden border border-neutral-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col">
                <div className="relative h-72 overflow-hidden shrink-0">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                  <div className="absolute top-6 left-6 flex gap-2">
                    <span className="bg-white/90 backdrop-blur-md text-black text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-sm">{course.category}</span>
                    {isOwned && (
                      <span className="bg-green-500 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs filled">verified</span> Owned
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-10 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-black text-2xl font-bold font-display uppercase tracking-tight leading-tight">{course.title}</h3>
                    <span className="font-black text-2xl whitespace-nowrap text-black font-display">{isOwned ? 'ACTIVE' : `$${course.price}`}</span>
                  </div>
                  <p className="text-neutral-500 text-sm leading-relaxed line-clamp-2 mb-10 font-medium flex-grow">{course.description}</p>
                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-neutral-50">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-neutral-300 text-[18px]">group</span>
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{course.enrollmentCount} Active</span>
                    </div>
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black group-hover:text-accent transition-colors">
                      {isOwned ? 'Go To Hub' : 'Enroll Track'} <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bespoke Architecture Section (Custom Course) */}
        <div className="pt-8">
          <Link to="/custom-course" className="group block bg-neutral-950 rounded-[3rem] p-12 md:p-16 text-white relative overflow-hidden shadow-2xl hover:shadow-[0_20px_100px_rgba(19,127,236,0.2)] transition-all duration-700">
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-8 space-y-8">
                <div className="space-y-4">
                  <span className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-black tracking-[0.2em] uppercase w-fit">Bespoke Architecture</span>
                  <h3 className="text-4xl md:text-6xl font-black font-display uppercase tracking-tight leading-[0.95]">
                    Can't find your <br /><span className="text-accent">Perfect Cycle?</span>
                  </h3>
                  <p className="text-neutral-400 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
                    Connect 1-on-1 with a Head Coach to architect a custom training track based on your specific biomechanics, goals, and equipment access.
                  </p>
                </div>
                <div className="flex flex-wrap gap-8">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-accent">
                      <span className="material-symbols-outlined text-xl">architecture</span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Custom Logic</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-accent">
                      <span className="material-symbols-outlined text-xl">psychology_alt</span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Coach Review</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-accent">
                      <span className="material-symbols-outlined text-xl">restaurant_menu</span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Macro Strategy</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 flex justify-center lg:justify-end">
                <div className="bg-accent text-white h-20 px-10 rounded-2xl flex items-center justify-center gap-4 font-black uppercase tracking-widest text-sm shadow-2xl group-hover:-translate-y-2 transition-transform">
                  Purchase a Custom Plan
                  <span className="material-symbols-outlined">arrow_forward</span>
                </div>
              </div>
            </div>
            {/* Decorative background elements */}
            <span className="material-symbols-outlined text-[300px] absolute -bottom-20 -right-20 text-white/5 select-none -rotate-12 group-hover:rotate-0 transition-transform duration-1000">design_services</span>
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
          </Link>
        </div>
      </main>

      {/* Quiz Modal Overlay */}
      {isQuizOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col max-h-[90vh]">
              <div className="p-12 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/30 shrink-0">
                 <div className="text-left space-y-1">
                    <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Athlete Assessment</p>
                    <h3 className="text-4xl font-black font-display uppercase text-black leading-none">
                      {quizStep < quizQuestions.length ? `Inquiry Phase ${quizStep + 1}` : 'Architecture Result'}
                    </h3>
                 </div>
                 <button 
                  onClick={resetQuiz} 
                  className="w-14 h-14 bg-white border border-neutral-100 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm group"
                 >
                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">close</span>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 no-scrollbar">
                {quizStep < quizQuestions.length ? (
                  /* Question View */
                  <div className="space-y-12 animate-in slide-in-from-right-8 duration-500 text-left">
                    <div className="space-y-2">
                       <h2 className="text-3xl font-black font-display uppercase tracking-tight text-black">{quizQuestions[quizStep].question}</h2>
                       <p className="text-neutral-500 font-medium">Select the option that most accurately represents your current stimulus needs.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {quizQuestions[quizStep].options.map((opt) => (
                         <button
                           key={opt.value}
                           onClick={() => handleAnswer(opt.value)}
                           className="group p-10 rounded-[2.5rem] border-2 border-neutral-100 bg-neutral-50/50 hover:bg-white hover:border-black hover:shadow-2xl transition-all text-left flex flex-col gap-6"
                         >
                            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-lg group-hover:bg-black group-hover:text-white transition-all">
                               <span className="material-symbols-outlined text-3xl">{opt.icon}</span>
                            </div>
                            <span className="text-lg font-black uppercase tracking-widest text-black">{opt.label}</span>
                         </button>
                       ))}
                    </div>
                  </div>
                ) : (
                  /* Recommendation View */
                  <div className="space-y-12 animate-in zoom-in-95 duration-500 text-center">
                    <div className="space-y-4">
                       <div className="mx-auto w-20 h-20 bg-accent rounded-3xl flex items-center justify-center text-white shadow-2xl animate-bounce">
                          <span className="material-symbols-outlined text-4xl">verified_user</span>
                       </div>
                       <h2 className="text-4xl font-black font-display uppercase tracking-tight text-black">Perfect Match Found</h2>
                       <p className="text-neutral-500 font-medium max-w-xl mx-auto">Based on your goals and experience, we recommend this high-impact programming track.</p>
                    </div>

                    <div className="max-w-md mx-auto bg-neutral-900 rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 group text-left">
                       <div className="h-56 relative overflow-hidden">
                          <img src={getRecommendation().image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                          <div className="absolute top-6 left-6">
                             <span className="bg-accent text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg">Recommended Track</span>
                          </div>
                       </div>
                       <div className="p-10 space-y-8">
                          <div className="space-y-2">
                             <h3 className="text-2xl font-black text-white uppercase tracking-tight font-display">{getRecommendation().title}</h3>
                             <p className="text-neutral-500 text-xs font-medium line-clamp-2">{getRecommendation().description}</p>
                          </div>
                          <Link 
                            to={`/courses/${getRecommendation().id}`} 
                            onClick={resetQuiz}
                            className="block w-full py-5 bg-white text-black text-center rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-accent hover:text-white transition-all shadow-xl"
                          >
                            Explore This Program
                          </Link>
                       </div>
                    </div>

                    <button 
                      onClick={() => setQuizStep(0)}
                      className="text-[10px] font-black text-neutral-300 uppercase tracking-widest hover:text-black transition-colors"
                    >
                      Start Over / Re-assess
                    </button>
                  </div>
                )}
              </div>

              {/* Progress Bar in Modal Footer */}
              <div className="p-8 border-t border-neutral-100 bg-neutral-50/50 shrink-0">
                 <div className="max-w-xs mx-auto space-y-3">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-neutral-400">
                       <span>Inquiry Progress</span>
                       <span>{Math.round((quizStep / quizQuestions.length) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-black transition-all duration-700 ease-out" 
                         style={{ width: `${(quizStep / quizQuestions.length) * 100}%` }}
                       ></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
