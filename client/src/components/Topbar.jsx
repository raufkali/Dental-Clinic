import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldCheck } from 'lucide-react';

const Topbar = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/patients?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between gap-4 shrink-0">
      {/* Slogan */}
      <div className="hidden sm:block">
        <p className="text-xs font-semibold text-slate-500">
          DentSuite <span className="font-normal text-slate-400">• Your Practice, Perfectly Managed.</span>
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative w-72">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Search patients, invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleSearch}
          className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
        />
      </div>
    </header>
  );
};

export default Topbar;
