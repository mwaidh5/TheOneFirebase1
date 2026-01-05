
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { MOCK_ADMIN } from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [trustDevice, setTrustDevice] = useState(true);
  const [isError, setIsError] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for hardcoded Admin credentials
    if (email === 'mahmood' && password === 'Whiteelv123?') {
      executeLogin(MOCK_ADMIN);
      return;
    }

    // Fallback to simulated user lookup
    const storedUsers = JSON.parse(localStorage.getItem('ironpulse_users') || '[]');
    const userMatch = storedUsers.find((u: any) => u.email === email);

    if (userMatch) {
      const userToLogin: User = {
        id: userMatch.id,
        firstName: userMatch.name.split(' ')[0],
        lastName: userMatch.name.split(' ').slice(1).join(' '),
        email: userMatch.email,
        role: userMatch.systemRole,
        avatar: `https://picsum.photos/100/100?random=${userMatch.id}`,
        memberSince: '2024',
        level: userMatch.role || 'Athlete'
      };

      const isPrivileged = [UserRole.ADMIN, UserRole.COACH, UserRole.SUPPORT].includes(userToLogin.role);
      const isTrusted = localStorage.getItem(`trusted_device_${userToLogin.id}`) === 'true';

      if (isPrivileged && !isTrusted) {
        setPendingUser(userToLogin);
        setShow2FA(true);
      } else {
        executeLogin(userToLogin);
      }
    } else {
      alert("Invalid credentials. Use username 'mahmood' and pass 'Whiteelv123?' for Admin access.");
    }
  };

  const executeLogin = (user: User) => {
    if (trustDevice && user) {
      localStorage.setItem(`trusted_device_${user.id}`, 'true');
    }
    
    onLogin(user);
    if (user.role === UserRole.ADMIN) navigate('/admin');
    else if (user.role === UserRole.COACH) navigate('/coach');
    else if (user.role === UserRole.SUPPORT) navigate('/support');
    else navigate('/profile');
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const verifyMfa = (e: React.FormEvent) => {
    e.preventDefault();
    setIs2FALoading(true);
    setIsError(false);

    setTimeout(() => {
      const codeStr = otpCode.join('');
      if (codeStr === '123456' || codeStr === '000000') {
        if (pendingUser) executeLogin(pendingUser);
      } else {
        setIsError(true);
        setIs2FALoading(false);
        setOtpCode(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
      }
    }, 1500);
  };

  if (show2FA && pendingUser) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 bg-neutral-50 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-full max-w-md space-y-10">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-accent text-white shadow-[0_0_40px_rgba(19,127,236,0.3)] animate-pulse">
              <span className="material-symbols-outlined text-3xl filled">verified_user</span>
            </div>
            <h1 className="text-3xl font-black font-display tracking-tight text-black uppercase">Identity Protocol</h1>
            <p className="text-neutral-500 font-medium text-sm">
              An MFA challenge is required for <span className="text-black font-bold uppercase">{pendingUser.role}</span> access. <br /> Enter the code from Google Authenticator.
            </p>
          </div>

          <form onSubmit={verifyMfa} className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-neutral-100 space-y-10">
            <div className="flex justify-between gap-3">
              {otpCode.map((val, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  maxLength={1}
                  value={val}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  className={`w-full h-16 text-center text-2xl font-black rounded-2xl border bg-neutral-50 focus:ring-2 focus:ring-accent outline-none transition-all ${isError ? 'border-red-500 bg-red-50' : 'border-neutral-100'}`}
                />
              ))}
            </div>

            {isError && (
              <p className="text-center text-xs font-black text-red-500 uppercase tracking-widest animate-bounce">Verification Failed: Invalid Token</p>
            )}

            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400">
                     <span className="material-symbols-outlined text-lg">laptop_mac</span>
                  </div>
                  <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest cursor-pointer" htmlFor="trust">Trust this device</label>
                </div>
                <div 
                  onClick={() => setTrustDevice(!trustDevice)}
                  className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${trustDevice ? 'bg-accent' : 'bg-neutral-200'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${trustDevice ? 'translate-x-7' : 'translate-x-1'}`}></div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={is2FALoading || otpCode.some(c => !c)}
                className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-neutral-800 shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-30"
              >
                {is2FALoading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">shield</span>
                    Verify Identity
                  </>
                )}
              </button>
            </div>
            
            <button 
              type="button" 
              onClick={() => { setShow2FA(false); setPendingUser(null); setOtpCode(['','','','','','']); }}
              className="w-full text-center text-[10px] font-black text-neutral-300 uppercase tracking-widest hover:text-black transition-colors"
            >
              Cancel Authorization
            </button>
          </form>

          <div className="p-6 bg-neutral-100 rounded-[2rem] flex items-start gap-4">
             <span className="material-symbols-outlined text-accent">info</span>
             <p className="text-[10px] font-bold text-neutral-500 leading-relaxed uppercase">
                Staff Hint: Use <span className="text-black font-black">123456</span> to authorize this device during initial setup.
             </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 bg-neutral-50 animate-in fade-in duration-700">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-black text-white shadow-2xl">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">
            Sign in to The One
          </h1>
          <p className="text-neutral-500 font-medium">Welcome back. Continue your training journey.</p>
        </div>

        <form className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-neutral-100 space-y-8" onSubmit={handleLoginSubmit}>
          <div className="space-y-6">
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Email or Username</label>
              <input 
                type="text" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com or username" 
                className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-black focus:ring-2 focus:ring-black focus:border-black font-medium transition-all" 
              />
            </div>
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Password</label>
                <Link to="/forgot-password" size="sm" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black">Forgot?</Link>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-black focus:ring-2 focus:ring-black focus:border-black font-medium transition-all" 
              />
            </div>
          </div>

          <div className="space-y-3">
            <button 
              type="submit"
              className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-neutral-800 shadow-xl transition-all flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined text-lg">login</span>
              Sign In
            </button>
          </div>
        </form>

        <p className="text-center text-sm font-medium text-neutral-400">
          Don't have an account? <Link to="/signup" className="font-black text-black hover:underline uppercase tracking-widest text-xs ml-1">Sign up free</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
