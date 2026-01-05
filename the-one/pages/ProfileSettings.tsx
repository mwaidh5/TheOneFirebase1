
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ProfileSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'billing'>('profile');
  const [isMfaSetupOpen, setIsMfaSetupOpen] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(() => localStorage.getItem('mfa_enabled_u1') === 'true');
  const [otpValue, setOtpValue] = useState('');

  const handleActivateMfa = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue === '123456') {
      setMfaEnabled(true);
      localStorage.setItem('mfa_enabled_u1', 'true');
      setIsMfaSetupOpen(false);
      alert("Logic Secured: Google Authenticator is now linked to your account.");
    } else {
      alert("Invalid code. Please try 123456 for the demo.");
    }
  };

  const revokeDevice = () => {
    if (window.confirm("Revoke trust for this device? You will need an MFA code to log in next time.")) {
      localStorage.removeItem('trusted_device_u1');
      alert("Device token purged.");
      window.location.reload();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 text-left animate-in fade-in duration-500">
      <div className="space-y-2 mb-12">
        <h1 className="text-4xl font-black font-display uppercase tracking-tight text-black leading-none">Account Logic</h1>
        <p className="text-neutral-400 font-medium">Manage your athlete identity and platform security protocols.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar Nav */}
        <div className="lg:col-span-3 space-y-2">
           {[
             { id: 'profile', label: 'Personal Info', icon: 'person' },
             { id: 'security', label: 'Security & MFA', icon: 'shield_lock' },
             { id: 'billing', label: 'Billing History', icon: 'payments' }
           ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === tab.id ? 'bg-black text-white shadow-xl' : 'text-neutral-400 hover:bg-neutral-50 hover:text-black'}`}
             >
               <span className={`material-symbols-outlined text-[20px] ${activeTab === tab.id ? 'filled' : ''}`}>{tab.icon}</span>
               {tab.label}
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-[3rem] border border-neutral-100 p-10 shadow-sm space-y-10 animate-in slide-in-from-right-4 duration-500">
               <div className="flex justify-between items-center border-b border-neutral-50 pb-8">
                  <h2 className="text-2xl font-black font-display uppercase text-black">Identity Details</h2>
                  <span className="material-symbols-outlined text-neutral-200">badge</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">First Name</label>
                    <input type="text" defaultValue="Alex" className="w-full p-5 bg-neutral-50 rounded-2xl border border-neutral-100 outline-none focus:border-black font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Last Name</label>
                    <input type="text" defaultValue="Johnson" className="w-full p-5 bg-neutral-50 rounded-2xl border border-neutral-100 outline-none focus:border-black font-bold" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Email</label>
                    <input type="email" defaultValue="alex.johnson@example.com" className="w-full p-5 bg-neutral-50 rounded-2xl border border-neutral-100 outline-none focus:border-black font-bold" />
                  </div>
               </div>
               <button className="px-10 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-neutral-800 transition-all shadow-lg">
                 Commit Identity Changes
               </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
               <div className="bg-white rounded-[3rem] border border-neutral-100 p-10 shadow-sm space-y-10">
                  <div className="flex justify-between items-center border-b border-neutral-50 pb-8">
                     <div className="space-y-1">
                        <h2 className="text-2xl font-black font-display uppercase text-black">Multi-Factor Authentication</h2>
                        <p className="text-xs text-neutral-400 font-medium">Protect your privileged access with an extra layer of logic.</p>
                     </div>
                     <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${mfaEnabled ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-neutral-50 text-neutral-400 border border-neutral-100'}`}>
                        {mfaEnabled ? 'System Shield Active' : 'Unprotected'}
                     </span>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-10">
                     <div className="w-20 h-20 rounded-[1.5rem] bg-neutral-50 flex items-center justify-center text-accent shrink-0 shadow-inner">
                        <span className="material-symbols-outlined text-4xl filled">google_plus_reshare</span>
                     </div>
                     <div className="flex-grow space-y-2 text-center md:text-left">
                        <h3 className="text-lg font-black uppercase text-black">Google Authenticator</h3>
                        <p className="text-sm text-neutral-500 font-medium max-w-md">Use a mobile app to generate one-time verification codes when logging in from a new machine.</p>
                     </div>
                     {!mfaEnabled ? (
                        <button 
                          onClick={() => setIsMfaSetupOpen(true)}
                          className="px-8 py-4 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-all shadow-lg shadow-accent/20"
                        >
                          Setup Protocol
                        </button>
                     ) : (
                        <button 
                          onClick={() => { if(window.confirm("Disable MFA protection?")) { setMfaEnabled(false); localStorage.removeItem('mfa_enabled_u1'); } }}
                          className="px-8 py-4 border border-neutral-100 text-red-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-50 transition-all"
                        >
                          Deactivate
                        </button>
                     )}
                  </div>
               </div>

               <div className="bg-white rounded-[3rem] border border-neutral-100 p-10 shadow-sm space-y-8">
                  <h3 className="text-xl font-black font-display uppercase text-black">Device Management</h3>
                  <div className="space-y-4">
                     <div className="flex items-center justify-between p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-neutral-400 shadow-sm">
                              <span className="material-symbols-outlined">laptop_mac</span>
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                 <p className="font-black text-black uppercase text-sm">MacBook Pro (Chrome)</p>
                                 <span className="px-2 py-0.5 bg-accent text-white text-[7px] font-black uppercase tracking-widest rounded">Current Session</span>
                              </div>
                              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Authorized from Tokyo, JP • 192.168.1.1</p>
                           </div>
                        </div>
                        <button 
                          onClick={revokeDevice}
                          className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                        >
                          Revoke Trust
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="bg-white rounded-[3rem] border border-neutral-100 p-10 shadow-sm space-y-10 animate-in slide-in-from-right-4 duration-500">
               <h2 className="text-2xl font-black font-display uppercase text-black">Platform Ledger</h2>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="border-b border-neutral-50">
                     <tr>
                       <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Enrollment</th>
                       <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Cycle ID</th>
                       <th className="py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Receipt</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-neutral-50">
                     {[1, 2].map(i => (
                       <tr key={i} className="group hover:bg-neutral-50/50 transition-colors">
                         <td className="py-6">
                           <p className="text-sm font-black text-black uppercase tracking-tight">Engine Builder 101</p>
                           <p className="text-[10px] text-neutral-400 font-bold uppercase mt-1">Oct 24, 2024 • $149.00</p>
                         </td>
                         <td className="py-6 text-xs font-mono text-neutral-300">ORD-V99212</td>
                         <td className="py-6 text-right">
                            <button className="text-neutral-300 hover:text-black transition-colors"><span className="material-symbols-outlined">download</span></button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* MFA SETUP MODAL */}
      {isMfaSetupOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
              <div className="p-10 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
                 <div className="text-left space-y-1">
                    <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Security Protocol Setup</p>
                    <h3 className="text-3xl font-black font-display uppercase text-black leading-none">Authenticator Link</h3>
                 </div>
                 <button onClick={() => setIsMfaSetupOpen(false)} className="w-12 h-12 bg-white border border-neutral-100 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm group">
                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">close</span>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar text-center">
                 <div className="space-y-4">
                    <div className="w-48 h-48 bg-white border-8 border-neutral-50 mx-auto p-4 rounded-[3rem] shadow-xl relative group">
                       {/* Simulated QR Code */}
                       <div className="w-full h-full bg-neutral-900 rounded-2xl flex items-center justify-center p-4">
                          <div className="grid grid-cols-8 grid-rows-8 gap-1 w-full h-full opacity-80">
                             {Array.from({length: 64}).map((_, i) => (
                               <div key={i} className={`${Math.random() > 0.5 ? 'bg-white' : 'bg-transparent'} rounded-sm`}></div>
                             ))}
                          </div>
                       </div>
                       <div className="absolute inset-0 bg-accent/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm rounded-[3rem]">
                          <span className="text-white font-black uppercase text-[10px] tracking-widest bg-black px-4 py-2 rounded-full">Scan Protocol</span>
                       </div>
                    </div>
                    <div className="space-y-1">
                       <p className="text-sm font-black uppercase tracking-tight text-black">Scan with Google Authenticator</p>
                       <p className="text-xs text-neutral-400 font-medium">Or enter code manually: <span className="font-mono text-accent font-bold">IRON-PULSE-ADMIN-X92</span></p>
                    </div>
                 </div>

                 <div className="max-w-xs mx-auto space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Confirm Logic Sync</label>
                       <input 
                         type="text" 
                         value={otpValue}
                         onChange={(e) => setOtpValue(e.target.value)}
                         placeholder="Enter 6-digit code" 
                         maxLength={6}
                         className="w-full text-center text-3xl font-black tracking-[0.5em] p-6 bg-neutral-50 rounded-3xl border border-neutral-100 focus:border-accent outline-none" 
                       />
                    </div>
                    <button 
                      onClick={handleActivateMfa}
                      className="w-full py-6 bg-black text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-accent transition-all shadow-xl"
                    >
                      Authorize Protocol
                    </button>
                    <p className="text-[9px] font-bold text-neutral-300 uppercase italic">Hint: Use "123456" for simulation approval.</p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;
