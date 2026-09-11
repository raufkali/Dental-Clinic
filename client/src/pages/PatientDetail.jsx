import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User,
  Edit,
  Plus,
  ArrowLeft,
  RotateCcw,
  FileText,
  MessageSquarePlus,
  Printer
} from 'lucide-react';
import { patientsAPI, treatmentsAPI, paymentsAPI } from '../services/api';
import RecordPaymentModal from '../components/RecordPaymentModal';
import AddPatientModal from '../components/AddPatientModal';
import AssignTreatmentModal from '../components/AssignTreatmentModal';
import { useClinic } from '../context/ClinicContext';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatCurrency, showToast, printReceipt } = useClinic();

  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editPatientModalOpen, setEditPatientModalOpen] = useState(false);
  const [assignTreatmentModalOpen, setAssignTreatmentModalOpen] = useState(false);
  const [selectedTreatmentForPayment, setSelectedTreatmentForPayment] = useState(null);

  // Note addition
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const loadPatient = async () => {
    try {
      setLoading(true);
      const res = await patientsAPI.getById(id);
      if (res.success) {
        setPatientData(res.data);
      }
    } catch (err) {
      showToast('Failed to load patient profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatient();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        Loading patient profile...
      </div>
    );
  }

  if (!patientData?.patient) {
    return (
      <div className="py-20 text-center text-slate-500 space-y-4">
        <p>Patient not found.</p>
        <button
          onClick={() => navigate('/patients')}
          className="px-4 py-2 rounded-lg btn-emerald text-sm"
        >
          Back to Patients
        </button>
      </div>
    );
  }

  const { patient, treatments = [], payments = [] } = patientData;
  const activeTreatments = treatments.filter((t) => t.status === 'Active');

  const regDateFormatted = new Date(patient.registrationDate || patient.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const handleOpenPayment = (trt = null) => {
    setSelectedTreatmentForPayment(trt || (activeTreatments[0] || treatments[0] || null));
    setPaymentModalOpen(true);
  };

  const handleAddNote = async (treatmentId) => {
    if (!newNote.trim()) return;
    try {
      setAddingNote(true);
      const res = await treatmentsAPI.addNote(treatmentId, newNote.trim());
      if (res.success) {
        showToast('Treatment note added', 'success');
        setNewNote('');
        loadPatient();
      }
    } catch (err) {
      showToast(err.message || 'Failed to add note', 'error');
    } finally {
      setAddingNote(false);
    }
  };

  const handleVoidPayment = async (payment) => {
    const reason = window.prompt(
      `Are you sure you want to void payment ${payment.paymentId} for ${formatCurrency(payment.amount)}?\nPlease enter the reason:`,
      'Entered in error'
    );
    if (!reason) return;

    try {
      const res = await paymentsAPI.void(payment._id, reason);
      if (res.success) {
        showToast(`Payment ${payment.paymentId} voided and reversed`, 'info');
        loadPatient();
      }
    } catch (err) {
      showToast(err.message || 'Failed to void payment', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button & Page Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/patients')}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Back to Patients"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Profile</h1>
        </div>

        <button
          onClick={() => setAssignTreatmentModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg btn-emerald text-sm font-semibold shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Assign Treatment</span>
        </button>
      </div>

      {/* 1. Top Patient Information Card matching Screenshot 5 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar matching screenshot */}
            <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-slate-400" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
              <p className="text-xs text-slate-500">Patient ID: {patient.patientId}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-8 text-sm">
            <div>
              <p className="text-xs text-slate-400">Phone:</p>
              <p className="font-semibold text-slate-800">{patient.phone}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Registration Date:</p>
              <p className="font-semibold text-slate-800">{regDateFormatted}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Status:</p>
              <span className="inline-block font-semibold text-emerald-700">
                {patient.status}
              </span>
            </div>

            <button
              onClick={() => setEditPatientModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors shadow-2xs"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Patient</span>
            </button>
          </div>
        </div>

        {/* Additional Medical info tags */}
        {(patient.allergies !== 'None' || patient.medicalNotes) && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
            {patient.allergies && patient.allergies !== 'None' && (
              <span className="px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                Allergies: {patient.allergies}
              </span>
            )}
            {patient.medicalNotes && (
              <span className="text-slate-600">
                <strong className="text-slate-700">Medical Notes:</strong> {patient.medicalNotes}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Active Treatments Card matching Screenshot 5 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <h3 className="text-base font-bold text-slate-900">Active Treatments</h3>

        {activeTreatments.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            No active treatment contracts. Click <strong>+ Assign Treatment</strong> above to start one.
          </div>
        ) : (
          activeTreatments.map((trt) => (
            <div key={trt._id} className="space-y-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              {/* Row Stats matching screenshot 5 */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-baseline">
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {trt.serviceId?.name || 'Treatment'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Contract: {formatCurrency(trt.contractAmount)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 font-medium">Paid</p>
                  <p className="text-sm font-bold text-slate-800">{formatCurrency(trt.totalPaid)}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 font-medium">Remaining</p>
                  <p className="text-sm font-bold text-slate-800">
                    {formatCurrency(trt.remainingBalance)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 font-medium">Monthly Installment</p>
                  <p className="text-sm font-bold text-slate-800">
                    {trt.monthlyInstallment ? formatCurrency(trt.monthlyInstallment) : '—'}
                  </p>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3">
                  <span className="text-sm font-semibold text-emerald-700">
                    {trt.status}
                  </span>
                  <button
                    onClick={() => handleOpenPayment(trt)}
                    className="px-3 py-1 rounded-md btn-emerald text-xs font-medium"
                  >
                    Pay
                  </button>
                </div>
              </div>

              {/* Dark Emerald Progress Bar matching Screenshot 5 */}
              <div className="space-y-1">
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-700 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, trt.progressPercent || 0)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-right text-slate-400 font-medium">
                  {trt.progressPercent || 0}% Paid
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Payment History Card matching Screenshot 5 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-6 pb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Payment History</h3>
          <button
            onClick={() => handleOpenPayment(null)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg btn-emerald text-xs font-semibold shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Payment</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Treatment</th>
                <th className="py-3 px-6">Payment Type</th>
                <th className="py-3 px-6">Method</th>
                <th className="py-3 px-6 text-right">Amount</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No payment records found for this patient.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const pDate = new Date(p.paymentDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short'
                  });
                  const isVoid = p.isVoid;

                  return (
                    <tr
                      key={p._id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isVoid ? 'opacity-50 line-through bg-slate-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-6 text-slate-700">{pDate}</td>
                      <td className="py-3.5 px-6 font-medium text-slate-900">
                        {p.treatmentId?.serviceId?.name || 'Treatment'}
                      </td>
                      <td className="py-3.5 px-6 text-slate-700">
                        {p.paymentType}
                        {isVoid && <span className="ml-2 text-xs text-rose-600 font-bold">[VOIDED]</span>}
                      </td>
                      <td className="py-3.5 px-6 text-slate-700">{p.paymentMethod}</td>
                      <td className="py-3.5 px-6 text-right font-medium text-slate-900">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3.5 px-6 text-right space-x-2">
                        {!isVoid && (
                          <>
                            <button
                              onClick={() =>
                                printReceipt({
                                  clinicName: 'Dental Clinic',
                                  receiptNumber: p.paymentId,
                                  date: p.paymentDate,
                                  patientName: patient.name,
                                  patientId: patient.patientId,
                                  serviceName: p.treatmentId?.serviceId?.name || 'Dental Service',
                                  paymentType: p.paymentType,
                                  amount: p.amount,
                                  paymentMethod: p.paymentMethod,
                                  remainingBalance: p.treatmentId?.contractAmount ? Math.max(0, p.treatmentId.contractAmount - p.amount) : 0,
                                  authorizedStaff: p.createdBy || 'Staff'
                                })
                              }
                              className="p-1 text-slate-400 hover:text-emerald-700 transition-colors"
                              title="Print Receipt"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleVoidPayment(p)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Void / Reverse Payment"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Treatment Notes Card matching Screenshot 5 */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Treatment Notes</h3>

        {/* Notes List */}
        <div className="space-y-2">
          {treatments.flatMap((t) => t.notes || []).length === 0 ? (
            <p className="text-sm text-slate-400 italic">No clinical notes recorded yet.</p>
          ) : (
            treatments.map((t) =>
              (t.notes || []).map((note, idx) => (
                <div key={note._id || idx} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>{note.note}</span>
                </div>
              ))
            )
          )}
        </div>

        {/* Quick Add Note input for first active treatment */}
        {activeTreatments.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
            <input
              type="text"
              placeholder="Add quick clinical note (e.g. Next appointment scheduled)..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddNote(activeTreatments[0]._id);
              }}
              className="flex-1 px-3.5 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
            <button
              onClick={() => handleAddNote(activeTreatments[0]._id)}
              disabled={addingNote || !newNote.trim()}
              className="px-3.5 py-1.5 rounded-lg btn-emerald text-xs font-semibold disabled:opacity-50"
            >
              Add Note
            </button>
          </div>
        )}
      </div>

      {/* Record Payment Modal (matching Screenshot 3) */}
      <RecordPaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        patient={patient}
        treatment={selectedTreatmentForPayment}
        treatmentsList={treatments}
        onPaymentSuccess={loadPatient}
      />

      {/* Edit Patient Modal */}
      <AddPatientModal
        isOpen={editPatientModalOpen}
        onClose={() => setEditPatientModalOpen(false)}
        initialData={patient}
        onSuccess={loadPatient}
      />

      {/* Assign Treatment Modal */}
      <AssignTreatmentModal
        isOpen={assignTreatmentModalOpen}
        onClose={() => setAssignTreatmentModalOpen(false)}
        patientId={patient._id}
        onSuccess={loadPatient}
      />
    </div>
  );
};

export default PatientDetail;
