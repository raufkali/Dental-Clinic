import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Receipt,
  Activity,
  Calendar,
  Briefcase,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
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

// Order requested by user:
// Dashboard, Patients, Accounting, Treatments, Appointments, Services, Reports, Settings
const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/patients', label: 'Patients', icon: Users },
  { path: '/accounting', label: 'Accounting', icon: Receipt },
  { path: '/treatments', label: 'Treatments', icon: Activity },
  { path: '/appointments', label: 'Appointments', icon: Calendar },
  { path: '/services', label: 'Services', icon: Briefcase },
  { path: '/reports', label: 'Reports', icon: FileBarChart },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar = () => {
  const { settings } = useClinic();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col h-screen select-none shrink-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className={`h-16 flex items-center border-b border-slate-100 px-4 ${
        isCollapsed ? 'justify-center' : 'justify-between'
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-200/60 shrink-0">
            <ToothIcon className="w-5 h-5 text-emerald-800" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 leading-tight">
              <span className="font-bold text-slate-900 text-base tracking-tight block truncate">
                DentSuite
              </span>
              <span className="text-[10px] text-emerald-700 font-medium block truncate">
                {settings.clinicName || 'Clinic Manager'}
              </span>
            </div>
          )}
        </div>

        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={toggleCollapse}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ${
            isCollapsed ? 'hidden' : 'block'
          }`}
          title="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* When collapsed, small expand button at top of nav */}
      {isCollapsed && (
        <div className="pt-2 px-3 flex justify-center">
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  isCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Brand & Slogan Footer */}
      <div className="p-3 border-t border-slate-100">
        {!isCollapsed && (
          <div className="px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-center">
            <p className="text-xs font-bold text-slate-800 tracking-tight">DentSuite</p>
            <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">Your Practice, Perfectly Managed.</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
export { ToothIcon };
