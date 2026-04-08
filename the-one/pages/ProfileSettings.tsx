
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, updateProfile, updateEmail } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types';

interface ProfileSettingsProps {
  currentUser: User;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ currentUser: initialUser }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'billing'>('profile');
  const [isMfaSetupOpen, setIsMfaSetupOpen] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(() => localStorage.getItem(`mfa_enabled_${initialUser.id}`) === 'true');
  const [otpValue, setOtpValue] = useState('');
  const navigate = useNavigate();
  
  // Dynamic Device Info State
  const [devices, setDevices] = useState<any[]>([]);

  const auth = getAuth();
  const [currentUser, setCurrentUser] = useState<User>(initialUser);
  const [formData, setFormData] = useState({
    firstName: initialUser.firstName || '',
    lastName: initialUser.lastName || '',
    email: initialUser.email || '',
    weight: '',
    height: '',
    age: '',
    fitnessLevel: '',
    bodyFat: '',
    trainingGoal: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Check if this session is an admin impersonating a user
  const isImpersonating = sessionStorage.getItem('is_impersonating') === 'true';

  useEffect(() => {
    // Generate/Load active devices simulation
    // In a real app, this would come from a server tracking sessions.
    
    // Use scoped key
    const storageKey = `user_devices_${currentUser.id}`;
    let storedDevices = JSON.parse(localStorage.getItem(storageKey) || '[]');

    // If we are impersonating, we don't want to show or register this session as a user device
    if (isImpersonating) {
        // Just show the existing devices without adding the admin's current session
        setDevices(storedDevices.map((d: any) => ({...d, isCurrent: false})));
        return;
    }
    
    const ua = navigator.userAgent;
    let browser = 'Unknown Browser';
    if (ua.indexOf("Chrome") > -1) browser = "Chrome";
    else if (ua.indexOf("Safari") > -1) browser = "Safari";
    else if (ua.indexOf("Firefox") > -1) browser = "Firefox";

    let os = 'Unknown OS';
    if (ua.indexOf("Mac") !== -1) os = "Mac OS";
    else if (ua.indexOf("Win") !== -1) os = "Windows";
    else if (ua.indexOf("Linux") !== -1) os = "Linux";
    else if (ua.indexOf("Android") !== -1) os = "Android";
    else if (ua.indexOf("like Mac") !== -1) os = "iOS";

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const location = timeZone.replace('_', ' ');

    const currentSessionId = sessionStorage.getItem(`current_device_id_${currentUser.id}`);

    const activeSessionId = currentSessionId || `device_${Date.now()}`;

    const currentDevice = {
        id: activeSessionId,
        userAgent: `${os} (${browser})`,
        location: location,
        ip: 'Current Session',
        isCurrent: true,
        lastActive: new Date().toLocaleDateString()
    };
    
    if (storedDevices.length === 0) {
        storedDevices = [currentDevice];
    } else {
        storedDevices = storedDevices.map((d: any) => ({...d, isCurrent: false}));
        const existingIdx = storedDevices.findIndex((d: any) => d.id === activeSessionId);
        if (existingIdx >= 0) {
            storedDevices[existingIdx] = currentDevice;
        } else {
            if (storedDevices.length < 2) {
                storedDevices.push(currentDevice);
            }
        }
    }
    
    setDevices(storedDevices);
    localStorage.setItem(storageKey, JSON.stringify(storedDevices));

  }, [isImpersonating, currentUser.id]);

  useEffect(() => {
    const fetchUserData = async () => {
        try {
            if (currentUser && currentUser.id) {
                const userRef = doc(db, 'users', currentUser.id);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    const userData = userSnap.data() as User;
                    setCurrentUser({...currentUser, ...userData});
                    setFormData({
                        firstName: userData.firstName || initialUser.firstName || '',
                        lastName: userData.lastName || initialUser.lastName || '',
                        email: userData.email || initialUser.email || '',
                        weight: (userData as any).weight || '',
                        height: (userData as any).height || '',
                        age: (userData as any).age || '',
                        fitnessLevel: (userData as any).fitnessLevel || '',
                        bodyFat: (userData as any).bodyFat || '',
                        trainingGoal: (userData as any).trainingGoal || ''
                    });
                }
            }
        } catch (error) {
            console.error("Failed to fetch extended user data (this is expected if impersonating):", error);
        } finally {
            setLoading(false);
        }
    };
    fetchUserData();
  }, [currentUser.id, initialUser]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (!currentUser.id) return;

    try {
        const userRef = doc(db, 'users', currentUser.id);
        
        // Update Firestore
        await updateDoc(userRef, {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            weight: formData.weight,
            height: formData.height,
            age: formData.age,
            fitnessLevel: formData.fitnessLevel,
            bodyFat: formData.bodyFat,
            trainingGoal: formData.trainingGoal
        });

        // Update Auth Profile (Display Name)
        if (auth.currentUser && !isImpersonating) {
            await updateProfile(auth.currentUser, {
                displayName: `${formData.firstName} ${formData.lastName}`.trim()
            });
        }

        if (auth.currentUser && formData.email !== auth.currentUser.email && !isImpersonating) {
             alert("Email update requires re-authentication. Please sign out and sign in again to change email safely.");
        }

        alert("Profile updated successfully!");
    } catch (error: any) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile: " + error.message);
    }
    setSaving(false);
  };

  const handleActivateMfa = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue === '123456') {
      setMfaEnabled(true);
      localStorage.setItem(`mfa_enabled_${currentUser.id}`, 'true');
      setIsMfaSetupOpen(false);
      alert("Logic Secured: Google Authenticator is now linked to your account.");
    } else {
      alert("Invalid code. Please try 123456 for the demo.");
    }
  };

  const revokeDevice = (deviceId: string) => {
    if (window.confirm("Revoke access for this device? It will be logged out immediately.")) {
        const updatedDevices = devices.filter(d => d.id !== deviceId);
        setDevices(updatedDevices);
        localStorage.setItem(`user_devices_${currentUser.id}`, JSON.stringify(updatedDevices));
        alert("Device access revoked.");
        
        // If they revoked their current device (and aren't impersonating), log them out
        if (deviceId === sessionStorage.getItem(`current_device_id_${currentUser.id}`) && !isImpersonating) {
             auth.signOut().then(() => {
                 navigate('/login');
             });
        }
    }
  };

  const endImpersonation = () => {
      sessionStorage.removeItem('is_impersonating');
      // To properly end impersonation in this demo setup without server-side tracking,
      // the safest route is to force a logout so the admin can log back into their own account.
      auth.signOut().then(() => {
          navigate('/login');
      });
  };

  // Add a dummy device for testing if under limit
  const addTestDevice = () => {
      if (devices.length >= 2) {
          alert("Maximum device limit reached (2). You must revoke a device before adding a new one.");
          return;
      }
      const newDevice = {
          id: `mock_device_${Date.now()}`,
          userAgent: 'iOS (Safari)',
          location: 'Europe/London',
          ip: '192.168.2.44',
          isCurrent: false,
          lastActive: new Date().toLocaleDateString()
      };
      const updated = [...devices, newDevice];
      setDevices(updated);
      localStorage.setItem(`user_devices_${currentUser.id}`, JSON.stringify(updated));
  };

  if (loading) {
      return <div className="p-20 text-center">Loading profile...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 text-left animate-in fade-in duration-500">
      <div className="space-y-2 mb-12">
        <h1 className="text-4xl font-black font-display uppercase tracking-tight text-black leading-none">Account Logic</h1>
        <p className="text-neutral-400 font-medium">Manage your athlete identity and platform security protocols.</p>
        {isImpersonating && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3 text-orange-700">
                    <span className="material-symbols-outlined">visibility</span>
                    <span className="text-xs font-bold uppercase tracking-widest">Admin Impersonation Mode Active</span>
                </div>
                <button onClick={endImpersonation} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-orange-700 transition-colors shadow-md">
                    End Session
                </button>
            </div>
        )}
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
               <form onSubmit={handleProfileUpdate} className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">First Name</label>
                        <input 
                            type="text" 
                            value={formData.firstName}
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                            className="w-full p-5 bg-neutral-50 rounded-2xl border border-neutral-100 outline-none focus:border-black font-bold" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Last Name</label>
                        <input 
                            type="text" 
                            value={formData.lastName}
                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                            className="w-full p-5 bg-neutral-50 rounded-2xl border border-neutral-100 outline-none focus:border-black font-bold" 
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Email</label>
                        <input 
                            type="email" 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full p-5 bg-neutral-50 rounded-2xl border border-neutral-100 outline-none focus:border-black font-bold" 
                        />
                      </div>
                   </div>

                   <div className="border-t border-neutral-50 pt-8">
                       <h3 className="text-lg font-black font-display uppercase text-black mb-6">Biometrics & Stats</h3>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="space-y-2">
                               <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Weight (lbs)</label>
                               <input 
                                   type="number" 
                                   value={formData.weight}
                                   onChange={(e) => setFormData({...formData, weight: e.target.value})}
                                   placeholder="e.g. 185"
                                   className="w-full p-4 bg-neutral-50 rounded-2xl border border-neutral-100 outline-none focus:border-black font-bold" 
                               />
                           </div>
                           <div className="space-y-2">
                               <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Height (cm)</label>
                               <input 
                                   type="number" 
                                   value={formData.height}
                                   onChange={(e) => setFormData({...formData, height: e.target.value})}
                                   placeholder="e.g. 180"
                                   className="w-full p-4 bg-neutral-50 rounded-2xl border border-neutral-100 outline-none focus:border-black font-bold" 
                               />
                           </div>
                           <div className="space-y-2">
                               <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Age</label>
                               <input 
                                   type="number" 
                                   value={formData.age}
                                   onChange={(e) => setFormData({...formData, age: e.target.value})}
                                   placeholder="e.g. 28"
                                   className="w-full p-4 bg-neutral-50 rounded-2xl border border-neutral-100 outline-none focus:border-black font-bold" 
                               />
                           </div>
                           <div className="md:col-span-3 space-y-2">
                               <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Self-Reported Fitness Level</label>
                               <select 
                                   value={formData.fitnessLevel}
                                   onChange={(e) => setFormData({...formData, fitnessLevel: e.target.value})}
                                   className="w-full p-4 bg-neutral-50 rounded-2xl border border-neutral-100 outline-none focus:border-black font-bold uppercase text-xs"
                                >
                                   <option value="">-- Select Level --</option>
                                   <option value="Beginner">Beginner (0-1 Years)</option>
                                   <option value="Intermediate">Intermediate (1-3 Years)</option>
                                   <option value="Advanced">Advanced (3+ Years)</option>
                                   <option value="Elite">Elite / Competitive</option>
                               </select>
                           </div>
                           <div className="md:col-span-1 space-y-2">
                               <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Body Fat %</label>
                               <input 
                                   type="number" 
                                   value={formData.bodyFat}
                                   onChange={(e) => setFormData({...formData, bodyFat: e.target.value})}
                                   placeholder="e.g. 15"
                                   className="w-full p-4 bg-neutral-50 rounded-2xl border border-neutral-100 outline-none focus:border-black font-bold" 
                               />
                           </div>
                           <div className="md:col-span-2 space-y-2">
                               <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-1">Core Training Goal</label>
                               <select 
                                   value={formData.trainingGoal}
                                   onChange={(e) => setFormData({...formData, trainingGoal: e.target.value})}
                                   className="w-full p-4 bg-neutral-50 rounded-2xl border border-neutral-100 outline-none focus:border-black font-bold uppercase text-xs"
                                >
                                   <option value="">-- Select Goal --</option>
                                   <option value="Hypertrophy">Hypertrophy (Muscle Gain)</option>
                                   <option value="Strength">Raw Power & Strength</option>
                                   <option value="Endurance">Cardiovascular Endurance</option>
                                   <option value="Weight Loss">Weight Loss & Toning</option>
                                   <option value="Athletic Performance">Athletic Performance / Agility</option>
                               </select>
                           </div>
                       </div>
                   </div>

                   <button 
                    type="submit" 
                    disabled={saving || isImpersonating}
                    className="px-10 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-neutral-800 transition-all shadow-lg disabled:opacity-50"
                   >
                     {isImpersonating ? 'Disabled in Impersonation' : (saving ? 'Saving...' : 'Commit Identity Changes')}
                   </button>
               </form>
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
                          disabled={isImpersonating}
                          className="px-8 py-4 bg-accent text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-all shadow-lg shadow-accent/20 disabled:opacity-50"
                        >
                          Setup Protocol
                        </button>
                     ) : (
                        <button 
                          onClick={() => { if(!isImpersonating && window.confirm("Disable MFA protection?")) { setMfaEnabled(false); localStorage.removeItem(`mfa_enabled_${currentUser.id}`); } }}
                          disabled={isImpersonating}
                          className="px-8 py-4 border border-neutral-100 text-red-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-50 transition-all disabled:opacity-50"
                        >
                          Deactivate
                        </button>
                     )}
                  </div>
               </div>

               <div className="bg-white rounded-[3rem] border border-neutral-100 p-10 shadow-sm space-y-8">
                  <div className="flex justify-between items-end border-b border-neutral-50 pb-6">
                      <div className="space-y-1">
                          <h3 className="text-xl font-black font-display uppercase text-black">Device Management</h3>
                          <p className="text-xs text-neutral-500 font-medium">You can only be logged in on a maximum of <strong className="text-black">2 devices</strong> simultaneously.</p>
                      </div>
                      <div className="text-right">
                          <span className={`text-sm font-black ${devices.length >= 2 ? 'text-red-500' : 'text-green-500'}`}>{devices.length} / 2</span>
                          <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400 mt-1">Slots Used</p>
                      </div>
                  </div>

                  <div className="space-y-4">
                     {devices.map((device, idx) => (
                         <div key={device.id} className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${device.isCurrent ? 'bg-neutral-50 border-neutral-200' : 'bg-white border-neutral-100 hover:border-black'}`}>
                            <div className="flex items-center gap-6">
                               <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-neutral-400 shadow-sm border border-neutral-100">
                                  <span className="material-symbols-outlined">
                                      {device.userAgent.includes('iOS') || device.userAgent.includes('Android') ? 'smartphone' : 'laptop_mac'}
                                  </span>
                               </div>
                               <div>
                                  <div className="flex items-center gap-2">
                                     <p className="font-black text-black uppercase text-sm">{device.userAgent}</p>
                                     {device.isCurrent && (
                                         <span className="px-2 py-0.5 bg-accent text-white text-[7px] font-black uppercase tracking-widest rounded shadow-sm">Current Session</span>
                                     )}
                                  </div>
                                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">
                                      {device.location} • {device.isCurrent ? 'Active Now' : `Last active: ${device.lastActive}`}
                                  </p>
                               </div>
                            </div>
                            <button 
                              onClick={() => revokeDevice(device.id)}
                              disabled={isImpersonating}
                              className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-400 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm group disabled:opacity-50"
                              title="Revoke Access"
                            >
                               <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">delete</span>
                            </button>
                         </div>
                     ))}
                     {devices.length === 0 && (
                         <p className="text-center text-neutral-400 text-xs italic py-4">No registered devices found.</p>
                     )}
                  </div>
                  
                  {/* Developer testing tool */}
                  {devices.length < 2 && !isImpersonating && (
                      <button onClick={addTestDevice} className="w-full py-4 border-2 border-dashed border-neutral-200 rounded-2xl text-[10px] font-black uppercase text-neutral-400 hover:text-black hover:border-black transition-colors">
                          + Simulate Another Login (Test)
                      </button>
                  )}
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
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
