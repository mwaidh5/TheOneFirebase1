
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';

interface NavbarProps {
  isLoggedIn: boolean;
  currentUser: User | null;
  onLogout: () => void;
  logo?: string;
}

const Navbar: React.FC<NavbarProps> = ({ isLoggedIn, currentUser, onLogout, logo }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    onLogout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 h-20">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          {logo ? (
            <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
          ) : (
            <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white shadow-sm">
              <span className="material-symbols-outlined text-[20px]">fitness_center</span>
            </div>
          )}
          <span className="text-lg font-bold tracking-tight text-black font-display uppercase">The One</span>
        </Link>

        <div className="hidden lg:flex items-center gap-10">
          <nav className="flex items-center gap-8 text-sm font-medium">
            <Link to="/" className={`${isActive('/') ? 'text-black font-bold border-b-2 border-black pb-1' : 'text-gray-500 hover:text-black transition-colors'}`}>Homepage</Link>
            <Link to="/courses" className={`${isActive('/courses') ? 'text-black font-bold border-b-2 border-black pb-1' : 'text-gray-500 hover:text-black transition-colors'}`}>Courses</Link>
            <Link to="/coaches" className={`${isActive('/coaches') ? 'text-black font-bold border-b-2 border-black pb-1' : 'text-gray-500 hover:text-black transition-colors'}`}>Coaches</Link>
            <Link to="/contact" className={`${isActive('/contact') ? 'text-black font-bold border-b-2 border-black pb-1' : 'text-gray-500 hover:text-black transition-colors'}`}>Contact</Link>
          </nav>

          <div className="h-6 w-px bg-gray-200"></div>

          {isLoggedIn && currentUser ? (
            <div className="flex items-center gap-4 relative" ref={dropdownRef}>
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold leading-none">{currentUser.firstName} {currentUser.lastName}</p>
                <p className="text-xs text-gray-500 mt-1">Role: {currentUser.role}</p>
              </div>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 hover:ring-2 hover:ring-black transition-all"
              >
                <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-gray-50 mb-1">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Signed in as</p>
                    <p className="text-sm font-bold text-black truncate">{currentUser.email}</p>
                  </div>
                  {currentUser.role === UserRole.ADMIN && (
                    <Link to="/admin" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-accent hover:bg-neutral-50 transition-colors">
                      <span className="material-symbols-outlined text-[20px] filled">dashboard</span> Admin Dashboard
                    </Link>
                  )}
                  {currentUser.role === UserRole.COACH && (
                    <Link to="/coach" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-accent hover:bg-neutral-50 transition-colors">
                      <span className="material-symbols-outlined text-[20px] filled">fitness_center</span> Coach Dashboard
                    </Link>
                  )}
                  {currentUser.role === UserRole.SUPPORT && (
                    <Link to="/support" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-accent hover:bg-neutral-50 transition-colors">
                      <span className="material-symbols-outlined text-[20px] filled">support_agent</span> Support Dashboard
                    </Link>
                  )}
                  <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-neutral-50 hover:text-black transition-colors">
                    <span className="material-symbols-outlined text-[20px]">person</span> Profile
                  </Link>
                  <Link to="/profile/courses" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-neutral-50 hover:text-black transition-colors">
                    <span className="material-symbols-outlined text-[20px]">school</span> My Courses
                  </Link>
                  <Link to="/profile/messages" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-neutral-50 hover:text-black transition-colors">
                    <span className="material-symbols-outlined text-[20px]">chat_bubble</span> Messages
                  </Link>
                  <Link to="/profile/settings" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-neutral-50 hover:text-black transition-colors">
                    <span className="material-symbols-outlined text-[20px]">settings</span> Settings
                  </Link>
                  <div className="h-px bg-gray-50 my-1"></div>
                  <button onClick={handleLogoutClick} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                    <span className="material-symbols-outlined text-[20px]">logout</span> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-6 text-sm font-bold">
              <Link to="/login" className="text-black hover:text-gray-600 transition-colors">Login</Link>
              <Link to="/signup" className="bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-colors shadow-sm">Signup</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
