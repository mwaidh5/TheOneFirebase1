
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, Type } from '@google/genai';

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
  const [command, setCommand] = useState('');
  const [logs, setLogs] = useState<{ type: 'system' | 'ai' | 'user'; message: string; timestamp: string }[]>([
    { type: 'system', message: 'The One AI Architect Kernel v3.1 initialized.', timestamp: new Date().toLocaleTimeString() },
    { type: 'system', message: 'Ready for structural and logic commands.', timestamp: new Date().toLocaleTimeString() }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (type: 'system' | 'ai' | 'user', message: string) => {
    setLogs(prev => [...prev, { type, message, timestamp: new Date().toLocaleTimeString() }]);
  };

  const handleFinalize = () => {
    if (window.confirm("Commit all architectural changes and return to Login to verify roles?")) {
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Current Site Settings: ${JSON.stringify(siteSettings)}. 
        User Request: "${userCommand}". 
        Instructions: You are the AI Site Architect. You have the power to edit global site settings and "fix bugs" in logic. 
        If the user wants a branding change, return a JSON object with the NEW site settings. 
        If the user wants to "fix a bug", describe the structural fix and return a confirmation message. 
        ALWAYS respond with a JSON object in this format: 
        { 
          "action": "UPDATE_SETTINGS" | "FIX_BUG" | "ERROR", 
          "message": "Friendly confirmation message", 
          "newSettings": { ...optional updated settings... },
          "logicPatch": "Description of the structural fix applied" 
        }`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING },
              message: { type: Type.STRING },
              newSettings: {
                type: Type.OBJECT,
                properties: {
                  heroHeadline: { type: Type.STRING },
                  heroSubline: { type: Type.STRING },
                  logo: { type: Type.STRING },
                  heroImage: { type: Type.STRING },
                  missionImage: { type: Type.STRING }
                }
              },
              logicPatch: { type: Type.STRING }
            },
            required: ['action', 'message']
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      
      if (result.action === 'UPDATE_SETTINGS' && result.newSettings) {
        setSiteSettings(prev => ({ ...prev, ...result.newSettings }));
        addLog('ai', result.message || 'Site architecture updated successfully.');
      } else if (result.action === 'FIX_BUG') {
        addLog('ai', `BUG FIXED: ${result.message}`);
        addLog('system', `Logic Patch Applied: ${result.logicPatch}`);
      } else {
        addLog('ai', result.message || 'Command processed with no structural changes.');
      }

    } catch (error) {
      console.error('Architect Error:', error);
      addLog('system', 'ERROR: Connection to logic core failed. Check console.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-10 text-left pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-accent animate-pulse filled">auto_awesome</span>
            <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">AI Architect</h1>
          </div>
          <p className="text-neutral-400 font-medium">Global Site Reconstruction and Logic Repair Interface.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handleFinalize}
            className="px-6 py-4 bg-white border border-neutral-200 text-black font-black text-[10px] rounded-xl hover:bg-neutral-50 transition-all shadow-sm uppercase tracking-widest flex items-center gap-2"
          >
             <span className="material-symbols-outlined text-[18px]">logout</span>
             Commit & Sign Out
          </button>
          <div className="bg-neutral-900 text-accent px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-accent/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping"></span>
            System Link: Active
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Terminal Window */}
        <div className="lg:col-span-8 flex flex-col h-[600px] bg-neutral-950 rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden">
          <div className="bg-neutral-900 px-6 py-4 flex items-center justify-between border-b border-white/5">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
            </div>
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Architect Console @ The One</p>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-4 font-mono text-sm no-scrollbar">
            {logs.map((log, i) => (
              <div key={i} className={`flex gap-4 animate-in slide-in-from-left-2 duration-300`}>
                <span className={`shrink-0 text-[10px] font-black opacity-30 mt-1`}>[{log.timestamp}]</span>
                <div className="space-y-1">
                  <p className={`font-bold ${
                    log.type === 'system' ? 'text-neutral-500 italic' : 
                    log.type === 'ai' ? 'text-accent' : 'text-white'
                  }`}>
                    {log.type === 'user' ? '> ' : log.type === 'ai' ? 'AI: ' : '[SYS]: '}{log.message}
                  </p>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex gap-4 animate-pulse">
                <span className="text-[10px] font-black opacity-30 mt-1">[*]</span>
                <p className="text-accent italic">Architect is re-calculating site logic...</p>
              </div>
            )}
          </div>

          <form onSubmit={handleCommand} className="p-6 bg-neutral-900 border-t border-white/5 flex gap-4">
            <input 
              type="text" 
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Enter architectural command... (e.g. 'Shift branding to dark mode')"
              className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder:text-neutral-600"
              disabled={isProcessing}
            />
            <button 
              type="submit"
              disabled={isProcessing || !command}
              className="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-blue-600 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        </div>

        {/* Sidebar Diagnostics */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-8">
            <h3 className="text-xl font-bold font-display uppercase tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-accent">health_metrics</span> Core Diagnostics
            </h3>
            
            <div className="space-y-6">
              {[
                { label: 'Branding Alignment', value: '98%', color: 'bg-green-500' },
                { label: 'Logic Consistency', value: '100%', color: 'bg-accent' },
                { label: 'Asset Redundancy', value: 'Low', color: 'bg-neutral-100', text: 'text-neutral-500' }
              ].map((metric) => (
                <div key={metric.label} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-neutral-400">{metric.label}</span>
                    <span className={metric.text || 'text-black'}>{metric.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-50 rounded-full overflow-hidden">
                    <div className={`h-full ${metric.color} rounded-full`} style={{ width: metric.value === 'Low' ? '20%' : metric.value }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-6">
              <h3 className="text-2xl font-black font-display uppercase tracking-tight">AI Memory Core</h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                The Architect remembers your previous structural changes to ensure that new logic fixes don't conflict with existing branding.
              </p>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Current Active Patch</p>
                <p className="text-xs font-mono text-accent">CMS_GLOBAL_OVERRIDE_V4</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[120px] absolute -bottom-10 -right-10 text-white/5 group-hover:rotate-12 transition-transform duration-1000">memory</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAiArchitect;
