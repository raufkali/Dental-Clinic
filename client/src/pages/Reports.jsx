import React, { useState, useEffect } from 'react';
import { Printer, Download, FileText, Calendar, Filter } from 'lucide-react';
import { reportsAPI, patientsAPI } from '../services/api';
import { useClinic } from '../context/ClinicContext';

const Reports = () => {
  const { formatCurrency, showToast } = useClinic();
  const [activeTab, setActiveTab] = useState('daily'); // 'daily', 'monthly', 'services', 'patient'
  const [loading, setLoading] = useState(false);

  // Daily/Monthly params
  const [reportDate, setReportDate] = useState('2026-09-11');
  const [financialData, setFinancialData] = useState(null);

  // Service revenue report
  const [serviceRevenue, setServiceRevenue] = useState([]);

  // Patient statement
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientStatement, setPatientStatement] = useState(null);

  useEffect(() => {
    if (activeTab === 'daily') {
      loadDailyReport();
    } else if (activeTab === 'monthly') {
      loadMonthlyReport();
    } else if (activeTab === 'services') {
      loadServiceRevenue();
    } else if (activeTab === 'patient') {
      loadPatientsList();
    }
  }, [activeTab, reportDate]);

  const loadDailyReport = async () => {
    try {
      setLoading(true);
      const res = await reportsAPI.getFinancial({ startDate: reportDate, endDate: reportDate });
      if (res.success) setFinancialData(res.data);
    } catch (err) {
      showToast('Failed to load daily report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyReport = async () => {
    try {
      setLoading(true);
      const d = new Date(reportDate);
      const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
      const res = await reportsAPI.getFinancial({ startDate: start, endDate: end });
      if (res.success) setFinancialData(res.data);
    } catch (err) {
      showToast('Failed to load monthly report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadServiceRevenue = async () => {
    try {
      setLoading(true);
      const res = await reportsAPI.getServices();
      if (res.success) setServiceRevenue(res.data);
    } catch (err) {
      showToast('Failed to load service revenue report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPatientsList = async () => {
    try {
      const res = await patientsAPI.getAll({});
      if (res.success) {
        setPatients(res.data);
        if (res.data.length > 0 && !selectedPatientId) {
          setSelectedPatientId(res.data[0]._id);
          loadPatientStatementData(res.data[0]._id);
        }
      }
    } catch (err) {
      showToast('Failed to load patients', 'error');
    }
  };

  const loadPatientStatementData = async (pId) => {
    try {
      setLoading(true);
      const res = await reportsAPI.getPatientStatement(pId);
      if (res.success) setPatientStatement(res.data);
    } catch (err) {
      showToast('Failed to load patient statement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial & Clinical Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-ready practice revenue, daily balances, service breakdowns, and patient statements
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-lg btn-emerald text-sm font-semibold shadow-2xs self-start md:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Report Type Tabs */}
      <div className="flex rounded-xl bg-white border border-slate-200 p-1 shadow-2xs max-w-2xl">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'daily' ? 'btn-emerald' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Daily Report
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'monthly' ? 'btn-emerald' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Monthly Report
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'services' ? 'btn-emerald' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Service Revenue
        </button>
        <button
          onClick={() => setActiveTab('patient')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'patient' ? 'btn-emerald' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Patient Statement
        </button>
      </div>

      {/* Date filter for daily/monthly */}
      {(activeTab === 'daily' || activeTab === 'monthly') && (
        <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs max-w-xs">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Select Date / Month:</span>
          <input
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            className="text-xs border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>
      )}

      {/* Patient Statement Selector */}
      {activeTab === 'patient' && (
        <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs max-w-md">
          <span className="text-xs font-semibold text-slate-600 shrink-0">Select Patient:</span>
          <select
            value={selectedPatientId}
            onChange={(e) => {
              setSelectedPatientId(e.target.value);
              loadPatientStatementData(e.target.value);
            }}
            className="w-full text-xs border border-slate-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            {patients.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.patientId}) - {p.phone}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* TAB 1 & 2: Daily & Monthly Reports */}
      {(activeTab === 'daily' || activeTab === 'monthly') && financialData && (
        <div className="space-y-6 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Total Income</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">
                {formatCurrency(financialData.summary?.totalIncome)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Total Expenses</p>
              <p className="text-xl font-bold text-rose-700 mt-1">
                {formatCurrency(financialData.summary?.totalExpenses)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Net Profit / Balance</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {formatCurrency(financialData.summary?.netIncome)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 font-medium">Transactions Count</p>
              <p className="text-xl font-bold text-slate-800 mt-1">
                {financialData.summary?.transactionCount || 0}
              </p>
            </div>
          </div>

          {/* Breakdown by Category */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Breakdown by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(financialData.categoryBreakdown || {}).map(([cat, info]) => (
                <div key={cat} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium block truncate">{cat}</span>
                  <span
                    className={`text-sm font-bold block mt-0.5 ${
                      info.type === 'Income' ? 'text-emerald-700' : 'text-slate-800'
                    }`}
                  >
                    {formatCurrency(info.amount)}
                  </span>
                  <span className="text-slate-400 text-2xs mt-0.5 block">{info.count} transactions</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ledger table for this report */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Transaction Details</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4">Patient</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Method</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(financialData.transactions || []).map((txn) => (
                    <tr key={txn._id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                        {new Date(txn.transactionDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">{txn.description}</td>
                      <td className="py-2.5 px-4 text-slate-600">{txn.patientId?.name || '—'}</td>
                      <td className="py-2.5 px-4 text-slate-600">{txn.category}</td>
                      <td className="py-2.5 px-4 text-slate-600">{txn.paymentMethod}</td>
                      <td
                        className={`py-2.5 px-4 text-right font-semibold ${
                          txn.type === 'Income' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {formatCurrency(txn.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Service Revenue Report */}
      {activeTab === 'services' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="py-3 px-6">Service</th>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6 text-center">Cases</th>
                  <th className="py-3 px-6 text-right">Total Contract Value</th>
                  <th className="py-3 px-6 text-right">Revenue Collected</th>
                  <th className="py-3 px-6 text-right">Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {serviceRevenue.map((item) => (
                  <tr key={item.serviceId} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-6 font-medium text-slate-900">{item.serviceName}</td>
                    <td className="py-3.5 px-6 text-slate-600 text-xs">{item.type}</td>
                    <td className="py-3.5 px-6 text-center font-semibold text-slate-700">
                      {item.casesCount}
                    </td>
                    <td className="py-3.5 px-6 text-right font-medium text-slate-800">
                      {formatCurrency(item.totalContractValue)}
                    </td>
                    <td className="py-3.5 px-6 text-right font-bold text-emerald-700">
                      {formatCurrency(item.totalRevenue)}
                    </td>
                    <td className="py-3.5 px-6 text-right font-semibold text-slate-900">
                      {formatCurrency(item.outstanding)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Patient Statement */}
      {activeTab === 'patient' && patientStatement && (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex justify-between items-start pb-6 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {patientStatement.patient?.name}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Patient ID: {patientStatement.patient?.patientId} • Phone: {patientStatement.patient?.phone}
              </p>
              <p className="text-xs text-slate-500">{patientStatement.patient?.address}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs text-slate-400 font-medium">Financial Statement</p>
              <p className="text-xs text-slate-500">
                Generated: {new Date().toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>

          {/* Statement Stat Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">Total Contracted</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {formatCurrency(patientStatement.totalContracted)}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">Total Paid</p>
              <p className="text-xl font-bold text-emerald-700 mt-1">
                {formatCurrency(patientStatement.totalPaid)}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">Remaining Balance</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {formatCurrency(patientStatement.remainingBalance)}
              </p>
            </div>
          </div>

          {/* Payment History */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3">Payment Ledger</h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Receipt #</th>
                    <th className="py-2.5 px-4">Treatment</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Method</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(patientStatement.payments || []).map((p) => (
                    <tr key={p._id} className={p.isVoid ? 'opacity-40 line-through' : ''}>
                      <td className="py-2.5 px-4 text-slate-600">
                        {new Date(p.paymentDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-700">
                        {p.paymentId}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900">
                        {p.treatmentId?.serviceId?.name || 'Treatment'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{p.paymentType}</td>
                      <td className="py-2.5 px-4 text-slate-600">{p.paymentMethod}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-700">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
