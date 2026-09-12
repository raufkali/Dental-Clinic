import React, { useState, useEffect } from 'react';
import { X, UserCheck, Clock } from 'lucide-react';
import { appointmentsAPI, patientsAPI, servicesAPI } from '../services/api';
import { useClinic } from '../context/ClinicContext';

const AddAppointmentModal = ({ isOpen, onClose, selectedDate, defaultServiceId, onSuccess }) => {
  const { showToast } = useClinic();
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [patientId, setPatientId] = useState('');
  const [serviceId, setServiceId] = useState(defaultServiceId || '');
  const [date, setDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);

  // 12-Hour AM/PM Time States
  const [hour, setHour] = useState('10');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('AM');
  const [isManualTime, setIsManualTime] = useState(false);
  const [manualTimeText, setManualTimeText] = useState('');

  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (selectedDate) setDate(selectedDate);
      if (defaultServiceId) setServiceId(defaultServiceId);
      loadOptions();
    } else {
      setPatientName('');
      setPhone('');
      setPatientId('');
      setServiceId('');
      setNotes('');
      setHour('10');
      setMinute('00');
      setPeriod('AM');
      setIsManualTime(false);
      setManualTimeText('');
    }
  }, [isOpen, selectedDate, defaultServiceId]);

  const loadOptions = async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        patientsAPI.getAll({ status: 'Active' }),
        servicesAPI.getAll({ status: 'Active' })
      ]);
      if (pRes.success) {
        setPatients(pRes.data);
      }
      if (sRes.success) {
        setServices(sRes.data);
        if (defaultServiceId && !serviceId) {
          setServiceId(defaultServiceId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePatientSelect = (pId) => {
    setPatientId(pId);
    if (!pId) return;
    const selected = patients.find((p) => p._id === pId);
    if (selected) {
      setPatientName(selected.name);
      setPhone(selected.phone || '');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      showToast('Patient name is required', 'error');
      return;
    }

    const formattedTime = isManualTime
      ? manualTimeText.trim()
      : `${hour}:${minute} ${period}`;

    if (!date || !formattedTime) {
      showToast('Date and time are required', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await appointmentsAPI.create({
        patientName: patientName.trim(),
        phone: phone.trim(),
        patientId: patientId || undefined,
        serviceId: serviceId || undefined,
        date,
        time: formattedTime,
        notes: notes.trim(),
        status: 'Scheduled'
      });

      if (res.success) {
        showToast('Appointment scheduled successfully', 'success');
        if (onSuccess) onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to schedule appointment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const hoursList = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">New Appointment</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Quick Select from Registered Patients (Optional) */}
          {patients.length > 0 && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Quick-fill from registered patients:</span>
              </div>
              <select
                value={patientId}
                onChange={(e) => handlePatientSelect(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-700"
              >
                <option value="">-- Choose registered patient (or type below) --</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.patientId}) {p.phone ? `— ${p.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Patient Name (Mandatory Manual Input) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Patient Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ali Khan or walk-in patient"
              value={patientName}
              onChange={(e) => {
                setPatientName(e.target.value);
                if (patientId) setPatientId('');
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 font-medium"
            />
          </div>

          {/* Patient Phone (Optional Manual Input) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 0300-1234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
            />
          </div>

          {/* Treatment / Service (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Treatment / Service (Optional)
            </label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
            >
              <option value="">-- None / General Consultation --</option>
              {services.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.type})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
            />
          </div>

          {/* AM / PM Time Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Appointment Time (AM / PM) *</span>
              </label>
              <button
                type="button"
                onClick={() => setIsManualTime(!isManualTime)}
                className="text-2xs text-emerald-700 hover:underline font-medium"
              >
                {isManualTime ? 'Use Time Selector' : 'Type Custom Time'}
              </button>
            </div>

            {!isManualTime ? (
              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {/* Hour Select */}
                <div className="flex-1">
                  <span className="text-2xs text-slate-400 block mb-0.5">Hour</span>
                  <select
                    value={hour}
                    onChange={(e) => setHour(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    {hoursList.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <span className="text-lg font-bold text-slate-400 pt-4">:</span>

                {/* Minute Select */}
                <div className="flex-1">
                  <span className="text-2xs text-slate-400 block mb-0.5">Minute</span>
                  <select
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  >
                    {minutesList.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* AM / PM Toggle */}
                <div className="pt-4 flex rounded-lg overflow-hidden border border-slate-300 bg-white">
                  <button
                    type="button"
                    onClick={() => setPeriod('AM')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all ${
                      period === 'AM'
                        ? 'btn-emerald text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriod('PM')}
                    className={`px-3 py-1.5 text-xs font-bold transition-all ${
                      period === 'PM'
                        ? 'btn-emerald text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            ) : (
              <input
                type="text"
                placeholder="e.g. 10:15 AM or 04:30 PM"
                value={manualTimeText}
                onChange={(e) => setManualTimeText(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              />
            )}
            <p className="text-2xs text-slate-400 mt-1">
              Selected time: <strong className="text-slate-700">{isManualTime ? manualTimeText || 'None' : `${hour}:${minute} ${period}`}</strong>
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes / Procedure
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Monthly wire adjustment, routine examination..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 placeholder-slate-400 resize-none"
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
              {loading ? 'Scheduling...' : 'Schedule Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAppointmentModal;
