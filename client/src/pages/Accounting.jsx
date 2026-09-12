import React, { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Ban,
  AlertTriangle,
  X
} from "lucide-react";
import { transactionsAPI } from "../services/api";
import AddTransactionModal from "../components/AddTransactionModal";
import EditTransactionModal from "../components/EditTransactionModal";
import ViewTransactionModal from "../components/ViewTransactionModal";
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
  const [includeVoid, setIncludeVoid] = useState(false);
  // Default date filter to dynamic Today
  const [startDate, setStartDate] = useState(() => getLocalDateStr());
  const [endDate, setEndDate] = useState(() => getLocalDateStr());
  const [loading, setLoading] = useState(true);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [voidModalOpen, setVoidModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [voidReason, setVoidReason] = useState("Incorrect entry / cancelled");
  const [processingAction, setProcessingAction] = useState(false);

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
        includeVoid: includeVoid ? "true" : "false",
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
  }, [searchTerm, typeFilter, methodFilter, startDate, endDate, includeVoid]);

  const handleOpenView = (txn) => {
    setSelectedTxn(txn);
    setViewModalOpen(true);
  };

  const handleOpenEdit = (txn) => {
    setSelectedTxn(txn);
    setViewModalOpen(false);
    setEditModalOpen(true);
  };

  const handleOpenVoid = (txn) => {
    setSelectedTxn(txn);
    setVoidReason(txn.isVoid ? "" : "Incorrect entry / duplicate transaction");
    setViewModalOpen(false);
    setVoidModalOpen(true);
  };

  const handleOpenDelete = (txn) => {
    setSelectedTxn(txn);
    setViewModalOpen(false);
    setDeleteModalOpen(true);
  };

  const handleConfirmVoid = async (e) => {
    e.preventDefault();
    if (!selectedTxn) return;
    try {
      setProcessingAction(true);
      const res = await transactionsAPI.void(selectedTxn._id, voidReason);
      if (res.success) {
        showToast(res.message || "Transaction void status updated", "success");
        setVoidModalOpen(false);
        setSelectedTxn(null);
        await loadTransactions();
      }
    } catch (err) {
      showToast(err.message || "Failed to update void status", "error");
    } finally {
      setProcessingAction(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedTxn) return;
    try {
      setProcessingAction(true);
      const res = await transactionsAPI.delete(selectedTxn._id);
      if (res.success) {
        showToast("Transaction permanently deleted", "success");
        setDeleteModalOpen(false);
        setSelectedTxn(null);
        await loadTransactions();
      }
    } catch (err) {
      showToast(err.message || "Failed to delete transaction", "error");
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Accounting
        </h1>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg btn-emerald text-sm font-semibold shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Transaction</span>
        </button>
      </div>

      {/* Dynamic Filter Labels */}
      {(() => {
        const todayStr = getLocalDateStr();
        const monthStartStr = `${todayStr.substring(0, 7)}-01`;
        const isTodayFilter = startDate === todayStr && endDate === todayStr;
        const isMonthFilter = startDate === monthStartStr && endDate === todayStr;
        const isAllFilter = !startDate && !endDate;

        let periodLabel = 'Period';
        if (isTodayFilter) periodLabel = "Today's";
        else if (isMonthFilter) periodLabel = 'Monthly';
        else if (isAllFilter) periodLabel = 'Total';

        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Income Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <p className="text-xs font-semibold text-slate-500">
                {periodLabel} Income:
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(summary.totalIncome)}
              </p>
            </div>

            {/* Expenses Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <p className="text-xs font-semibold text-slate-500">
                {periodLabel} Expenses:
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(summary.totalExpense)}
              </p>
            </div>

            {/* Net Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <p className="text-xs font-semibold text-slate-500">
                {periodLabel === "Today's" ? 'Net:' : `${periodLabel} Net:`}
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(summary.netBalance)}
              </p>
            </div>
          </div>
        );
      })()}

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

        {/* Include Void Toggle */}
        <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeVoid}
            onChange={(e) => setIncludeVoid(e.target.checked)}
            className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
          />
          <span>Show Voided</span>
        </label>
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
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    Loading transactions ledger...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
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

                  const isSettled = txn.treatmentId?.status === 'Settled' || txn.treatmentId?.status === 'Completed';

                  return (
                    <tr
                      key={txn._id}
                      className={`transition-colors ${
                        txn.isVoid
                          ? "opacity-50 bg-slate-50/50"
                          : isSettled
                          ? "opacity-75 bg-slate-50/30 hover:opacity-100 hover:bg-slate-50/70"
                          : "hover:bg-slate-50/60"
                      }`}
                    >
                      <td className="py-4 px-6 text-slate-700 whitespace-nowrap">
                        {dateLabel}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className={txn.isVoid ? "line-through text-slate-500" : ""}>
                            {txn.description}
                          </span>
                          {txn.isVoid && (
                            <span className="px-2 py-0.5 rounded text-2xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              VOID
                            </span>
                          )}
                        </div>
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
                          txn.isVoid
                            ? "line-through text-slate-400"
                            : txn.type === "Income"
                            ? "text-emerald-700 font-semibold"
                            : "text-slate-900 font-semibold"
                        }`}
                      >
                        {formatCurrency(txn.amount)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View button */}
                          <button
                            onClick={() => handleOpenView(txn)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="View Transaction Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEdit(txn)}
                            className="p-1.5 rounded-md text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Edit Transaction"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Void / Unvoid button */}
                          <button
                            onClick={() => handleOpenVoid(txn)}
                            className={`p-1.5 rounded-md transition-colors ${
                              txn.isVoid
                                ? "text-blue-700 hover:bg-blue-50"
                                : "text-amber-700 hover:bg-amber-50"
                            }`}
                            title={txn.isVoid ? "Unvoid Transaction" : "Void Transaction"}
                          >
                            <Ban className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleOpenDelete(txn)}
                            className="p-1.5 rounded-md text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={loadTransactions}
      />

      {/* View Transaction Modal */}
      <ViewTransactionModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        transaction={selectedTxn}
        onEdit={handleOpenEdit}
        onVoid={handleOpenVoid}
        onDelete={handleOpenDelete}
      />

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        transaction={selectedTxn}
        onSuccess={loadTransactions}
      />

      {/* Void Confirmation Modal */}
      {voidModalOpen && selectedTxn && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${selectedTxn.isVoid ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {selectedTxn.isVoid ? "Unvoid Transaction" : "Void Transaction"}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedTxn.transactionId}</p>
                </div>
              </div>
              <button
                onClick={() => setVoidModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmVoid} className="space-y-4">
              <p className="text-xs text-slate-600">
                {selectedTxn.isVoid
                  ? "Are you sure you want to restore this transaction to active status? It will be re-included in financial ledger totals."
                  : "Voiding will exclude this transaction from daily income/expense totals without permanently deleting it from audit history."}
              </p>

              {!selectedTxn.isVoid && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason for Voiding *
                  </label>
                  <input
                    type="text"
                    required
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder="e.g. Duplicate entry, patient paid via different method..."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-800"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVoidModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className={`px-5 py-2 text-sm font-semibold rounded-lg text-white transition-all shadow-sm ${
                    selectedTxn.isVoid
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {processingAction
                    ? "Processing..."
                    : selectedTxn.isVoid
                    ? "Confirm Unvoid"
                    : "Confirm Void"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedTxn && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 rounded-lg text-rose-700">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Delete Transaction</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedTxn.transactionId}</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p>
                Are you sure you want to permanently delete this <strong>{selectedTxn.type}</strong> transaction of{" "}
                <strong className="text-slate-900">{formatCurrency(selectedTxn.amount)}</strong>?
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="font-semibold text-slate-800">{selectedTxn.description}</p>
                <p className="text-slate-500 mt-0.5">
                  Category: {selectedTxn.category} | Method: {selectedTxn.paymentMethod}
                </p>
              </div>
              <p className="text-rose-600 font-semibold">
                Warning: This action is permanent and cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingAction}
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
              >
                {processingAction ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounting;
