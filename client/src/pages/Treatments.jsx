import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, DollarSign } from 'lucide-react';
import { treatmentsAPI } from '../services/api';
import AssignTreatmentModal from '../components/AssignTreatmentModal';
import RecordPaymentModal from '../components/RecordPaymentModal';
import { useClinic } from '../context/ClinicContext';

const Treatments = () => {
  const navigate = useNavigate();
  const { formatCurrency, showToast } = useClinic();

  const [treatments, setTreatments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);

  const loadTreatments = async () => {
    try {
      setLoading(true);
      const res = await treatmentsAPI.getAll({
        status: statusFilter !== 'All' ? statusFilter : undefined
      });
      if (res.success) {
        setTreatments(res.data);
      }
    } catch (err) {
      showToast('Failed to load treatments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTreatments();
  }, [statusFilter]);

  const filteredTreatments = treatments.filter((t) => {
    const q = searchTerm.toLowerCase();
    const pName = t.patientId?.name?.toLowerCase() || '';
    const sName = t.serviceId?.name?.toLowerCase() || '';
    const tId = t.treatmentId?.toLowerCase() || '';
    return pName.includes(q) || sName.includes(q) || tId.includes(q);
  });

  const handleOpenPayment = (treatment) => {
    setSelectedTreatment(treatment);
    setPaymentModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Treatments & Contracts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage dental treatment plans, agreed contracts, and installment tracking
          </p>
        </div>
        <button
          onClick={() => setAssignModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg btn-emerald text-sm font-semibold shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Assign Treatment</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search treatments, patient name, service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Treatments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-6">ID</th>
                <th className="py-3.5 px-6">Patient</th>
                <th className="py-3.5 px-6">Service</th>
                <th className="py-3.5 px-6 text-right">Contract</th>
                <th className="py-3.5 px-6 text-right">Paid</th>
                <th className="py-3.5 px-6 text-right">Remaining</th>
                <th className="py-3.5 px-6 text-center">Progress</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    Loading treatments...
                  </td>
                </tr>
              ) : filteredTreatments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No treatments found.
                  </td>
                </tr>
              ) : (
                filteredTreatments.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-emerald-800">
                      {t.treatmentId}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-900">
                      <button
                        onClick={() => navigate(`/patients/${t.patientId?._id}`)}
                        className="hover:underline text-left"
                      >
                        {t.patientId?.name || 'Unknown'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-slate-700">{t.serviceId?.name || 'Service'}</td>
                    <td className="py-4 px-6 text-right font-medium text-slate-800">
                      {formatCurrency(t.contractAmount)}
                    </td>
                    <td className="py-4 px-6 text-right text-emerald-700 font-medium">
                      {formatCurrency(t.totalPaid)}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-slate-900">
                      {formatCurrency(t.remainingBalance)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-700 h-2 rounded-full"
                            style={{ width: `${Math.min(100, t.progressPercent || 0)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {t.progressPercent || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium ${
                          t.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : t.status === 'Completed'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenPayment(t)}
                        className="p-1.5 rounded-md text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="Record Payment"
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/patients/${t.patientId?._id}`)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="View Patient"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AssignTreatmentModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onSuccess={loadTreatments}
      />

      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        treatment={selectedTreatment}
        patient={selectedTreatment?.patientId}
        onPaymentSuccess={loadTreatments}
      />
    </div>
  );
};

export default Treatments;
