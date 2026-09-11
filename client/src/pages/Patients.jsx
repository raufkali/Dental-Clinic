import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, UserPlus, Eye, Edit } from 'lucide-react';
import { patientsAPI } from '../services/api';
import AddPatientModal from '../components/AddPatientModal';
import { useClinic } from '../context/ClinicContext';

const Patients = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useClinic();

  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

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
                <th className="py-3.5 px-6">Patient ID</th>
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6">Phone</th>
                <th className="py-3.5 px-6">Gender / Age</th>
                <th className="py-3.5 px-6">Reg. Date</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Loading patient records...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No patients found matching your search.
                  </td>
                </tr>
              ) : (
                patients.map((p) => {
                  const regDate = new Date(p.registrationDate || p.createdAt).toLocaleDateString(
                    'en-GB',
                    { day: 'numeric', month: 'short', year: 'numeric' }
                  );

                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => navigate(`/patients/${p._id}`)}
                    >
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-emerald-800">
                        {p.patientId}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-900">{p.name}</td>
                      <td className="py-4 px-6 text-slate-700">{p.phone}</td>
                      <td className="py-4 px-6 text-slate-700">
                        {p.gender} {p.age ? `(${p.age}y)` : ''}
                      </td>
                      <td className="py-4 px-6 text-slate-600 text-xs">{regDate}</td>
                      <td className="py-4 px-6 text-center">
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
