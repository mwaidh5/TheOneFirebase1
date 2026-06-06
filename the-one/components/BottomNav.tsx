import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { User, UserRole } from '../types';
import { useT } from '../i18n/I18nContext';

interface BottomNavProps {
  isLoggedIn: boolean;
  currentUser: User | null;
}

interface Tab {
  to: string;
  icon: string;
  label: string;
  /** Returns true when this tab should be highlighted for the given path. */
  match: (path: string) => boolean;
  badge?: number;
}

const BottomNav: React.FC<BottomNavProps> = ({ isLoggedIn, currentUser }) => {
  const location = useLocation();
  const { t } = useT();
  const [unreadCount, setUnreadCount] = useState(0);

  // Live unread message count (mirrors the old navbar badge).
  useEffect(() => {
    if (!currentUser) {
      setUnreadCount(0);
      return;
    }
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.id)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.docs.forEach((d) => {
        const data = d.data() as any;
        if (data.unreadCounts && data.unreadCounts[currentUser.id] > 0) {
          count += data.unreadCounts[currentUser.id];
        }
        if (
          (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPPORT) &&
          data.type === 'support' &&
          data.unreadCounts &&
          data.unreadCounts['support-team'] > 0
        ) {
          count += data.unreadCounts['support-team'];
        }
      });
      setUnreadCount(count);
    });
    return () => unsub();
  }, [currentUser]);

  const path = location.pathname;

  const tabs: Tab[] = [
    { to: '/', icon: 'home', label: t('nav.home'), match: (p) => p === '/' },
    { to: '/courses', icon: 'fitness_center', label: t('nav.courses'), match: (p) => p.startsWith('/courses') },
    { to: '/coaches', icon: 'groups', label: t('nav.coaches'), match: (p) => p.startsWith('/coaches') },
  ];

  if (isLoggedIn) {
    tabs.push({
      to: '/profile/messages',
      icon: 'chat_bubble',
      label: t('nav.messages'),
      match: (p) => p === '/profile/messages',
      badge: unreadCount,
    });
    tabs.push({
      to: '/profile',
      icon: 'person',
      label: t('nav.account'),
      // Any profile route except messages maps to the Account tab.
      match: (p) => p.startsWith('/profile') && p !== '/profile/messages',
    });
  } else {
    tabs.push({
      to: '/login',
      icon: 'person',
      label: t('nav.account'),
      match: (p) => p === '/login' || p === '/signup' || p.startsWith('/profile'),
    });
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-lg border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-xl mx-auto flex items-stretch justify-around px-2 h-16">
        {tabs.map((tab) => {
          const active = tab.match(path);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`relative flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${
                active ? 'text-accent' : 'text-gray-400 hover:text-black'
              }`}
            >
              <span className="relative">
                <span className={`material-symbols-outlined text-[24px] ${active ? 'filled' : ''}`}>
                  {tab.icon}
                </span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-bold leading-none px-1.5 py-0.5 rounded-full min-w-[1rem] text-center">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                ) : null}
              </span>
              <span className="text-[10px] font-bold tracking-wide">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
