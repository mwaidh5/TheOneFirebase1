
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
    if (window.confirm("Purge security logic?")) {
       localStorage.removeItem(`trusted_device_${userId}`);
       localStorage.removeItem(`mfa_enabled_${userId}`);
       alert("Security purged.");
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
    if (window.confirm("Purge athlete?")) {
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
    { label: 'All', value: 'ALL', icon: 'groups' },
    { label: 'Clients', value: UserRole.CLIENT, icon: 'person' },
    { label: 'Coaches', value: UserRole.COACH, icon: 'fitness_center' },
    { label: 'Support', value: UserRole.SUPPORT, icon: 'support_agent' },
    { label: 'Admins', value: UserRole.ADMIN, icon: 'admin_panel_settings' },
  ];

  return (
    <div className="space-y-6 sm:space-y-12 text-left animate-in fade-in duration-500 pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-black uppercase">Community</h1>
          <p className="text-neutral-400 font-medium text-xs sm:text-base">Manage platform access.</p>
        </div>
        <Link to="/admin/users/new" className="px-6 py-4 bg-black text-white font-black uppercase tracking-widest text-[10px] md:text-xs rounded-2xl shadow-xl flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-lg">person_add</span>
          Add User
        </Link>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-neutral-100 shadow-lg space-y-4">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 text-xl">search</span>
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-100 rounded-xl py-3 pl-12 pr-6 text-sm font-bold outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-2 px-2">
          {roleOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRoleFilter(opt.value as any)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 border flex items-center gap-2 ${
                roleFilter === opt.value ? 'bg-black text-white border-black shadow-md' : 'bg-neutral-50 text-neutral-400 border-neutral-50'
              }`}
            >
              <span className="material-symbols-outlined text-base">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* MOBILE LIST / DESKTOP TABLE */}
      <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-xl overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left table-auto">
                <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">User</th>
                    <th className="px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Role</th>
                    <th className="px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Permission</th>
                    <th className="px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-neutral-50/50 transition-colors group">
                        <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                            <img className="w-10 h-10 rounded-full" src={`https://picsum.photos/100/100?random=${user.id}`} alt="" />
                            <div className="min-w-0">
                                <p className="font-black text-black uppercase text-sm tracking-tight truncate">{user.name}</p>
                                <p className="text-[10px] text-neutral-400 font-medium truncate">{user.email}</p>
                            </div>
                        </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">{user.systemRole}</p>
                                <span className={`w-fit px-2 py-0.5 text-[8px] font-black uppercase rounded-full ${user.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{user.status}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            {user.systemRole === UserRole.COACH && (
                                <button onClick={() => toggleBespokePermission(user.id)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${user.isBespokeAuthorized ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-neutral-50 border-neutral-100 text-neutral-300'}`}>
                                    {user.isBespokeAuthorized ? 'Custom Builder' : 'Standard'}
                                </button>
                            )}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button onClick={() => toggleMenu(user.id)} className="p-2 text-neutral-400 hover:text-black transition-all">
                                <span className="material-symbols-outlined">settings</span>
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-neutral-50">
            {filteredUsers.map((user) => (
                <div key={user.id} className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img className="w-12 h-12 rounded-full border-2 border-neutral-50" src={`https://picsum.photos/100/100?random=${user.id}`} alt="" />
                            <div className="min-w-0">
                                <p className="font-black text-black uppercase text-xs tracking-tight truncate">{user.name}</p>
                                <p className="text-[10px] text-neutral-400 font-medium truncate">{user.email}</p>
                            </div>
                        </div>
                        <button onClick={() => toggleMenu(user.id)} className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeMenuId === user.id ? 'bg-black text-white' : 'bg-neutral-50 text-neutral-400'}`}>
                            <span className="material-symbols-outlined">more_vert</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex gap-2">
                            <span className="px-2 py-1 bg-neutral-50 text-neutral-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-neutral-100">{user.systemRole}</span>
                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${user.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{user.status}</span>
                        </div>
                        {user.systemRole === UserRole.COACH && (
                             <button onClick={() => toggleBespokePermission(user.id)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${user.isBespokeAuthorized ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-neutral-50 border-neutral-100 text-neutral-300'}`}>
                                {user.isBespokeAuthorized ? 'Builder' : 'Standard'}
                             </button>
                        )}
                    </div>

                    {/* Mobile Context Menu Inline */}
                    {activeMenuId === user.id && (
                        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-neutral-100 animate-in slide-in-from-top-2 duration-200">
                             <button onClick={() => handleOpenEdit(user)} className="flex items-center justify-center gap-2 py-3 bg-neutral-50 rounded-xl text-[9px] font-black uppercase text-neutral-600">
                                <span className="material-symbols-outlined text-base">edit</span> Edit
                             </button>
                             <button onClick={() => handleImpersonateUser(user)} className="flex items-center justify-center gap-2 py-3 bg-accent/10 rounded-xl text-[9px] font-black uppercase text-accent">
                                <span className="material-symbols-outlined text-base">login</span> Login
                             </button>
                             <button onClick={() => handleUpdateUserStatus(user.id, user.status === 'Active' ? 'Suspended' : 'Active')} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase ${user.status === 'Active' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                                <span className="material-symbols-outlined text-base">{user.status === 'Active' ? 'block' : 'check'}</span> {user.status === 'Active' ? 'Suspend' : 'Active'}
                             </button>
                             <button onClick={() => handleDeleteUser(user.id)} className="flex items-center justify-center gap-2 py-3 bg-red-50 rounded-xl text-[9px] font-black uppercase text-red-600">
                                <span className="material-symbols-outlined text-base">delete</span> Delete
                             </button>
                        </div>
                    )}
                </div>
            ))}
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <span className="material-symbols-outlined text-6xl text-neutral-100">person_off</span>
              <p className="text-neutral-300 font-black uppercase tracking-widest text-[10px]">No users found</p>
            </div>
          )}
      </div>

      {/* Edit Modal (Responsive) */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
              <div className="p-6 md:p-10 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                 <h3 className="text-xl md:text-2xl font-black font-display uppercase text-black">Edit Profile</h3>
                 <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 bg-white border border-neutral-100 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined">close</span>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
                 <form onSubmit={handleUpdateUser} className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-neutral-400 ml-1">Name</label>
                        <input type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-3 font-bold text-sm outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-neutral-400 ml-1">Email</label>
                        <input type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-3 font-medium text-sm outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-neutral-400 ml-1">Role</label>
                            <select value={editingUser.systemRole} onChange={e => setEditingUser({...editingUser, systemRole: e.target.value as any})} className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-3 text-[10px] font-black uppercase outline-none">
                                <option value={UserRole.CLIENT}>Client</option>
                                <option value={UserRole.COACH}>Coach</option>
                                <option value={UserRole.SUPPORT}>Support</option>
                                <option value={UserRole.ADMIN}>Admin</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-neutral-400 ml-1">Status</label>
                            <select value={editingUser.status} onChange={e => setEditingUser({...editingUser, status: e.target.value as any})} className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-3 text-[10px] font-black uppercase outline-none">
                                <option value="Active">Active</option>
                                <option value="Suspended">Suspended</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">Update Profile</button>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
