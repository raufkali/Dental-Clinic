import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Scale,
  AlertCircle,
  Calendar,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { reportsAPI } from '../services/api';
import { useClinic } from '../context/ClinicContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { formatCurrency, showToast } = useClinic();

  const [period, setPeriod] = useState('30days');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const res = await reportsAPI.getDashboard(period, todayStr);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      showToast('Failed to load dashboard statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const cards = data?.cards || {
    totalPatients: 0,
    activeTreatments: 0,
    todayIncome: 0,
    todayExpenses: 0,
    todayNet: 0,
    totalOutstanding: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0
  };

  const chartData = data?.chartData || [];
  const recentTransactions = data?.recentTransactions || [];
  const todayAppointments = data?.todayAppointments || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinic Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time practice performance, appointments, and accounting ledger summary
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Period:</span>
          <div className="flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
            <button
              onClick={() => setPeriod('7days')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                period === '7days' ? 'bg-emerald-700 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setPeriod('30days')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                period === '30days' ? 'bg-emerald-700 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                period === 'month' ? 'bg-emerald-700 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              This Month
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (Section 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Income */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Income</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(cards.todayIncome)}
          </p>
        </div>

        {/* Today's Expenses */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Expenses</span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-700">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(cards.todayExpenses)}
          </p>
        </div>

        {/* Today's Net */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Net</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(cards.todayNet)}
          </p>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Outstanding</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(cards.totalOutstanding)}
          </p>
        </div>
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Registered Patients</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">{cards.totalPatients}</p>
          </div>
          <Users className="w-5 h-5 text-slate-400" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Active Treatments</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">{cards.activeTreatments}</p>
          </div>
          <Activity className="w-5 h-5 text-slate-400" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Monthly Income</p>
            <p className="text-lg font-bold text-emerald-700 mt-0.5">{formatCurrency(cards.monthlyIncome)}</p>
          </div>
          <TrendingUp className="w-5 h-5 text-emerald-600" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Monthly Expenses</p>
            <p className="text-lg font-bold text-rose-700 mt-0.5">{formatCurrency(cards.monthlyExpenses)}</p>
          </div>
          <TrendingDown className="w-5 h-5 text-rose-600" />
        </div>
      </div>

      {/* Financial Comparison Chart (Section 3) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Income vs. Expense Trend</h2>
          <span className="text-xs text-slate-400">Values in PKR (Rs.)</span>
        </div>
        <div className="h-72 w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Loading financial trends...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              No transactions recorded in this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => [formatCurrency(val), '']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Income" fill="#047857" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2-Column: Recent Transactions & Today's Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions matching Section 3 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
            <button
              onClick={() => navigate('/accounting')}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
            >
              <span>View Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Patient / Entity</th>
                  <th className="py-2.5 px-4">Service</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">
                      No recent transactions.
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((txn) => (
                    <tr key={txn._id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {new Date(txn.transactionDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {txn.patientId?.name || txn.description}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {txn.treatmentId?.serviceId?.name || (txn.type === 'Income' ? 'Service' : '—')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-medium ${
                            txn.type === 'Income'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {txn.type}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-semibold whitespace-nowrap ${
                          txn.type === 'Income' ? 'text-emerald-700' : 'text-slate-800'
                        }`}
                      >
                        {formatCurrency(txn.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Today's Appointments matching Section 24 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Today's Appointments</h3>
            <button
              onClick={() => navigate('/appointments')}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
            >
              <span>All Appointments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-64">
            {todayAppointments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No appointments scheduled for today.
              </div>
            ) : (
              todayAppointments.map((apt) => (
                <div key={apt._id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700">
                      {apt.time}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{apt.patientName}</p>
                      <p className="text-xs text-slate-500">
                        {apt.serviceName} • {apt.doctor}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      apt.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : apt.status === 'Cancelled'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {apt.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
