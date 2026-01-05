
import React from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword: React.FC = () => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 bg-neutral-50">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-black text-white shadow-2xl">
            <span className="material-symbols-outlined text-3xl">key</span>
          </div>
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">
            Reset Password
          </h1>
          <p className="text-neutral-500 font-medium">Enter your email and we'll send you a recovery link.</p>
        </div>

        <form className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-neutral-100 space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Email Address</label>
            <input type="email" placeholder="name@example.com" className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-black focus:ring-2 focus:ring-black focus:border-black font-medium transition-all" />
          </div>

          <button className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-neutral-800 shadow-xl transition-all">
            Send Reset Link
          </button>
        </form>

        <p className="text-center text-sm font-medium text-neutral-400">
          Remembered? <Link to="/login" className="font-black text-black hover:underline uppercase tracking-widest text-xs ml-1">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
