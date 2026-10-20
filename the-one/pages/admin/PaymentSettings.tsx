
import React, { useState } from 'react';
import { useT } from '../../i18n/I18nContext';

const PaymentSettings: React.FC = () => {
  const { t } = useT();
  const [gateway, setGateway] = useState({
    provider: 'SindiPay',
    merchantId: 'MID-882910',
    apiKey: 'sdp_live_************************',
    secretKey: 'sec_************************',
    mode: 'SANDBOX',
    currency: 'USD',
    isEnabled: true
  });

  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS'>('IDLE');

  const handleSave = () => {
    setSaveStatus('SAVING');
    setTimeout(() => {
      setSaveStatus('SUCCESS');
      setTimeout(() => setSaveStatus('IDLE'), 2000);
    }, 1200);
  };

  return (
    <div className="space-y-12 text-start animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">{t('admin.pay.title')}</h1>
          <p className="text-neutral-400 font-medium">{t('admin.pay.subtitle')}</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saveStatus === 'SAVING'}
          className="px-10 py-5 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neutral-800 transition shadow-xl flex items-center gap-3 disabled:opacity-50"
        >
          {saveStatus === 'SAVING' ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
          ) : saveStatus === 'SUCCESS' ? (
            <span className="material-symbols-outlined text-green-400">check_circle</span>
          ) : (
            <span className="material-symbols-outlined">key</span>
          )}
          {saveStatus === 'SAVING' ? t('admin.pay.encrypting') : saveStatus === 'SUCCESS' ? t('admin.pay.vault_updated') : t('admin.pay.authorize')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <section className="bg-white p-10 rounded-[3rem] border border-neutral-100 shadow-2xl space-y-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black font-display uppercase tracking-tight flex items-center gap-3 text-black">
                <span className="material-symbols-outlined text-accent filled">security</span>
                {t('admin.pay.sindipay_config')}
              </h2>
              <div className="flex p-1 bg-neutral-50 rounded-xl">
                 <button onClick={() => setGateway({...gateway, mode: 'SANDBOX'})} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${gateway.mode === 'SANDBOX' ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-black'}`}>{t('admin.pay.sandbox')}</button>
                 <button onClick={() => setGateway({...gateway, mode: 'PRODUCTION'})} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${gateway.mode === 'PRODUCTION' ? 'bg-red-50 text-white shadow-lg' : 'text-neutral-400 hover:text-red-500'}`}>{t('admin.pay.live_mode')}</button>
              </div>
            </div>

            <div className="grid gap-8">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ms-1">{t('admin.pay.provider')}</label>
                  <select 
                    value={gateway.provider}
                    onChange={(e) => setGateway({...gateway, provider: e.target.value})}
                    className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-black uppercase tracking-widest outline-none focus:border-black appearance-none"
                  >
                    <option>SindiPay</option>
                    <option>Stripe</option>
                    <option>PayPal</option>
                    <option>Razorpay</option>
                  </select>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ms-1">{t('admin.pay.merchant_id')}</label>
                    <input 
                      type="text" 
                      value={gateway.merchantId}
                      onChange={(e) => setGateway({...gateway, merchantId: e.target.value})}
                      dir="ltr"
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-mono text-sm outline-none focus:ring-2 focus:ring-accent"
                      placeholder={t('admin.pay.merchant_ph')}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ms-1">{t('admin.pay.api_key')}</label>
                    <input 
                      type="text" 
                      value={gateway.apiKey}
                      onChange={(e) => setGateway({...gateway, apiKey: e.target.value})}
                      dir="ltr"
                      className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-mono text-sm outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ms-1">{t('admin.pay.secret_key')}</label>
                  <input 
                    type="password" 
                    value={gateway.secretKey}
                    onChange={(e) => setGateway({...gateway, secretKey: e.target.value})}
                    dir="ltr"
                    className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-mono text-sm outline-none focus:ring-2 focus:ring-accent"
                  />
                  <p className="text-[9px] font-bold text-neutral-300 uppercase mt-2">{t('admin.pay.secret_hint')} <span className="text-accent" dir="ltr">sindipay.com/api/v1/verify</span></p>
               </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-neutral-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                 <h3 className="text-2xl font-black font-display uppercase tracking-tight">{t('admin.pay.system_status')}</h3>
                 <div className="flex items-center gap-4 p-5 bg-white/5 rounded-3xl border border-white/10">
                    <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-500">
                       <span className="material-symbols-outlined filled animate-pulse">cloud_done</span>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-neutral-400 uppercase">{t('admin.pay.connectivity')}</p>
                       <p className="text-sm font-black uppercase text-green-500">{t('admin.pay.linked')}</p>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{t('admin.pay.capabilities')}</p>
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-bold text-neutral-300">{t('admin.pay.cards')}</span>
                       <div className="w-10 h-5 bg-accent rounded-full relative"><div className="absolute end-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div></div>
                    </div>
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-bold text-neutral-300">{t('admin.pay.wallets')}</span>
                       <div className="w-10 h-5 bg-accent rounded-full relative"><div className="absolute end-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div></div>
                    </div>
                 </div>
              </div>
              <span className="material-symbols-outlined text-[140px] absolute -bottom-10 -end-10 text-white/5 select-none -rotate-12">account_balance</span>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6">
              <h4 className="text-sm font-black uppercase text-black tracking-tight border-s-4 border-accent ps-4">{t('admin.pay.webhooks')}</h4>
              <div className="grid gap-3">
                 <button className="w-full p-4 bg-neutral-50 rounded-xl text-start hover:bg-black hover:text-white transition group">
                    <p className="text-[10px] font-black uppercase text-neutral-400 group-hover:text-white/60">{t('admin.pay.callback_url')}</p>
                    <code className="text-[9px] font-mono mt-1 block" dir="ltr">https://api.theone.com/sindi-callback</code>
                 </button>
                 <button className="w-full py-4 text-center border border-neutral-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-300 hover:text-black">
                    {t('admin.pay.test_payload')}
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSettings;
