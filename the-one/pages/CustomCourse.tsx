
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';

interface CustomCourseProps {
  currentUser: User | null;
}

const CustomCourse: React.FC<CustomCourseProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    sport: '',
    goal: '',
    phone: '',
    height: currentUser?.level === 'RX' ? "180" : '', 
    weight: currentUser?.level === 'RX' ? '85' : '',   
    age: '28'
  });

  const sports = [
    { id: 'crossfit', name: 'CrossFit', icon: 'fitness_center' },
    { id: 'muaythai', name: 'Muay Thai', icon: 'sports_mma' },
    { id: 'bodybuilding', name: 'Body Building', icon: 'accessibility_new' },
    { id: 'strength', name: 'Strength & Conditioning', icon: 'bolt' },
    { id: 'powerlifting', name: 'Powerlifting', icon: 'weight' },
    { id: 'general', name: 'General Fitness', icon: 'reorder' }
  ];

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    setTimeout(() => {
      alert("Custom Program Request Filed. Redirecting to PulsePay...");
      navigate(`/checkout?courseId=custom-${formData.sport}`);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="flex-grow bg-white flex flex-col items-center justify-center p-6 text-left animate-in fade-in duration-700">
      <div className="w-full max-w-4xl space-y-12 py-12">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl md:text-5xl font-black font-display uppercase tracking-tight text-black leading-none">Custom Track Architecture</h1>
            <div className="text-right">
              <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest block">Cycle Request</span>
              <span className="text-lg font-black text-accent uppercase font-display">Step {step} / 4</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-black transition-all duration-700 ease-out" 
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] border border-neutral-100 shadow-2xl overflow-hidden">
          <div className="p-10 md:p-16">
            
            {step === 1 && (
              <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black font-display uppercase tracking-tight text-black">Select your Discipline</h2>
                  <p className="text-neutral-500 font-medium">Your coach will build a program specific to this biomechanical modality.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {sports.map((sport) => (
                    <button
                      key={sport.id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, sport: sport.id });
                        handleNext();
                      }}
                      className={`group p-8 rounded-[2rem] border transition-all text-center flex flex-col items-center gap-4 ${
                        formData.sport === sport.id 
                        ? 'border-black bg-black text-white shadow-2xl' 
                        : 'border-neutral-100 bg-neutral-50 hover:border-accent hover:bg-white'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                        formData.sport === sport.id ? 'bg-white/20 text-white' : 'bg-white text-neutral-400 group-hover:text-accent'
                      }`}>
                        <span className="material-symbols-outlined text-3xl">{sport.icon}</span>
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">{sport.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black font-display uppercase tracking-tight text-black">Athlete Vitals</h2>
                  <p className="text-neutral-500 font-medium">Capture your metrics and contact line for the head coach.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-5 bg-neutral-50 rounded-2xl border border-neutral-100 font-bold text-lg text-black focus:border-black outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Age (Years)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="e.g. 28"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full p-5 bg-neutral-50 rounded-2xl border border-neutral-100 font-bold text-lg text-black focus:border-black outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Weight (KG)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="e.g. 85"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full p-5 bg-neutral-50 rounded-2xl border border-neutral-100 font-bold text-lg text-black focus:border-black outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Height (CM)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="e.g. 180"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="w-full p-5 bg-neutral-50 rounded-2xl border border-neutral-100 font-bold text-lg text-black focus:border-black outline-none transition-all" 
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={handleBack} className="flex-1 py-5 border border-neutral-100 text-neutral-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-50">Back</button>
                  <button type="button" onClick={handleNext} className="flex-[2] py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-800 shadow-xl">Set Goals</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black font-display uppercase tracking-tight text-black">Performance Objectives</h2>
                  <p className="text-neutral-500 font-medium">What is your "Why"? Be specific about your needs.</p>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">The Goal</label>
                  <textarea 
                    rows={6}
                    required
                    placeholder="I want to improve my heavy snatch and increase my aerobic threshold for Muay Thai rounds..."
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    className="w-full p-8 bg-neutral-50 rounded-3xl border border-neutral-100 font-medium text-lg text-black focus:border-black outline-none transition-all resize-none" 
                  />
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={handleBack} className="flex-1 py-5 border border-neutral-100 text-neutral-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-50">Back</button>
                  <button type="button" onClick={handleNext} className="flex-[2] py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-800 shadow-xl">Final Review</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-12 animate-in zoom-in-95 duration-500">
                <div className="flex flex-col items-center text-center gap-6">
                  <div className="w-20 h-20 bg-accent rounded-3xl flex items-center justify-center text-white shadow-2xl animate-bounce">
                    <span className="material-symbols-outlined text-4xl">verified_user</span>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black font-display uppercase tracking-tight text-black">Architecture Ready</h2>
                    <p className="text-neutral-500 font-medium">Review your profile before connecting with a Head Coach.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 bg-neutral-50 rounded-[2.5rem] border border-neutral-100 space-y-4">
                    <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Athlete Snapshot</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-3 bg-white rounded-xl shadow-sm border border-neutral-50">
                        <p className="text-[9px] font-black text-neutral-400 uppercase">Age</p>
                        <p className="text-lg font-black">{formData.age}</p>
                      </div>
                      <div className="text-center p-3 bg-white rounded-xl shadow-sm border border-neutral-50">
                        <p className="text-[9px] font-black text-neutral-400 uppercase">Height</p>
                        <p className="text-lg font-black">{formData.height}cm</p>
                      </div>
                      <div className="text-center p-3 bg-white rounded-xl shadow-sm border border-neutral-50">
                        <p className="text-[9px] font-black text-neutral-400 uppercase">Weight</p>
                        <p className="text-lg font-black">{formData.weight}kg</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-neutral-200">
                      <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-2">Discipline</p>
                      <p className="text-xl font-black text-accent uppercase tracking-tight">
                        {sports.find(s => s.id === formData.sport)?.name || 'General'}
                      </p>
                      <p className="text-[10px] font-black text-neutral-400 uppercase mt-2">Contact: {formData.phone}</p>
                    </div>
                  </div>

                  <div className="p-8 bg-neutral-50 rounded-[2.5rem] border border-neutral-100 space-y-4">
                    <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">The Directive</p>
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-neutral-50 min-h-[140px]">
                      <p className="text-xs font-medium text-neutral-500 leading-relaxed italic line-clamp-6">"{formData.goal}"</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-8 border-t border-neutral-100">
                  <button 
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-6 bg-accent text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm hover:bg-blue-600 transition-all shadow-2xl flex items-center justify-center gap-4"
                  >
                    {isProcessing ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[20px]">shopping_cart_checkout</span>
                        Authorize Request — Pay Securely
                      </>
                    )}
                  </button>
                  <button type="button" onClick={() => setStep(1)} className="w-full text-center text-[10px] font-black text-neutral-300 uppercase tracking-widest hover:text-black transition-colors">Restart Architecture</button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomCourse;
