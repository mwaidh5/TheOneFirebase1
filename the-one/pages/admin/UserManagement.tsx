
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { deleteDoc, doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { User, UserRole, Course } from '../../types';
import { useT } from '../../i18n/I18nContext';
import type { TranslationKey } from '../../i18n/translations';

const ROLE_KEYS: Record<string, TranslationKey> = {
  [UserRole.CLIENT]: 'admin.role.client',
  [UserRole.COACH]: 'admin.role.coach',
  [UserRole.SUPPORT]: 'admin.role.support',
  [UserRole.ADMIN]: 'admin.role.admin',
};
const USER_STATUS_KEYS: Record<string, TranslationKey> = {
  Active: 'admin.common.active',
  Suspended: 'admin.users.suspended',
  Inactive: 'admin.common.inactive',
};

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
  enrolledCourseIds?: string[];
  avatar?: string;
}

interface UserManagementProps {
  onImpersonate: (user: User) => void;
  courses: Course[];
}

const UserManagement: React.FC<UserManagementProps> = ({ onImpersonate, courses }) => {
  const navigate = useNavigate();
  const { t } = useT();
  const roleLabel = (r: string) => (ROLE_KEYS[r] ? t(ROLE_KEYS[r]) : r);
  const statusLabel = (s: string) => (USER_STATUS_KEYS[s] ? t(USER_STATUS_KEYS[s]) : s);
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

  // Fetch users from Firestore and merge with local
  useEffect(() => {
    const fetchDbUsers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            const dbUsers = querySnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: `${data.firstName} ${data.lastName}`,
                    email: data.email,
                    phone: data.phone || '',
                    status: 'Active', // Default active for DB users
                    role: data.level || 'Athlete',
                    systemRole: data.role as UserRole,
                    lastSeen: 'Recently',
                    enrolledCourseIds: data.enrolledCourseIds || [],
                    avatar: data.avatar || ''
                } as UserData;
            });
            
            setUsers(prev => {
                const prevIds = new Set(prev.map(p => p.id));
                const newUsers = dbUsers.filter(d => !prevIds.has(d.id));
                // Replace existing if found in DB? or just add new?
                // Let's update existing ones from DB as DB is source of truth for them
                const updatedPrev = prev.map(p => {
                    const dbUser = dbUsers.find(d => d.id === p.id);
                    return dbUser ? dbUser : p;
                });
                // Add completely new ones
                const finalUsers = [...updatedPrev, ...newUsers];
                return finalUsers;
            });
        } catch (error) {
            console.error("Error fetching users from Firestore", error);
        }
    };
    fetchDbUsers();
  }, []); // Run once on mount

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenuId && !(event.target as Element).closest('.action-menu-container')) {
         setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleResetSecurity = (userId: string) => {
    if (window.confirm(t('admin.users.confirm_reset_security'))) {
       localStorage.removeItem(`trusted_device_${userId}`);
       localStorage.removeItem(`mfa_enabled_${userId}`);
       alert(t('admin.users.security_purged'));
       setActiveMenuId(null);
    }
  };

  const handleOpenEdit = (user: UserData) => {
    setEditingUser({ ...user });
    setIsEditModalOpen(true);
    setActiveMenuId(null);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    // Update Local State
    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));

    // Update Firestore
    try {
        const userRef = doc(db, "users", editingUser.id);
        await updateDoc(userRef, {
            role: editingUser.systemRole,
            enrolledCourseIds: editingUser.enrolledCourseIds || []
            // Note: Not updating name/email in DB to avoid conflict if fields differ, strictly updating permissions/courses
        });
    } catch (error) {
        // Ignore if document doesn't exist (mock user)
    }

    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handleUpdateUserStatus = (userId: string, status: UserData['status']) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status } : u));
    setActiveMenuId(null);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm(t('admin.users.confirm_delete'))) {
      setUsers(users.filter(u => u.id !== userId));
      try {
          await deleteDoc(doc(db, "users", userId));
      } catch (e) {
          // ignore
      }
      setActiveMenuId(null);
    }
  };

  const handleImpersonateUser = (userData: UserData) => {
    // Set a flag in session storage indicating this is an impersonated session
    // so it doesn't count towards the device limit for the impersonated user
    sessionStorage.setItem('is_impersonating', 'true');
    
    const userToLogin: User = {
      id: userData.id,
      firstName: userData.name.split(' ')[0],
      lastName: userData.name.split(' ').slice(1).join(' '),
      email: userData.email,
      role: userData.systemRole,
      avatar: userData.avatar || '',
      memberSince: '2024',
      level: userData.role,
      enrolledCourseIds: userData.enrolledCourseIds
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
    { label: t('admin.common.all'), value: 'ALL', icon: 'groups' },
    { label: t('admin.users.clients'), value: UserRole.CLIENT, icon: 'person' },
    { label: t('admin.users.coaches'), value: UserRole.COACH, icon: 'fitness_center' },
    { label: t('admin.role.support'), value: UserRole.SUPPORT, icon: 'support_agent' },
    { label: t('admin.users.admins'), value: UserRole.ADMIN, icon: 'admin_panel_settings' },
  ];

  return (
    <div className="space-y-6 sm:space-y-12 text-start animate-in fade-in duration-500 pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-black uppercase">{t('admin.users.title')}</h1>
          <p className="text-neutral-400 font-medium text-xs sm:text-base">{t('admin.users.subtitle')}</p>
        </div>
        <Link to="/admin/users/new" className="px-6 py-4 bg-black text-white font-black uppercase tracking-widest text-[10px] md:text-xs rounded-2xl shadow-xl flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-lg">person_add</span>
          {t('admin.users.add_user')}
        </Link>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-neutral-100 shadow-lg space-y-4">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-neutral-300 text-xl">search</span>
          <input 
            type="text" 
            placeholder={t('admin.users.search_ph')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-100 rounded-xl py-3 ps-12 pe-6 text-sm font-bold outline-none"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-2 px-2">
          {roleOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRoleFilter(opt.value as any)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition shrink-0 border flex items-center gap-2 ${
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
      <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-xl overflow-hidden min-h-[400px]">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-visible">
            <table className="w-full text-start table-auto">
                <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('admin.users.user')}</th>
                    <th className="px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('admin.users.role')}</th>
                    <th className="px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest">{t('admin.users.permission')}</th>
                    <th className="px-6 py-5 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-end">{t('admin.common.actions')}</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-neutral-50/50 transition-colors group">
                        <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                            {user.avatar ? (
                                <img className="w-10 h-10 rounded-full object-cover" src={user.avatar} alt="" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                                    <span className="material-symbols-outlined text-xl">person</span>
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="font-black text-black uppercase text-sm tracking-tight truncate">{user.name}</p>
                                <p className="text-[10px] text-neutral-400 font-medium truncate" dir="ltr">{user.email}</p>
                            </div>
                        </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">{roleLabel(user.systemRole)}</p>
                                <span className={`w-fit px-2 py-0.5 text-[8px] font-black uppercase rounded-full ${user.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{statusLabel(user.status)}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            {user.systemRole === UserRole.COACH && (
                                <button onClick={() => toggleBespokePermission(user.id)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${user.isBespokeAuthorized ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-neutral-50 border-neutral-100 text-neutral-300'}`}>
                                    {user.isBespokeAuthorized ? t('admin.users.custom_builder') : t('admin.users.standard')}
                                </button>
                            )}
                        </td>
                        <td className="px-6 py-4 text-end">
                           <div className="flex justify-end gap-2 items-center relative action-menu-container">
                                <button 
                                  onClick={() => handleImpersonateUser(user)}
                                  className="px-3 py-2 bg-accent/10 hover:bg-accent hover:text-white text-accent rounded-lg text-[9px] font-black uppercase tracking-widest transition"
                                  title={t('admin.users.login_as')}
                                >
                                  {t('admin.users.login')}
                                </button>
                                <button onClick={(e) => toggleMenu(user.id, e)} aria-label={t('admin.common.actions')} className="p-2 text-neutral-400 hover:text-black transition">
                                    <span className="material-symbols-outlined">settings</span>
                                </button>
                                
                                {/* DESKTOP DROPDOWN MENU */}
                                {activeMenuId === user.id && (
                                  <div className="absolute end-0 top-full mt-2 w-48 bg-white border border-neutral-100 rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                      <button onClick={() => handleOpenEdit(user)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 rounded-xl text-start">
                                          <span className="material-symbols-outlined text-sm text-neutral-400">edit</span>
                                          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">{t('admin.users.edit_profile')}</span>
                                      </button>
                                      <button onClick={() => handleUpdateUserStatus(user.id, user.status === 'Active' ? 'Suspended' : 'Active')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 rounded-xl text-start">
                                          <span className="material-symbols-outlined text-sm text-neutral-400">{user.status === 'Active' ? 'block' : 'check_circle'}</span>
                                          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">{user.status === 'Active' ? t('admin.users.suspend') : t('admin.users.activate')}</span>
                                      </button>
                                      <div className="h-px bg-neutral-100 my-1"></div>
                                      <button onClick={() => handleDeleteUser(user.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-xl text-start text-red-600">
                                          <span className="material-symbols-outlined text-sm">delete</span>
                                          <span className="text-[10px] font-black uppercase tracking-widest">{t('common.delete')}</span>
                                      </button>
                                  </div>
                                )}
                           </div>
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
                            {user.avatar ? (
                                <img className="w-12 h-12 rounded-full border-2 border-neutral-50 object-cover" src={user.avatar} alt="" />
                            ) : (
                                <div className="w-12 h-12 rounded-full border-2 border-neutral-50 bg-neutral-100 flex items-center justify-center text-neutral-400">
                                    <span className="material-symbols-outlined text-2xl">person</span>
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="font-black text-black uppercase text-xs tracking-tight truncate">{user.name}</p>
                                <p className="text-[10px] text-neutral-400 font-medium truncate" dir="ltr">{user.email}</p>
                            </div>
                        </div>
                        <button onClick={(e) => toggleMenu(user.id, e)} aria-label={t('admin.common.actions')} className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeMenuId === user.id ? 'bg-black text-white' : 'bg-neutral-50 text-neutral-400'} action-menu-container`}>
                            <span className="material-symbols-outlined">more_vert</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="flex gap-2">
                            <span className="px-2 py-1 bg-neutral-50 text-neutral-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-neutral-100">{roleLabel(user.systemRole)}</span>
                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${user.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{statusLabel(user.status)}</span>
                        </div>
                        {user.systemRole === UserRole.COACH && (
                             <button onClick={() => toggleBespokePermission(user.id)} className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${user.isBespokeAuthorized ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-neutral-50 border-neutral-100 text-neutral-300'}`}>
                                {user.isBespokeAuthorized ? t('admin.users.builder') : t('admin.users.standard')}
                             </button>
                        )}
                    </div>

                    {/* Mobile Context Menu Inline */}
                    {activeMenuId === user.id && (
                        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-neutral-100 animate-in slide-in-from-top-2 duration-200">
                             <button onClick={() => handleOpenEdit(user)} className="flex items-center justify-center gap-2 py-3 bg-neutral-50 rounded-xl text-[9px] font-black uppercase text-neutral-600">
                                <span className="material-symbols-outlined text-base">edit</span> {t('common.edit')}
                             </button>
                             <button onClick={() => handleImpersonateUser(user)} className="flex items-center justify-center gap-2 py-3 bg-accent/10 rounded-xl text-[9px] font-black uppercase text-accent">
                                <span className="material-symbols-outlined text-base">login</span> {t('admin.users.login')}
                             </button>
                             <button onClick={() => handleUpdateUserStatus(user.id, user.status === 'Active' ? 'Suspended' : 'Active')} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase ${user.status === 'Active' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'}`}>
                                <span className="material-symbols-outlined text-base">{user.status === 'Active' ? 'block' : 'check'}</span> {user.status === 'Active' ? t('admin.users.suspend') : t('admin.users.activate')}
                             </button>
                             <button onClick={() => handleDeleteUser(user.id)} className="flex items-center justify-center gap-2 py-3 bg-red-50 rounded-xl text-[9px] font-black uppercase text-red-600">
                                <span className="material-symbols-outlined text-base">delete</span> {t('common.delete')}
                             </button>
                        </div>
                    )}
                </div>
            ))}
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <span className="material-symbols-outlined text-6xl text-neutral-100">person_off</span>
              <p className="text-neutral-300 font-black uppercase tracking-widest text-[10px]">{t('admin.users.no_users')}</p>
            </div>
          )}
      </div>

      {/* Edit Modal (Responsive) */}
      {isEditModalOpen && editingUser && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
              <div className="p-6 md:p-10 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                 <h3 className="text-xl md:text-2xl font-black font-display uppercase text-black">{t('admin.users.edit_profile')}</h3>
                 <button onClick={() => setIsEditModalOpen(false)} aria-label={t('common.close')} className="w-10 h-10 bg-white border border-neutral-100 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined">close</span>
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
                 <form onSubmit={handleUpdateUser} className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-neutral-400 ms-1">{t('admin.common.name')}</label>
                        <input type="text" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-3 font-bold text-sm outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-neutral-400 ms-1">{t('admin.common.email')}</label>
                        <input type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} dir="ltr" className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-3 font-medium text-sm outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-neutral-400 ms-1">{t('admin.users.role')}</label>
                            <select value={editingUser.systemRole} onChange={e => setEditingUser({...editingUser, systemRole: e.target.value as any})} className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-3 text-[10px] font-black uppercase outline-none">
                                <option value={UserRole.CLIENT}>{t('admin.role.client')}</option>
                                <option value={UserRole.COACH}>{t('admin.role.coach')}</option>
                                <option value={UserRole.SUPPORT}>{t('admin.role.support')}</option>
                                <option value={UserRole.ADMIN}>{t('admin.role.admin')}</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-neutral-400 ms-1">{t('admin.common.status')}</label>
                            <select value={editingUser.status} onChange={e => setEditingUser({...editingUser, status: e.target.value as any})} className="w-full bg-neutral-50 border border-neutral-100 rounded-xl p-3 text-[10px] font-black uppercase outline-none">
                                <option value="Active">{t('admin.common.active')}</option>
                                <option value="Suspended">{t('admin.users.suspended')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-neutral-100">
                        <label className="text-[9px] font-black uppercase text-neutral-400 ms-1">{t('admin.users.enrolled_courses')}</label>
                        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pe-2">
                            {courses.map(course => (
                                <label key={course.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl cursor-pointer hover:bg-neutral-100 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        checked={editingUser.enrolledCourseIds?.includes(course.id) || false}
                                        onChange={(e) => {
                                            const current = editingUser.enrolledCourseIds || [];
                                            if (e.target.checked) {
                                                setEditingUser({...editingUser, enrolledCourseIds: [...current, course.id]});
                                            } else {
                                                setEditingUser({...editingUser, enrolledCourseIds: current.filter(id => id !== course.id)});
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold truncate">{course.title}</p>
                                        <p className="text-[9px] text-neutral-400 uppercase tracking-widest truncate">{course.category}</p>
                                    </div>
                                </label>
                            ))}
                            {courses.length === 0 && <p className="text-xs text-neutral-400 italic p-2">{t('admin.users.no_courses')}</p>}
                        </div>
                    </div>

                    <button type="submit" className="w-full py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">{t('admin.users.update_profile')}</button>
                 </form>
              </div>
           </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UserManagement;
