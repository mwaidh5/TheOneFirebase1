
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { useT } from '../i18n/I18nContext';

const ForgotPassword: React.FC = () => {
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(t('auth.reset_sent'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-6 bg-neutral-50 animate-in fade-in duration-700">
      <div className="w-full max-w-md space-y-10">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-black text-white shadow-2xl">
            <span className="material-symbols-outlined text-3xl">key</span>
          </div>
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">
            {t('auth.forgot_title')}
          </h1>
          <p className="text-neutral-500 font-medium">{t('auth.forgot_sub')}</p>
        </div>

        <form className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-neutral-100 space-y-8" onSubmit={handleReset}>
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">{t('auth.email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-2xl border border-neutral-100 bg-neutral-50 p-4 text-black focus:ring-2 focus:ring-black focus:border-black font-medium transition-all"
            />
          </div>

          {message && (
            <p className="text-center text-xs font-bold text-green-600 uppercase tracking-widest animate-pulse">
              {message}
            </p>
          )}

          {error && (
            <p className="text-center text-xs font-bold text-red-500 uppercase tracking-widest animate-shake">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-neutral-800 shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">send</span>
                {t('auth.send_reset_link')}
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm font-medium text-neutral-400">
          <Link to="/login" className="font-black text-black hover:underline uppercase tracking-widest text-xs ml-1">{t('auth.back_to_login')}</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
