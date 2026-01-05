
import React from 'react';

const NotificationsSettings: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-black font-display uppercase tracking-tight text-black mb-12">Notifications</h1>
      <div className="space-y-6">
        {[
          { title: 'Training Reminders', desc: 'Get notified when it\'s time for your scheduled WOD.' },
          { title: 'Community Updates', desc: 'Stay in the loop with forum replies and mentions.' },
          { title: 'Product Updates', desc: 'New courses, features, and platform improvements.' },
          { title: 'Marketing', desc: 'Special offers and early access to events.' },
        ].map(item => (
          <div key={item.title} className="flex items-center justify-between p-8 bg-neutral-50 rounded-3xl border border-neutral-100">
            <div className="space-y-1">
              <p className="font-bold text-black uppercase text-sm tracking-tight">{item.title}</p>
              <p className="text-sm text-neutral-500">{item.desc}</p>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsSettings;
