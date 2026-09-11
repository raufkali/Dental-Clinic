import React, { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import { transactionsAPI, patientsAPI } from '../services/api';
import { useClinic } from '../context/ClinicContext';

const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AddTransactionModal = ({ isOpen, onClose, onSuccess }) => {
  const { settings, showToast } = useClinic();
  const [type, setType] = useState('Expense');
  const [category, setCategory] = useState('Dental Materials');
  const [amount, setAmount] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patients, setPatients] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [transactionDate, setTransactionDate] = useState(() => getLocalDateStr());
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPatients();
      setTransactionDate(getLocalDateStr());
    } else {
      setAmount('');
      setPatientName('');
      setPatientId('');
      setDescription('');
      setReference('');
    }
  }, [isOpen]);

  const loadPatients = async () => {
    try {
      const res = await patientsAPI.getAll({ status: 'Active' });
      if (res.success) {
        setPatients(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePatientSelect = (pId) => {
    setPatientId(pId);
    if (!pId) return;
    const p = patients.find((item) => item._id === pId);
    if (p) {
      setPatientName(p.name);
    }
  };

  if (!isOpen) return null;

  const categories = type === 'Expense'
    ? (settings.expenseCategories || [
        'Dental Materials',
        'Electricity',
        'Rent',
        'Staff Salary',
        'Equipment',
        'Laboratory Charges',
        'Maintenance',
        'Office Supplies',
        'Other'
      ])
    : ['Treatment Payment', 'Consultation Fee', 'Laboratory Sale', 'Other Income'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid positive amount', 'error');
      return;
    }

    if (!description.trim()) {
      showToast('Description is required', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await transactionsAPI.create({
        type,
        category,
        amount: numAmount,
        patientName: patientName.trim(),
        patientId: patientId || undefined,
        paymentMethod,
        transactionDate,
        description: description.trim(),
        reference: reference.trim()
      });

      if (res.success) {
        showToast(`${type} transaction recorded successfully`, 'success');
        if (onSuccess) onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to record transaction', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Add Transaction</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Type Selector (Income vs Expense) */}
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => { setType('Income'); setCategory('Consultation Fee'); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                type === 'Income'
                  ? 'bg-white text-emerald-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => { setType('Expense'); setCategory('Dental Materials'); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                type === 'Expense'
                  ? 'bg-white text-rose-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expense
            </button>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Patient / Party Name (Mandatory Manual Input with Optional Registered Patient Selector) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Patient / Party Name (Optional):
              </label>
              {patients.length > 0 && (
                <select
                  value={patientId}
                  onChange={(e) => handlePatientSelect(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 focus:outline-none"
                >
                  <option value="">-- Quick select registered patient --</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>
                  ))}
                </select>
              )}
            </div>
            <input
              type="text"
              placeholder="e.g. Ali Khan, Dental Supply Corp, Walk-in..."
              value={patientName}
              onChange={(e) => {
                setPatientName(e.target.value);
                if (patientId) setPatientId('');
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 font-medium"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amount:</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">Rs.</span>
              <input
                type="number"
                step="any"
                required
                min="1"
                placeholder="5,000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 font-semibold"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description:</label>
            <input
              type="text"
              required
              placeholder={type === 'Expense' ? 'Purchased dental materials' : 'Consultation fee received'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method:</label>
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

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date:</label>
            <input
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
            />
          </div>

          {/* Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reference / Invoice #:</label>
            <input
              type="text"
              placeholder="Optional"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Action Footer */}
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
              {loading ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;
