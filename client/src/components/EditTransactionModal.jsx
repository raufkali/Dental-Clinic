import React, { useState, useEffect } from 'react';
import { X, User } from 'lucide-react';
import { transactionsAPI, patientsAPI } from '../services/api';
import { useClinic } from '../context/ClinicContext';

const EditTransactionModal = ({ isOpen, onClose, transaction, onSuccess }) => {
  const { settings, showToast } = useClinic();
  const [type, setType] = useState('Expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patients, setPatients] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [transactionDate, setTransactionDate] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && transaction) {
      setType(transaction.type || 'Expense');
      setCategory(transaction.category || '');
      setAmount(transaction.amount ? String(transaction.amount) : '');
      setPatientName(transaction.patientName || transaction.patientId?.name || '');
      setPatientId(transaction.patientId?._id || transaction.patientId || '');
      setPaymentMethod(transaction.paymentMethod || 'Cash');
      const dateStr = transaction.transactionDate
        ? new Date(transaction.transactionDate).toISOString().split('T')[0]
        : '';
      setTransactionDate(dateStr);
      setDescription(transaction.description || '');
      setReference(transaction.reference || '');
      loadPatients();
    }
  }, [isOpen, transaction]);

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

  if (!isOpen || !transaction) return null;

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
      const res = await transactionsAPI.update(transaction._id, {
        type,
        category: category || categories[0],
        amount: numAmount,
        patientName: patientName.trim(),
        patientId: patientId || null,
        paymentMethod,
        transactionDate,
        description: description.trim(),
        reference: reference.trim()
      });

      if (res.success) {
        showToast('Transaction updated successfully', 'success');
        if (onSuccess) onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update transaction', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Edit Transaction</h2>
            <p className="text-xs text-slate-400 font-mono">{transaction.transactionId}</p>
          </div>
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
              onClick={() => { setType('Income'); }}
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
              onClick={() => { setType('Expense'); }}
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
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amount *</label>
            <input
              type="number"
              required
              min="0.01"
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 font-bold"
            />
          </div>

          {/* Date & Payment Method Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
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
          </div>

          {/* Patient Quick-select (Optional) */}
          {patients.length > 0 && (
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Select Patient (Optional):
              </label>
              <select
                value={patientId}
                onChange={(e) => handlePatientSelect(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-700"
              >
                <option value="">-- Manual Patient / None --</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.patientId})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Patient Name input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Patient Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe or Walk-in"
              value={patientName}
              onChange={(e) => {
                setPatientName(e.target.value);
                if (patientId) setPatientId('');
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. Composite filling payment, Clinic electricity bill..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
            />
          </div>

          {/* Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reference / Invoice # (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. INV-1029 or Cheque #..."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
            />
          </div>

          {/* Pinned Action Buttons */}
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;
