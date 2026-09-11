import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ReceiptModal from './ReceiptModal';
import { useClinic } from '../context/ClinicContext';

const Layout = () => {
  const { activeReceipt, closeReceipt } = useClinic();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal receipt={activeReceipt} onClose={closeReceipt} />
      )}
    </div>
  );
};

export default Layout;
