import React, { useState } from 'react';
import { X } from 'lucide-react';
import { patientsAPI } from '../services/api';
import { useClinic } from '../context/ClinicContext';

const AddPatientModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const { showToast } = useClinic();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    fatherName: initialData?.fatherName || '',
    gender: initialData?.gender || 'Male',
    age: initialData?.age || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    allergies: initialData?.allergies || 'None',
    medicalNotes: initialData?.medicalNotes || '',
    emergencyName: initialData?.emergencyContact?.name || '',
    emergencyPhone: initialData?.emergencyContact?.phone || '',
    status: initialData?.status || 'Active'
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      showToast('Patient name and phone number are required', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name.trim(),
        fatherName: formData.fatherName.trim(),
        gender: formData.gender,
        age: formData.age ? Number(formData.age) : undefined,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        allergies: formData.allergies.trim(),
        medicalNotes: formData.medicalNotes.trim(),
        emergencyContact: {
          name: formData.emergencyName.trim(),
          phone: formData.emergencyPhone.trim()
        },
        status: formData.status
      };

      let res;
      if (initialData?._id) {
        res = await patientsAPI.update(initialData._id, payload);
      } else {
        res = await patientsAPI.create(payload);
      }

      if (res.success) {
        showToast(
          initialData ? 'Patient updated successfully' : 'Patient registered successfully',
          'success'
        );
        if (onSuccess) onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to save patient', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'Edit Patient' : 'Register New Patient'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
              <input
                type="text"
                required
                name="name"
                placeholder="e.g. Ali Khan"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Father / Guardian Name</label>
              <input
                type="text"
                name="fatherName"
                placeholder="e.g. Tariq Khan"
                value={formData.fatherName}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Age</label>
              <input
                type="number"
                name="age"
                min="1"
                placeholder="24"
                value={formData.age}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Completed treatment">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                name="phone"
                placeholder="0300-1234567"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                name="email"
                placeholder="clin@gmail.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
            <input
              type="text"
              name="address"
              placeholder="e.g. House 45, Street 12, Gulberg, Lahore"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Allergies</label>
              <input
                type="text"
                name="allergies"
                placeholder="e.g. Penicillin, Latex, None"
                value={formData.allergies}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Emergency Contact Phone</label>
              <input
                type="text"
                name="emergencyPhone"
                placeholder="0321-xxxxxxx"
                value={formData.emergencyPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Medical Notes</label>
            <textarea
              name="medicalNotes"
              rows={2}
              placeholder="e.g. Diabetic, Hypertension, Bleeding tendencies..."
              value={formData.medicalNotes}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 resize-none"
            />
          </div>

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
              {loading ? 'Saving...' : initialData ? 'Update Patient' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatientModal;
