import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';

const ClinicContext = createContext(null);

export const ClinicProvider = ({ children }) => {
  const [fontTheme, setFontThemeState] = useState(() => {
    return localStorage.getItem('dental_font_theme') || 'classic';
  });

  const [settings, setSettings] = useState({
    clinicName: 'Dental Clinic',
    clinicAddress: 'Dental Care Center, Main Boulevard, Lahore',
    phone: '+92 300 1234567',
    email: 'info@dentalclinic.pk',
    currencySymbol: 'Rs.',
    currency: 'PKR',
    receiptFooter: 'Thank you for choosing Dental Clinic.',
    fontTheme: 'classic'
  });

  const [toasts, setToasts] = useState([]);
  const [activeReceipt, setActiveReceipt] = useState(null);

  // Apply font-theme to document element immediately
  useEffect(() => {
    document.documentElement.setAttribute('data-font-theme', fontTheme);
    localStorage.setItem('dental_font_theme', fontTheme);
  }, [fontTheme]);

  const setFontTheme = (theme) => {
    setFontThemeState(theme);
    setSettings((prev) => ({ ...prev, fontTheme: theme }));
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await settingsAPI.get();
        if (res.success && res.data) {
          setSettings(res.data);
          if (res.data.fontTheme) {
            setFontThemeState(res.data.fontTheme);
          }
        }
      } catch (err) {
        // Fallback to default
      }
    };
    fetchSettings();
  }, []);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const formatCurrency = (amount) => {
    const val = Number(amount) || 0;
    const formatted = val.toLocaleString('en-US');
    return `${settings.currencySymbol || 'Rs.'} ${formatted}`;
  };

  const printReceipt = (receiptData) => {
    setActiveReceipt(receiptData);
  };

  const closeReceipt = () => {
    setActiveReceipt(null);
  };

  return (
    <ClinicContext.Provider
      value={{
        settings,
        setSettings,
        fontTheme,
        setFontTheme,
        showToast,
        formatCurrency,
        printReceipt,
        activeReceipt,
        closeReceipt
      }}
    >
      {children}

      {/* Global Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all duration-200 flex items-center justify-between gap-3 ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : toast.type === 'info'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
