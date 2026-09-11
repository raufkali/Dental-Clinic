import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User as UserIcon, ChevronDown, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Topbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/patients?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-end gap-5 shrink-0">
      {/* Search Bar matching screenshot */}
      <div className="relative w-72">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearch}
          className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* User Role Pill Dropdown matching screenshot */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
          <span className="text-slate-700 text-sm">{user?.role || 'Receptionist'}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-40">
            <div className="px-3.5 py-2 border-b border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Signed in as</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || user?.username}</p>
              <span className="inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
                {user?.role || 'Staff'}
              </span>
            </div>
            <button
              onClick={() => {
                setDropdownOpen(false);
                logout();
                navigate('/login');
              }}
              className="w-full text-left px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
