import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { treatmentsAPI, servicesAPI, patientsAPI } from '../services/api';
import { useClinic } from '../context/ClinicContext';

const AssignTreatmentModal = ({ isOpen, onClose, patientId, onSuccess }) => {
  const { formatCurrency, showToast, printReceipt } = useClinic();
  const [services, setServices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [contractAmount, setContractAmount] = useState('');
  const [initialPaymentAmount, setInitialPaymentAmount] = useState('');
  const [initialPaymentMethod, setInitialPaymentMethod] = useState('Cash');
  const [monthlyInstallment, setMonthlyInstallment] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [durationMonths, setDurationMonths] = useState('12');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (patientId) setSelectedPatientId(patientId);
      loadServicesAndPatients();
    }
  }, [isOpen, patientId]);

  const loadServicesAndPatients = async () => {
    try {
      const [sRes, pRes] = await Promise.all([
        servicesAPI.getAll({ status: 'Active' }),
        patientId ? Promise.resolve({ success: true, data: [] }) : patientsAPI.getAll({ status: 'Active' })
      ]);
      if (sRes.success) {
        setServices(sRes.data);
        if (sRes.data.length > 0 && !selectedServiceId) {
          handleServiceSelect(sRes.data[0]);
        }
      }
      if (pRes.success && pRes.data?.length > 0) {
        setPatients(pRes.data);
        if (!selectedPatientId) setSelectedPatientId(pRes.data[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleServiceSelect = (srv) => {
    setSelectedServiceId(srv._id);
    const def = srv.defaultPrice || srv.minPrice || 0;
    setContractAmount(def ? String(def) : '');
    if (srv.type === 'Contract') {
      setInitialPaymentAmount(def ? String(Math.round(def * 0.15)) : '15000');
      setMonthlyInstallment('5000');
    } else {
      setInitialPaymentAmount('');
      setMonthlyInstallment('0');
    }
  };

  if (!isOpen) return null;

  const selectedService = services.find((s) => s._id === selectedServiceId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalAmount = parseFloat(contractAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      showToast('Please enter a valid contract amount', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await treatmentsAPI.create({
        patientId: selectedPatientId,
        serviceId: selectedServiceId,
        contractAmount: finalAmount,
        initialPaymentAmount: parseFloat(initialPaymentAmount) || 0,
        initialPaymentMethod,
        monthlyInstallment: parseFloat(monthlyInstallment) || 0,
        startDate,
        durationMonths: parseInt(durationMonths, 10) || 0,
        notes
      });

      if (res.success) {
        showToast('Treatment assigned successfully', 'success');
        if (res.initialPayment) {
          showToast(`Initial payment of ${formatCurrency(res.initialPayment.amount)} recorded`, 'info');
        }
        if (onSuccess) onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to assign treatment', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Assign Treatment / Contract</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {!patientId && patients.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Patient:</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              >
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.patientId})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Dental Service:</label>
            <select
              value={selectedServiceId}
              onChange={(e) => {
                const s = services.find((item) => item._id === e.target.value);
                if (s) handleServiceSelect(s);
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
            >
              {services.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.type}) {s.minPrice ? `— [${formatCurrency(s.minPrice)} - ${formatCurrency(s.maxPrice)}]` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedService && selectedService.minPrice > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex justify-between items-center">
              <span>Standard Price Range:</span>
              <span className="font-semibold text-slate-800">
                {formatCurrency(selectedService.minPrice)} — {formatCurrency(selectedService.maxPrice)}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Agreed Contract Amount (Final Price) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">Rs.</span>
              <input
                type="number"
                required
                min="1"
                placeholder="90,000"
                value={contractAmount}
                onChange={(e) => setContractAmount(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 font-semibold"
              />
            </div>
          </div>

          {/* Initial / Advance Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Initial / Advance Payment</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">Rs.</span>
                <input
                  type="number"
                  min="0"
                  placeholder="15,000"
                  value={initialPaymentAmount}
                  onChange={(e) => setInitialPaymentAmount(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Advance Method</label>
              <select
                value={initialPaymentMethod}
                onChange={(e) => setInitialPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>

          {/* Monthly Installment (If contract) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Monthly Installment</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">Rs.</span>
                <input
                  type="number"
                  min="0"
                  placeholder="5,000"
                  value={monthlyInstallment}
                  onChange={(e) => setMonthlyInstallment(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Expected Duration (Months)</label>
              <input
                type="number"
                min="0"
                placeholder="15"
                value={durationMonths}
                onChange={(e) => setDurationMonths(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Start Date:</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Initial Clinical Notes:</label>
            <textarea
              rows={2}
              placeholder="e.g. Orthodontic examination completed, brackets planned..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm rounded-lg btn-emerald font-semibold shadow-sm transition-all"
            >
              {loading ? 'Assigning...' : 'Assign Treatment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignTreatmentModal;
