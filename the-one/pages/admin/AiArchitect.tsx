
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { setDoc, doc } from 'firebase/firestore';
import { db, aiModel } from '../../firebase';
import { useT } from '../../i18n/I18nContext';

interface SiteSettings {
  logo: string;
  heroImage: string;
  missionImage: string;
  heroHeadline: string;
  heroSubline: string;
}

interface AdminAiArchitectProps {
  siteSettings: SiteSettings;
  setSiteSettings: React.Dispatch<React.SetStateAction<SiteSettings>>;
  onLogout: () => void;
}

const AdminAiArchitect: React.FC<AdminAiArchitectProps> = ({ siteSettings, setSiteSettings, onLogout }) => {
  const navigate = useNavigate();
  const { t, lang } = useT();
  const timeLocale = lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB';
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<{ type: 'system' | 'ai' | 'user'; message: string; timestamp: string }[]>(() => [
    { type: 'system', message: t('admin.ai.init_1'), timestamp: new Date().toLocaleTimeString(timeLocale) },
    { type: 'system', message: t('admin.ai.init_2'), timestamp: new Date().toLocaleTimeString(timeLocale) }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (type: 'system' | 'ai' | 'user', message: string) => {
    setLogs(prev => [...prev, { type, message, timestamp: new Date().toLocaleTimeString(timeLocale) }]);
  };

  const handleFinalize = () => {
    if (window.confirm(t('admin.ai.confirm_finalize'))) {
        onLogout();
        navigate('/login');
    }
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command || isProcessing) return;

    const userCommand = command;
    setCommand('');
    addLog('user', userCommand);
    setIsProcessing(true);

    try {
      const promptText = `Current Site Settings: ${JSON.stringify(siteSettings)}.
User Request: "${userCommand}".
Instructions: You are the AI Site Architect. You have the power to edit global site settings and "fix bugs" in logic.
If the user wants a branding change, return a JSON object with the NEW site settings.
If the user wants to "fix a bug", describe the structural fix and return a confirmation message.
ALWAYS respond with a JSON object in this exact format (no extra text):
{
  "action": "UPDATE_SETTINGS" | "FIX_BUG" | "ERROR",
  "message": "Friendly confirmation message",
  "newSettings": { ...optional updated settings object... },
  "logicPatch": "Description of the structural fix applied"
}`;

      const aiResult = await aiModel.generateContent(promptText);
      const result = JSON.parse(aiResult.response.text() || '{}');
      
      if (result.action === 'UPDATE_SETTINGS' && result.newSettings) {
        const updated = { ...siteSettings, ...result.newSettings };
        await setDoc(doc(db, 'settings', 'site'), updated);
        addLog('ai', result.message || t('admin.ai.updated'));
      } else if (result.action === 'FIX_BUG') {
        addLog('ai', t('admin.ai.bug_fixed', { msg: result.message }));
        addLog('system', t('admin.ai.patch_applied', { patch: result.logicPatch }));
      } else {
        addLog('ai', result.message || t('admin.ai.no_changes'));
      }

    } catch (error) {
      console.error('Architect Error:', error);
      addLog('system', t('admin.ai.error'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-10 text-start pb-20 animate-in fade-in duration-500">
        <button onClick={() => navigate(-1)} className="md:hidden flex items-center gap-2 text-neutral-500 hover:text-black transition-colors -ms-2">
            <span className="material-symbols-outlined rtl:rotate-180">arrow_back_ios_new</span>
            <span className="text-sm font-bold">{t('common.back')}</span>
        </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-accent animate-pulse filled">auto_awesome</span>
            <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-black uppercase">{t('admin.ai.title')}</h1>
          </div>
          <p className="text-neutral-400 font-medium text-sm sm:text-base">{t('admin.ai.subtitle')}</p>
        </div>
        <div className="hidden sm:flex gap-4">
          <button 
            onClick={handleFinalize}
            className="px-6 py-4 bg-white border border-neutral-200 text-black font-black text-[10px] rounded-xl hover:bg-neutral-50 transition shadow-sm uppercase tracking-widest flex items-center gap-2"
          >
             <span className="material-symbols-outlined text-[18px]">logout</span>
             {t('admin.ai.commit_sign_out')}
          </button>
          <div className="bg-neutral-900 text-accent px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-accent/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping"></span>
            {t('admin.ai.system_link')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
        {/* Terminal Window */}
        <div className="lg:col-span-8 flex flex-col h-[500px] sm:h-[600px] bg-neutral-950 rounded-3xl sm:rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden">
          <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between border-b border-white/5">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
            </div>
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{t('admin.ai.console')}</p>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 font-mono text-xs sm:text-sm no-scrollbar">
            {logs.map((log, i) => (
              <div key={i} className={`flex gap-4 animate-in slide-in-from-left-2 rtl:slide-in-from-right-2 duration-300`}>
                <span className={`shrink-0 text-[10px] font-black opacity-30 mt-1`} dir="ltr">[{log.timestamp}]</span>
                <div className="space-y-1">
                  <p className={`font-bold ${
                    log.type === 'system' ? 'text-neutral-500 italic' : 
                    log.type === 'ai' ? 'text-accent' : 'text-white'
                  }`}>
                    {log.type === 'user' ? '> ' : log.type === 'ai' ? t('admin.ai.prefix_ai') : t('admin.ai.prefix_sys')}{log.message}
                  </p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex gap-4 animate-pulse">
                <span className="text-[10px] font-black opacity-30 mt-1">[*]</span>
                <p className="text-accent italic">{t('admin.ai.processing')}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleCommand} className="p-4 sm:p-6 bg-neutral-900 border-t border-white/5 flex gap-4">
            <input 
              type="text" 
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder={t('admin.ai.command_ph')}
              className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder:text-neutral-600"
              disabled={isProcessing}
            />
            <button 
              type="submit"
              disabled={isProcessing || !command}
              aria-label={t('common.send')}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-blue-600 transition disabled:opacity-50"
            >
              <span className="material-symbols-outlined rtl:-scale-x-100">send</span>
            </button>
          </form>
        </div>

        {/* Sidebar Diagnostics */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-8">
            <h3 className="text-lg sm:text-xl font-bold font-display uppercase tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-accent">health_metrics</span> {t('admin.ai.core_diagnostics')}
            </h3>
            
            <div className="space-y-6">
              {[
                { label: t('admin.ai.branding'), value: '98%', color: 'bg-green-500' },
                { label: t('admin.ai.logic'), value: '100%', color: 'bg-accent' },
                { label: t('admin.ai.redundancy'), value: 'Low', display: t('admin.ai.low'), color: 'bg-neutral-100', text: 'text-neutral-500' }
              ].map((metric) => (
                <div key={metric.label} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-neutral-400">{metric.label}</span>
                    <span className={metric.text || 'text-black'} dir={metric.display ? undefined : 'ltr'}>{metric.display || metric.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-50 rounded-full overflow-hidden">
                    <div className={`h-full ${metric.color} rounded-full`} style={{ width: metric.value === 'Low' ? '20%' : metric.value }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black text-white p-8 sm:p-10 rounded-3xl sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-6">
              <h3 className="text-xl sm:text-2xl font-black font-display uppercase tracking-tight">{t('admin.ai.memory_core')}</h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                {t('admin.ai.memory_desc')}
              </p>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">{t('admin.ai.active_patch')}</p>
                <p className="text-xs font-mono text-accent" dir="ltr">CMS_GLOBAL_OVERRIDE_V4</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-9xl sm:text-[120px] absolute -bottom-6 -end-6 sm:-bottom-10 sm:-end-10 text-white/5 group-hover:rotate-12 transition-transform duration-1000">memory</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAiArchitect;
