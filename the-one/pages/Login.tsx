
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, UserRole } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const executeLogin = async (firebaseUser: any) => {
    // Determine Role (in production, this should be more robust)
    const isAdminEmail = ['mwaidh5@gmail.com', 'mwaidh@yahoo.com'].includes(firebaseUser.email?.toLowerCase());
    const role = isAdminEmail ? UserRole.ADMIN : UserRole.CLIENT; // Default to CLIENT, could be Coach if logic exists

    // Prepare User Object
    const userData: User = {
      id: firebaseUser.uid,
      firstName: firebaseUser.displayName?.split(' ')[0] || 'User',
      lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
      email: firebaseUser.email || '',
      role: role,
      avatar: firebaseUser.photoURL || `https://picsum.photos/100/100?random=${firebaseUser.uid}`,
      memberSince: '2024',
      level: 'Athlete',
    };

    // SYNC USER TO FIRESTORE for Security Rules
    try {
        // Check if user exists first to avoid overwriting existing roles if we had a more complex system
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // New user, save full profile
            await setDoc(userRef, { ...userData, role: role.toString() }); // Save role as string match for rules
        } else {
            // Existing user, update basic info but maybe preserve role if it was manually changed in DB
            // For this demo, we enforce the hardcoded admin check again to ensure access
            const currentData = userSnap.data();
            const finalRole = isAdminEmail ? 'Admin' : (currentData.role || 'Client');
            
            // Update local object to match DB if needed
            if (finalRole === 'Admin') userData.role = UserRole.ADMIN;
            else if (finalRole === 'Coach') userData.role = UserRole.COACH;
            else userData.role = UserRole.CLIENT;

            await setDoc(userRef, { ...userData, role: finalRole }, { merge: true });
        }
    } catch (error) {
        console.error("Error syncing user to Firestore:", error);
        // Continue login even if sync fails, though rules might block writes
    }
    
    onLogin(userData);
    if (userData.role === UserRole.ADMIN) navigate('/admin');
    else if (userData.role === UserRole.COACH) navigate('/coach');
    else navigate('/profile');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    /* 
       BYPASS REMOVED: Authentication via Firebase is required for Storage access.
       If you are using mwaidh@yahoo.com, ensure it is a valid user in Firebase Auth.
    */
    /*
    if (email.trim().toLowerCase() === 'mwaidh@yahoo.com') {
      const mockFirebaseUser = {
        uid: 'demo-admin-user',
        displayName: 'Admin User',
        email: 'mwaidh@yahoo.com',
        photoURL: '',
      };
      await executeLogin(mockFirebaseUser);
      setIsLoading(false);
      return;
    }
    */

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await executeLogin(userCredential.user);
    } catch (error: any) { 
      setLoginError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoginError('');
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await executeLogin(result.user);
    } catch (error: any) {
      setLoginError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 bg-neutral-50 animate-in fade-in duration-700">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-black text-white shadow-2xl">
            <span className="material-symbols-outlined text-3xl">lock</span>
          </div>
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">
            Sign in to The One
          </h1>
          <p className="text-neutral-500 font-medium">Welcome back. Continue your training journey.</p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-neutral-100 space-y-6">
          <button 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
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

          <form className="space-y-6" onSubmit={handleLoginSubmit}>
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
                <Link to="/forgot-password" className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-black">Forgot?</Link>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
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

            {loginError && (
              <p className="text-center text-xs font-bold text-red-500 uppercase tracking-widest animate-shake">
                {loginError}
              </p>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-neutral-800 shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoading ? (
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
          Don't have an account? <Link to="/signup" className="font-black text-black hover:underline uppercase tracking-widest text-xs ml-1">Sign up free</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
