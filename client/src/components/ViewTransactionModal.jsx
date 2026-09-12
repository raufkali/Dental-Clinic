import React from 'react';
import { X, Calendar, DollarSign, Tag, User, CreditCard, FileText, Ban, CheckCircle, Trash2, Edit2 } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

const ViewTransactionModal = ({ isOpen, onClose, transaction, onEdit, onVoid, onDelete }) => {
  const { formatCurrency } = useClinic();

  if (!isOpen || !transaction) return null;

  const dateLabel = new Date(transaction.transactionDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const patientName = transaction.patientName || transaction.patientId?.name || '—';
  const serviceName = transaction.treatmentId?.serviceId?.name || (transaction.type === 'Income' ? 'General Consultation / Service' : '—');

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
              {transaction.transactionId}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                transaction.type === 'Income'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  : 'bg-rose-50 text-rose-700 border border-rose-200/60'
              }`}
            >
              {transaction.type}
            </span>
            {transaction.isVoid && (
              <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                VOIDED
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Amount Display */}
          <div className={`p-4 rounded-xl text-center border ${
            transaction.isVoid
              ? 'bg-slate-100 border-slate-200 line-through opacity-70'
              : transaction.type === 'Income'
              ? 'bg-emerald-50/70 border-emerald-200/60'
              : 'bg-rose-50/70 border-rose-200/60'
          }`}>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Transaction Amount
            </span>
            <span className={`text-3xl font-extrabold ${
              transaction.type === 'Income' ? 'text-emerald-700' : 'text-slate-900'
            }`}>
              {formatCurrency(transaction.amount)}
            </span>
          </div>

          {/* Void notice if voided */}
          {transaction.isVoid && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
              <div className="font-semibold flex items-center gap-1.5 mb-1">
                <Ban className="w-3.5 h-3.5 text-rose-600" />
                <span>This transaction is marked VOID</span>
              </div>
              <p>Reason: {transaction.voidReason || 'No reason provided'}</p>
              {transaction.voidedBy && <p className="text-2xs text-rose-700 mt-1">Voided by: {transaction.voidedBy}</p>}
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-slate-400 block mb-1">Date</span>
              <span className="font-semibold text-slate-800">{dateLabel}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-slate-400 block mb-1">Category</span>
              <span className="font-semibold text-slate-800">{transaction.category}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-slate-400 block mb-1">Patient</span>
              <span className="font-semibold text-slate-800">{patientName}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-slate-400 block mb-1">Payment Method</span>
              <span className="font-semibold text-slate-800">{transaction.paymentMethod || 'Cash'}</span>
            </div>

            <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-slate-400 block mb-1">Description</span>
              <span className="font-semibold text-slate-800 text-sm">{transaction.description}</span>
            </div>

            {transaction.reference && (
              <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block mb-1">Reference / Note</span>
                <span className="font-semibold text-slate-800">{transaction.reference}</span>
              </div>
            )}

            {serviceName !== '—' && (
              <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block mb-1">Associated Treatment / Service</span>
                <span className="font-semibold text-slate-800">{serviceName}</span>
              </div>
            )}
          </div>

          <div className="pt-2 text-2xs text-slate-400 flex justify-between">
            <span>Created by: {transaction.createdBy || 'Staff'}</span>
            <span>Recorded: {new Date(transaction.createdAt || transaction.transactionDate).toLocaleString()}</span>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between gap-2 p-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            {/* Delete button */}
            <button
              type="button"
              onClick={() => onDelete(transaction)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            {/* Void / Unvoid button */}
            <button
              type="button"
              onClick={() => onVoid(transaction)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors flex items-center gap-1.5"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>{transaction.isVoid ? 'Unvoid' : 'Void'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit button */}
            <button
              type="button"
              onClick={() => onEdit(transaction)}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg btn-emerald flex items-center gap-1.5 shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTransactionModal;
