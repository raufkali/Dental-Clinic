import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ClinicProvider } from './context/ClinicContext';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Appointments from './pages/Appointments';
import Services from './pages/Services';
import Treatments from './pages/Treatments';
import Accounting from './pages/Accounting';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import LicenseActivation from './pages/LicenseActivation';
import { licenseService } from './services/licenseService';

const LicenseGate = ({ children }) => {
  const [licenseState, setLicenseState] = useState({
    checking: true,
    isValid: false,
    verification: null
  });

  const checkLicense = async () => {
    try {
      const res = await licenseService.verifyOfflineLicense();
      setLicenseState({
        checking: false,
        isValid: res.isValid,
        verification: res
      });
    } catch (e) {
      setLicenseState({
        checking: false,
        isValid: false,
        verification: { status: 'ERROR', message: 'License check error' }
      });
    }
  };

  useEffect(() => {
    checkLicense();
  }, []);

  // Revocation Watchdog: Runs immediately and every 8 seconds when active
  // If admin revokes or deletes license, this immediately clears license and terminates the app!
  useEffect(() => {
    if (!licenseState.isValid) return;

    const runWatchdog = async () => {
      try {
        const res = await licenseService.checkDeviceActivation();
        if (
          res.isRevoked ||
          res.reason === 'REVOKED' ||
          res.reason === 'DELETED' ||
          res.reason === 'LICENSE_NOT_FOUND'
        ) {
          console.warn('[Watchdog] License deleted or revoked by admin! Closing application immediately...');
          await licenseService.clearStoredLicense();

          if (typeof window !== 'undefined' && window.electronAPI?.closeApp) {
            window.electronAPI.closeApp();
          } else {
            setLicenseState({
              checking: false,
              isValid: false,
              verification: {
                status: 'REVOKED',
                message: res.message || 'Access has been revoked or license deleted by administrator.'
              }
            });
          }
        }
      } catch (err) {
        // Tolerant of temporary network drops
      }
    };

    // Run immediately on active mount
    runWatchdog();

    // Check periodically every 8 seconds
    const watchdog = setInterval(runWatchdog, 8000);

    return () => clearInterval(watchdog);
  }, [licenseState.isValid]);

  if (licenseState.checking) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600 text-sm gap-3">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span>Verifying Machine License & Security...</span>
      </div>
    );
  }

  if (!licenseState.isValid) {
    return (
      <LicenseActivation
        verificationResult={licenseState.verification}
        onLicenseActivated={() => checkLicense()}
      />
    );
  }

  return children;
};

function App() {
  return (
    <HashRouter>
      <LicenseGate>
        <AuthProvider>
          <ClinicProvider>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="patients" element={<Patients />} />
                <Route path="patients/:id" element={<PatientDetail />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="services" element={<Services />} />
                <Route path="treatments" element={<Treatments />} />
                <Route path="accounting" element={<Accounting />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </ClinicProvider>
        </AuthProvider>
      </LicenseGate>
    </HashRouter>
  );
}

export default App;
