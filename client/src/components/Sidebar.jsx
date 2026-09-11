import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Briefcase,
  Activity,
  Receipt,
  FileBarChart,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';

// Tooth Icon component matching the screenshots
const ToothIcon = ({ className = "w-6 h-6 text-emerald-700" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M7 2a5 5 0 0 0-5 5c0 3 2 7 3 10a4 4 0 0 0 4 3c2 0 3-3 3-5 0 2 1 5 3 5a4 4 0 0 0 4-3c1-3 3-7 3-10a5 5 0 0 0-5-5c-1.5 0-3 .8-4 2-1-1.2-2.5-2-4-2z" />
  </svg>
);

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/patients', label: 'Patients', icon: Users },
  { path: '/appointments', label: 'Appointments', icon: Calendar },
  { path: '/services', label: 'Services', icon: Briefcase },
  { path: '/treatments', label: 'Treatments', icon: Activity },
  { path: '/accounting', label: 'Accounting', icon: Receipt },
  { path: '/reports', label: 'Reports', icon: FileBarChart },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { settings } = useClinic();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-200/60">
          <ToothIcon className="w-5 h-5 text-emerald-800" />
        </div>
        <span className="font-semibold text-slate-800 text-lg tracking-tight">
          {settings.clinicName || 'Dental Clinic'}
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-slate-100 text-emerald-800 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer / Logout */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
export { ToothIcon };
