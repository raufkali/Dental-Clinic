import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Eye,
  DollarSign,
  ArrowLeft,
  CheckCircle2,
  Users,
  Layers,
  ChevronRight,
  Sparkles,
  CheckCheck,
  X
} from 'lucide-react';
import { treatmentsAPI, servicesAPI } from '../services/api';
import AssignTreatmentModal from '../components/AssignTreatmentModal';
import RecordPaymentModal from '../components/RecordPaymentModal';
import { useClinic } from '../context/ClinicContext';

const Treatments = () => {
  const navigate = useNavigate();
  const { formatCurrency, showToast } = useClinic();

  const [services, setServices] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);

  // Mark Fully Settled state
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [treatmentToSettle, setTreatmentToSettle] = useState(null);
  const [settleReason, setSettleReason] = useState('Treatment concluded early, remaining balance waived');
  const [settling, setSettling] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, sRes] = await Promise.all([
        treatmentsAPI.getAll({}),
        servicesAPI.getAll({})
      ]);

      if (tRes.success) {
        setTreatments(tRes.data);
      }
      if (sRes.success) {
        setServices(sRes.data);
      }
    } catch (err) {
      showToast('Failed to load treatments and services', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenPayment = (treatment) => {
    setSelectedTreatment(treatment);
    setPaymentModalOpen(true);
  };

  const handleOpenSettle = (treatment) => {
    setTreatmentToSettle(treatment);
    setSettleReason('Treatment concluded early, remaining balance waived');
    setSettleModalOpen(true);
  };

  const handleConfirmSettle = async (e) => {
    e.preventDefault();
    if (!treatmentToSettle) return;

    try {
      setSettling(true);
      const res = await treatmentsAPI.settle(treatmentToSettle._id, settleReason);
      if (res.success) {
        showToast('Treatment marked as fully settled', 'success');
        setSettleModalOpen(false);
        setTreatmentToSettle(null);
        await loadData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to settle treatment', 'error');
    } finally {
      setSettling(false);
    }
  };

  // Filter treatments by selected service, status, and search query
  const displayedTreatments = treatments.filter((t) => {
    if (selectedService && (t.serviceId?._id || t.serviceId) !== selectedService._id) {
      return false;
    }
    if (statusFilter !== 'All' && t.status !== statusFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const pName = (t.patientId?.name || '').toLowerCase();
      const sName = (t.serviceId?.name || '').toLowerCase();
      const tId = (t.treatmentId || '').toLowerCase();
      return pName.includes(q) || sName.includes(q) || tId.includes(q);
    }
    return true;
  });

  // Calculate stats for a service
  const getServiceStats = (serviceId) => {
    const sTreatments = treatments.filter(
      (t) => (t.serviceId?._id || t.serviceId) === serviceId
    );
    const activeCount = sTreatments.filter((t) => t.status === 'Active').length;
    const totalCount = sTreatments.length;
    const totalContract = sTreatments.reduce((sum, t) => sum + (t.contractAmount || 0), 0);
    const totalCollected = sTreatments.reduce((sum, t) => sum + (t.totalPaid || 0), 0);
    const remainingBalance = sTreatments.reduce((sum, t) => sum + (t.remainingBalance || 0), 0);

    return {
      activeCount,
      totalCount,
      totalContract,
      totalCollected,
      remainingBalance
    };
  };

  // Grand totals across all treatments
  const grandStats = {
    totalTreatments: treatments.length,
    activeTreatments: treatments.filter((t) => t.status === 'Active').length,
    totalContract: treatments.reduce((sum, t) => sum + (t.contractAmount || 0), 0),
    totalCollected: treatments.reduce((sum, t) => sum + (t.totalPaid || 0), 0),
    totalRemaining: treatments.reduce((sum, t) => sum + (t.remainingBalance || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* View 1: Service Summary Cards Overview */}
      {!selectedService ? (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Treatments & Contracts
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Select any dental service card below to view its patient contracts, payments, and settlements.
              </p>
            </div>
            <button
              onClick={() => setAssignModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg btn-emerald text-sm font-semibold shadow-2xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Assign Treatment</span>
            </button>
          </div>

          {/* Grand Overview Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-medium text-slate-500 block mb-1">Active Contracts</span>
              <div className="text-xl font-bold text-slate-900">{grandStats.activeTreatments}</div>
              <span className="text-2xs text-slate-400 mt-0.5 block">{grandStats.totalTreatments} total recorded</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-medium text-slate-500 block mb-1">Total Agreed Value</span>
              <div className="text-xl font-bold text-slate-900">{formatCurrency(grandStats.totalContract)}</div>
              <span className="text-2xs text-emerald-700 mt-0.5 block font-medium">All services combined</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-medium text-slate-500 block mb-1">Total Collected</span>
              <div className="text-xl font-bold text-emerald-700">{formatCurrency(grandStats.totalCollected)}</div>
              <span className="text-2xs text-slate-400 mt-0.5 block">
                {grandStats.totalContract > 0
                  ? `${((grandStats.totalCollected / grandStats.totalContract) * 100).toFixed(1)}% recovery`
                  : '0%'}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-medium text-slate-500 block mb-1">Remaining Receivables</span>
              <div className="text-xl font-bold text-amber-700">{formatCurrency(grandStats.totalRemaining)}</div>
              <span className="text-2xs text-slate-400 mt-0.5 block">Pending installment collection</span>
            </div>
          </div>

          {/* Service Cards Grid Header */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-700" />
              <h2 className="text-lg font-bold text-slate-800">Services Summary Cards</h2>
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium">
                {services.length} Services
              </span>
            </div>
          </div>

          {/* Service Summary Cards Grid */}
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              Loading service summaries...
            </div>
          ) : services.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              No services found. Add services in the Services section.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((srv) => {
                const stats = getServiceStats(srv._id);
                const recoveryRate = stats.totalContract > 0
                  ? Math.round((stats.totalCollected / stats.totalContract) * 100)
                  : 0;

                return (
                  <div
                    key={srv._id}
                    onClick={() => setSelectedService(srv)}
                    className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-emerald-500 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {srv.name}
                          </h3>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-2xs font-semibold uppercase tracking-wider">
                            {srv.type}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-semibold border border-emerald-200/60">
                          <Users className="w-3.5 h-3.5" />
                          {stats.activeCount} Active
                        </span>
                      </div>

                      {/* Financial breakdown */}
                      <div className="space-y-2 py-3 border-y border-slate-100 my-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Agreed Contracts:</span>
                          <span className="font-semibold text-slate-800">{formatCurrency(stats.totalContract)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Total Collected:</span>
                          <span className="font-semibold text-emerald-700">{formatCurrency(stats.totalCollected)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Remaining Balance:</span>
                          <span className="font-semibold text-amber-700">{formatCurrency(stats.remainingBalance)}</span>
                        </div>

                        {/* Mini progress bar */}
                        <div className="pt-1">
                          <div className="flex justify-between text-2xs text-slate-400 mb-1">
                            <span>Collection Progress</span>
                            <span>{recoveryRate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${recoveryRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 text-xs font-semibold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                      <span>Manage Patients & Records</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* View 2: Service Drill-Down Page with Patient Contracts */
        <>
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedService(null)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Services Cards</span>
            </button>

            <button
              onClick={() => setAssignModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg btn-emerald text-sm font-semibold shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>+ Assign Patient to {selectedService.name}</span>
            </button>
          </div>

          {/* Service Banner */}
          {(() => {
            const stats = getServiceStats(selectedService._id);
            return (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold text-slate-900">{selectedService.name}</h1>
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-200/60">
                        {selectedService.type}
                      </span>
                    </div>
                    {selectedService.description && (
                      <p className="text-xs text-slate-500 mt-1">{selectedService.description}</p>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Standard Price: <span className="text-slate-900 font-bold">{formatCurrency(selectedService.defaultPrice || 0)}</span>
                  </div>
                </div>

                {/* Service Specific Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div>
                    <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">Active Patients</span>
                    <span className="text-lg font-bold text-slate-900">{stats.activeCount}</span>
                  </div>
                  <div>
                    <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">Agreed Contracts</span>
                    <span className="text-lg font-bold text-slate-900">{formatCurrency(stats.totalContract)}</span>
                  </div>
                  <div>
                    <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">Collected</span>
                    <span className="text-lg font-bold text-emerald-700">{formatCurrency(stats.totalCollected)}</span>
                  </div>
                  <div>
                    <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider block">Remaining Due</span>
                    <span className="text-lg font-bold text-amber-700">{formatCurrency(stats.remainingBalance)}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Search and Filters */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search patient name, treatment ID..."
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
                <option value="Settled">Settled Early</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Treatments Table for This Service */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-600">
                    <th className="py-3.5 px-6">ID</th>
                    <th className="py-3.5 px-6">Patient</th>
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
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        Loading patients for {selectedService.name}...
                      </td>
                    </tr>
                  ) : displayedTreatments.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        No patient treatment records found for {selectedService.name}.
                      </td>
                    </tr>
                  ) : (
                    displayedTreatments.map((t) => (
                      <tr
                        key={t._id}
                        className={`transition-colors ${
                          t.isSettled || t.remainingBalance === 0
                            ? 'opacity-75 bg-slate-50/40 hover:opacity-100 hover:bg-slate-50/70'
                            : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="py-4 px-6 font-mono text-xs font-semibold text-emerald-800">
                          {t.treatmentId}
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-900">
                          <button
                            onClick={() => navigate(`/patients/${t.patientId?._id}`)}
                            className="hover:underline text-left"
                          >
                            <div>{t.patientId?.name || 'Unknown Patient'}</div>
                            {t.patientId?.phone && (
                              <div className="text-xs text-slate-400 font-normal">{t.patientId?.phone}</div>
                            )}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-right font-medium text-slate-800">
                          {formatCurrency(t.contractAmount)}
                        </td>
                        <td className="py-4 px-6 text-right text-emerald-700 font-medium">
                          {formatCurrency(t.totalPaid)}
                        </td>
                        <td className="py-4 px-6 text-right font-semibold text-slate-900">
                          {t.isSettled ? (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                              Fully Settled (Rs. 0)
                            </span>
                          ) : (
                            formatCurrency(t.remainingBalance)
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-emerald-700 h-2 rounded-full"
                                style={{ width: `${Math.min(100, t.isSettled ? 100 : (t.progressPercent || 0))}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-slate-500 font-medium">
                              {t.isSettled ? 100 : (t.progressPercent || 0)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium ${
                              t.isSettled || t.status === 'Settled'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                                : t.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                : t.status === 'Completed'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {t.isSettled ? 'Settled Early' : t.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Record Payment Button (only if not settled and remaining > 0) */}
                            {!t.isSettled && t.remainingBalance > 0 && (
                              <button
                                onClick={() => handleOpenPayment(t)}
                                className="p-1.5 rounded-md text-emerald-700 hover:bg-emerald-50 transition-colors"
                                title="Record Payment"
                              >
                                <DollarSign className="w-4 h-4" />
                              </button>
                            )}

                            {/* Mark Fully Settled Button (settle early before full contract paid) */}
                            {!t.isSettled && t.status === 'Active' && (
                              <button
                                onClick={() => handleOpenSettle(t)}
                                className="p-1.5 rounded-md text-amber-700 hover:bg-amber-50 transition-colors"
                                title="Mark Fully Settled (Forgive remaining balance early)"
                              >
                                <CheckCheck className="w-4 h-4" />
                              </button>
                            )}

                            {/* View Patient Details */}
                            <button
                              onClick={() => navigate(`/patients/${t.patientId?._id}`)}
                              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                              title="View Patient Record"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Mark Fully Settled Modal */}
      {settleModalOpen && treatmentToSettle && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
                  <CheckCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Mark Fully Settled</h2>
                  <p className="text-xs text-slate-400">Forgive remaining balance and complete early</p>
                </div>
              </div>
              <button
                onClick={() => setSettleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmSettle} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1">
                <p className="font-semibold">Early Completion & Balance Forgiveness</p>
                <p>
                  Patient <strong>{treatmentToSettle.patientId?.name || 'Patient'}</strong> has an outstanding balance of{' '}
                  <strong className="text-amber-800">{formatCurrency(treatmentToSettle.remainingBalance)}</strong>.
                </p>
                <p>
                  Marking this treatment as fully settled will waive all future payments, zero out the remaining balance, and complete the contract.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Settlement Reason / Clinical Note *
                </label>
                <textarea
                  rows={3}
                  required
                  value={settleReason}
                  onChange={(e) => setSettleReason(e.target.value)}
                  placeholder="e.g. Treatment achieved desired outcome earlier than expected, doctor waived remaining installments."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 resize-none"
                />
              </div>

              {/* Pinned Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setSettleModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settling}
                  className="px-5 py-2 text-sm rounded-lg btn-emerald font-semibold shadow-sm transition-all"
                >
                  {settling ? 'Settling...' : 'Confirm Full Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Treatment Modal */}
      <AssignTreatmentModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        defaultServiceId={selectedService?._id}
        onSuccess={loadData}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        treatment={selectedTreatment}
        patient={selectedTreatment?.patientId}
        onPaymentSuccess={loadData}
      />
    </div>
  );
};

export default Treatments;
