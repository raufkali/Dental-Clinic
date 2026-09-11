import React from 'react';
import { Printer, X } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

const ReceiptModal = ({ receipt, onClose }) => {
  const { formatCurrency } = useClinic();

  if (!receipt) return null;

  const handlePrint = () => {
    if (window.electronAPI?.isElectron) {
      window.electronAPI.printReceipt();
    } else {
      window.print();
    }
  };

  const formattedDate = new Date(receipt.date || Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Action Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-b border-slate-200 print:hidden shrink-0">
          <span className="font-semibold text-sm text-slate-700">Payment Receipt</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-emerald text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="flex-1 overflow-y-auto p-8 text-slate-800 bg-white">
          {/* Clinic Header */}
          <div className="text-center pb-5 border-b border-slate-200">
            <h2 className="text-2xl font-bold tracking-tight text-emerald-800">
              {receipt.clinicName || 'Dental Clinic'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">{receipt.clinicAddress}</p>
            <p className="text-xs text-slate-500">Phone: {receipt.clinicPhone}</p>
          </div>

          {/* Receipt Info Meta */}
          <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-100">
            <div>
              <p className="text-slate-400 font-medium">Receipt No:</p>
              <p className="font-semibold text-slate-800">{receipt.receiptNumber || 'REC-001'}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 font-medium">Date:</p>
              <p className="font-semibold text-slate-800">{formattedDate}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Patient Name:</p>
              <p className="font-semibold text-slate-800">{receipt.patientName}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 font-medium">Patient ID:</p>
              <p className="font-semibold text-slate-800">{receipt.patientId}</p>
            </div>
          </div>

          {/* Treatment & Payment Breakdown */}
          <div className="py-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Service / Treatment:</span>
              <span className="font-semibold text-slate-900">{receipt.serviceName || 'Dental Service'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Payment Type:</span>
              <span className="font-medium text-slate-800">{receipt.paymentType || 'Payment'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Payment Method:</span>
              <span className="font-medium text-slate-800">{receipt.paymentMethod || 'Cash'}</span>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-base font-bold text-slate-900">Amount Paid:</span>
              <span className="text-xl font-extrabold text-emerald-700">
                {formatCurrency(receipt.amount)}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100 text-slate-600">
              <span>Remaining Balance:</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(receipt.remainingBalance)}
              </span>
            </div>
          </div>

          {/* Signoff & Footer */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
            <div>
              <p>Issued by: <span className="font-medium text-slate-700">{receipt.authorizedStaff || 'Staff'}</span></p>
              <p className="mt-1 italic">Dental Care Excellence</p>
            </div>
            <div className="text-center">
              <div className="w-32 border-b border-slate-300 mb-1"></div>
              <span>Authorized Signature</span>
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden on print) */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end print:hidden shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
