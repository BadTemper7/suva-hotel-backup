import { useEffect, useMemo, useState } from "react";
import {
  FiSearch,
  FiTrash2,
  FiCreditCard,
  FiList,
  FiTag,
  FiUpload,
  FiEye,
  FiEdit,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiPrinter,
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import Loader from "../components/layout/Loader.jsx";
import { useBillingStore } from "../stores/billingStore.js";
import { getUserRole } from "../app/auth.js";
import ReceiptUploadModal from "../components/modals/ReceiptUploadModal.jsx";
import ViewReceiptsModal from "../components/modals/ViewReceiptsModal.jsx";
import EditBillingModal from "../components/modals/EditBillingModal.jsx";
import Pagination from "../components/ui/Pagination.jsx";

const STATUS_STYLES = {
  unpaid: "bg-red-100 text-red-700",
  partial: "bg-[#0c2bfc]/10 text-[#0c2bfc]",
  paid: "bg-[#00af00]/10 text-[#00af00]",
  refunded: "bg-purple-100 text-purple-700",
  voided: "bg-gray-100 text-gray-700",
};

function normalizeStatus(value) {
  const raw = String(value ?? "")
    .toLowerCase()
    .trim();
  if (raw === "paid") return "paid";
  if (raw === "partial" || raw === "partially paid") return "partial";
  if (raw === "refunded") return "refunded";
  if (raw === "voided" || raw === "cancelled") return "voided";
  return "unpaid";
}

function StatusPill({ value }) {
  const v = normalizeStatus(value);
  const labels = {
    paid: "Paid",
    partial: "Partial",
    unpaid: "Unpaid",
    refunded: "Refunded",
    voided: "Voided",
  };

  const label = labels[v] || v.charAt(0).toUpperCase() + v.slice(1);

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${
        STATUS_STYLES[v] || STATUS_STYLES.unpaid
      }`}
    >
      {label}
    </span>
  );
}

// Helper function to check if a billing is recent (within last 24 hours)
function isRecentBilling(createdAt) {
  if (!createdAt) return false;
  const billingDate = new Date(createdAt);
  const now = new Date();
  const diffInHours = (now - billingDate) / (1000 * 60 * 60);
  return diffInHours <= 24;
}

function BillingCard({
  billing,
  onUpload,
  onView,
  onEdit,
  selected,
  onSelect,
}) {
  const guest = billing?.reservationId?.guestId;
  const guestName = guest ? `${guest.firstName} ${guest.lastName}` : "—";
  const isPaid = billing.status === "paid";
  const recent = isRecentBilling(billing.createdAt);

  const money = (n) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(n || 0);

  return (
    <div
      className={`
      rounded-xl border 
      bg-white
      p-4 flex items-start gap-4
      shadow-sm hover:shadow-md transition-all duration-300
      hover:-translate-y-0.5 relative
      ${recent ? "border-[#0c2bfc] bg-[#0c2bfc]/5" : "border-gray-200"}
    `}
    >
      {recent && (
        <div className="absolute -top-2 -left-2 bg-[#0c2bfc] text-white text-xs px-2 py-1 rounded-full shadow-lg animate-pulse">
          New
        </div>
      )}
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect(billing._id)}
        className="
          mt-1 h-5 w-5 rounded border-gray-300 
          text-[#0c2bfc] focus:ring-[#0c2bfc]/20
        "
      />

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="text-sm font-semibold text-gray-900 truncate">
            {billing.billingNumber}
          </div>
          <div className="text-xs text-gray-600 font-medium">
            {billing.reservationId?.reservationNumber}
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm font-medium text-gray-900">{guestName}</div>
          <div className="text-xs text-gray-600 mt-1">
            {guest?.contactNumber || "—"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="text-xs text-gray-500">Total</div>
            <div className="text-sm font-semibold text-gray-900">
              {money(billing.totalAmount)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Balance</div>
            <div className="text-sm font-semibold text-gray-900">
              {money(billing.balance)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Paid</div>
            <div className="text-sm font-semibold text-gray-900">
              {money(billing.amountPaid)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Due Now</div>
            <div className="text-sm font-semibold text-gray-900">
              {money(billing.amountDueNow)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <StatusPill value={billing.status} />
          <div className="text-xs text-gray-500">
            {new Date(billing.createdAt).toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onEdit(billing)}
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
          <FiEdit className="w-4 h-4" /> Edit
        </button>

        <button
          type="button"
          onClick={() => onView(billing)}
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
          <FiEye className="w-4 h-4" />
        </button>

        {isPaid ? (
          <span
            className="
            h-10 px-4 rounded-xl 
            border border-gray-200 
            bg-[#00af00]/10
            text-sm font-medium inline-flex items-center justify-center gap-2
            text-[#00af00]
          "
          >
            <FiUpload className="w-4 h-4" />
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onUpload(billing)}
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
            <FiUpload className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            const billingStore = useBillingStore.getState();
            billingStore
              .printReceipt(billing._id)
              .catch((err) =>
                toast.error(err.message || "Failed to print receipt"),
              );
          }}
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
          title="Print Receipt"
        >
          <FiPrinter className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function Billing() {
  const navigate = useNavigate();

  const billingState = useBillingStore((s) => s.billings);
  const billings = Array.isArray(billingState)
    ? billingState
    : billingState?.billings || [];

  const fetchBillings = useBillingStore((s) => s.fetchBillings);
  const deleteMultipleBillings = useBillingStore(
    (s) => s.deleteMultipleBillings,
  );
  const updateBilling = useBillingStore((s) => s.updateBilling);
  const loading = useBillingStore((s) => s.loading);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [uploadModal, setUploadModal] = useState({
    open: false,
    billing: null,
  });
  const [viewReceiptsModal, setViewReceiptsModal] = useState({
    open: false,
    billing: null,
  });
  const [editModal, setEditModal] = useState({
    open: false,
    billing: null,
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedBillings, setSelectedBillings] = useState([]);

  const role = getUserRole();
  const isAdmin = role === "admin" || role === "superadmin";

  useEffect(() => {
    fetchBillings().catch((err) =>
      toast.error(err.message || "Failed to fetch billings"),
    );
  }, [fetchBillings]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return billings.filter((b) => {
      const st = normalizeStatus(b.status);
      if (statusFilter !== "all" && st !== statusFilter) return false;
      if (!s) return true;

      const guest = b?.reservationId?.guestId;
      const guestName = `${guest?.firstName || ""} ${
        guest?.lastName || ""
      }`.toLowerCase();
      const contact = String(guest?.contactNumber || "").toLowerCase();
      const resNum = String(
        b?.reservationId?.reservationNumber || "",
      ).toLowerCase();

      const billNum = String(b?.billingNumber || "").toLowerCase();
      return (
        guestName.includes(s) ||
        contact.includes(s) ||
        resNum.includes(s) ||
        billNum.includes(s) ||
        st.includes(s)
      );
    });
  }, [billings, q, statusFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Keep selection valid when filters change
  useEffect(() => {
    const visible = new Set(filtered.map((b) => b._id));
    setSelectedBillings((prev) => prev.filter((id) => visible.has(id)));
  }, [filtered]);

  const openUploadModal = (billing) => setUploadModal({ open: true, billing });
  const closeUploadModal = () => setUploadModal({ open: false, billing: null });

  const openViewReceiptsModal = (billing) =>
    setViewReceiptsModal({ open: true, billing });
  const closeViewReceiptsModal = () =>
    setViewReceiptsModal({ open: false, billing: null });

  const openEditModal = (billing) => setEditModal({ open: true, billing });
  const closeEditModal = () => setEditModal({ open: false, billing: null });

  const handleEditBilling = async (billingId, payload) => {
    try {
      await updateBilling(billingId, payload);
      toast.success("Billing updated successfully");
      closeEditModal();
    } catch (err) {
      toast.error(err.message || "Failed to update billing");
    }
  };

  const handleReceiptSuccess = async () => {
    try {
      await fetchBillings();
      toast.success("Receipt uploaded successfully");
      closeUploadModal();
    } catch (err) {
      toast.error(err.message || "Failed to refresh billing data");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedBillings.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedBillings.length} billing record(s)?`,
      )
    )
      return;

    try {
      await deleteMultipleBillings(selectedBillings);
      toast.success(
        `${selectedBillings.length} billing record(s) deleted successfully`,
      );
      setSelectedBillings([]);
    } catch (err) {
      toast.error(err.message || "Failed to delete selected billings");
    }
  };

  const toggleSelectBilling = (id) => {
    setSelectedBillings((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedBillings.length === paged.length) setSelectedBillings([]);
    else setSelectedBillings(paged.map((b) => b._id));
  };

  const money = (n) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(n || 0);

  return (
    <div className="h-full min-h-0 flex flex-col gap-6">
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
          <div className="text-xl font-bold text-gray-900">
            Billing Management
          </div>
          <div className="text-sm text-gray-600">
            Manage billing records, upload receipts, and track payments
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && selectedBillings.length > 0 && (
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
              Delete ({selectedBillings.length})
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/payment-options")}
              className="
                h-11 px-5 rounded-xl 
                border border-gray-200 
                bg-white
                hover:bg-gray-50
                text-sm font-medium inline-flex items-center gap-2
                transition-all duration-200
                hover:shadow-md hover:-translate-y-0.5
                active:translate-y-0
                text-gray-700 hover:text-[#0c2bfc]
              "
              title="Go to Payment Options"
            >
              <FiCreditCard />
              Payment Options
            </button>

            <button
              type="button"
              onClick={() => navigate("/payment-types")}
              className="
                h-11 px-5 rounded-xl 
                border border-gray-200 
                bg-white
                hover:bg-gray-50
                text-sm font-medium inline-flex items-center gap-2
                transition-all duration-200
                hover:shadow-md hover:-translate-y-0.5
                active:translate-y-0
                text-gray-700 hover:text-[#0c2bfc]
              "
              title="Go to Payment Types"
            >
              <FiList />
              Payment Types
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate("/discount-types")}
                className="
                  h-11 px-5 rounded-xl 
                  bg-[#0c2bfc] 
                  hover:bg-[#0a24d6]
                  text-white text-sm font-medium inline-flex items-center gap-2
                  transition-all duration-200
                  hover:shadow-lg hover:-translate-y-0.5
                  active:translate-y-0
                "
                title="Go to Discount Types"
              >
                <FiTag />
                Discount Types
              </button>
            )}
          </div>
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
                  placeholder="Search guest name, contact, reservation id, status…"
                />
              </div>
            </form>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <span className="text-sm text-gray-600 font-medium">Status</span>
            </div>
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
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
              <option value="voided">Voided</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile list */}
      <div className="md:hidden space-y-3">
        {paged.map((b) => (
          <BillingCard
            key={b._id}
            billing={b}
            onUpload={openUploadModal}
            onView={openViewReceiptsModal}
            onEdit={openEditModal}
            selected={selectedBillings.includes(b._id)}
            onSelect={toggleSelectBilling}
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
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="text-gray-700 font-medium">
              No billing records found
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
                  selectedBillings.length === paged.length && paged.length > 0
                }
                onChange={toggleSelectAll}
                className="
                  h-5 w-5 rounded border-gray-300 
                  text-[#0c2bfc] focus:ring-[#0c2bfc]/20
                "
              />
            )}
            <div className="text-sm font-semibold text-gray-900">
              Billing Records ({total})
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
                        selectedBillings.length === paged.length &&
                        paged.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="h-5 w-5 rounded border-gray-300 text-[#0c2bfc] focus:ring-[#0c2bfc]/20"
                    />
                  </th>
                )}
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Billing #
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Reservation #
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Guest
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Contact
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Total
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Paid
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Balance
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Status
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Due Now
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Created
                </th>
                {isAdmin && (
                  <th className="text-right font-semibold text-gray-700 px-6 py-4">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {paged.map((b) => {
                const guest = b?.reservationId?.guestId;
                const guestName = guest
                  ? `${guest.firstName} ${guest.lastName}`
                  : "—";
                const isPaid = b.status === "paid";
                const recent = isRecentBilling(b.createdAt);

                return (
                  <tr
                    key={b._id}
                    className={`
                    border-b border-gray-100 last:border-b-0
                    hover:bg-gray-50
                    transition-colors duration-150
                    ${recent ? "bg-[#0c2bfc]/5" : ""}
                  `}
                  >
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedBillings.includes(b._id)}
                          onChange={() => toggleSelectBilling(b._id)}
                          className="
                            h-5 w-5 rounded border-gray-300 
                            text-[#0c2bfc] focus:ring-[#0c2bfc]/20
                          "
                        />
                      </td>
                    )}

                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        {b.billingNumber}
                        {recent && (
                          <span className="bg-[#0c2bfc] text-white text-xs px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                            New
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-gray-700 font-medium">
                        {b.reservationId?.reservationNumber}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {guestName}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-gray-700">
                        {guest?.contactNumber || "—"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {money(b.totalAmount)}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-gray-700 font-medium">
                        {money(b.amountPaid)}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-gray-700 font-medium">
                        {money(b.balance)}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusPill value={b.status} />
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-gray-700 font-medium">
                        {money(b.amountDueNow)}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500">
                        {new Date(b.createdAt).toLocaleDateString("en-PH", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </td>

                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(b)}
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
                            <FiEdit className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openViewReceiptsModal(b)}
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
                            <FiEye className="w-4 h-4" />
                          </button>

                          {isPaid ? (
                            <span
                              className="
                              h-10 px-4 rounded-xl 
                              border border-gray-200 
                              bg-[#00af00]/10
                              text-sm font-medium inline-flex items-center justify-center gap-2
                              text-[#00af00] cursor-not-allowed
                            "
                            >
                              <FiUpload className="w-4 h-4" />
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openUploadModal(b)}
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
                              <FiUpload className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const billingStore = useBillingStore.getState();
                              billingStore
                                .printReceipt(b._id)
                                .catch((err) =>
                                  toast.error(
                                    err.message || "Failed to print receipt",
                                  ),
                                );
                            }}
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
                            title="Print Receipt"
                          >
                            <FiPrinter className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}

              {paged.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 12 : 11}
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
                          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="text-gray-700 font-medium text-lg">
                      No billing records found
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Try adjusting your search criteria
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        setPage={setPage}
        total={total}
        pageSize={pageSize}
        color="blue"
      />

      {/* Receipt Upload Modal */}
      {uploadModal.open && (
        <ReceiptUploadModal
          open={uploadModal.open}
          onClose={closeUploadModal}
          billing={uploadModal.billing}
          onSuccess={handleReceiptSuccess}
        />
      )}

      {/* View Receipts Modal */}
      {viewReceiptsModal.open && (
        <ViewReceiptsModal
          open={viewReceiptsModal.open}
          onClose={closeViewReceiptsModal}
          billing={viewReceiptsModal.billing}
          
        />
      )}

      {/* Edit Billing Modal */}
      {editModal.open && (
        <EditBillingModal
          open={editModal.open}
          onClose={closeEditModal}
          billing={editModal.billing}
          onSave={handleEditBilling}
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
            text="Loading billing records..."
          />
        </div>
      )}
    </div>
  );
}
