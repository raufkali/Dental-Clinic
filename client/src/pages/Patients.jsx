import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, UserPlus, Eye, Edit, ChevronDown, ChevronRight, Layers, DollarSign, ArrowRight } from 'lucide-react';
import { patientsAPI } from '../services/api';
import AddPatientModal from '../components/AddPatientModal';
import { useClinic } from '../context/ClinicContext';

const Patients = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast, formatCurrency } = useClinic();

  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [expandedPatientId, setExpandedPatientId] = useState(null);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const res = await patientsAPI.getAll({
        q: searchTerm,
        status: statusFilter !== 'All' ? statusFilter : undefined
      });
      if (res.success) {
        setPatients(res.data);
      }
    } catch (err) {
      showToast('Failed to load patients', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [searchTerm, statusFilter]);

  // Sync if query param changes
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patients</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage clinic patients, medical records, and treatment profiles
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPatient(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg btn-emerald text-sm font-semibold shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Register Patient</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, phone, patient ID (e.g. Ali Khan, 0300, P-001)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Completed treatment">Completed</option>
          </select>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4 w-10 text-center"></th>
                <th className="py-3.5 px-4">Patient ID</th>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Involved Services</th>
                <th className="py-3.5 px-4">Reg. Date</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Loading patient records...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No patients found matching your search.
                  </td>
                </tr>
              ) : (
                patients.map((p) => {
                  const regDate = new Date(p.registrationDate || p.createdAt).toLocaleDateString(
                    'en-GB',
                    { day: 'numeric', month: 'short', year: 'numeric' }
                  );
                  const isExpanded = expandedPatientId === p._id;
                  const involvement = p.involvement || [];

                  return (
                    <React.Fragment key={p._id}>
                      <tr
                        className={`hover:bg-slate-50/60 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-slate-50/40' : ''
                        }`}
                        onClick={() => navigate(`/patients/${p._id}`)}
                      >
                        <td
                          className="py-4 px-3 text-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedPatientId(isExpanded ? null : p._id);
                          }}
                        >
                          <button
                            type="button"
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                            title={isExpanded ? 'Collapse involvement details' : 'Expand involvement details'}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-emerald-700" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs font-semibold text-emerald-800">
                          {p.patientId}
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-900">
                          {p.name}
                          {p.age && <span className="text-xs text-slate-400 font-normal ml-1">({p.age}y)</span>}
                        </td>
                        <td className="py-4 px-4 text-slate-700">{p.phone}</td>
                        <td className="py-4 px-4">
                          {involvement.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {involvement.slice(0, 2).map((inv, idx) => (
                                <span
                                  key={idx}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-medium ${
                                    inv.isSettled || inv.remainingBalance === 0
                                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                                  }`}
                                >
                                  <span>{inv.serviceName}</span>
                                </span>
                              ))}
                              {involvement.length > 2 && (
                                <span className="text-2xs text-slate-500 font-medium">
                                  +{involvement.length - 2} more
                                </span>
                              )}
                              {p.totalOutstandingBalance > 0 && (
                                <span className="text-2xs font-semibold text-amber-700 ml-1">
                                  Due: {formatCurrency(p.totalOutstandingBalance)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">None assigned</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-600 text-xs">{regDate}</td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium ${
                              p.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td
                          className="py-4 px-6 text-right space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => navigate(`/patients/${p._id}`)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingPatient(p);
                              setModalOpen(true);
                            }}
                            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Edit Patient"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Involvement Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan="8" className="px-6 py-4">
                            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-emerald-700" />
                                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    Patient Clinical Involvement & Treatments ({involvement.length})
                                  </h4>
                                </div>
                                <button
                                  onClick={() => navigate(`/patients/${p._id}`)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                                >
                                  <span>Open Complete Profile</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {involvement.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-2">
                                  No active treatment contracts currently assigned to this patient.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {involvement.map((inv, idx) => (
                                    <div
                                      key={inv._id || idx}
                                      className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex flex-col justify-between space-y-2"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <div className="font-semibold text-slate-800 text-xs">
                                            {inv.serviceName}
                                          </div>
                                          <span className="text-2xs font-mono text-slate-400">
                                            {inv.treatmentId} • {inv.serviceType}
                                          </span>
                                        </div>
                                        <span
                                          className={`px-2 py-0.5 rounded text-2xs font-semibold ${
                                            inv.isSettled || inv.status === 'Settled'
                                              ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                                              : inv.status === 'Active'
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                              : 'bg-slate-100 text-slate-600'
                                          }`}
                                        >
                                          {inv.isSettled ? 'Fully Settled' : inv.status}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-3 gap-2 text-2xs pt-1 border-t border-slate-200/60">
                                        <div>
                                          <span className="text-slate-400 block">Contract:</span>
                                          <span className="font-semibold text-slate-700">
                                            {formatCurrency(inv.contractAmount)}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block">Paid:</span>
                                          <span className="font-semibold text-emerald-700">
                                            {formatCurrency(inv.totalPaid)}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block">Remaining:</span>
                                          <span className={`font-semibold ${inv.remainingBalance > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                                            {inv.isSettled ? 'Rs. 0' : formatCurrency(inv.remainingBalance)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Patient Modal */}
      <AddPatientModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPatient(null);
        }}
        initialData={editingPatient}
        onSuccess={loadPatients}
      />
    </div>
  );
};

export default Patients;
