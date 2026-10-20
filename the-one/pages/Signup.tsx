
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole, User } from '../types';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { logEvent } from '../hooks/useLogEvent';
import { useT } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';

// Firebase Auth error code → user-facing message key.
const signupErrorKey = (code?: string): TranslationKey => {
  switch (code) {
    case 'auth/email-already-in-use': return 'app.auth.err_email_in_use';
    case 'auth/invalid-email': return 'app.auth.err_invalid_email';
    case 'auth/weak-password': return 'app.auth.err_weak_password';
    case 'auth/operation-not-allowed': return 'app.auth.err_not_allowed';
    case 'auth/too-many-requests': return 'app.auth.err_too_many';
    case 'auth/network-request-failed': return 'app.auth.err_network';
    default: return 'app.auth.signup_failed';
  }
};

interface SignupProps {
  onSignup: (user: User) => void;
}

const Signup: React.FC<SignupProps> = ({ onSignup }) => {
  const navigate = useNavigate();
  const { t } = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const newUser: User = {
        id: user.uid,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: user.email || '',
        role: UserRole.CLIENT,
        avatar: `https://i.pravatar.cc/150?u=${user.uid}`,
        memberSince: new Date().getFullYear().toString(),
        level: 'Athlete'
      };

      await setDoc(doc(db, 'users', user.uid), {
        ...newUser,
        phone: formData.phone,
        role: newUser.role.toString()
      });

      onSignup(newUser);

      logEvent({
        type: 'USER_SIGNUP',
        title: 'New Athlete Registered',
        description: `${newUser.firstName} ${newUser.lastName} (${newUser.email}) created an account.`,
        userId: newUser.id,
        userName: `${newUser.firstName} ${newUser.lastName}`,
        userEmail: newUser.email,
        userAvatar: newUser.avatar,
      });

      if (newUser.role === UserRole.ADMIN) {
        navigate('/admin');
      } else {
        navigate('/profile');
      }

    } catch (err: any) {
      setError(t(signupErrorKey(err?.code)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 bg-neutral-50 animate-in fade-in duration-700">
      <div className="w-full max-w-xl space-y-10">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-black text-white shadow-2xl">
            <span className="material-symbols-outlined text-3xl">person_add</span>
          </div>
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">{t('auth.signup_heading')}</h1>
          <p className="text-neutral-500 font-medium">{t('auth.signup_sub_long')}</p>
        </div>

        <form className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-2xl border border-neutral-100 space-y-8" onSubmit={handleSignup}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 text-start">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] rtl:tracking-normal text-neutral-400 ms-1">{t('auth.first_name')}</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                placeholder={t('app.auth.first_name_ph')}
                className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-black focus:ring-2 focus:ring-black focus:border-black font-medium transition"
              />
            </div>
            <div className="space-y-2 text-start">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] rtl:tracking-normal text-neutral-400 ms-1">{t('auth.last_name')}</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                placeholder={t('app.auth.last_name_ph')}
                className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-black focus:ring-2 focus:ring-black focus:border-black font-medium transition"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2 text-start">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] rtl:tracking-normal text-neutral-400 ms-1">{t('auth.email')}</label>
              <input
                type="email"
                dir="ltr"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="name@example.com"
                className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-black focus:ring-2 focus:ring-black focus:border-black font-medium transition"
              />
            </div>

            <div className="space-y-2 text-start">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] rtl:tracking-normal text-neutral-400 ms-1">{t('auth.phone')}</label>
              <input
                type="tel"
                dir="ltr"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+1 (555) 000-0000"
                className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-black focus:ring-2 focus:ring-black focus:border-black font-medium transition"
              />
            </div>

            <div className="space-y-2 text-start">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] rtl:tracking-normal text-neutral-400 ms-1">{t('auth.create_password')}</label>
              <input
                type="password"
                dir="ltr"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-black focus:ring-2 focus:ring-black focus:border-black font-medium transition"
              />
            </div>
          </div>

          {error && (
            <p className="text-center text-xs font-bold text-red-500 uppercase tracking-widest rtl:tracking-normal animate-shake">
              {error}
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] rtl:tracking-normal text-xs hover:bg-neutral-800 shadow-xl transition flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">how_to_reg</span>
                  {t('auth.create_account')}
                </>
              )}
            </button>
          </div>

          <div className="text-[10px] font-bold text-neutral-300 uppercase leading-relaxed text-center px-4">
            {t('auth.terms_full')}
          </div>
        </form>

        <p className="text-center text-sm font-medium text-neutral-400">
          {t('auth.already_member')}
          <button onClick={() => navigate('/login')} className="font-black text-black hover:underline uppercase tracking-widest rtl:tracking-normal text-xs ms-1">
            {t('auth.login_here')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;
