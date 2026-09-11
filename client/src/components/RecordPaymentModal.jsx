import React, { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';
import { paymentsAPI } from '../services/api';
import { useClinic } from '../context/ClinicContext';

const RecordPaymentModal = ({
  isOpen,
  onClose,
  patient,
  treatment,
  treatmentsList = [],
  onPaymentSuccess
}) => {
  const { formatCurrency, showToast, printReceipt } = useClinic();

  const [selectedTreatmentId, setSelectedTreatmentId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('Monthly Installment');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [allowOverpayment, setAllowOverpayment] = useState(false);
  const [overpaymentWarning, setOverpaymentWarning] = useState(null);

  useEffect(() => {
    if (treatment?._id) {
      setSelectedTreatmentId(treatment._id);
    } else if (treatmentsList.length > 0) {
      setSelectedTreatmentId(treatmentsList[0]._id);
    }
  }, [treatment, treatmentsList]);

  if (!isOpen) return null;

  // Active treatment object
  const activeTreatment = treatment || treatmentsList.find((t) => t._id === selectedTreatmentId) || null;
  const currentRemaining = activeTreatment ? (activeTreatment.remainingBalance ?? activeTreatment.contractAmount) : 0;
  const treatmentName = activeTreatment?.serviceId?.name || activeTreatment?.serviceName || 'Treatment';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid positive payment amount', 'error');
      return;
    }

    if (!activeTreatment?._id) {
      showToast('Please select a valid treatment', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await paymentsAPI.create({
        patientId: patient?._id || activeTreatment.patientId?._id || activeTreatment.patientId,
        treatmentId: activeTreatment._id,
        amount: numAmount,
        paymentType,
        paymentMethod,
        paymentDate,
        reference,
        notes,
        allowOverpayment
      });

      if (res.success) {
        showToast('Payment recorded successfully', 'success');
        if (res.data?.receipt) {
          printReceipt(res.data.receipt);
        }
        if (onPaymentSuccess) {
          onPaymentSuccess(res.data);
        }
        onClose();
      }
    } catch (err) {
      if (err.requiresConfirmation) {
        setOverpaymentWarning(err.message);
      } else {
        showToast(err.message || 'Failed to record payment', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Record Payment</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Patient Display */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Patient:</label>
            <input
              type="text"
              readOnly
              value={patient?.name || activeTreatment?.patientId?.name || 'Patient'}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-not-allowed"
            />
          </div>

          {/* Treatment Display / Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Treatment:</label>
            {treatmentsList.length > 1 && !treatment ? (
              <select
                value={selectedTreatmentId}
                onChange={(e) => setSelectedTreatmentId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                {treatmentsList.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.serviceId?.name || t.treatmentId} ({formatCurrency(t.remainingBalance)} remaining)
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                readOnly
                value={treatmentName}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-not-allowed"
              />
            )}
          </div>

          {/* Remaining Balance Banner (Matching screenshot 3) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <span>Remaining Balance:</span>
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {formatCurrency(currentRemaining)}
            </div>
          </div>

          {/* Overpayment Warning if applicable */}
          {overpaymentWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-2">
              <p>{overpaymentWarning}</p>
              <label className="flex items-center gap-2 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowOverpayment}
                  onChange={(e) => setAllowOverpayment(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-600"
                />
                <span>Confirm overpayment / account credit</span>
              </label>
            </div>
          )}

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Amount:</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                Rs.
              </span>
              <input
                type="number"
                step="any"
                required
                min="1"
                placeholder="5,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-slate-900 font-semibold"
              />
            </div>
          </div>

          {/* Payment Type Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Type:</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
            >
              <option value="Monthly Installment">Monthly Installment</option>
              <option value="Initial / Advance">Initial / Advance</option>
              <option value="Partial Payment">Partial Payment</option>
              <option value="Full Payment">Full Payment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Payment Method Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method:</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
            >
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Card</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Date:</label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
            />
          </div>

          {/* Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Reference:</label>
            <input
              type="text"
              placeholder="Optional"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Notes:</label>
            <textarea
              rows={2}
              placeholder="Optional"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 placeholder-slate-400 resize-none"
            />
          </div>

          {/* Helper caption matching screenshot */}
          <p className="text-xs text-slate-400 leading-relaxed pt-1">
            After recording, this payment will be added to the patient's treatment balance and clinic accounting.
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm rounded-lg btn-emerald font-semibold shadow-sm transition-all flex items-center gap-2"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordPaymentModal;
