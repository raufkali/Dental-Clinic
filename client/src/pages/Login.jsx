import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';
import { ToothIcon } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { settings, showToast } = useClinic();

  const [mode, setMode] = useState('login'); // 'login' or 'register'

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Registration form state (for testing & onboarding)
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('Receptionist');

  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('Please enter your username and password', 'error');
      return;
    }

    try {
      setLoading(true);
      await login(username.trim(), password);
      showToast('Logged in successfully', 'success');
      navigate('/');
    } catch (err) {
      showToast(err.message || 'Invalid login credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName.trim() || !regUsername.trim() || !regPassword.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (regPassword.length < 4) {
      showToast('Password must be at least 4 characters long', 'error');
      return;
    }

    try {
      setLoading(true);
      await register({
        name: regName.trim(),
        username: regUsername.trim(),
        password: regPassword,
        role: regRole
      });
      showToast(`Welcome, ${regName}! Account created and signed in.`, 'success');
      navigate('/');
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Brand Header */}
        <div className="px-8 pt-8 pb-5 text-center border-b border-slate-100 bg-slate-50/50">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center mx-auto mb-3">
            <ToothIcon className="w-7 h-7 text-emerald-800" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {settings.clinicName || 'Dental Clinic'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Management & Accounting Desktop System
          </p>

          {/* Mode Switcher: Sign In vs Register (for testing) */}
          <div className="flex rounded-lg bg-slate-200/70 p-1 mt-4">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === 'login'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === 'register'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register (Testing)
            </button>
          </div>
        </div>

        {/* 1. Sign In Form */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="p-8 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="admin or receptionist"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg btn-emerald text-sm font-semibold shadow-2xs transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Fill Buttons */}
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center mb-2">Quick Sign-in for Seeded Staff:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleFillDemo('receptionist', 'recep123')}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-xs text-slate-700 font-medium transition-colors"
                >
                  Receptionist
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo('admin', 'admin123')}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-xs text-slate-700 font-medium transition-colors"
                >
                  Admin Doctor
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* 2. Registration Form for Testing & Onboarding */
          <form onSubmit={handleRegisterSubmit} className="p-8 space-y-3.5 max-h-[75vh] overflow-y-auto">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Usman Tariq"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Username *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. usman"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Min 4 chars"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Repeat password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Staff Role</label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              >
                <option value="Receptionist">Receptionist (Front Desk & Appointments)</option>
                <option value="Doctor">Doctor (Treatments & Notes)</option>
                <option value="Accountant">Accountant (Ledger & Reports)</option>
                <option value="Admin">Admin (Full Access & Settings)</option>
              </select>
            </div>

            <p className="text-2xs text-slate-400 pt-1">
              * Registration is enabled for test accounts and local staff onboarding.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg btn-emerald text-sm font-semibold shadow-2xs transition-all flex items-center justify-center gap-2 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Creating Account...' : 'Register & Sign In'}</span>
            </button>
          </form>
        )}
      </div>

      <p className="text-2xs text-slate-400 mt-6">
        Offline Local Desktop Application • Powered by Electron & MongoDB
      </p>
    </div>
  );
};

export default Login;
