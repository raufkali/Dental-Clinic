import React, { useState, useEffect } from "react";
import { Search, Calendar, Plus } from "lucide-react";
import { transactionsAPI } from "../services/api";
import AddTransactionModal from "../components/AddTransactionModal";
import { useClinic } from "../context/ClinicContext";

const getLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const Accounting = () => {
  const { formatCurrency, showToast } = useClinic();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
    todayIncome: 0,
    todayExpenses: 0,
    todayNet: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  // Default date filter to dynamic Today (e.g. current calendar day)
  const [startDate, setStartDate] = useState(() => getLocalDateStr());
  const [endDate, setEndDate] = useState(() => getLocalDateStr());
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const todayStr = getLocalDateStr();
      const res = await transactionsAPI.getAll({
        q: searchTerm,
        type: typeFilter !== "All" ? typeFilter : undefined,
        paymentMethod: methodFilter !== "All" ? methodFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        today: todayStr,
      });
      if (res.success) {
        setTransactions(res.data);
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err) {
      showToast("Failed to load accounting ledger", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [searchTerm, typeFilter, methodFilter, startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
        Accounting
      </h1>

      {/* Top 3 Stat Cards matching Screenshot 4 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Today's Income Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">
            Today's Income:
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(summary.todayIncome)}
          </p>
        </div>

        {/* Today's Expenses Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">
            Today's Expenses:
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(summary.todayExpenses)}
          </p>
        </div>

        {/* Net Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Net:</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {formatCurrency(summary.todayNet)}
          </p>
        </div>
      </div>

      {/* Filter Bar matching Screenshot 4 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search transactions input */}
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search transactions"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-800 placeholder-slate-400 shadow-2xs"
            />
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-2xs">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border-none bg-transparent text-xs text-slate-700 focus:outline-none"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border-none bg-transparent text-xs text-slate-700 focus:outline-none"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs text-slate-400 hover:text-slate-600 ml-1"
                title="Clear date filter"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Date Shortcuts */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs text-xs">
            <button
              onClick={() => {
                const t = getLocalDateStr();
                setStartDate(t);
                setEndDate(t);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                startDate === getLocalDateStr() && endDate === getLocalDateStr()
                  ? "bg-emerald-50 text-emerald-800 font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                const t = getLocalDateStr();
                setStartDate(`${t.substring(0, 7)}-01`);
                setEndDate(t);
              }}
              className="px-2.5 py-1 rounded-md font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Month
            </button>
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                !startDate && !endDate
                  ? "bg-emerald-50 text-emerald-800 font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              All
            </button>
          </div>

          {/* Type Filter Dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
          >
            <option value="All">Type filter: All</option>
            <option value="Income">Income only</option>
            <option value="Expense">Expense only</option>
          </select>

          {/* Payment Method Dropdown */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
          >
            <option value="All">Payment method: All</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card">Card</option>
          </select>
        </div>

        {/* Primary Action Button matching Screenshot 4 */}
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg btn-emerald text-sm font-semibold shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Transaction</span>
        </button>
      </div>

      {/* Transactions Ledger Table matching Screenshot 4 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Description</th>
                <th className="py-3.5 px-6">Patient</th>
                <th className="py-3.5 px-6">Service</th>
                <th className="py-3.5 px-6 text-center">Type</th>
                <th className="py-3.5 px-6">Payment Method</th>
                <th className="py-3.5 px-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Loading transactions ledger...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No transactions found for the selected period.
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const dateLabel = new Date(
                    txn.transactionDate,
                  ).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  });

                  return (
                    <tr
                      key={txn._id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-4 px-6 text-slate-700 whitespace-nowrap">
                        {dateLabel}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-900">
                        {txn.description}
                      </td>
                      <td className="py-4 px-6 text-slate-700">
                        {txn.patientName || txn.patientId?.name || "—"}
                      </td>
                      <td className="py-4 px-6 text-slate-700">
                        {txn.treatmentId?.serviceId?.name ||
                          (txn.type === "Income" ? "Service" : "—")}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-block px-3 py-0.5 rounded-full text-xs font-medium ${
                            txn.type === "Income"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : "bg-rose-50 text-rose-700 border border-rose-200/60"
                          }`}
                        >
                          {txn.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-700">
                        {txn.paymentMethod || "Cash"}
                      </td>
                      <td
                        className={`py-4 px-6 text-right font-medium whitespace-nowrap ${
                          txn.type === "Income"
                            ? "text-emerald-700"
                            : "text-slate-900"
                        }`}
                      >
                        {formatCurrency(txn.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer matching "Total total" row in Screenshot 4 */}
            {transactions.length > 0 && (
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50/70 font-semibold text-sm text-slate-800">
                  <td className="py-4 px-6" colSpan={4}>
                    Total total
                  </td>
                  <td className="py-4 px-6 text-center text-emerald-700">
                    {formatCurrency(summary.totalIncome)}
                  </td>
                  <td className="py-4 px-6 text-center text-rose-700">
                    {formatCurrency(summary.totalExpense)}
                  </td>
                  <td className="py-4 px-6 text-right text-slate-900 font-bold">
                    {formatCurrency(summary.netBalance)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadTransactions}
      />
    </div>
  );
};

export default Accounting;
