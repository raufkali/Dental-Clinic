import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { servicesAPI } from '../services/api';
import AddServiceModal from '../components/AddServiceModal';
import AssignTreatmentModal from '../components/AssignTreatmentModal';
import { useClinic } from '../context/ClinicContext';

const Services = () => {
  const { formatCurrency, showToast } = useClinic();
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignService, setAssignService] = useState(null);

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await servicesAPI.getAll({ q: searchTerm });
      if (res.success) {
        setServices(res.data);
      }
    } catch (err) {
      showToast('Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [searchTerm]);

  const handleToggleStatus = async (service) => {
    try {
      const res = await servicesAPI.toggleStatus(service._id);
      if (res.success) {
        showToast(`Service "${service.name}" updated`, 'success');
        loadServices();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header matching Screenshot 2 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Services</h1>
        <button
          onClick={() => {
            setEditingService(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg btn-emerald text-sm font-semibold shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Service</span>
        </button>
      </div>

      {/* Main Container matching Screenshot 2 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Search Bar matching screenshot */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Table matching Screenshot 2 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-6">Service</th>
                <th className="py-3.5 px-6">Price Range</th>
                <th className="py-3.5 px-6">Type</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    Loading dental services...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    No services found matching your query.
                  </td>
                </tr>
              ) : (
                services.map((srv) => {
                  const priceRange = srv.minPrice && srv.maxPrice
                    ? `Rs. ${srv.minPrice.toLocaleString()}–${srv.maxPrice.toLocaleString()}`
                    : srv.defaultPrice
                    ? `Rs. ${srv.defaultPrice.toLocaleString()}`
                    : 'Variable';

                  return (
                    <tr key={srv._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-900">{srv.name}</td>
                      <td className="py-4 px-6 text-slate-700">{priceRange}</td>
                      <td className="py-4 px-6 text-slate-700">{srv.type}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium ${
                            srv.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {srv.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2 text-sm">
                        <button
                          onClick={() => {
                            setAssignService(srv);
                            setAssignModalOpen(true);
                          }}
                          className="font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md text-xs transition-colors"
                          title="Assign Patient to this Service"
                        >
                          + Assign
                        </button>
                        <button
                          onClick={() => handleEdit(srv)}
                          className="font-medium text-slate-600 hover:text-emerald-700 text-xs px-2 py-1 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(srv)}
                          className={`font-medium text-xs px-2 py-1 rounded transition-colors ${
                            srv.status === 'Active'
                              ? 'text-slate-500 hover:text-rose-600'
                              : 'text-emerald-700 hover:text-emerald-800'
                          }`}
                        >
                          {srv.status === 'Active' ? 'Disable' : 'Enable'}
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

      {/* Add / Edit Service Modal */}
      <AddServiceModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingService(null);
        }}
        service={editingService}
        onSuccess={loadServices}
      />

      {/* Assign Patient to Service Modal */}
      <AssignTreatmentModal
        isOpen={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setAssignService(null);
        }}
        defaultServiceId={assignService?._id}
        onSuccess={loadServices}
      />
    </div>
  );
};

export default Services;
