import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ArrowRight, ArrowLeft, Phone, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { ToothIcon } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';
import { authAPI } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { settings, showToast } = useClinic();

  // Mode: 'login' or 'recover'
  const [view, setView] = useState('login');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Recovery form state
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [recoverySuccess, setRecoverySuccess] = useState(null);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      showToast('Please enter your email/phone and password', 'error');
      return;
    }

    try {
      setLoginLoading(true);
      await login(identifier.trim(), password);
      showToast('Signed in successfully', 'success');
      navigate('/');
    } catch (err) {
      showToast(err.message || 'Invalid login credentials', 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRecoverSubmit = async (e) => {
    e.preventDefault();
    setRecoverySuccess(null);

    if (!recoveryPhone.trim()) {
      showToast('Please enter your registered phone number', 'error');
      return;
    }

    if (newPassword.length < 4) {
      showToast('New password must be at least 4 characters long', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    try {
      setRecoverLoading(true);
      const res = await authAPI.recoverPassword({
        phone: recoveryPhone.trim(),
        newPassword
      });

      setRecoverySuccess('Password reset successfully! You can now sign in.');
      showToast('Password recovered successfully!', 'success');
      setIdentifier(recoveryPhone.trim());
      setPassword(newPassword);

      setTimeout(() => {
        setView('login');
      }, 1500);
    } catch (err) {
      showToast(err.message || 'Failed to recover password. Please check the phone number.', 'error');
    } finally {
      setRecoverLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Brand Header */}
        <div className="px-8 pt-8 pb-5 text-center border-b border-slate-100 bg-slate-50/60">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <ToothIcon className="w-7 h-7 text-emerald-700" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {settings.clinicName || 'Dental Clinic'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {view === 'login' ? 'Admin Sign In • Offline Desktop System' : 'Password Recovery'}
          </p>
        </div>

        {/* 1. Sign In Form */}
        {view === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="p-8 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email or Phone Number
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. doctor@clinic.com or 03001234567"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setView('recover');
                    setRecoverySuccess(null);
                  }}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 placeholder-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <span>{loginLoading ? 'Signing In...' : 'Sign In to Clinic'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-3 border-t border-slate-100 text-center">
              <p className="text-2xs text-slate-500">
                Enter the credentials you created during Problos website activation.
              </p>
            </div>
          </form>
        ) : (
          /* 2. Password Recovery Form */
          <form onSubmit={handleRecoverSubmit} className="p-8 space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
              <button
                type="button"
                onClick={() => setView('login')}
                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>

            {recoverySuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{recoverySuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Registered Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. 03001234567"
                  value={recoveryPhone}
                  onChange={(e) => setRecoveryPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 placeholder-slate-400"
                />
              </div>
              <p className="text-2xs text-slate-500 mt-1">
                Enter the phone number specified when purchasing the license.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="At least 4 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 placeholder-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={recoverLoading}
              className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{recoverLoading ? 'Resetting Password...' : 'Reset Password & Proceed'}</span>
            </button>
          </form>
        )}
      </div>

      <p className="text-2xs text-slate-500 mt-6">
        Single-User Offline Desktop Application • Powered by Electron & MongoDB
      </p>
    </div>
  );
};

export default Login;
