import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiSearch, FiTrash2, FiFilter } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

import Loader from "../components/layout/Loader.jsx";
import PaymentOptionModal from "../components/modals/PaymentOptionModal.jsx";
import Pagination from "../components/ui/Pagination.jsx";
import { usePaymentOptionStore } from "../stores/paymentOptionStore.js";
import { getUserRole } from "../app/auth.js";

const STATUS_STYLES = {
  active: "bg-[#00af00]/10 text-[#00af00]",
  inactive: "bg-gray-100 text-gray-700",
};

function normalizeStatus(value) {
  const raw = String(value ?? "")
    .toLowerCase()
    .trim();
  if (raw === "inactive") return "inactive";
  return "active";
}

function StatusPill({ value }) {
  const v = normalizeStatus(value);
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${STATUS_STYLES[v]}`}
    >
      {v === "inactive" ? "Inactive" : "Active"}
    </span>
  );
}

function PaymentCard({ payment, onEdit, selected, onSelect }) {
  return (
    <div
      className="
      rounded-xl border border-gray-200 
      bg-white
      p-4 flex items-start gap-4
      shadow-sm hover:shadow-md transition-all duration-300
      hover:-translate-y-0.5
    "
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect(payment._id)}
        className="
          mt-1 h-5 w-5 rounded border-gray-300 
          text-[#0c2bfc] focus:ring-[#0c2bfc]/20
        "
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-gray-900 truncate">
            {payment.name}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-gray-600">
            <svg
              className="w-4 h-4 text-[#0c2bfc]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="font-medium capitalize">
              {payment.paymentType}
              {payment.paymentType === "partial" && ` (${payment.amount}%)`}
            </span>
          </div>
        </div>
        <div className="mt-3">
          <StatusPill value={payment.isActive ? "active" : "inactive"} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onEdit(payment)}
        className="
          h-10 px-4 rounded-xl 
          border border-gray-200 
          bg-white
          hover:bg-gray-50
          text-sm font-medium inline-flex items-center gap-2
          transition-all duration-200
          hover:shadow-md hover:-translate-y-0.5
          active:translate-y-0
          text-gray-700 hover:text-[#0c2bfc]
        "
      >
        <FiEdit2 className="w-4 h-4" /> Edit
      </button>
    </div>
  );
}

export default function PaymentOptions() {
  const paymentOptions = usePaymentOptionStore((s) => s.paymentOptions);
  const fetchPaymentOptions = usePaymentOptionStore(
    (s) => s.fetchPaymentOptions,
  );
  const createPaymentOption = usePaymentOptionStore(
    (s) => s.createPaymentOption,
  );
  const updatePaymentOption = usePaymentOptionStore(
    (s) => s.updatePaymentOption,
  );
  const deleteMultiplePaymentOptions = usePaymentOptionStore(
    (s) => s.deleteMultiplePaymentOptions,
  );
  const loading = usePaymentOptionStore((s) => s.loading);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modal, setModal] = useState({
    open: false,
    mode: "add",
    payment: null,
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedPayments, setSelectedPayments] = useState([]);

  const role = getUserRole();
  const isAdmin = role === "admin" || role === "superadmin";

  useEffect(() => {
    fetchPaymentOptions().catch((err) =>
      toast.error(err.message || "Failed to fetch payment options"),
    );
  }, [fetchPaymentOptions]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return paymentOptions.filter((p) => {
      const st = p.isActive ? "active" : "inactive";
      if (statusFilter !== "all" && st !== statusFilter) return false;
      if (typeFilter !== "all" && p.paymentType !== typeFilter) return false;
      if (!s) return true;
      return (
        p.name?.toLowerCase().includes(s) ||
        p.paymentType?.toLowerCase().includes(s) ||
        st.includes(s)
      );
    });
  }, [paymentOptions, q, statusFilter, typeFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openAdd = () => setModal({ open: true, mode: "add", payment: null });
  const openEdit = (payment) => setModal({ open: true, mode: "edit", payment });
  const closeModal = () =>
    setModal({ open: false, mode: "add", payment: null });

  const savePaymentOption = async (payload) => {
    try {
      if (modal.mode === "add") {
        await createPaymentOption(payload);
        toast.success("Payment option created successfully");
      } else {
        await updatePaymentOption(payload._id, payload);
        toast.success("Payment option updated successfully");
      }
      closeModal();
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
  };

  const toggleSelectPayment = (id) => {
    setSelectedPayments((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedPayments.length === paged.length) setSelectedPayments([]);
    else setSelectedPayments(paged.map((p) => p._id));
  };

  const handleDeleteSelected = async () => {
    if (selectedPayments.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedPayments.length} payment option(s)?`,
      )
    )
      return;
    try {
      await deleteMultiplePaymentOptions(selectedPayments);
      toast.success(
        `${selectedPayments.length} payment option(s) deleted successfully`,
      );
      setSelectedPayments([]);
    } catch (err) {
      toast.error(err.message || "Failed to delete selected payment options");
    }
  };

  return (
    <div className="min-h-full flex flex-col gap-6">
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#1f2937",
            border: "1px solid #e5e7eb",
          },
        }}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xl font-bold text-gray-900">Payment Options</div>
          <div className="text-sm text-gray-600">
            Manage payment methods, types, and availability
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && selectedPayments.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={loading}
              className="
                h-11 px-5 rounded-xl 
                bg-[#0c2bfc] 
                hover:bg-[#0a24d6]
                text-white text-sm font-medium inline-flex items-center gap-2
                transition-all duration-200
                hover:shadow-lg hover:-translate-y-0.5
                active:translate-y-0
                disabled:opacity-70 disabled:cursor-not-allowed
              "
            >
              <FiTrash2 className="w-4 h-4" />
              Delete ({selectedPayments.length})
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={openAdd}
              className="
                h-11 px-5 rounded-xl 
                bg-[#0c2bfc] 
                hover:bg-[#0a24d6]
                text-white text-sm font-medium inline-flex items-center gap-2
                transition-all duration-200
                hover:shadow-lg hover:-translate-y-0.5
                active:translate-y-0
              "
            >
              <FiPlus className="w-4 h-4" /> Add Payment Option
            </button>
          )}
        </div>
      </div>

      {/* Search + Filter */}
      <div
        className="
        rounded-xl border border-gray-200 
        bg-white
        p-4 shadow-sm
      "
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <form onSubmit={(e) => e.preventDefault()}>
              <div
                className="
                flex items-center gap-2 rounded-xl 
                border border-gray-200 
                bg-white px-4 py-3
                focus-within:ring-2 focus-within:ring-[#0c2bfc]/20
                focus-within:border-[#0c2bfc] transition-all duration-200
              "
              >
                <FiSearch className="text-gray-400 shrink-0" />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  className="
                    w-full bg-transparent outline-none 
                    text-sm text-gray-800 placeholder-gray-400
                  "
                  placeholder="Search payment option name, type, status…"
                />
              </div>
            </form>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <span className="text-sm text-gray-600 font-medium">Filters</span>
            </div>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="
                h-11 rounded-xl border border-gray-200 
                bg-white px-4 text-sm outline-none 
                focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
                text-gray-700 font-medium
                transition-all duration-200
              "
            >
              <option value="all">All Types</option>
              <option value="full">Full Payment</option>
              <option value="partial">Partial Payment</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="
                h-11 rounded-xl border border-gray-200 
                bg-white px-4 text-sm outline-none 
                focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
                text-gray-700 font-medium
                transition-all duration-200
              "
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile list */}
      <div className="md:hidden space-y-3">
        {paged.map((p) => (
          <PaymentCard
            key={p._id}
            payment={p}
            onEdit={openEdit}
            selected={selectedPayments.includes(p._id)}
            onSelect={toggleSelectPayment}
          />
        ))}
        {paged.length === 0 && (
          <div
            className="
            rounded-xl border border-gray-200 
            bg-white
            px-6 py-12 text-center
          "
          >
            <div className="text-gray-300 mb-3">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="text-gray-700 font-medium">
              No payment options found
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Try adjusting your search or filters
            </div>
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div
        className="
        flex-1 min-h-0 hidden md:flex flex-col 
        bg-white
        border border-gray-200 rounded-xl 
        overflow-hidden shadow-sm
      "
      >
        <div
          className="
          px-6 py-4 border-b border-gray-200 
          flex items-center justify-between gap-3
          bg-gray-50
        "
        >
          <div className="flex items-center gap-3">
            {isAdmin && (
              <input
                type="checkbox"
                checked={
                  selectedPayments.length === paged.length && paged.length > 0
                }
                onChange={toggleSelectAll}
                className="
                  h-5 w-5 rounded border-gray-300 
                  text-[#0c2bfc] focus:ring-[#0c2bfc]/20
                "
              />
            )}
            <div className="text-sm font-semibold text-gray-900">
              Payment Options ({total})
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="
                  h-10 rounded-xl border border-gray-200 
                  bg-white px-3 text-sm outline-none 
                  focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
                  text-gray-700 font-medium
                "
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {isAdmin && (
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedPayments.length === paged.length &&
                        paged.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="h-5 w-5 rounded border-gray-300 text-[#0c2bfc] focus:ring-[#0c2bfc]/20"
                    />
                  </th>
                )}
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Name
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Payment Type
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Status
                </th>
                {isAdmin && (
                  <th className="text-right font-semibold text-gray-700 px-6 py-4">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {paged.map((p) => (
                <tr
                  key={p._id}
                  className="
                    border-b border-gray-100 last:border-b-0
                    hover:bg-gray-50
                    transition-colors duration-150
                  "
                >
                  {isAdmin && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedPayments.includes(p._id)}
                        onChange={() => toggleSelectPayment(p._id)}
                        className="
                          h-5 w-5 rounded border-gray-300 
                          text-[#0c2bfc] focus:ring-[#0c2bfc]/20
                        "
                      />
                    </td>
                  )}

                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{p.name}</div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700 font-medium capitalize">
                        {p.paymentType}
                        {p.paymentType === "partial" && ` (${p.amount}%)`}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <StatusPill value={p.isActive ? "active" : "inactive"} />
                  </td>

                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="
                          h-10 px-4 rounded-xl 
                          border border-gray-200 
                          bg-white
                          hover:bg-gray-50
                          text-sm font-medium inline-flex items-center gap-2
                          transition-all duration-200
                          hover:shadow-md hover:-translate-y-0.5
                          active:translate-y-0
                          text-gray-700 hover:text-[#0c2bfc]
                        "
                      >
                        <FiEdit2 className="w-4 h-4" /> Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {paged.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="px-6 py-16 text-center"
                  >
                    <div className="text-gray-300 mb-3">
                      <svg
                        className="w-16 h-16 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-gray-700 font-medium text-lg">
                      No payment options found
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Try adjusting your search criteria or add a new payment
                      option
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination using the enhanced component */}
      <Pagination
        page={page}
        totalPages={totalPages}
        setPage={setPage}
        total={total}
        pageSize={pageSize}
        color="blue"
      />

      {/* Modal */}
      {modal.open && (
        <PaymentOptionModal
          open={modal.open}
          mode={modal.mode}
          paymentOption={modal.payment}
          onClose={closeModal}
          onSave={savePaymentOption}
        />
      )}

      {/* Loader overlay */}
      {loading && (
        <div
          className="
          absolute inset-0 z-50 flex items-center justify-center 
          bg-white/90 backdrop-blur-sm
        "
        >
          <Loader
            size={60}
            variant="primary"
            showText={true}
            text="Loading payment options..."
          />
        </div>
      )}
    </div>
  );
}
