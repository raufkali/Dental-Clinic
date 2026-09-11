import React, { useState } from 'react';
import { X } from 'lucide-react';
import { servicesAPI } from '../services/api';
import { useClinic } from '../context/ClinicContext';

const AddServiceModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const { showToast } = useClinic();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    minPrice: initialData?.minPrice || '',
    maxPrice: initialData?.maxPrice || '',
    defaultPrice: initialData?.defaultPrice || '',
    type: initialData?.type || 'One-time',
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
    if (!formData.name.trim()) {
      showToast('Service name is required', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        minPrice: Number(formData.minPrice) || 0,
        maxPrice: Number(formData.maxPrice) || 0,
        defaultPrice: Number(formData.defaultPrice) || Number(formData.minPrice) || 0,
        type: formData.type,
        status: formData.status
      };

      let res;
      if (initialData?._id) {
        res = await servicesAPI.update(initialData._id, payload);
      } else {
        res = await servicesAPI.create(payload);
      }

      if (res.success) {
        showToast(
          initialData ? 'Service updated successfully' : 'Service created successfully',
          'success'
        );
        if (onSuccess) onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      showToast(err.message || 'Failed to save service', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? 'Edit Service' : 'Add Service'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Service Name *</label>
            <input
              type="text"
              required
              name="name"
              placeholder="e.g. Braces, Scaling, Root Canal..."
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
            <textarea
              rows={2}
              name="description"
              placeholder="Brief description of the treatment..."
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Min Price (Rs.)</label>
              <input
                type="number"
                name="minPrice"
                min="0"
                placeholder="80,000"
                value={formData.minPrice}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Max Price (Rs.)</label>
              <input
                type="number"
                name="maxPrice"
                min="0"
                placeholder="100,000"
                value={formData.maxPrice}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Service Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
              >
                <option value="One-time">One-time</option>
                <option value="Contract">Contract (Installments)</option>
              </select>
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
              </select>
            </div>
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
              {loading ? 'Saving...' : initialData ? 'Update Service' : 'Add Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddServiceModal;
