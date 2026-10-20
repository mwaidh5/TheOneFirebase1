
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, where, getDocs, deleteDoc, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { CustomCourseRequest, Coach, User, CustomDiscipline } from '../../types';
import { useT } from '../../i18n/I18nContext';
import { TranslationKey } from '../../i18n/translations';

// Display labels for stored request statuses (the values stay English).
const STATUS_LABEL: Record<string, TranslationKey> = {
  PENDING_PAYMENT: 'status.pending_payment',
  DIAGNOSTIC: 'status.diagnostic',
  BUILDING: 'status.building',
  COMPLETED: 'status.completed',
};

const AdminCustomRequests: React.FC = () => {
  const navigate = useNavigate();
  const { t, lang } = useT();
  const [requests, setRequests] = useState<CustomCourseRequest[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [disciplines, setDisciplines] = useState<CustomDiscipline[]>([]);
  const [inspectingReq, setInspectingReq] = useState<CustomCourseRequest | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'INTAKE' | 'RESULTS'>('INTAKE');

  // Manual Lead State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({ clientId: '', sportId: '' });

  useEffect(() => {
    // 1. Fetch Coaches
    const fetchCoaches = async () => {
      const q = query(collection(db, 'users'), where('role', '==', 'Coach'));
      const snapshot = await getDocs(q);
      const coachData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coach));
      setCoaches(coachData);
    };
    fetchCoaches();

    // 2. Fetch Clients for Manual Assignment
    const fetchClients = async () => {
        const q = query(collection(db, 'users'), where('role', '==', 'Client'));
        const snapshot = await getDocs(q);
        const clientData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setClients(clientData);
    };
    fetchClients();

    // 3. Fetch Disciplines (Sports)
    const fetchDisciplines = async () => {
        try {
            const snap = await getDocs(collection(db, 'custom_disciplines'));
            setDisciplines(snap.docs.map(d => d.data() as CustomDiscipline));
        } catch (e) {
            console.error("Error fetching disciplines", e);
        }
    };
    fetchDisciplines();

    // 4. Real-time listener for Custom Requests
    const reqQuery = query(collection(db, 'custom_requests'));
    const unsubscribe = onSnapshot(reqQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomCourseRequest));
      setRequests(data);
    });

    return () => unsubscribe();
  }, []);

  const openInspector = (req: CustomCourseRequest) => {
    setInspectingReq(req);
    setActiveModalTab('INTAKE');
  };

  const handleGrantAccess = async (reqId: string) => {
    if (!window.confirm(t('builder.confirm_grant'))) return;
    try {
      await updateDoc(doc(db, 'custom_requests', reqId), {
        status: 'DIAGNOSTIC'
      });
    } catch (error) {
      console.error("Error granting access:", error);
      alert(t('builder.grant_failed'));
    }
  };

  const handleDeleteRequest = async (reqId: string) => {
    if (!window.confirm(t('builder.confirm_delete_lead'))) return;
    try {
      await deleteDoc(doc(db, 'custom_requests', reqId));
    } catch (error) {
      console.error("Error deleting request:", error);
      alert(t('builder.delete_failed'));
    }
  };

  return (
    <div className="space-y-12 text-start animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">{t('builder.leads_title')}</h1>
            <p className="text-neutral-400 font-medium">{t('builder.leads_sub')}</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition shadow-lg flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            {t('builder.add_manual_lead')}
          </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-neutral-100 overflow-hidden shadow-2xl">
        <table className="w-full text-start">
          <thead className="bg-neutral-50 border-b border-neutral-100">
            <tr>
              <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('builder.th_athlete')}</th>
              <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('builder.th_game')}</th>
              <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('builder.th_coach')}</th>
              <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-end">{t('builder.th_actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {requests.length === 0 ? (
               <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-neutral-400 font-bold uppercase tracking-widest text-xs">
                     {t('builder.no_requests')}
                  </td>
               </tr>
            ) : requests.map((req) => {
              const assignedCoach = coaches.find(c => req.assignedCoachIds?.includes(c.id));
              const game = disciplines.find(d => d.id === req.sport); // Use fetched disciplines

              return (
                <tr key={req.id} className="hover:bg-neutral-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <p className="font-black text-black uppercase text-sm tracking-tight">{req.athleteName}</p>
                      <button 
                        onClick={() => openInspector(req)}
                        className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1 hover:text-black"
                      >
                        <span className="material-symbols-outlined text-[14px]">visibility</span>
                        {t('builder.inspect_dossier')}
                      </button>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-2">
                      <span className={`w-fit px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                        req.status === 'PENDING_PAYMENT' ? 'bg-orange-50 text-orange-600' : 
                        req.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {STATUS_LABEL[req.status] ? t(STATUS_LABEL[req.status]) : req.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest"><span dir="ltr">${req.price}</span> • {game?.name || req.sport}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {assignedCoach ? (
                       <div className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-100 rounded-2xl w-fit shadow-sm">
                          <img src={assignedCoach.avatar || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="" />
                          <div>
                             <p className="text-[10px] font-black uppercase text-black leading-tight">{assignedCoach.name}</p>
                             <p className="text-[8px] font-bold text-accent uppercase tracking-widest mt-0.5">{game?.name || t('builder.master_coach')}</p>
                          </div>
                       </div>
                    ) : (
                       <span className="text-[10px] font-black text-neutral-300 uppercase italic">{t('builder.awaiting_assign')}</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-end">
                    <div className="flex items-center justify-end gap-2">
                      {req.status === 'PENDING_PAYMENT' && (
                        <button
                          onClick={() => handleGrantAccess(req.id)}
                          title={t('builder.grant_access_title')}
                          className="w-10 h-10 flex items-center justify-center bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[20px]">lock_open</span>
                        </button>
                      )}

                      <button 
                        onClick={() => navigate(`/admin/custom-programmer/${req.id}`)}
                        className="px-6 py-3 bg-neutral-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition shadow-lg flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[16px]">design_services</span>
                        {t('builder.submit_course')}
                      </button>

                      <button
                        onClick={() => handleDeleteRequest(req.id)}
                        title={t('builder.remove_lead')}
                        className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Manual Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 text-start">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden p-10 space-y-8">
               <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-black font-display uppercase tracking-tight">{t('builder.manual_lead')}</h3>
                   <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center hover:bg-black hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
               </div>
               
               <div className="space-y-6">
                   <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-neutral-400 ms-1">{t('builder.select_client')}</label>
                       <select 
                           value={newLead.clientId} 
                           onChange={e => setNewLead({...newLead, clientId: e.target.value})}
                           className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-4 font-bold text-sm outline-none"
                       >
                           <option value="">{t('builder.choose_athlete')}</option>
                           {clients.map(c => (
                               <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.email})</option>
                           ))}
                       </select>
                   </div>
                   
                   <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-neutral-400 ms-1">{t('builder.select_discipline')}</label>
                       <select 
                           value={newLead.sportId} 
                           onChange={e => setNewLead({...newLead, sportId: e.target.value})}
                           className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-4 font-bold text-sm outline-none"
                       >
                           <option value="">{t('builder.choose_sport')}</option>
                           {disciplines.length === 0 && <option disabled>{t('builder.no_sports')}</option>}
                           {disciplines.map(s => (
                               <option key={s.id} value={s.id}>{s.name} (${s.price})</option>
                           ))}
                       </select>
                   </div>
                   
                   <button 
                       onClick={async () => {
                           if (!newLead.clientId || !newLead.sportId) return alert(t('builder.all_fields_required'));
                           const client = clients.find(c => c.id === newLead.clientId);
                           const sport = disciplines.find(s => s.id === newLead.sportId);
                           if (!client || !sport) return;
                           
                           try {
                               // 1. Create Request
                               const reqData = {
                                    athleteId: client.id,
                                    athleteName: `${client.firstName} ${client.lastName}`,
                                    phone: '',
                                    sport: sport.id,
                                    goal: `Manual Assignment: ${sport.name}`,
                                    biometrics: { height: '', weight: '', age: '' },
                                    status: 'DIAGNOSTIC', 
                                    price: sport.price,
                                    createdAt: serverTimestamp(),
                                    assignedCoachIds: sport.assignedCoachId ? [sport.assignedCoachId] : [],
                                    weeks: [],
                                    hasMealPlan: false,
                                    durationWeeks: 4,
                                    diagnostics: sport.diagnostics || [],
                                    submissions: []
                               };
                               
                               const docRef = await addDoc(collection(db, 'custom_requests'), reqData);
                               
                               // 2. Enroll User
                               // Dynamically import arrayUnion to avoid top-level import issues if any
                               const { arrayUnion } = await import('firebase/firestore');
                               await updateDoc(doc(db, 'users', client.id), {
                                   enrolledCourseIds: arrayUnion(docRef.id)
                               });
                               
                               setIsAddModalOpen(false);
                               setNewLead({ clientId: '', sportId: '' });
                               alert(t('builder.lead_created'));
                           } catch (e) {
                               console.error(e);
                               alert(t('builder.lead_error'));
                           }
                       }}
                       className="w-full py-5 bg-black text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-accent transition shadow-xl"
                   >
                       {t('builder.create_grant')}
                   </button>
               </div>
           </div>
        </div>
      )}

      {/* Inspector Modal */}
      {inspectingReq && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 text-start">
          <div className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
               <div className="space-y-1 text-start">
                  <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">{t('builder.athlete_investigation')}</p>
                  <h3 className="text-4xl font-black font-display uppercase text-black leading-none">{inspectingReq.athleteName}</h3>
               </div>
               <button 
                onClick={() => setInspectingReq(null)}
                className="w-14 h-14 bg-white border border-neutral-100 rounded-2xl flex items-center justify-center hover:bg-black hover:text-white transition shadow-sm"
               >
                  <span className="material-symbols-outlined">close</span>
               </button>
            </div>

            <div className="flex border-b border-neutral-100 bg-white">
              <button 
                onClick={() => setActiveModalTab('INTAKE')}
                className={`flex-1 py-6 text-center text-[10px] font-black uppercase tracking-widest transition border-b-4 ${activeModalTab === 'INTAKE' ? 'border-black text-black bg-neutral-50/50' : 'border-transparent text-neutral-300 hover:text-black'}`}
              >
                {t('builder.inquiry_profile')}
              </button>
              <button 
                onClick={() => setActiveModalTab('RESULTS')}
                className={`flex-1 py-6 text-center text-[10px] font-black uppercase tracking-widest transition border-b-4 ${activeModalTab === 'RESULTS' ? 'border-black text-black bg-neutral-50/50' : 'border-transparent text-neutral-300 hover:text-black'}`}
              >
                {t('builder.test_submissions', { n: inspectingReq.submissions?.length || 0 })}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 no-scrollbar">
               {activeModalTab === 'INTAKE' ? (
                 <div className="space-y-10 animate-in fade-in duration-300">
                    <div className="grid grid-cols-3 gap-6">
                       {[
                          { l: t('builder.height'), v: inspectingReq.biometrics?.height || t('builder.na') },
                          { l: t('builder.weight'), v: inspectingReq.biometrics?.weight || t('builder.na') },
                          { l: t('builder.age'), v: inspectingReq.biometrics?.age || t('builder.na') }
                       ].map(s => (
                          <div key={s.l} className="p-8 bg-neutral-50 rounded-[2.5rem] border border-neutral-100 text-center shadow-inner">
                             <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">{s.l}</p>
                             <p className="text-3xl font-black text-black">{s.v}</p>
                          </div>
                       ))}
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-xl font-black uppercase tracking-tight border-s-4 border-accent ps-6">{t('builder.stimulus_directive')}</h3>
                       <div className="p-10 bg-neutral-50 rounded-[3rem] border border-neutral-100 italic text-neutral-600 leading-relaxed font-medium text-lg">
                         "{inspectingReq.goal}"
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-8 animate-in slide-in-from-right-4 rtl:slide-in-from-left-4 duration-300">
                    {inspectingReq.submissions && inspectingReq.submissions.length > 0 ? (
                        inspectingReq.submissions.map((sub, idx) => {
                            const test = inspectingReq.diagnostics?.find(d => d.id === sub.testId);
                            return (
                                <div key={idx} className="p-8 bg-neutral-50 rounded-[2.5rem] border border-neutral-100 space-y-4 shadow-sm">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">{test?.title || t('builder.diagnostic_question')}</p>
                                        <span className="text-[8px] font-bold text-neutral-300 uppercase">{new Date(sub.submittedAt).toLocaleDateString(lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB')}</span>
                                    </div>
                                    
                                    {sub.data.startsWith('http') ? (
                                        <div className="rounded-2xl overflow-hidden shadow-inner border border-neutral-200">
                                            {test?.inputType === 'VIDEO' || sub.data.includes('.mp4') || sub.data.includes('.mov') || sub.data.includes('.webm') ? (
                                                <video src={sub.data} controls className="w-full max-h-[400px] object-cover bg-black" />
                                            ) : (
                                                <img src={sub.data} alt={t('builder.submission_alt')} className="w-full object-contain bg-neutral-900" />
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm font-bold text-black leading-relaxed whitespace-pre-wrap">{sub.data}</p>
                                    )}
                                    
                                    {test?.instruction && (
                                        <p className="text-[9px] font-medium text-neutral-400 italic border-s-2 border-neutral-200 ps-3">{t('builder.ref')} "{test.instruction}"</p>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-20 text-center space-y-4">
                            <span className="material-symbols-outlined text-6xl text-neutral-100">inbox</span>
                            <p className="text-neutral-300 font-black uppercase tracking-widest text-xs">{t('builder.no_submissions_yet')}</p>
                        </div>
                    )}
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomRequests;
