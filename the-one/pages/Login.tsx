
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole, User } from '../types';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State for handling device limit logic
  const [showDeviceLimitModal, setShowDeviceLimitModal] = useState(false);
  const [existingDevices, setExistingDevices] = useState<any[]>([]);
  const [pendingFirebaseUser, setPendingFirebaseUser] = useState<any>(null);

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let browser = 'Unknown Browser';
    if (ua.indexOf("Chrome") > -1) browser = "Chrome";
    else if (ua.indexOf("Safari") > -1) browser = "Safari";
    else if (ua.indexOf("Firefox") > -1) browser = "Firefox";

    let os = 'Unknown OS';
    if (ua.indexOf("Mac") !== -1) os = "Mac OS";
    else if (ua.indexOf("Win") !== -1) os = "Windows";
    else if (ua.indexOf("Linux") !== -1) os = "Linux";
    else if (ua.indexOf("Android") !== -1) os = "Android";
    else if (ua.indexOf("like Mac") !== -1) os = "iOS";

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const location = timeZone.replace('_', ' ');

    return {
        // Use a consistent ID generation based on User Agent and OS to loosely track "same" browser
        id: `device_${btoa(ua).substring(0, 10)}`, 
        userAgent: `${os} (${browser})`,
        location: location,
        ip: 'Current Session',
        isCurrent: true,
        lastActive: new Date().toLocaleDateString()
    };
  };

  const handleDeviceLimitCheck = (firebaseUser: any) => {
    // In a real production app, device tracking MUST be server-side.
    // We are simulating it using localStorage for this demo.
    const storageKey = `user_devices_${firebaseUser.uid}`;
    let storedDevices = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Clean up current flag from old devices
    storedDevices = storedDevices.map((d: any) => ({...d, isCurrent: false}));

    const newDevice = getDeviceInfo();
    
    // Check if this specific device is already in the list
    const existingDeviceIndex = storedDevices.findIndex((d: any) => d.id === newDevice.id);

    if (existingDeviceIndex !== -1) {
        // It's the same device, just update the last active and current status
        storedDevices[existingDeviceIndex] = newDevice;
        localStorage.setItem(storageKey, JSON.stringify(storedDevices));
        sessionStorage.setItem(`current_device_id_${firebaseUser.uid}`, newDevice.id);
        return true;
    }

    if (storedDevices.length >= 2) {
        // Limit reached with a TRULY NEW device, show modal instead of just failing
        setExistingDevices(storedDevices);
        setPendingFirebaseUser(firebaseUser);
        setShowDeviceLimitModal(true);
        setLoading(false);
        return false; 
    }

    // Under limit, proceed to add new device
    storedDevices.push(newDevice);
    localStorage.setItem(`user_devices_${firebaseUser.uid}`, JSON.stringify(storedDevices));
    sessionStorage.setItem(`current_device_id_${firebaseUser.uid}`, newDevice.id);

    return true;
  };

  const finalizeLogin = async (firebaseUser: any) => {
    let role = UserRole.CLIENT;
    let userData: User = {
        id: firebaseUser.uid,
        firstName: firebaseUser.displayName?.split(' ')[0] || 'User',
        lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
        email: firebaseUser.email || '',
        role: role,
        avatar: firebaseUser.photoURL || `https://picsum.photos/100/100?random=${firebaseUser.uid}`,
        memberSince: new Date().getFullYear().toString(),
        level: 'Athlete',
    };

    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        role = data.role as UserRole;
        userData = { ...userData, ...data, role };
      } else {
         await setDoc(userRef, userData);
      }
    } catch (err) {
      console.error("Error syncing user to Firestore:", err);
    }

    onLogin(userData);

    if (userData.role === UserRole.ADMIN) navigate('/admin');
    else if (userData.role === UserRole.COACH) navigate('/coach');
    else navigate('/profile');
  };

  const syncUserToFirestore = async (firebaseUser: any) => {
    // DEVICE LIMIT CHECK
    const canLogin = handleDeviceLimitCheck(firebaseUser);
    if (!canLogin) return; // Modal will handle the rest

    await finalizeLogin(firebaseUser);
  };

  const handleRevokeDeviceAndLogin = (deviceIdToRemove: string) => {
      // Remove selected device
      const updatedDevices = existingDevices.filter(d => d.id !== deviceIdToRemove);
      
      // Add new current device
      const newDevice = getDeviceInfo();
      updatedDevices.push(newDevice);
      
      // Save
      localStorage.setItem(`user_devices_${pendingFirebaseUser.uid}`, JSON.stringify(updatedDevices));
      sessionStorage.setItem(`current_device_id_${pendingFirebaseUser.uid}`, newDevice.id);
      
      // Close modal and proceed
      setShowDeviceLimitModal(false);
      setLoading(true);
      finalizeLogin(pendingFirebaseUser);
  };

  const handleCancelDeviceLimit = () => {
      auth.signOut();
      setShowDeviceLimitModal(false);
      setPendingFirebaseUser(null);
      setError('Login cancelled due to device limits.');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await syncUserToFirestore(userCredential.user);
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
        setError('Wrong password or email.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await syncUserToFirestore(result.user);
    } catch (err: any) {
      console.error("Google login error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized. Please whitelist it in Firebase Console (Authentication > Settings > Authorized Domains).');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled.');
      } else {
        setError('Google sign-in failed. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 bg-neutral-50 animate-in fade-in duration-700 relative">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-black text-white shadow-2xl">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">Sign in to The One</h1>
          <p className="text-neutral-500 font-medium">Welcome back. Continue your training journey.</p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-neutral-100 space-y-6">
          <button 
            onClick={handleGoogleLogin}
            disabled={loading || showDeviceLimitModal}
            className="w-full py-4 bg-white border border-neutral-200 text-black rounded-2xl font-bold hover:bg-neutral-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <img src="/google.svg" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>

          <div className="flex items-center">
            <hr className="w-full border-neutral-200" />
            <span className="px-4 text-xs font-bold text-neutral-400 uppercase">or</span>
            <hr className="w-full border-neutral-200" />
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2 text-left">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Email Address</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-black focus:ring-2 focus:ring-black focus:border-black font-medium transition-all"
              />
            </div>
            
            <div className="space-y-2 text-left">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Password</label>
                <button type="button" onClick={() => navigate('/forgot-password')} className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black">
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-black focus:ring-2 focus:ring-black focus:border-black font-medium transition-all"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-neutral-400 hover:text-black"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <p className="text-center text-xs font-bold text-red-500 uppercase tracking-widest animate-shake">
                {error}
              </p>
            )}

            <button 
              type="submit" 
              disabled={loading || showDeviceLimitModal}
              className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-neutral-800 shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">login</span>
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm font-medium text-neutral-400">
          Don't have an account? 
          <button onClick={() => navigate('/signup')} className="font-black text-black hover:underline uppercase tracking-widest text-xs ml-1">
            Sign up free
          </button>
        </p>
      </div>

      {/* DEVICE LIMIT MODAL */}
      {showDeviceLimitModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden text-left flex flex-col">
              <div className="p-8 border-b border-neutral-100 bg-neutral-50/50 flex items-start gap-4">
                 <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl">important_devices</span>
                 </div>
                 <div>
                     <h3 className="text-xl font-black font-display uppercase text-black">Device Limit Reached</h3>
                     <p className="text-xs font-medium text-neutral-500 mt-1">You are already logged into 2 devices. To continue logging in here, you must revoke access from one of your existing devices.</p>
                 </div>
              </div>
              
              <div className="p-8 space-y-4">
                 <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Active Devices</p>
                 <div className="space-y-3">
                     {existingDevices.map((device) => (
                         <div key={device.id} className="flex items-center justify-between p-4 rounded-2xl border border-neutral-200 bg-white">
                             <div className="flex items-center gap-4">
                                <span className="material-symbols-outlined text-neutral-400 text-2xl">
                                  {device.userAgent.includes('iOS') || device.userAgent.includes('Android') ? 'smartphone' : 'laptop_mac'}
                                </span>
                                <div>
                                    <p className="text-sm font-black uppercase text-black">{device.userAgent}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-0.5">{device.location} • Last: {device.lastActive}</p>
                                </div>
                             </div>
                             <button 
                                onClick={() => handleRevokeDeviceAndLogin(device.id)}
                                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors"
                             >
                                Revoke
                             </button>
                         </div>
                     ))}
                 </div>
              </div>

              <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end">
                  <button 
                    onClick={handleCancelDeviceLimit}
                    className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-black transition-colors"
                  >
                    Cancel Login
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Login;
