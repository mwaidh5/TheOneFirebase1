import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import BottomNav from './BottomNav';
import LanguageToggle from './LanguageToggle';
import { Capacitor } from '@capacitor/core';
import { User } from '../types';

interface AppShellProps {
  isLoggedIn: boolean;
  currentUser: User | null;
  onLogout: () => void;
  logo?: string;
  originalAdmin: User | null;
  stopImpersonating: () => void;
  children: React.ReactNode;
}

/**
 * Decides the app chrome based on the current route:
 *  - Role areas (/admin, /coach, /support): keep the original top Navbar + Footer.
 *  - Auth screens (login/signup/forgot): no chrome at all (clean full-screen).
 *  - Everything else (the user-facing app): a native-style bottom tab bar,
 *    no top header, no footer.
 */
const AppShell: React.FC<AppShellProps> = ({
  isLoggedIn,
  currentUser,
  onLogout,
  logo,
  originalAdmin,
  stopImpersonating,
  children,
}) => {
  const path = useLocation().pathname;
  const navigate = useNavigate();
  const goBack = () => { if (window.history.length > 1) navigate(-1); else navigate('/'); };

  const isNative = Capacitor.isNativePlatform();
  const isRole = /^\/(admin|coach|support)(\/|$)/.test(path);
  const isAuth = ['/login', '/signup', '/forgot-password'].includes(path);

  const banner = originalAdmin ? (
    <div className="bg-accent py-2 px-6 flex items-center justify-center gap-6 animate-in slide-in-from-top duration-500 z-[110] fixed w-full top-0 left-0 shadow-xl">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-white text-[18px] filled animate-pulse">admin_panel_settings</span>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
          Viewing as <span className="underline decoration-white/30 decoration-2 underline-offset-4">{currentUser?.firstName} {currentUser?.lastName}</span>
        </p>
      </div>
      <button
        onClick={stopImpersonating}
        className="bg-white text-accent px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-xl"
      >
        Exit Session
      </button>
    </div>
  ) : null;

  // ── Web (any browser): the original full website — top navbar + footer on every route ──
  if (!isNative) {
    return (
      <div className="flex flex-col min-h-screen">
        {banner}
        <div className={originalAdmin ? 'mt-12' : ''}>
          <Navbar isLoggedIn={isLoggedIn} currentUser={currentUser} onLogout={onLogout} logo={logo} />
        </div>
        <main className="flex-grow flex flex-col">{children}</main>
        <Footer logo={logo} />
      </div>
    );
  }

  // ── Native app: app chrome — bottom tab bar, no top header, clean auth screens ──
  // Role areas (admin/coach/support) use their OWN in-app header (AdminLayout etc.),
  // so we never show the web Navbar/Footer inside the native app.
  const showTopNav = false;
  const showBottomNav = !isRole && !isAuth;
  const showFooter = false;
  // Menu sub-pages (messages, nutrition, settings, …) are reached from the
  // Settings hub and otherwise have no way back, so give them a back button.
  const showBack = showBottomNav && path.startsWith('/profile');

  return (
    <div className="flex flex-col min-h-screen">
      {banner}

      {showTopNav && (
        <div className={originalAdmin ? 'mt-12' : ''}>
          <Navbar isLoggedIn={isLoggedIn} currentUser={currentUser} onLogout={onLogout} logo={logo} />
        </div>
      )}

      <main
        className="flex-grow flex flex-col"
        style={{
          paddingTop: isAuth
            ? undefined
            : originalAdmin
              ? 'calc(3rem + env(safe-area-inset-top))'
              : showBack
                ? 'calc(3.25rem + env(safe-area-inset-top))'
                : 'env(safe-area-inset-top)',
          paddingBottom: showBottomNav ? 'calc(4rem + env(safe-area-inset-bottom))' : undefined,
        }}
      >
        {children}
      </main>

      {isAuth && (
        <>
          <button
            onClick={goBack}
            aria-label="Back"
            className="fixed left-4 z-[120] w-10 h-10 rounded-full bg-white border border-neutral-200 shadow-sm flex items-center justify-center text-black hover:bg-black hover:text-white transition-all"
            style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="fixed right-4 z-[120]" style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}>
            <LanguageToggle variant="pill" />
          </div>
        </>
      )}

      {showBack && (
        <button
          onClick={goBack}
          aria-label="Back"
          className="fixed left-3 z-[120] w-10 h-10 rounded-full bg-white/90 backdrop-blur border border-neutral-200 shadow-md flex items-center justify-center text-black active:scale-95 transition-transform"
          style={{ top: 'calc(0.6rem + env(safe-area-inset-top))' }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      )}

      {showFooter && <Footer logo={logo} />}
      {showBottomNav && <BottomNav isLoggedIn={isLoggedIn} currentUser={currentUser} />}
    </div>
  );
};

export default AppShell;
