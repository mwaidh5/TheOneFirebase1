
import React, { useState, useMemo, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { formatDistanceToNow, format } from 'date-fns';
import { LogEventType } from '../../hooks/useLogEvent';

interface LogEntry {
  id: string;
  type: LogEventType;
  title: string;
  description: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  meta?: Record<string, any>;
  createdAt: any;
  timestamp: number;
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
  USER_SIGNUP:           { label: 'New Athlete',      icon: 'person_add',       color: 'text-purple-600', bg: 'bg-purple-500',   border: 'border-purple-200' },
  USER_LOGIN:            { label: 'Login',            icon: 'login',            color: 'text-accent',     bg: 'bg-accent',       border: 'border-blue-200' },
  COURSE_ENROLL:         { label: 'Enrollment',       icon: 'school',           color: 'text-green-600',  bg: 'bg-green-500',    border: 'border-green-200' },
  WORKOUT_COMPLETE:      { label: 'Session Done',     icon: 'fitness_center',   color: 'text-orange-600', bg: 'bg-orange-500',   border: 'border-orange-200' },
  CUSTOM_REQUEST:        { label: 'Custom Program',   icon: 'architecture',     color: 'text-amber-600',  bg: 'bg-amber-500',    border: 'border-amber-200' },
  CUSTOM_PROGRAM_SENT:   { label: 'Program Sent',     icon: 'send',             color: 'text-teal-600',   bg: 'bg-teal-500',     border: 'border-teal-200' },
  COURSE_CREATED:        { label: 'Course Created',   icon: 'add_circle',       color: 'text-blue-600',   bg: 'bg-blue-500',     border: 'border-blue-200' },
  COURSE_UPDATED:        { label: 'Course Updated',   icon: 'edit',             color: 'text-indigo-600', bg: 'bg-indigo-500',   border: 'border-indigo-200' },
  USER_UPDATED:          { label: 'User Updated',     icon: 'manage_accounts',  color: 'text-slate-600',  bg: 'bg-slate-500',    border: 'border-slate-200' },
  SYSTEM:                { label: 'System',           icon: 'settings_suggest', color: 'text-neutral-500',bg: 'bg-neutral-600',  border: 'border-neutral-200' },
};

const getConfig = (type: string) => TYPE_CONFIG[type] || TYPE_CONFIG['SYSTEM'];

const AdminActivityFeed: React.FC = () => {
  const [filter, setFilter] = useState<LogEventType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<'24H' | '7D' | '30D' | 'ALL'>('7D');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'system_logs'), orderBy('createdAt', 'desc'), limit(200));
    const unsub = onSnapshot(q, (snap) => {
      const entries: LogEntry[] = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || 'SYSTEM',
          title: data.title || 'System Event',
          description: data.description || '',
          userId: data.userId,
          userName: data.userName,
          userEmail: data.userEmail,
          userAvatar: data.userAvatar,
          meta: data.meta,
          createdAt: data.createdAt,
          timestamp: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
        };
      });
      setLogs(entries);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredLogs = useMemo(() => {
    const now = Date.now();
    const timeMap: Record<string, number> = {
      '24H': 24 * 60 * 60 * 1000,
      '7D': 7 * 24 * 60 * 60 * 1000,
      '30D': 30 * 24 * 60 * 60 * 1000,
    };
    return logs.filter(log => {
      if (filter !== 'ALL' && log.type !== filter) return false;
      if (timeframe !== 'ALL' && now - log.timestamp > timeMap[timeframe]) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          log.title.toLowerCase().includes(q) ||
          log.description.toLowerCase().includes(q) ||
          (log.userName || '').toLowerCase().includes(q) ||
          (log.userEmail || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, filter, timeframe, searchQuery]);

  // Summary counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(l => { counts[l.type] = (counts[l.type] || 0) + 1; });
    return counts;
  }, [logs]);

  const filterTypes: (LogEventType | 'ALL')[] = [
    'ALL', 'USER_SIGNUP', 'USER_LOGIN', 'COURSE_ENROLL', 'WORKOUT_COMPLETE', 'CUSTOM_REQUEST', 'SYSTEM',
  ];

  return (
    <div className="space-y-10 text-left pb-20 animate-in fade-in duration-500">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">Log History</h1>
        <p className="text-neutral-400 font-medium">Real-time audit trail of every key platform event.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: logs.length, icon: 'list_alt', color: 'text-neutral-400' },
          { label: 'New Athletes', value: typeCounts['USER_SIGNUP'] || 0, icon: 'person_add', color: 'text-purple-500' },
          { label: 'Enrollments', value: typeCounts['COURSE_ENROLL'] || 0, icon: 'school', color: 'text-green-500' },
          { label: 'Sessions Done', value: typeCounts['WORKOUT_COMPLETE'] || 0, icon: 'fitness_center', color: 'text-orange-500' },
        ].map(s => (
          <div key={s.label} className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center ${s.color}`}>
              <span className="material-symbols-outlined text-[18px]">{s.icon}</span>
            </div>
            <div>
              <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest">{s.label}</p>
              <p className="text-2xl font-black text-black leading-none mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-xl space-y-6">
        {/* Search + Timeframe */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-neutral-300">search</span>
            <input
              type="text"
              placeholder="Search by title, athlete, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-medium outline-none focus:border-black transition-all"
            />
          </div>
          <div className="flex p-1 bg-neutral-50 border border-neutral-100 rounded-2xl shrink-0">
            {(['24H', '7D', '30D', 'ALL'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === t ? 'bg-black text-white shadow-lg' : 'text-neutral-400 hover:text-black'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex gap-2 flex-wrap">
          {filterTypes.map(f => {
            const cfg = f === 'ALL' ? null : getConfig(f);
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-1.5 ${
                  filter === f ? 'bg-black text-white border-black shadow-xl' : 'bg-neutral-50 text-neutral-400 border-neutral-100 hover:border-neutral-300'
                }`}
              >
                {cfg && <span className="material-symbols-outlined text-sm">{cfg.icon}</span>}
                {f === 'ALL' ? 'All Events' : cfg?.label}
                <span className="ml-1 opacity-50 text-[9px]">{f === 'ALL' ? logs.length : (typeCounts[f] || 0)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Log List */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-neutral-400 text-xs font-black uppercase tracking-widest">Loading logs...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="py-24 text-center space-y-4">
          <span className="material-symbols-outlined text-7xl text-neutral-100">receipt_long</span>
          <p className="text-neutral-300 font-black uppercase tracking-[0.3em] text-sm">No events found</p>
          <p className="text-neutral-400 text-xs font-medium">
            {logs.length === 0
              ? 'Events appear here when athletes log in, enroll in courses, or complete workouts.'
              : 'Try adjusting your filter or search query.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log, i) => {
            const cfg = getConfig(log.type);
            const timeStr = log.createdAt?.toDate
              ? formatDistanceToNow(log.createdAt.toDate(), { addSuffix: true })
              : 'Just now';
            const dateStr = log.createdAt?.toDate
              ? format(log.createdAt.toDate(), 'MMM d, yyyy · h:mm a')
              : '';
            return (
              <div
                key={log.id}
                className="group bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-lg transition-all flex flex-col sm:flex-row sm:items-center gap-4 animate-in slide-in-from-bottom-2 duration-300 cursor-pointer"
                style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
                onClick={() => setSelectedLog(log)}
              >
                {/* Type Icon */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${cfg.bg}`}>
                  <span className="material-symbols-outlined text-xl filled">{cfg.icon}</span>
                </div>

                {/* User avatar */}
                {log.userAvatar ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-neutral-100 shrink-0">
                    <img src={log.userAvatar} className="w-full h-full object-cover" alt={log.userName || ''} />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-neutral-400 text-lg">person</span>
                  </div>
                )}

                {/* Content */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-neutral-50 ${cfg.color}`}>{cfg.label}</span>
                    <span className="w-1 h-1 rounded-full bg-neutral-200"></span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-neutral-300">{timeStr}</span>
                  </div>
                  <h3 className="text-base font-black text-black uppercase tracking-tight leading-none group-hover:text-accent transition-colors">
                    {log.title}
                  </h3>
                  {log.description && (
                    <p className="text-xs text-neutral-500 font-medium mt-0.5 truncate">{log.description}</p>
                  )}
                  {log.userName && (
                    <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest mt-1">{log.userName} · {log.userEmail}</p>
                  )}
                </div>

                {/* Timestamp + Arrow */}
                <div className="flex items-center gap-4 shrink-0">
                  {dateStr && (
                    <div className="text-right hidden md:block">
                      <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest whitespace-nowrap">{dateStr}</p>
                    </div>
                  )}
                  <span className="material-symbols-outlined text-neutral-200 group-hover:text-accent transition-colors">arrow_forward_ios</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (() => {
        const cfg = getConfig(selectedLog.type);
        const dateStr = selectedLog.createdAt?.toDate
          ? format(selectedLog.createdAt.toDate(), 'PPPP · p')
          : 'Unknown time';
        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-8 border-b border-neutral-100 flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${cfg.bg}`}>
                    <span className="material-symbols-outlined text-2xl filled">{cfg.icon}</span>
                  </div>
                  <div>
                    <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${cfg.color}`}>{cfg.label}</p>
                    <h3 className="text-2xl font-black font-display uppercase text-black leading-none">{selectedLog.title}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="w-10 h-10 bg-neutral-50 border border-neutral-100 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all group shrink-0"
                >
                  <span className="material-symbols-outlined group-hover:rotate-90 transition-transform text-sm">close</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                {/* Description */}
                {selectedLog.description && (
                  <p className="text-sm text-neutral-600 font-medium leading-relaxed">{selectedLog.description}</p>
                )}

                {/* User Context */}
                {selectedLog.userName && (
                  <div className="flex items-center gap-4 p-5 bg-neutral-50 rounded-2xl border border-neutral-100">
                    {selectedLog.userAvatar ? (
                      <img src={selectedLog.userAvatar} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md shrink-0" alt="" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-neutral-500">person</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-base font-black text-black uppercase tracking-tight truncate">{selectedLog.userName}</p>
                      <p className="text-xs text-neutral-400 font-medium truncate">{selectedLog.userEmail}</p>
                    </div>
                  </div>
                )}

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-white border border-neutral-100 rounded-2xl">
                    <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest mb-1">Event ID</p>
                    <p className="text-xs font-black text-black font-mono truncate">{selectedLog.id.slice(0, 16).toUpperCase()}</p>
                  </div>
                  <div className="p-4 bg-white border border-neutral-100 rounded-2xl">
                    <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest mb-1">Timestamp</p>
                    <p className="text-xs font-bold text-black">{dateStr}</p>
                  </div>
                  <div className="p-4 bg-white border border-neutral-100 rounded-2xl">
                    <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest mb-1">Event Type</p>
                    <p className={`text-xs font-black uppercase tracking-tight ${cfg.color}`}>{selectedLog.type}</p>
                  </div>
                  {selectedLog.userId && (
                    <div className="p-4 bg-white border border-neutral-100 rounded-2xl">
                      <p className="text-[8px] font-black text-neutral-300 uppercase tracking-widest mb-1">User ID</p>
                      <p className="text-xs font-black text-black font-mono truncate">{selectedLog.userId.slice(0, 16)}</p>
                    </div>
                  )}
                </div>

                {/* Extra Meta */}
                {selectedLog.meta && Object.keys(selectedLog.meta).length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Additional Context</p>
                    <div className="p-5 bg-neutral-900 rounded-2xl border border-white/5 font-mono text-[11px] text-accent leading-relaxed break-all">
                      {JSON.stringify(selectedLog.meta, null, 2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-neutral-100 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-8 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all shadow-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AdminActivityFeed;
