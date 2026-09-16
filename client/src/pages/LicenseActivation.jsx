import React, { useState } from 'react';
import {
  ShieldAlert,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { licenseService } from '../services/licenseService';

export const ToothIcon = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4.5 10.5C3.5 7 4 4 6.5 2.5C9 1 11 3 12 4.5C13 3 15 1 17.5 2.5C20 4 20.5 7 19.5 10.5C18.5 14 17.5 17 16.5 22C15.5 22 14.5 19 12 19C9.5 19 8.5 22 7.5 22C6.5 17 5.5 14 4.5 10.5Z" />
  </svg>
);

const LicenseActivation = ({ verificationResult, onLicenseActivated }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const isRevoked = verificationResult?.status === 'REVOKED';
  const isExpired = verificationResult?.status === 'EXPIRED';

  const handleActivate = async (e) => {
    e?.preventDefault();
    if (!tokenInput.trim()) {
      setError('Please paste your license token into the field below.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const record = await licenseService.applyToken(tokenInput.trim());
      setSuccess(true);
      setTimeout(() => {
        if (onLicenseActivated) {
          onLicenseActivated(record);
        }
      }, 1000);
    } catch (err) {
      setError(err.message || 'Invalid license token. Please contact your system administrator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-slate-800 font-sans select-none">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-xl p-8">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3 text-emerald-700 shadow-xs">
            <ToothIcon className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            DentSuite
          </h1>
          <p className="text-xs font-medium text-emerald-700 mt-1">
            Your Practice, Perfectly Managed.
          </p>
        </div>

        {/* Status Notice */}
        <div className="mb-6">
          {isRevoked ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-semibold block text-rose-900 mb-0.5">Authorization Revoked</span>
                Your license access has been revoked or removed by the administrator. Please enter a valid license token to restore access.
              </div>
            </div>
          ) : isExpired ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-semibold block text-amber-900 mb-0.5">License Expired</span>
                Your subscription period has ended. Please enter your renewed license token below.
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-start gap-3">
              <Key className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-semibold block text-slate-900 mb-0.5">Activation Required</span>
                You do not have authorization to use this software. Please enter your license token to activate.
              </div>
            </div>
          )}
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>License validated successfully! Launching DentSuite...</span>
          </div>
        )}

        {/* Manual Token Form */}
        <form onSubmit={handleActivate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              License Token
            </label>
            <textarea
              rows={4}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste your license token here..."
              disabled={loading || success}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50/70 border border-slate-300 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent focus:bg-white transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || success || !tokenInput.trim()}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Validating Token...</span>
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Activated</span>
              </>
            ) : (
              <>
                <span>Activate DentSuite</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-2xs text-slate-400">
            Tokens are manually generated and issued by your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LicenseActivation;
