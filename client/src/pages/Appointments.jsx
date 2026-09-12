import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit2, XCircle, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react';
import { appointmentsAPI } from '../services/api';
import AddAppointmentModal from '../components/AddAppointmentModal';
import { useClinic } from '../context/ClinicContext';

const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeTo12Hour = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.toUpperCase().includes('AM') || timeStr.toUpperCase().includes('PM')) {
    return timeStr;
  }
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hour = parseInt(parts[0], 10);
  const min = parts[1];
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${min} ${period}`;
};

const Appointments = () => {
  const { showToast } = useClinic();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const dateString = getLocalDateStr(currentDate);

  const formattedHeaderDate = currentDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const res = await appointmentsAPI.getAll({ date: dateString });
      if (res.success) {
        setAppointments(res.data);
      }
    } catch (err) {
      showToast('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [dateString]);

  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await appointmentsAPI.updateStatus(id, status);
      if (res.success) {
        showToast(`Appointment status updated to ${status}`, 'success');
        loadAppointments();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Completed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Cancelled
          </span>
        );
      case 'No Show':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            No Show
          </span>
        );
      case 'Scheduled':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Scheduled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar matching Screenshot 1 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Appointments — {formattedHeaderDate}
        </h1>

        <div className="flex items-center gap-3">
          {/* Day Navigation Group */}
          <div className="flex items-center rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
            <button
              onClick={handlePrevDay}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              Previous Day
            </button>
            <div className="h-4 w-px bg-slate-200"></div>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              Today
            </button>
            <div className="h-4 w-px bg-slate-200"></div>
            <button
              onClick={handleNextDay}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              Next Day
            </button>
          </div>

          {/* Date Selector Popover Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="p-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Select specific date"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
            {showDatePicker && (
              <div className="absolute right-0 mt-2 p-3 bg-white rounded-xl shadow-xl border border-slate-200 z-30">
                <input
                  type="date"
                  value={dateString}
                  onChange={(e) => {
                    if (e.target.value) {
                      setCurrentDate(new Date(e.target.value));
                      setShowDatePicker(false);
                    }
                  }}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            )}
          </div>

          {/* New Appointment Button matching Dark Emerald requirement */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg btn-emerald text-sm font-semibold shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Appointment</span>
          </button>
        </div>
      </div>

      {/* Main Table Card matching Screenshot 1 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-6">Time</th>
                <th className="py-3.5 px-6">Patient</th>
                <th className="py-3.5 px-6">Treatment / Service</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    Loading appointments...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    No appointments scheduled for this date.
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => (
                  <tr key={apt._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-800 whitespace-nowrap">
                      {formatTimeTo12Hour(apt.time)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-900">{apt.patientName || apt.patientId?.name || 'Patient'}</div>
                      {(apt.phone || apt.patientId?.phone) && (
                        <div className="text-xs text-slate-400">{apt.phone || apt.patientId?.phone}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-700">
                      {apt.serviceName || (apt.serviceId?.name) || 'General Consultation'}
                    </td>
                    <td className="py-4 px-6 text-center">{getStatusBadge(apt.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 text-slate-400">
                        {apt.status === 'Scheduled' && (
                          <button
                            onClick={() => handleStatusChange(apt._id, 'Completed')}
                            className="p-1 rounded hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Mark Completed"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {apt.status !== 'Cancelled' && (
                          <button
                            onClick={() => handleStatusChange(apt._id, 'Cancelled')}
                            className="p-1 rounded hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            title="Cancel Appointment"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Appointment Modal */}
      <AddAppointmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedDate={dateString}
        onSuccess={loadAppointments}
      />
    </div>
  );
};

export default Appointments;
