import React, { useState, useEffect } from 'react';
import {
  Save,
  Database,
  Download,
  RotateCcw,
  Shield,
  UserPlus,
  Users,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { settingsAPI, backupAPI, authAPI, auditAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useClinic } from '../context/ClinicContext';

const Settings = () => {
  const { user } = useAuth();
  const { settings, setSettings, showToast } = useClinic();

  const [activeTab, setActiveTab] = useState('clinic'); // 'clinic', 'backup', 'users', 'audit'
  const [loading, setLoading] = useState(false);

  // Clinic profile form state
  const [formData, setFormData] = useState({
    clinicName: settings.clinicName || 'Dental Clinic',
    clinicAddress: settings.clinicAddress || '',
    phone: settings.phone || '',
    email: settings.email || '',
    currencySymbol: settings.currencySymbol || 'Rs.',
    currency: settings.currency || 'PKR',
    receiptFooter: settings.receiptFooter || ''
  });

  // Backups state
  const [backups, setBackups] = useState([]);
  const [backupLoading, setBackupLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'Receptionist' });

  // Audit state
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    setFormData({
      clinicName: settings.clinicName || 'Dental Clinic',
      clinicAddress: settings.clinicAddress || '',
      phone: settings.phone || '',
      email: settings.email || '',
      currencySymbol: settings.currencySymbol || 'Rs.',
      currency: settings.currency || 'PKR',
      receiptFooter: settings.receiptFooter || ''
    });
  }, [settings]);

  useEffect(() => {
    if (activeTab === 'backup') loadBackups();
    else if (activeTab === 'users' && user?.role === 'Admin') loadUsers();
    else if (activeTab === 'audit') loadAuditLogs();
  }, [activeTab]);

  const loadBackups = async () => {
    try {
      setBackupLoading(true);
      const res = await backupAPI.list();
      if (res.success) setBackups(res.data);
    } catch (err) {
      showToast('Failed to list backups', 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await authAPI.getUsers();
      if (res.success) setUsers(res.data);
    } catch (err) {
      showToast('Failed to load clinic staff', 'error');
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await auditAPI.get({ limit: 50 });
      if (res.success) setAuditLogs(res.data);
    } catch (err) {
      showToast('Failed to load audit logs', 'error');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await settingsAPI.update(formData);
      if (res.success) {
        setSettings(res.data);
        showToast('Clinic settings saved successfully', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setBackupLoading(true);
      const res = await backupAPI.create();
      if (res.success) {
        showToast(`Backup created: ${res.filename}`, 'success');
        loadBackups();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create backup', 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreBackup = async (filename) => {
    const confirm = window.confirm(
      `CAUTION: Restoring will overwrite current database records with data from "${filename}". Are you sure you want to proceed?`
    );
    if (!confirm) return;

    try {
      setBackupLoading(true);
      const res = await backupAPI.restore(filename);
      if (res.success) {
        showToast(res.message, 'success');
        window.location.reload();
      }
    } catch (err) {
      showToast(err.message || 'Failed to restore database', 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.username || !newUser.password) {
      showToast('All fields are required', 'error');
      return;
    }
    try {
      const res = await authAPI.createUser(newUser);
      if (res.success) {
        showToast(`Staff member "${newUser.name}" added`, 'success');
        setNewUser({ name: '', username: '', password: '', role: 'Receptionist' });
        loadUsers();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create user', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinic Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure clinic profile, currency, local database backup/recovery, and staff accounts
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-white border border-slate-200 p-1 shadow-2xs max-w-lg">
        <button
          onClick={() => setActiveTab('clinic')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'clinic' ? 'btn-emerald' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Clinic Profile
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'backup' ? 'btn-emerald' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Database Backup
        </button>
        {user?.role === 'Admin' && (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'users' ? 'btn-emerald' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Staff Accounts
          </button>
        )}
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'audit' ? 'btn-emerald' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Audit Log
        </button>
      </div>

      {/* TAB 1: Clinic Profile */}
      {activeTab === 'clinic' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Clinic Name</label>
              <input
                type="text"
                required
                value={formData.clinicName}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Clinic Address</label>
            <input
              type="text"
              value={formData.clinicAddress}
              onChange={(e) => setFormData({ ...formData, clinicAddress: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Currency Code</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Receipt Footer Note</label>
            <textarea
              rows={2}
              value={formData.receiptFooter}
              onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg btn-emerald text-sm font-semibold shadow-2xs"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Local Database Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6 max-w-3xl">
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Local MongoDB Data Snapshots</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate offline JSON snapshots of all patients, services, payments, and transactions
              </p>
            </div>
            <button
              onClick={handleCreateBackup}
              disabled={backupLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg btn-emerald text-xs font-semibold shadow-2xs"
            >
              <Database className="w-4 h-4" />
              <span>{backupLoading ? 'Backing Up...' : 'Create Backup Now'}</span>
            </button>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Available Backups</h4>
            {backups.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 italic">No backups found yet. Click above to create one.</p>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {backups.map((b) => (
                  <div key={b.filename} className="p-3 flex items-center justify-between hover:bg-slate-50 text-xs">
                    <div>
                      <p className="font-mono font-medium text-slate-800">{b.filename}</p>
                      <p className="text-slate-400 text-2xs mt-0.5">
                        {new Date(b.createdAt).toLocaleString()} • {b.sizeKB} KB
                      </p>
                    </div>
                    <button
                      onClick={() => handleRestoreBackup(b.filename)}
                      className="px-3 py-1 bg-white border border-slate-300 hover:border-rose-300 text-slate-700 hover:text-rose-700 rounded-md font-medium transition-colors"
                    >
                      Restore Data
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Staff Accounts (Admin only) */}
      {activeTab === 'users' && user?.role === 'Admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Add Staff form */}
          <form onSubmit={handleCreateUser} className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add New Staff Account</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="Dr. Sara Khan"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Username</label>
              <input
                type="text"
                required
                placeholder="drsara"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="Receptionist">Receptionist</option>
                <option value="Accountant">Accountant</option>
                <option value="Doctor">Doctor</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2 rounded-lg btn-emerald text-sm font-semibold shadow-2xs"
            >
              Create Account
            </button>
          </form>

          {/* Existing Staff list */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Current Clinic Staff</h3>
            <div className="divide-y divide-slate-100">
              {users.map((u) => (
                <div key={u._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">{u.name}</p>
                    <p className="text-slate-400">@{u.username}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">System Activity Audit Trail</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Entity</th>
                  <th className="py-2.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 px-4 font-semibold text-slate-800">{log.user}</td>
                    <td className="py-2 px-4 font-mono text-emerald-800 font-medium">{log.action}</td>
                    <td className="py-2 px-4 text-slate-600">{log.entity}</td>
                    <td className="py-2 px-4 text-slate-500 truncate max-w-xs">
                      {JSON.stringify(log.details || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
