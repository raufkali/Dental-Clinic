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
  Printer,
  CheckCheck,
  Trash2,
  Layers,
  Calendar,
  DollarSign,
  AlertTriangle,
  X
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

  // Settle Treatment Modal
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [treatmentToSettle, setTreatmentToSettle] = useState(null);
  const [settleReason, setSettleReason] = useState('Treatment concluded early, remaining balance waived by doctor');
  const [settling, setSettling] = useState(false);

  // Edit Treatment Modal
  const [editTreatmentModalOpen, setEditTreatmentModalOpen] = useState(false);
  const [treatmentToEdit, setTreatmentToEdit] = useState(null);
  const [editTreatmentData, setEditTreatmentData] = useState({
    contractAmount: '',
    monthlyInstallment: '',
    durationMonths: '',
    status: 'Active',
    notes: ''
  });
  const [updatingTreatment, setUpdatingTreatment] = useState(false);

  // Edit Payment Modal
  const [editPaymentModalOpen, setEditPaymentModalOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState(null);
  const [editPaymentData, setEditPaymentData] = useState({
    amount: '',
    paymentMethod: 'Cash',
    paymentType: 'Monthly Installment',
    paymentDate: '',
    notes: ''
  });
  const [updatingPayment, setUpdatingPayment] = useState(false);

  // Delete Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'treatment' | 'payment', item: object }
  const [deleting, setDeleting] = useState(false);

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

  const handleOpenPayment = (trt = null) => {
    const active = (patientData?.treatments || []).filter((t) => t.status === 'Active');
    setSelectedTreatmentForPayment(trt || (active[0] || patientData?.treatments[0] || null));
    setPaymentModalOpen(true);
  };

  // Open Settle Treatment Modal
  const handleOpenSettle = (trt) => {
    setTreatmentToSettle(trt);
    setSettleReason('Treatment concluded early, remaining balance waived by doctor');
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
        await loadPatient();
      }
    } catch (err) {
      showToast(err.message || 'Failed to settle treatment', 'error');
    } finally {
      setSettling(false);
    }
  };

  // Open Edit Treatment Modal
  const handleOpenEditTreatment = (trt) => {
    setTreatmentToEdit(trt);
    setEditTreatmentData({
      contractAmount: trt.contractAmount ? String(trt.contractAmount) : '',
      monthlyInstallment: trt.monthlyInstallment ? String(trt.monthlyInstallment) : '0',
      durationMonths: trt.durationMonths ? String(trt.durationMonths) : '0',
      status: trt.status || 'Active',
      notes: ''
    });
    setEditTreatmentModalOpen(true);
  };

  const handleSaveTreatment = async (e) => {
    e.preventDefault();
    if (!treatmentToEdit) return;
    const finalAmount = parseFloat(editTreatmentData.contractAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      showToast('Contract amount must be a positive number', 'error');
      return;
    }

    try {
      setUpdatingTreatment(true);
      const res = await treatmentsAPI.update(treatmentToEdit._id, {
        contractAmount: finalAmount,
        monthlyInstallment: parseFloat(editTreatmentData.monthlyInstallment) || 0,
        durationMonths: parseInt(editTreatmentData.durationMonths, 10) || 0,
        status: editTreatmentData.status,
        notes: editTreatmentData.notes.trim() || undefined
      });

      if (res.success) {
        showToast('Treatment contract updated successfully', 'success');
        setEditTreatmentModalOpen(false);
        setTreatmentToEdit(null);
        await loadPatient();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update treatment', 'error');
    } finally {
      setUpdatingTreatment(false);
    }
  };

  // Open Edit Payment Modal
  const handleOpenEditPayment = (p) => {
    setPaymentToEdit(p);
    const dateStr = p.paymentDate ? new Date(p.paymentDate).toISOString().split('T')[0] : '';
    setEditPaymentData({
      amount: p.amount ? String(p.amount) : '',
      paymentMethod: p.paymentMethod || 'Cash',
      paymentType: p.paymentType || 'Monthly Installment',
      paymentDate: dateStr,
      notes: p.notes || ''
    });
    setEditPaymentModalOpen(true);
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!paymentToEdit) return;
    const numAmount = parseFloat(editPaymentData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Amount must be a positive number', 'error');
      return;
    }

    try {
      setUpdatingPayment(true);
      const res = await paymentsAPI.update(paymentToEdit._id, {
        amount: numAmount,
        paymentMethod: editPaymentData.paymentMethod,
        paymentType: editPaymentData.paymentType,
        paymentDate: editPaymentData.paymentDate,
        notes: editPaymentData.notes.trim()
      });

      if (res.success) {
        showToast('Payment record and ledger updated successfully', 'success');
        setEditPaymentModalOpen(false);
        setPaymentToEdit(null);
        await loadPatient();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update payment', 'error');
    } finally {
      setUpdatingPayment(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (type, item) => {
    setDeleteTarget({ type, item });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      if (deleteTarget.type === 'treatment') {
        const res = await treatmentsAPI.delete(deleteTarget.item._id);
        if (res.success) {
          showToast('Treatment contract deleted successfully', 'success');
        }
      } else if (deleteTarget.type === 'payment') {
        const res = await paymentsAPI.delete(deleteTarget.item._id);
        if (res.success) {
          showToast('Payment and ledger entry deleted successfully', 'success');
        }
      }
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      await loadPatient();
    } catch (err) {
      showToast(err.message || 'Failed to delete record', 'error');
    } finally {
      setDeleting(false);
    }
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
        showToast(`Payment ${payment.paymentId} voided and reversed in ledger`, 'info');
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
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar matching screenshot */}
            <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-slate-400" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
              <p className="text-xs text-slate-500 font-mono">Patient ID: {patient.patientId}</p>
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

        {/* Clinical Involvement Overview Strip */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              Involved Services ({treatments.length}):
            </span>
            {treatments.length === 0 ? (
              <span className="text-slate-400 italic">No treatments assigned yet</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {treatments.map((t) => (
                  <span
                    key={t._id}
                    className={`px-2 py-0.5 rounded-md font-medium text-2xs ${
                      t.isSettled || t.remainingBalance === 0
                        ? 'bg-slate-100 text-slate-700 border border-slate-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                    }`}
                  >
                    {t.serviceId?.name || 'Treatment'} ({t.isSettled ? 'Settled' : t.status})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Financial summary tags */}
          {patientData.financialSummary && (
            <div className="flex items-center gap-4 text-2xs">
              <span className="text-slate-500">
                Total Agreed: <strong className="text-slate-800">{formatCurrency(patientData.financialSummary.totalContractAmount)}</strong>
              </span>
              <span className="text-slate-500">
                Collected: <strong className="text-emerald-700">{formatCurrency(patientData.financialSummary.totalPaid)}</strong>
              </span>
              <span className="text-slate-500">
                Outstanding: <strong className={patientData.financialSummary.totalRemaining > 0 ? 'text-amber-700' : 'text-slate-600'}>
                  {formatCurrency(patientData.financialSummary.totalRemaining)}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Additional Medical info tags */}
        {(patient.allergies !== 'None' || patient.medicalNotes) && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
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
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Active Treatments & Contracts</h3>
          <button
            onClick={() => setAssignTreatmentModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg btn-emerald text-xs font-semibold shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Assign Treatment</span>
          </button>
        </div>

        {activeTreatments.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            No active treatment contracts. Click <strong>+ Assign Treatment</strong> above to start one.
          </div>
        ) : (
          activeTreatments.map((trt) => (
            <div key={trt._id} className="space-y-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              {/* Row Stats matching screenshot 5 */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-baseline">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">
                      {trt.serviceId?.name || 'Treatment'}
                    </h4>
                    <span className="text-2xs font-mono text-slate-400">({trt.treatmentId})</span>
                  </div>
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
                    {trt.isSettled ? (
                      <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                        Rs. 0 (Settled)
                      </span>
                    ) : (
                      formatCurrency(trt.remainingBalance)
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400 font-medium">Monthly Installment</p>
                  <p className="text-sm font-bold text-slate-800">
                    {trt.monthlyInstallment ? formatCurrency(trt.monthlyInstallment) : '—'}
                  </p>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-1.5">
                  {/* Pay button */}
                  {!trt.isSettled && trt.remainingBalance > 0 && (
                    <button
                      onClick={() => handleOpenPayment(trt)}
                      className="px-2.5 py-1 rounded-md btn-emerald text-xs font-semibold shadow-2xs"
                      title="Record Payment"
                    >
                      Pay
                    </button>
                  )}

                  {/* Mark Fully Settled (Early completion before full contract paid) */}
                  {!trt.isSettled && trt.status === 'Active' && (
                    <button
                      onClick={() => handleOpenSettle(trt)}
                      className="p-1 rounded-md text-amber-700 hover:text-amber-800 hover:bg-amber-50 transition-colors"
                      title="Mark Fully Settled (Forgive remaining balance early)"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}

                  {/* Edit Treatment */}
                  <button
                    onClick={() => handleOpenEditTreatment(trt)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Edit Treatment Details"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {/* Delete Treatment */}
                  <button
                    onClick={() => handleOpenDelete('treatment', trt)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Treatment Contract"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dark Emerald Progress Bar matching Screenshot 5 */}
              <div className="space-y-1">
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-700 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, trt.isSettled ? 100 : (trt.progressPercent || 0))}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span className="font-semibold text-emerald-700">
                    {trt.isSettled ? 'Fully Settled Early' : trt.status}
                  </span>
                  <span className="font-medium">
                    {trt.isSettled ? 100 : (trt.progressPercent || 0)}% Paid
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Payment History Card matching Screenshot 5 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-6 pb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Payment History & Transactions</h3>
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
                      <td className="py-3.5 px-6 text-right space-x-1.5">
                        {!isVoid && (
                          <>
                            {/* Print Receipt */}
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

                            {/* Edit Payment */}
                            <button
                              onClick={() => handleOpenEditPayment(p)}
                              className="p-1 text-slate-400 hover:text-slate-800 transition-colors"
                              title="Edit Payment / Transaction"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            {/* Delete Payment */}
                            <button
                              onClick={() => handleOpenDelete('payment', p)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete Payment Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Void / Reverse Payment */}
                            <button
                              onClick={() => handleVoidPayment(p)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Void / Reverse Payment in Ledger"
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

      {/* Settle Treatment Modal */}
      {settleModalOpen && treatmentToSettle && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
                  <CheckCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Mark Fully Settled</h2>
                  <p className="text-xs text-slate-400 font-mono">{treatmentToSettle.treatmentId}</p>
                </div>
              </div>
              <button
                onClick={() => setSettleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSettle} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1">
                <p className="font-semibold">Early Completion & Balance Forgiveness</p>
                <p>
                  Remaining balance of{' '}
                  <strong className="text-amber-800">{formatCurrency(treatmentToSettle.remainingBalance)}</strong> will be waived.
                  The contract will be marked completed with no further payments due.
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
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 resize-none"
                />
              </div>

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

      {/* Edit Treatment Modal */}
      {editTreatmentModalOpen && treatmentToEdit && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Edit Treatment Contract</h2>
                <p className="text-xs text-slate-400 font-mono">{treatmentToEdit.treatmentId} • {treatmentToEdit.serviceId?.name}</p>
              </div>
              <button
                onClick={() => setEditTreatmentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTreatment} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Amount (Final Price) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={editTreatmentData.contractAmount}
                  onChange={(e) => setEditTreatmentData((prev) => ({ ...prev, contractAmount: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Installment</label>
                  <input
                    type="number"
                    min="0"
                    value={editTreatmentData.monthlyInstallment}
                    onChange={(e) => setEditTreatmentData((prev) => ({ ...prev, monthlyInstallment: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    min="0"
                    value={editTreatmentData.durationMonths}
                    onChange={(e) => setEditTreatmentData((prev) => ({ ...prev, durationMonths: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contract Status</label>
                <select
                  value={editTreatmentData.status}
                  onChange={(e) => setEditTreatmentData((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Settled">Settled Early</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Add Amendment Note (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Contract price adjusted per doctor discussion..."
                  value={editTreatmentData.notes}
                  onChange={(e) => setEditTreatmentData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditTreatmentModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingTreatment}
                  className="px-5 py-2 text-sm rounded-lg btn-emerald font-semibold shadow-sm transition-all"
                >
                  {updatingTreatment ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {editPaymentModalOpen && paymentToEdit && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Edit Payment & Transaction</h2>
                <p className="text-xs text-slate-400 font-mono">{paymentToEdit.paymentId}</p>
              </div>
              <button
                onClick={() => setEditPaymentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  value={editPaymentData.amount}
                  onChange={(e) => setEditPaymentData((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={editPaymentData.paymentDate}
                    onChange={(e) => setEditPaymentData((prev) => ({ ...prev, paymentDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Method</label>
                  <select
                    value={editPaymentData.paymentMethod}
                    onChange={(e) => setEditPaymentData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Type</label>
                <select
                  value={editPaymentData.paymentType}
                  onChange={(e) => setEditPaymentData((prev) => ({ ...prev, paymentType: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                >
                  <option value="Monthly Installment">Monthly Installment</option>
                  <option value="Initial / Advance">Initial / Advance</option>
                  <option value="Full Settlement">Full Settlement</option>
                  <option value="Custom Payment">Custom Payment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={editPaymentData.notes}
                  onChange={(e) => setEditPaymentData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditPaymentModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPayment}
                  className="px-5 py-2 text-sm rounded-lg btn-emerald font-semibold shadow-sm transition-all"
                >
                  {updatingPayment ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete {deleteTarget.type === 'treatment' ? 'Treatment Contract' : 'Payment Record'}?
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {deleteTarget.type === 'treatment'
                    ? deleteTarget.item.treatmentId
                    : deleteTarget.item.paymentId}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              {deleteTarget.type === 'treatment'
                ? `Are you sure you want to permanently delete this contract (${deleteTarget.item.serviceId?.name || 'Treatment'})? All associated payments and ledger records will be removed.`
                : `Are you sure you want to permanently delete payment ${deleteTarget.item.paymentId} for ${formatCurrency(deleteTarget.item.amount)}? This will remove the transaction from the accounting ledger.`}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-2xs"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

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
