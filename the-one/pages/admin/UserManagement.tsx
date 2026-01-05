
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../../types';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Suspended' | 'Inactive';
  role: string; // Athlete skill level (e.g., RX, Elite)
  systemRole: UserRole;
  lastSeen: string;
  isBespokeAuthorized?: boolean;
}

interface UserManagementProps {
  onImpersonate: (user: User) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ onImpersonate }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  
  const menuRef = useRef<HTMLDivElement>(null);

  const [users, setUsers] = useState<UserData[]>(() => {
    const saved = localStorage.getItem('ironpulse_users');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('ironpulse_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (id: string) => {
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleResetSecurity = (userId: string) => {
    if (window.confirm("Purge all trusted devices and MFA logic for this user? They will need to perform a fresh activation setup.")) {
       localStorage.removeItem(`trusted_device_${userId}`);
       localStorage.removeItem(`mfa_enabled_${userId}`);
       alert("Security credentials purged from database.");
       setActiveMenuId(null);
    }
  };

  const handleOpenEdit = (user: UserData) => {
    setEditingUser({ ...user });
    setIsEditModalOpen(true);
    setActiveMenuId(null);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handleUpdateUserStatus = (userId: string, status: UserData['status']) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status } : u));
    setActiveMenuId(null);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Are you sure you want to purge this athlete's data? This action is irreversible.")) {
      setUsers(users.filter(u => u.id !== userId));
      setActiveMenuId(null);
    }
  };

  const handleImpersonateUser = (userData: UserData) => {
    const userToLogin: User = {
      id: userData.id,
      firstName: userData.name.split(' ')[0],
      lastName: userData.name.split(' ').slice(1).join(' '),
      email: userData.email,
      role: userData.systemRole,
      avatar: `https://picsum.photos/100/100?random=${userData.id}`,
      memberSince: '2024',
      level: userData.role
    };
    onImpersonate(userToLogin);
    if (userToLogin.role === UserRole.COACH) navigate('/coach');
    else if (userToLogin.role === UserRole.SUPPORT) navigate('/support');
    else navigate('/profile');
  };

  const toggleBespokePermission = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, isBespokeAuthorized: !u.isBespokeAuthorized } : u));
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.systemRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleOptions = [
    { label: 'All Users', value: 'ALL', icon: 'groups' },
    { label: 'Clients', value: UserRole.CLIENT, icon: 'person' },
    { label: 'Coaches', value: UserRole.COACH, icon: 'fitness_center' },
    { label: 'Support', value: UserRole.SUPPORT, icon: 'support_agent' },
    { label: 'Admins', value: UserRole.ADMIN, icon: 'admin_panel_settings' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 text-left animate-in fade-in duration-500 pb-40">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black font-display tracking-tight text-black uppercase">Platform Community</h1>
          <p className="text-neutral-400 font-medium">Manage athletes, audit logs, and authorize coaches for custom programming.</p>
        </div>
        <Link to="/admin/users/new" className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neutral-800 transition-all shadow-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">person_add</span>
          Add New User
        </Link>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-neutral-100 shadow-xl flex flex-col lg:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-neutral-300">search</span>
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold outline-none focus:border-black transition-all"
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar">
          {roleOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRoleFilter(opt.value as any)}
              className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 border flex items-center gap-2 ${
                roleFilter === opt.value ? 'bg-black text-white border-black shadow-xl' : 'bg-neutral-50 text-neutral-400 border-neutral-50 hover:border-neutral-200'
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${roleFilter === opt.value ? 'filled' : ''}`}>{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-2xl relative overflow-hidden">
          <table className="w-full text-left table-auto">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">User / Athlete</th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">System Role</th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Logic Access</th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filteredUsers.map((user, i) => {
                const isBottomRow = i >= filteredUsers.length - 2 && filteredUsers.length > 2;
                const isPrivileged = [UserRole.ADMIN, UserRole.COACH, UserRole.SUPPORT].includes(user.systemRole);
                const isCoach = user.systemRole === UserRole.COACH;
                const isSupport = user.systemRole === UserRole.SUPPORT;
                const isAdminRole = user.systemRole === UserRole.ADMIN;
                
                return (
                  <tr key={user.id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-neutral-100 overflow-hidden border-2 border-white shadow-sm shrink-0">
                          <img src={`https://picsum.photos/100/100?random=${user.id}`} alt="Avatar" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-black uppercase text-sm tracking-tight truncate">{user.name}</p>
                          <p className="text-[10px] text-neutral-400 font-medium truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isSupport ? 'text-purple-600' : isAdminRole ? 'text-red-500' : 'text-neutral-600'}`}>{user.systemRole}</p>
                        <span className={`w-fit px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full ${
                          user.status === 'Active' ? 'bg-green-50 text-green-700' : 
                          user.status === 'Suspended' ? 'bg-red-50 text-red-700' :
                          'bg-neutral-100 text-neutral-500'
                        }`}>
                          {user.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {isCoach ? (
                        <button 
                          onClick={() => toggleBespokePermission(user.id)}
                          className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${user.isBespokeAuthorized ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-neutral-50 border-neutral-100 text-neutral-300'}`}
                        >
                          <span className="material-symbols-outlined text-[18px]">{user.isBespokeAuthorized ? 'verified' : 'cancel'}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">{user.isBespokeAuthorized ? 'Can Build Custom' : 'Standard Only'}</span>
                        </button>
                      ) : isSupport ? (
                        <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                           <span className="material-symbols-outlined text-sm filled">support_agent</span> Lead Resolver
                        </span>
                      ) : isAdminRole ? (
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                           <span className="material-symbols-outlined text-sm filled">shield_person</span> System God
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-neutral-200 uppercase tracking-widest">N/A for Client</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right relative">
                      <div className="flex justify-end gap-2">
                        {(isCoach || isSupport) && (
                           <button 
                              onClick={() => handleImpersonateUser(user)}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 ${
                                isSupport ? 'bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white' : 'bg-accent/10 text-accent hover:bg-accent hover:text-white'
                              }`}
                           >
                              <span className="material-symbols-outlined text-[16px] filled">login</span>
                              Login as {user.systemRole}
                           </button>
                        )}
                        <button 
                          onClick={() => toggleMenu(user.id)} 
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                            activeMenuId === user.id ? 'bg-black text-white shadow-lg' : 'bg-neutral-50 text-neutral-400 hover:text-black hover:bg-white'
                          }`}
                        >
                          <span className="material-symbols-outlined">settings_suggest</span>
                        </button>
                        
                        {activeMenuId === user.id && (
                          <div 
                            ref={menuRef}
                            className={`absolute right-8 w-64 bg-white border border-neutral-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] py-3 z-[1000] animate-in fade-in duration-300 overflow-hidden text-left ${
                               isBottomRow ? 'bottom-[80%] mb-2' : 'top-[80%] mt-2'
                            }`}
                          >
                            <div className="px-4 py-2 border-b border-neutral-50 mb-2">
                               <p className="text-[9px] font-black text-neutral-300 uppercase tracking-widest">User Control</p>
                            </div>
                            
                            <button 
                              onClick={() => handleOpenEdit(user)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-neutral-600 hover:bg-neutral-50 hover:text-black transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit_square</span> Edit Profile
                            </button>

                            <button 
                              onClick={() => handleImpersonateUser(user)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-accent hover:bg-accent/5 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">login</span> 
                              Login as {user.systemRole}
                            </button>
                            
                            {isPrivileged && (
                              <button 
                                onClick={() => handleResetSecurity(user.id)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-purple-600 hover:bg-purple-50 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">security_update_warning</span> Reset Security/MFA
                              </button>
                            )}

                            <div className="h-px bg-neutral-50 my-2"></div>
                            
                            <p className="px-4 py-1.5 text-[8px] font-black text-neutral-300 uppercase tracking-widest">Account Status</p>
                            
                            {user.status === 'Active' ? (
                              <button 
                                onClick={() => handleUpdateUserStatus(user.id, 'Suspended')}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-orange-600 hover:bg-orange-50 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">block</span> Suspend User
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleUpdateUserStatus(user.id, 'Active')}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-green-600 hover:bg-green-50 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">check_circle</span> Reactivate
                              </button>
                            )}
                            
                            <div className="h-px bg-neutral-50 my-2"></div>

                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete_forever</span> Purge User
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="py-24 text-center space-y-4">
              <span className="material-symbols-outlined text-7xl text-neutral-100">person_off</span>
              <p className="text-neutral-300 font-black uppercase tracking-[0.3em]">No matching users found in this segment</p>
            </div>
          )}
      </div>

      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col max-h-[90vh]">
              <div className="p-10 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50 shrink-0">
                 <div className="text-left space-y-1">
                    <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Modify Athlete Logic</p>
                    <h3 className="text-4xl font-black font-display uppercase text-black leading-none">Edit Profile</h3>
                 </div>
                 <button 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="w-14 h-14 bg-white border border-neutral-100 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm group"
                 >
                    <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">close</span>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 no-scrollbar text-left">
                 <form onSubmit={handleUpdateUser} className="space-y-10">
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Full Name</label>
                          <input 
                            type="text" required
                            value={editingUser.name}
                            onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                            className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-5 font-bold text-lg focus:border-black outline-none transition-all"
                          />
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Email</label>
                            <input 
                              type="email" required
                              value={editingUser.email}
                              onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                              className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-4 font-medium focus:border-black outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Phone</label>
                            <input 
                              type="text" required
                              value={editingUser.phone}
                              onChange={e => setEditingUser({...editingUser, phone: e.target.value})}
                              className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-4 font-medium focus:border-black outline-none transition-all"
                            />
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-neutral-100">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">System Permissions</label>
                            <select 
                              value={editingUser.systemRole}
                              onChange={e => setEditingUser({...editingUser, systemRole: e.target.value as any})}
                              className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-4 font-black uppercase text-[11px] tracking-widest outline-none appearance-none focus:border-black transition-all cursor-pointer"
                            >
                               <option value={UserRole.CLIENT}>Athlete / Client</option>
                               <option value={UserRole.COACH}>Verified Coach</option>
                               <option value={UserRole.SUPPORT}>Customer Support</option>
                               <option value={UserRole.ADMIN}>Administrator</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 ml-1">Account Status</label>
                            <select 
                              value={editingUser.status}
                              onChange={e => setEditingUser({...editingUser, status: e.target.value as any})}
                              className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl p-4 font-black uppercase text-[11px] tracking-widest outline-none appearance-none focus:border-black transition-all cursor-pointer"
                            >
                               <option value="Active">Active Account</option>
                               <option value="Suspended">Suspended</option>
                               <option value="Inactive">Inactive</option>
                            </select>
                          </div>
                       </div>
                    </div>

                    <div className="pt-6">
                       <button 
                          type="submit"
                          className="w-full py-6 bg-black text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-neutral-800 transition-all shadow-2xl flex items-center justify-center gap-3"
                       >
                          <span className="material-symbols-outlined text-[18px]">save</span>
                          Update Platform Profile
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
