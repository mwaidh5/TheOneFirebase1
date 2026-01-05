
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';

interface SignupProps {
  onSignup: (user: User) => void;
}

const Signup: React.FC<SignupProps> = ({ onSignup }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: UserRole.CLIENT,
        avatar: `https://i.pravatar.cc/150?u=${formData.email}`,
        memberSince: new Date().getFullYear().toString(),
        level: 'Athlete',
      };

      // Also add to the persistent user management list
      const storedUsers = JSON.parse(localStorage.getItem('ironpulse_users') || '[]');
      storedUsers.push({
        id: newUser.id,
        name: `${newUser.firstName} ${newUser.lastName}`,
        email: newUser.email,
        phone: formData.phone,
        status: 'Active',
        role: 'Athlete',
        systemRole: UserRole.CLIENT,
        lastSeen: 'Just now'
      });
      localStorage.setItem('ironpulse_users', JSON.stringify(storedUsers));

      onSignup(newUser);
      setIsLoading(false);
      navigate('/profile');
    }, 1500);
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 bg-neutral-50 animate-in fade-in duration-700">
      <div className="w-full max-w-xl space-y-10">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-black text-white shadow-2xl">
            <span className="material-symbols-outlined text-3xl">person_add</span>
          </div>
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">
            Join The One
          </h1>
          <p className="text-neutral-500 font-medium">Create your athlete profile and start your journey.</p>
        </div>

        <form className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-2xl border border-neutral-100 space-y-8" onSubmit={handleSignup}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">First Name</label>
              <input 
                type="text" 
                required
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                placeholder="Alex" 
                className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-black focus:ring-2 focus:ring-black focus:border-black font-medium transition-all" 
              />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Last Name</label>
              <input 
                type="text" 
                required
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                placeholder="Johnson" 
                className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-black focus:ring-2 focus:ring-black focus:border-black font-medium transition-all" 
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Email Address</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="name@example.com" 
                className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-black focus:ring-2 focus:ring-black focus:border-black font-medium transition-all" 
              />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Phone Number</label>
              <input 
                type="tel" 
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+1 (555) 000-0000" 
                className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-black focus:ring-2 focus:ring-black focus:border-black font-medium transition-all" 
              />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Create Password</label>
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••" 
                className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-black focus:ring-2 focus:ring-black focus:border-black font-medium transition-all" 
              />
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-neutral-800 shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">how_to_reg</span>
                  Create Athlete Account
                </>
              )}
            </button>
          </div>

          <div className="text-[10px] font-bold text-neutral-300 uppercase leading-relaxed text-center px-4">
            By signing up, you agree to our <span className="text-black underline cursor-pointer">Terms of Service</span> and <span className="text-black underline cursor-pointer">Privacy Policy</span>.
          </div>
        </form>

        <p className="text-center text-sm font-medium text-neutral-400">
          Already a member? <Link to="/login" className="font-black text-black hover:underline uppercase tracking-widest text-xs ml-1">Log in here</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
