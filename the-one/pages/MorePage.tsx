import React, { useState } from 'react';
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
  // Accordion: sections stay collapsed until tapped — keeps the page compact.
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

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
    { to: '/profile/settings', icon: 'manage_accounts', label: t('settings.tab_personal') },
    { to: '/profile/notifications', icon: 'notifications', label: t('nav.notifications') },
    { to: '/profile/billing', icon: 'receipt_long', label: t('nav.billing') },
  ];

  // Collapsible group: header row toggles its contents.
  const Section: React.FC<{ id: string; icon: string; title: string; rows: Row[]; extra?: React.ReactNode }> = ({ id, icon, title, rows, extra }) => (
    <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
      <button onClick={() => toggle(id)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-neutral-50 transition-colors">
        <span className="material-symbols-outlined text-[24px] text-neutral-500">{icon}</span>
        <span className="flex-1 text-start text-base font-black uppercase tracking-wide text-black">{title}</span>
        <span className={`material-symbols-outlined text-neutral-300 transition-transform ${open[id] ? 'rotate-180' : ''}`}>expand_more</span>
      </button>
      {open[id] && (
        <div className="divide-y divide-neutral-50 border-t border-neutral-50 animate-in fade-in duration-200">
          {rows.map((r) => (
            <Link key={r.to} to={r.to} className="flex items-center gap-4 ps-7 pe-5 py-3.5 hover:bg-neutral-50 transition-colors">
              <span className={`material-symbols-outlined text-[22px] ${r.accent ? 'text-accent filled' : 'text-neutral-400'}`}>{r.icon}</span>
              <span className={`flex-1 text-sm font-bold ${r.accent ? 'text-accent uppercase tracking-wide' : 'text-black'}`}>{r.label}</span>
              <span className="material-symbols-outlined text-neutral-300 text-[20px]">chevron_right</span>
            </Link>
          ))}
          {extra}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 space-y-3 animate-in fade-in duration-300">
      {/* Profile header */}
      <Link to="/profile" className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-neutral-100 hover:border-black transition-all">
        <img src={currentUser.avatar} alt="" className="w-14 h-14 rounded-2xl object-cover border border-neutral-200" />
        <div className="flex-1 min-w-0">
          <p className="text-xl font-black uppercase text-black leading-tight truncate">{currentUser.firstName} {currentUser.lastName}</p>
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{currentUser.role}</p>
        </div>
        <span className="material-symbols-outlined text-neutral-300">chevron_right</span>
      </Link>

      {/* Role dashboard stays one tap away (not buried in a group) */}
      {rolePanel && (
        <Link to={rolePanel.to} className="flex items-center gap-3 px-5 py-4 bg-accent text-white rounded-2xl shadow-lg shadow-accent/20">
          <span className="material-symbols-outlined text-[24px] filled">{rolePanel.icon}</span>
          <span className="flex-1 text-base font-black uppercase tracking-wide">{rolePanel.label}</span>
          <span className="material-symbols-outlined">chevron_right</span>
        </Link>
      )}

      <Section id="account" icon="person" title={t('nav.account')} rows={account} />
      <Section
        id="settings"
        icon="settings"
        title={t('nav.settings')}
        rows={settings}
        extra={
          <div className="ps-7 pe-5 py-3.5 flex items-center gap-4">
            <span className="material-symbols-outlined text-[22px] text-neutral-400">translate</span>
            <span className="flex-1 text-sm font-bold text-black">{t('settings.language')}</span>
            <div className="flex gap-1 bg-neutral-50 rounded-xl p-1">
              {(['en', 'ar'] as const).map((code) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${lang === code ? 'bg-black text-white' : 'text-neutral-400'}`}
                >
                  {code === 'en' ? 'EN' : 'ع'}
                </button>
              ))}
            </div>
          </div>
        }
      />

      {/* Logout */}
      <button
        onClick={() => { onLogout(); navigate('/login'); }}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-50 text-red-600 font-black uppercase tracking-widest text-xs hover:bg-red-500 hover:text-white transition-all"
      >
        <span className="material-symbols-outlined text-[20px]">logout</span>
        {t('nav.logout')}
      </button>
    </div>
  );
};

export default MorePage;
