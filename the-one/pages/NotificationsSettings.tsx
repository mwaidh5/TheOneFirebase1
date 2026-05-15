
import React from 'react';
import { useT } from '../i18n/I18nContext';
import type { TranslationKey } from '../i18n/translations';

const NotificationsSettings: React.FC = () => {
  const { t } = useT();
  const items: Array<{ titleKey: TranslationKey; descKey: TranslationKey }> = [
    { titleKey: 'notif.training_title', descKey: 'notif.training_desc' },
    { titleKey: 'notif.community_title', descKey: 'notif.community_desc' },
    { titleKey: 'notif.product_title', descKey: 'notif.product_desc' },
    { titleKey: 'notif.marketing_title', descKey: 'notif.marketing_desc' },
  ];
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-black font-display uppercase tracking-tight text-black mb-12">{t('notif.heading')}</h1>
      <div className="space-y-6">
        {items.map(item => (
          <div key={item.titleKey} className="flex items-center justify-between p-8 bg-neutral-50 rounded-3xl border border-neutral-100">
            <div className="space-y-1">
              <p className="font-bold text-black uppercase text-sm tracking-tight">{t(item.titleKey)}</p>
              <p className="text-sm text-neutral-500">{t(item.descKey)}</p>
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
