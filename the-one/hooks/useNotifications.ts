
import { useEffect, useRef } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db, getMessagingInstance, VAPID_KEY } from '../firebase';
import { User } from '../types';

/**
 * useNotifications
 *
 * - Requests browser notification permission on first login
 * - Saves the FCM token to the user's Firestore document (users/{uid}.fcmToken)
 * - Fires a foreground toast when a message arrives while the tab is active
 *
 * Usage: call this once at the App root level when currentUser is available.
 */
export function useNotifications(currentUser: User | null | undefined) {
  const initialised = useRef(false);

  useEffect(() => {
    if (!currentUser || initialised.current) return;
    if (VAPID_KEY === 'YOUR_VAPID_KEY') {
      console.warn('[FCM] VAPID key not set. Paste it in firebase.ts to enable push notifications.');
      return;
    }

    initialised.current = true;

    const setup = async () => {
      try {
        const messaging = await getMessagingInstance();
        if (!messaging) return; // Browser doesn't support FCM

        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // Get FCM token
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (!token) return;

        // Save to Firestore
        await updateDoc(doc(db, 'users', currentUser.id), { fcmToken: token });

        // Handle foreground messages (tab is active)
        onMessage(messaging, (payload) => {
          const { title, body } = payload.notification || {};
          if (!title) return;

          // Show a non-blocking toast via a custom DOM element
          showToast(title, body || '');
        });
      } catch (err) {
        console.error('[FCM] Notification setup failed:', err);
      }
    };

    setup();
  }, [currentUser?.id]);
}

/** Injects a fleeting toast notification into the DOM */
function showToast(title: string, body: string) {
  const existing = document.getElementById('fcm-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'fcm-toast';
  toast.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;">
      <span class="material-symbols-outlined" style="color:#137FEC;font-size:20px">notifications</span>
      <div>
        <p style="font-weight:900;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#000;margin:0">${title}</p>
        ${body ? `<p style="font-size:11px;color:#666;margin:2px 0 0">${body}</p>` : ''}
      </div>
    </div>
  `;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: '999999',
    background: '#fff',
    border: '1px solid #f0f0f0',
    borderRadius: '16px',
    padding: '16px 20px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    fontFamily: 'inherit',
    maxWidth: '340px',
    animation: 'slideInToast 0.3s ease',
    cursor: 'pointer',
  });

  // Inject keyframes if not already present
  if (!document.getElementById('toast-keyframes')) {
    const style = document.createElement('style');
    style.id = 'toast-keyframes';
    style.textContent = `
      @keyframes slideInToast {
        from { transform: translateY(20px); opacity: 0; }
        to   { transform: translateY(0);    opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  toast.addEventListener('click', () => toast.remove());
  document.body.appendChild(toast);
  setTimeout(() => toast?.remove(), 6000);
}
