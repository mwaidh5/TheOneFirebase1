import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { useT } from '../i18n/I18nContext';

interface MorePageProps {
  currentUser: User | null;
  onLogout: () => void;
}

interface Row { to: string; icon: string; label: string; accent?: boolean; }

const MorePage: React.FC<MorePageProps> = ({ currentUser, onLogout }) => {
  const navigate = useNavigate();
  const { t, lang, setLang } = useT();

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-black text-white flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl">person</span>
        </div>
        <h1 className="text-2xl font-black font-display uppercase">{t('nav.account')}</h1>
        <p className="text-neutral-400 text-sm font-medium">{t('auth.login_sub')}</p>
        <div className="flex gap-3 justify-center">
          <Link to="/login" className="px-6 py-3 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest">{t('nav.login')}</Link>
          <Link to="/signup" className="px-6 py-3 bg-neutral-100 text-black rounded-2xl text-[11px] font-black uppercase tracking-widest">{t('nav.signup')}</Link>
        </div>
      </div>
    );
  }

  const rolePanel: Row | null =
    currentUser.role === UserRole.ADMIN ? { to: '/admin', icon: 'dashboard', label: t('nav.admin'), accent: true } :
    currentUser.role === UserRole.COACH ? { to: '/coach', icon: 'fitness_center', label: t('nav.coach'), accent: true } :
    currentUser.role === UserRole.SUPPORT ? { to: '/support', icon: 'support_agent', label: t('nav.support'), accent: true } :
    null;

  const account: Row[] = [
    { to: '/profile', icon: 'person', label: t('nav.profile') },
    { to: '/profile/courses', icon: 'school', label: t('nav.my_courses') },
    { to: '/profile/messages', icon: 'chat_bubble', label: t('nav.messages') },
    { to: '/profile/nutrition', icon: 'restaurant', label: t('nav.nutrition') },
    { to: '/profile/vitals', icon: 'monitor_heart', label: t('nav.vitals') },
  ];

  const settings: Row[] = [
    { to: '/profile/settings', icon: 'settings', label: t('nav.settings') },
    { to: '/profile/notifications', icon: 'notifications', label: t('nav.notifications') },
    { to: '/profile/billing', icon: 'receipt_long', label: t('nav.billing') },
  ];

  const Section: React.FC<{ title: string; rows: Row[] }> = ({ title, rows }) => (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">{title}</p>
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden divide-y divide-neutral-50">
        {rows.map((r) => (
          <Link key={r.to} to={r.to} className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 transition-colors">
            <span className={`material-symbols-outlined text-[22px] ${r.accent ? 'text-accent filled' : 'text-neutral-400'}`}>{r.icon}</span>
            <span className={`flex-1 text-sm font-bold ${r.accent ? 'text-accent uppercase tracking-wide' : 'text-black'}`}>{r.label}</span>
            <span className="material-symbols-outlined text-neutral-300 text-[20px]">chevron_right</span>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-5 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Profile header */}
      <Link to="/profile" className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-neutral-100 hover:border-black transition-all">
        <img src={currentUser.avatar} alt="" className="w-14 h-14 rounded-2xl object-cover border border-neutral-200" />
        <div className="flex-1 min-w-0">
          <p className="text-lg font-black uppercase text-black leading-tight truncate">{currentUser.firstName} {currentUser.lastName}</p>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">{currentUser.role}</p>
        </div>
        <span className="material-symbols-outlined text-neutral-300">chevron_right</span>
      </Link>

      {rolePanel && <Section title={t('nav.dashboard')} rows={[rolePanel]} />}

      <Section title={t('nav.account')} rows={account} />
      <Section title={t('nav.settings')} rows={settings} />

      {/* Language */}
      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">{t('settings.language')}</p>
        <div className="bg-white rounded-2xl border border-neutral-100 p-2 flex gap-2">
          {(['en', 'ar'] as const).map((code) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${lang === code ? 'bg-black text-white' : 'text-neutral-400 hover:bg-neutral-50'}`}
            >
              {code === 'en' ? 'English' : 'العربية'}
            </button>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={() => { onLogout(); navigate('/login'); }}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-50 text-red-600 font-black uppercase tracking-widest text-[11px] hover:bg-red-500 hover:text-white transition-all"
      >
        <span className="material-symbols-outlined text-[20px]">logout</span>
        {t('nav.logout')}
      </button>
    </div>
  );
};

export default MorePage;
