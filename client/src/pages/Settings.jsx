import React, { useState, useEffect } from 'react';
import { Save, Building, Phone, Mail, MapPin, DollarSign, FileText, User, Type, CheckCircle } from 'lucide-react';
import { settingsAPI } from '../services/api';
import { useClinic } from '../context/ClinicContext';

const Settings = () => {
  const { settings, setSettings, fontTheme, setFontTheme, showToast } = useClinic();
  const [loading, setLoading] = useState(false);

  // Clinic profile form state
  const [formData, setFormData] = useState({
    clinicName: settings.clinicName || 'Dental Clinic',
    doctorName: settings.doctorName || 'Dr. Tariq Khan',
    clinicAddress: settings.clinicAddress || '',
    phone: settings.phone || '',
    email: settings.email || '',
    currencySymbol: settings.currencySymbol || 'Rs.',
    currency: settings.currency || 'PKR',
    receiptFooter: settings.receiptFooter || '',
    fontTheme: settings.fontTheme || fontTheme || 'classic'
  });

  useEffect(() => {
    setFormData({
      clinicName: settings.clinicName || 'Dental Clinic',
      doctorName: settings.doctorName || 'Dr. Tariq Khan',
      clinicAddress: settings.clinicAddress || '',
      phone: settings.phone || '',
      email: settings.email || '',
      currencySymbol: settings.currencySymbol || 'Rs.',
      currency: settings.currency || 'PKR',
      receiptFooter: settings.receiptFooter || '',
      fontTheme: settings.fontTheme || fontTheme || 'classic'
    });
  }, [settings, fontTheme]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await settingsAPI.update(formData);
      if (res.success) {
        setSettings(res.data);
        showToast('Clinic settings saved successfully', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinic Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure your dental clinic identity, doctor profile, currency, and printed receipt footer.
        </p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-800">Clinic Profile</h2>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="p-6 space-y-5">
          {/* Clinic Name & Doctor/Owner Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Clinic Name *</span>
              </label>
              <input
                type="text"
                name="clinicName"
                required
                value={formData.clinicName}
                onChange={handleChange}
                placeholder="e.g. City Dental Hospital"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Doctor / Owner Name *</span>
              </label>
              <input
                type="text"
                name="doctorName"
                required
                value={formData.doctorName}
                onChange={handleChange}
                placeholder="e.g. Dr. Tariq Khan, BDS"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 font-medium"
              />
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Phone Number *</span>
              </label>
              <input
                type="text"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +92 300 1234567"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. contact@citydental.com"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              />
            </div>
          </div>

          {/* Clinic Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Clinic Physical Address</span>
            </label>
            <input
              type="text"
              name="clinicAddress"
              value={formData.clinicAddress}
              onChange={handleChange}
              placeholder="e.g. Suite 101, Dental Care Tower, Medical District"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
            />
          </div>

          {/* Currency Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>Currency Symbol</span>
              </label>
              <input
                type="text"
                name="currencySymbol"
                value={formData.currencySymbol}
                onChange={handleChange}
                placeholder="e.g. Rs. or $"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Currency Code (ISO)
              </label>
              <input
                type="text"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                placeholder="e.g. PKR or USD"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              />
            </div>
          </div>

          {/* Receipt Footer Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Printed Receipt Footer Note</span>
            </label>
            <textarea
              name="receiptFooter"
              rows={3}
              value={formData.receiptFooter}
              onChange={handleChange}
              placeholder="e.g. Thank you for choosing City Dental. For emergency assistance call our hotline."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 resize-none"
            />
            <p className="text-2xs text-slate-400 mt-1">
              This message appears at the bottom of all printed receipts and patient statements.
            </p>
          </div>

          {/* Typography & Font Theme Settings (Requested: Bebas Neue for Headings + Fraunces for general text) */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-emerald-700" />
              <span>Typography & Font Style</span>
            </label>
            <p className="text-2xs text-slate-500 mb-3">
              Choose the primary typography theme for clinic headings and body texts. Changes preview immediately.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Classic Editorial (Bebas Neue + Fraunces) */}
              <div
                onClick={() => {
                  setFormData((prev) => ({ ...prev, fontTheme: 'classic' }));
                  setFontTheme('classic');
                }}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.fontTheme === 'classic'
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900">Editorial Classic</span>
                  {formData.fontTheme === 'classic' && (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <p className="text-xs font-medium text-emerald-800 tracking-wider font-heading uppercase text-sm">
                  BEBAS NEUE HEADINGS
                </p>
                <p className="text-2xs text-slate-600 mt-1 italic font-body">
                  Fraunces serif body font
                </p>
                <span className="inline-block mt-2 text-2xs px-2 py-0.5 bg-emerald-100/70 text-emerald-800 rounded font-semibold">
                  Default Requested
                </span>
              </div>

              {/* Option 2: Modern Sans (Plus Jakarta Sans) */}
              <div
                onClick={() => {
                  setFormData((prev) => ({ ...prev, fontTheme: 'modern' }));
                  setFontTheme('modern');
                }}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.fontTheme === 'modern'
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900">Modern Clean</span>
                  {formData.fontTheme === 'modern' && (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Plus Jakarta Sans
                </p>
                <p className="text-2xs text-slate-600 mt-1">
                  Clean contemporary sans-serif interface
                </p>
              </div>

              {/* Option 3: System Standard */}
              <div
                onClick={() => {
                  setFormData((prev) => ({ ...prev, fontTheme: 'system' }));
                  setFontTheme('system');
                }}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.fontTheme === 'system'
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900">System Native</span>
                  {formData.fontTheme === 'system' && (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <p className="text-xs font-medium text-slate-700">
                  Segoe UI / Inter
                </p>
                <p className="text-2xs text-slate-500 mt-1">
                  Compact operating system default
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg btn-emerald text-sm font-semibold shadow-2xs transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving Settings...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
