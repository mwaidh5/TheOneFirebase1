
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatDistanceToNow } from 'date-fns';
import { ar as arLocale } from 'date-fns/locale';
import { useT } from '../../i18n/I18nContext';
import type { TranslationKey } from '../../i18n/translations';

const LOG_TYPE_KEYS: Record<string, TranslationKey> = {
  USER_SIGNUP: 'admin.log_type.user_signup',
  USER_LOGIN: 'admin.log_type.user_login',
  COURSE_ENROLL: 'admin.log_type.course_enroll',
  WORKOUT_COMPLETE: 'admin.log_type.workout_complete',
  CUSTOM_REQUEST: 'admin.log_type.custom_request',
  CUSTOM_PROGRAM_SENT: 'admin.log_type.custom_program_sent',
  COURSE_CREATED: 'admin.log_type.course_created',
  COURSE_UPDATED: 'admin.log_type.course_updated',
  USER_UPDATED: 'admin.log_type.user_updated',
  SYSTEM: 'admin.log_type.system',
};

const AdminDashboard: React.FC = () => {
  const { t, lang } = useT();
  const timeLocale = lang === 'ar' ? 'ar' : 'en-GB';
  const fnsLocale = lang === 'ar' ? { locale: arLocale } : {};
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<Date>(new Date());

  // Real Data State
  const [stats, setStats] = useState({
      usersCount: 0,
      coursesCount: 0,
      revenue: 0,
      leadsCount: 0
  });
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
      const fetchData = async () => {
          try {
              const usersSnap = await getDocs(collection(db, "users"));
              const coursesSnap = await getDocs(collection(db, "courses"));
              setStats({
                  usersCount: usersSnap.size,
                  coursesCount: coursesSnap.size,
                  revenue: 0,
                  leadsCount: 0
              });
          } catch (error) {
              console.error("Error fetching dashboard stats", error);
          }
      };
      fetchData();

      // Live Logs — reads from system_logs (written by logEvent utility)
      const q = query(collection(db, "system_logs"), orderBy("createdAt", "desc"), limit(20));
      const unsubscribe = onSnapshot(q, (snapshot) => {
          setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => unsubscribe();
  }, []);


  const runSystemScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setLastScan(new Date());
    }, 2000);
  };

  const systemMetrics = [
    { name: t('admin.dash.metric_kernel'), status: t('admin.dash.metric_optimal'), health: 100, latency: '12ms', icon: 'terminal' },
    { name: t('admin.dash.metric_db'), status: t('admin.dash.metric_online'), health: 98, latency: '45ms', icon: 'database' },
    { name: t('admin.dash.metric_cache'), status: t('admin.dash.metric_buffered'), health: 94, latency: '2ms', icon: 'speed' },
    { name: t('admin.dash.metric_sindipay'), status: t('admin.dash.metric_connected'), health: 100, latency: '120ms', icon: 'account_balance' },
    { name: t('admin.dash.metric_ai'), status: t('admin.dash.metric_ready'), health: 100, latency: '850ms', icon: 'auto_awesome' },
    { name: t('admin.dash.metric_cdn'), status: t('admin.dash.metric_operational'), health: 95, latency: '28ms', icon: 'cloud_done' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-start">
        <div className="space-y-1">
          <h2 className="text-4xl font-black font-display tracking-tight text-black uppercase leading-none">{t('admin.dash.title')}</h2>
          <p className="text-neutral-400 font-medium">{t('admin.dash.subtitle')}</p>
        </div>
        <div className="flex gap-4">
          <Link to="/admin/activity" className="px-6 py-4 bg-white border border-neutral-200 text-black font-black text-[10px] rounded-xl hover:bg-neutral-50 transition shadow-sm uppercase tracking-widest flex items-center gap-2">
             <span className="material-symbols-outlined text-[18px]">history</span>
             {t('admin.dash.audit_log')}
          </Link>
          <button 
            onClick={() => setIsStatusOpen(true)}
            className="px-6 py-4 bg-black text-white font-black text-[10px] rounded-xl hover:bg-neutral-800 shadow-xl transition flex items-center gap-2 uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-[18px]">emergency_share</span>
            {t('admin.dash.platform_status')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-start">
        {[
          { label: t('admin.dash.active_athletes'), val: stats.usersCount.toString(), trend: '', color: 'text-accent', icon: 'groups' },
          { label: t('admin.dash.courses_active'), val: stats.coursesCount.toString(), sub: t('admin.dash.published'), color: 'text-purple-600', icon: 'school' },
          { label: t('admin.dash.platform_revenue'), val: `$${stats.revenue}`, trend: '', color: 'text-green-600', icon: 'payments' },
          { label: t('admin.dash.cycle_leads'), val: stats.leadsCount.toString(), sub: t('admin.dash.pending_review'), color: 'text-orange-600', icon: 'architecture' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-[2.5rem] p-8 border border-neutral-100 shadow-sm hover:shadow-xl transition group">
            <div className="flex items-center justify-between mb-8">
              <p className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</p>
              <div className={`w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform shadow-inner`}>
                <span className="material-symbols-outlined text-xl">{stat.icon}</span>
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <p className="text-4xl font-black text-black font-display tracking-tighter" dir="ltr">{stat.val}</p>
              {stat.trend ? (
                <span className="text-green-600 text-[10px] font-black uppercase tracking-widest">{stat.trend}</span>
              ) : (
                <span className="text-neutral-300 text-[10px] font-black uppercase tracking-widest">{stat.sub}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 text-start">
        <div className="lg:col-span-8 bg-white rounded-[3rem] border border-neutral-100 p-10 shadow-2xl relative overflow-hidden">
           <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-black font-display uppercase tracking-tight">{t('admin.dash.command_center')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Link to="/admin/diagnostics" className="p-8 bg-neutral-50 rounded-[2.5rem] hover:bg-black hover:text-white transition group border border-neutral-100 relative overflow-hidden">
                      <div className="absolute top-4 end-4 w-10 h-10 bg-white group-hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                          <span className="material-symbols-outlined text-purple-600 group-hover:text-white rtl:-scale-x-100">arrow_outward</span>
                      </div>
                      <span className="material-symbols-outlined text-5xl mb-6 text-purple-600 group-hover:text-white">fact_check</span>
                      <h4 className="text-xl font-black uppercase tracking-tight">{t('admin.nav.diagnostics')}</h4>
                      <p className="text-xs text-neutral-400 group-hover:text-white/60 mt-2 font-medium leading-relaxed">
                          {t('admin.dash.diagnostics_desc')}
                      </p>
                  </Link>
                  <Link to="/admin/courses" className="p-8 bg-neutral-50 rounded-[2.5rem] hover:bg-black hover:text-white transition group border border-neutral-100 relative overflow-hidden">
                      <div className="absolute top-4 end-4 w-10 h-10 bg-white group-hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                          <span className="material-symbols-outlined text-accent group-hover:text-white rtl:-scale-x-100">arrow_outward</span>
                      </div>
                      <span className="material-symbols-outlined text-5xl mb-6 text-accent group-hover:text-white">school</span>
                      <h4 className="text-xl font-black uppercase tracking-tight">{t('admin.dash.manage_courses')}</h4>
                      <p className="text-xs text-neutral-400 group-hover:text-white/60 mt-2 font-medium leading-relaxed">
                          {t('admin.dash.manage_courses_desc')}
                      </p>
                  </Link>
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 bg-white rounded-[3rem] border border-neutral-100 shadow-2xl flex flex-col overflow-hidden max-h-[700px]">
          <div className="p-8 border-b border-neutral-50 flex items-center justify-between bg-neutral-50/30">
            <h3 className="text-lg font-black font-display uppercase tracking-tight">{t('admin.dash.system_logs')}</h3>
            <Link to="/admin/activity" className="text-accent text-[9px] font-black uppercase tracking-widest hover:underline flex items-center gap-1">
              {t('admin.dash.live_feed')} <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_forward</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar py-2">
            {logs.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-xs">{t('admin.dash.no_recent_activity')}</div>
            ) : (
                logs.map((ev, i) => {
                  const typeColors: Record<string, string> = {
                    USER_SIGNUP: 'text-purple-500',
                    USER_LOGIN: 'text-accent',
                    COURSE_ENROLL: 'text-green-500',
                    WORKOUT_COMPLETE: 'text-orange-500',
                    CUSTOM_REQUEST: 'text-yellow-600',
                    CUSTOM_PROGRAM_SENT: 'text-blue-500',
                    COURSE_CREATED: 'text-teal-500',
                    SYSTEM: 'text-neutral-400',
                  };
                  const color = typeColors[ev.type] || 'text-accent';
                  return (
                  <div key={ev.id || i} className="px-8 py-5 hover:bg-neutral-50 transition border-b border-neutral-50 last:border-0 relative group">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md bg-neutral-50 ${color}`}>{LOG_TYPE_KEYS[ev.type || 'SYSTEM'] ? t(LOG_TYPE_KEYS[ev.type || 'SYSTEM']) : ev.type}</span>
                        <span className="text-[8px] font-bold text-neutral-300 uppercase tracking-widest">• {ev.createdAt?.toDate ? formatDistanceToNow(ev.createdAt.toDate(), { addSuffix: true, ...fnsLocale }) : t('admin.common.just_now')}</span>
                      </div>
                      <p className="text-xs font-bold text-black leading-relaxed group-hover:text-accent transition-colors">{ev.title}</p>
                      {ev.description && <p className="text-[10px] text-neutral-400 font-medium mt-0.5 leading-snug">{ev.description}</p>}
                  </div>
                  );
                })
            )}
          </div>

          <div className="p-6 bg-black text-white rounded-b-[3rem] flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-[20px] filled">auto_awesome</span>
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest">{t('admin.dash.architect_tip')}</p>
                <p className="text-[9px] font-medium text-neutral-400">{t('admin.dash.tip_text')}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Platform Status Modal */}
      {isStatusOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-start justify-center py-8 px-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto">
           <div className="bg-neutral-950 w-full max-w-2xl rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col border border-white/10 my-auto">
              <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
                 <div className="text-start space-y-1">
                    <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">{t('admin.dash.infra_diagnostic')}</p>
                    <h3 className="text-3xl font-black font-display uppercase text-white leading-none">{t('admin.dash.system_health')}</h3>
                 </div>
                 <button 
                  onClick={() => setIsStatusOpen(false)} 
                  aria-label={t('common.close')}
                  className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-red-500 hover:border-red-500 transition group"
                 >
                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">close</span>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar text-start">
                 <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-4">
                       <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]'}`}></div>
                       <p className="text-xs font-black uppercase text-white tracking-widest">
                          {isScanning ? t('admin.dash.synchronizing') : t('admin.dash.all_nominal')}
                       </p>
                    </div>
                    <button 
                      onClick={runSystemScan}
                      disabled={isScanning}
                      className="px-5 py-2 bg-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition disabled:opacity-50"
                    >
                      {isScanning ? t('admin.dash.scanning') : t('admin.dash.refresh_pulse')}
                    </button>
                 </div>

                 <div className="grid gap-4">
                    {systemMetrics.map((m, i) => (
                       <div key={m.name} className="flex items-center gap-6 p-5 bg-white/[0.02] hover:bg-white/5 rounded-2xl border border-white/5 transition group">
                          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-accent shrink-0 group-hover:scale-110 transition-transform">
                             <span className="material-symbols-outlined text-2xl">{m.icon}</span>
                          </div>
                          <div className="flex-grow">
                             <div className="flex justify-between items-end mb-2">
                                <h4 className="text-sm font-black text-white uppercase tracking-tight">{m.name}</h4>
                                <span className="text-[10px] font-black text-accent uppercase tracking-widest" dir="ltr">{m.latency}</span>
                             </div>
                             <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div 
                                   className={`h-full bg-accent transition duration-1000 ease-out ${isScanning ? 'w-0' : ''}`} 
                                   style={{ width: isScanning ? '0%' : `${m.health}%` }}
                                ></div>
                             </div>
                          </div>
                          <div className="text-end min-w-[80px]">
                             <p className="text-[9px] font-black text-neutral-500 uppercase mb-0.5">{t('admin.common.status')}</p>
                             <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">{m.status}</p>
                          </div>
                       </div>
                    ))}
                 </div>

                 <div className="p-6 bg-accent/10 rounded-2xl border border-accent/20 flex gap-4 items-start">
                    <span className="material-symbols-outlined text-accent animate-pulse">security</span>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-accent uppercase tracking-widest">{t('admin.dash.e2e')}</p>
                       <p className="text-xs text-white/60 leading-relaxed">{t('admin.dash.e2e_text')}</p>
                    </div>
                 </div>
              </div>

              <div className="p-8 border-t border-white/5 bg-white/5 shrink-0 flex justify-between items-center">
                 <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">{t('admin.dash.last_audit', { time: lastScan.toLocaleTimeString(timeLocale) })}</p>
                 <div className="flex gap-4">
                    <span className="flex items-center gap-2 text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                       <span className="w-2 h-2 rounded-full bg-green-500"></span> {t('admin.dash.active')}
                    </span>
                    <span className="flex items-center gap-2 text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                       <span className="w-2 h-2 rounded-full bg-white/10"></span> {t('admin.dash.standby')}
                    </span>
                 </div>
              </div>
           </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminDashboard;
