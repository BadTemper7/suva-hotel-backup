import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiEdit2,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiTrash2,
  FiEye,
  FiFilter,
  FiCalendar,
  FiUser,
  FiPhone,
  FiCreditCard,
  FiClock,
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

import Loader from "../components/layout/Loader.jsx";
import ReservationStatusModal from "../components/modals/ReservationStatusModal.jsx";
import { useReservationStore } from "../stores/reservationStore.js";
import { getUserRole } from "../app/auth.js";
import { Helmet } from "react-helmet";
import Pagination from "../components/ui/Pagination.jsx";

const STATUS_STYLES = {
  pending: "bg-[#0c2bfc]/10 text-[#0c2bfc]",
  confirmed: "bg-[#00af00]/10 text-[#00af00]",
  checked_in: "bg-blue-100 text-blue-700",
  checked_out: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-700",
  no_show: "bg-orange-100 text-orange-700",
};

function normalizeStatus(v) {
  const s = String(v || "")
    .toLowerCase()
    .trim();
  if (
    [
      "pending",
      "confirmed",
      "checked_in",
      "checked_out",
      "cancelled",
      "expired",
      "no_show",
    ].includes(s)
  )
    return s;
  return "pending";
}

function StatusPill({ value }) {
  const v = normalizeStatus(value);
  const label =
    v === "checked_in"
      ? "Checked In"
      : v === "checked_out"
        ? "Checked Out"
        : v === "no_show"
          ? "No Show"
          : v.charAt(0).toUpperCase() + v.slice(1);

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${STATUS_STYLES[v]}`}
    >
      {label}
    </span>
  );
}

function ReservationCard({
  reservation,
  onEdit,
  onView,
  onDelete,
  selected,
  onSelect,
}) {
  const guestName =
    `${reservation?.guestId?.firstName || ""} ${
      reservation?.guestId?.lastName || ""
    }`.trim() || "—";
  const contact = reservation?.guestId?.contactNumber || "—";
  const assistedByName = reservation?.userId
    ? `${reservation?.userId?.firstName || ""} ${reservation?.userId?.lastName || ""}`
    : "—";

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
        onChange={() => onSelect(reservation._id)}
        className="
          mt-1 h-5 w-5 rounded border-gray-300 
          text-[#0c2bfc] focus:ring-[#0c2bfc]/20
        "
      />

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="text-sm font-semibold text-gray-900 truncate">
            #{reservation.reservationNumber}
          </div>
          <div className="text-xs text-gray-600 font-medium">
            Assisted by: {assistedByName}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <FiUser className="w-4 h-4 text-[#0c2bfc]" />
            <div className="text-sm font-medium text-gray-900">{guestName}</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <FiPhone className="w-3 h-3 text-[#00af00]" />
            <span>{contact}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <FiCalendar className="w-3 h-3 text-[#0c2bfc]" />
              <div className="text-xs text-gray-500">Check-in</div>
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {new Date(reservation.checkIn).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <FiCalendar className="w-3 h-3 text-[#0c2bfc]" />
              <div className="text-xs text-gray-500">Check-out</div>
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {new Date(reservation.checkOut).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <FiCreditCard className="w-3 h-3 text-[#00af00]" />
              <div className="text-xs text-gray-500">Payment</div>
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {reservation.paymentOption?.name || "—"}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <FiClock className="w-3 h-3 text-[#0c2bfc]" />
              <div className="text-xs text-gray-500">Status</div>
            </div>
            <StatusPill value={reservation.status} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onEdit(reservation)}
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

        <button
          type="button"
          onClick={() => onView(reservation)}
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
          <FiEye className="w-4 h-4" /> View
        </button>

        <button
          type="button"
          onClick={() => onDelete(reservation)}
          className="
            h-10 px-4 rounded-xl 
            border border-gray-200 
            bg-white
            hover:bg-gray-50
            text-sm font-medium inline-flex items-center gap-2
            transition-all duration-200
            hover:shadow-md hover:-translate-y-0.5
            active:translate-y-0
            text-red-600 hover:text-red-700
          "
        >
          <FiTrash2 className="w-4 h-4" /> Delete
        </button>
      </div>
    </div>
  );
}

export default function Reservations() {
  const reservations = useReservationStore((s) => s.reservations);
  const fetchReservations = useReservationStore((s) => s.fetchReservations);
  const updateReservationStatus = useReservationStore(
    (s) => s.updateReservationStatus,
  );
  const deleteReservation = useReservationStore((s) => s.deleteReservation);
  const deleteMultipleReservations = useReservationStore(
    (s) => s.deleteMultipleReservations,
  );
  const loading = useReservationStore((s) => s.loading);
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState({ open: false, reservation: null });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    reservation: null,
    isBulk: false,
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedReservations, setSelectedReservations] = useState([]);

  const role = getUserRole();
  const isAdmin = role === "admin" || role === "superadmin";

  useEffect(() => {
    fetchReservations().catch((err) =>
      toast.error(err.message || "Failed to fetch reservations"),
    );
  }, [fetchReservations]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return reservations.filter((r) => {
      const st = normalizeStatus(r.status);
      if (statusFilter !== "all" && st !== statusFilter) return false;
      if (!s) return true;

      const guestName = `${r?.guestId?.firstName || ""} ${
        r?.guestId?.lastName || ""
      }`.toLowerCase();
      const contact = String(r?.guestId?.contactNumber || "").toLowerCase();
      const resNum = String(r?.reservationNumber || "").toLowerCase();

      return (
        guestName.includes(s) ||
        contact.includes(s) ||
        resNum.includes(s) ||
        st.includes(s)
      );
    });
  }, [reservations, q, statusFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    const visible = new Set(filtered.map((r) => r._id));
    setSelectedReservations((prev) => prev.filter((id) => visible.has(id)));
  }, [filtered]);

  const openEdit = (reservation) => setModal({ open: true, reservation });
  const closeModal = () => setModal({ open: false, reservation: null });

  const openDeleteModal = (reservation) => {
    setDeleteModal({
      open: true,
      reservation,
      isBulk: false,
    });
  };

  const openBulkDeleteModal = () => {
    if (selectedReservations.length === 0) return;
    setDeleteModal({
      open: true,
      reservation: null,
      isBulk: true,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      open: false,
      reservation: null,
      isBulk: false,
    });
  };

  const handleDeleteReservation = async () => {
    if (!deleteModal.reservation) return;

    try {
      await deleteReservation(deleteModal.reservation._id);
      toast.success("Reservation deleted successfully");
      closeDeleteModal();
    } catch (err) {
      toast.error(err.message || "Failed to delete reservation");
    }
  };

  const handleBulkDeleteReservations = async () => {
    if (selectedReservations.length === 0) return;

    try {
      await deleteMultipleReservations(selectedReservations);
      toast.success(
        `${selectedReservations.length} reservation(s) deleted successfully`,
      );
      setSelectedReservations([]);
      closeDeleteModal();
    } catch (err) {
      toast.error(err.message || "Failed to delete selected reservations");
    }
  };

  const saveStatus = async (status, notes) => {
    try {
      await updateReservationStatus(modal.reservation._id, status, notes);
      toast.success("Reservation updated successfully");
      closeModal();
    } catch (err) {
      toast.error(err.message || "Failed to update reservation");
    }
  };

  const filteredIds = useMemo(() => filtered.map((r) => r._id), [filtered]);
  const isAllSelected =
    filteredIds.length > 0 &&
    selectedReservations.length === filteredIds.length;

  const toggleSelectReservation = (id) => {
    setSelectedReservations((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedReservations.length === paged.length)
      setSelectedReservations([]);
    else setSelectedReservations(paged.map((r) => r._id));
  };

  const goToAvailableRoomsToday = () => {
    navigate("/available-today");
  };

  return (
    <>
      <Helmet>
        <title>Reservation Management - Resort Admin</title>
      </Helmet>
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
              Reservation Management
            </div>
            <div className="text-sm text-gray-600">
              Manage reservation statuses and view guest information
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && selectedReservations.length > 0 && (
              <button
                onClick={openBulkDeleteModal}
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
                Delete ({selectedReservations.length})
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={goToAvailableRoomsToday}
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
                title="Go to Available Rooms Today"
              >
                <svg
                  className="w-4 h-4"
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                Available Rooms
              </button>

              <button
                type="button"
                onClick={() => navigate("/reservation-process")}
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
                <FiPlus className="w-4 h-4" /> Create Reservation
              </button>
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
                <span className="text-sm text-gray-600 font-medium">
                  Status
                </span>
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
                <option value="all">All Reservations</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="checked_in">Checked In</option>
                <option value="checked_out">Checked Out</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
                <option value="no_show">No Show</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile list */}
        <div className="md:hidden space-y-3">
          {paged.map((r) => (
            <ReservationCard
              key={r._id}
              reservation={r}
              onEdit={openEdit}
              onView={(r) => navigate(`/reservations/${r._id}/rooms`)}
              onDelete={openDeleteModal}
              selected={selectedReservations.includes(r._id)}
              onSelect={toggleSelectReservation}
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="text-gray-700 font-medium">
                No reservations found
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
                    selectedReservations.length === paged.length &&
                    paged.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="
                    h-5 w-5 rounded border-gray-300 
                    text-[#0c2bfc] focus:ring-[#0c2bfc]/20
                  "
                />
              )}
              <div className="text-sm font-semibold text-gray-900">
                Reservations ({total})
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
                          selectedReservations.length === paged.length &&
                          paged.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="h-5 w-5 rounded border-gray-300 text-[#0c2bfc] focus:ring-[#0c2bfc]/20"
                      />
                    </th>
                  )}
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
                    Payment Option
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Dates
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Status
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Assisted By
                  </th>
                  {isAdmin && (
                    <th className="text-right font-semibold text-gray-700 px-6 py-4">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {paged.map((r) => {
                  const guestName =
                    `${r?.guestId?.firstName || ""} ${
                      r?.guestId?.lastName || ""
                    }`.trim() || "—";
                  const contact = r?.guestId?.contactNumber || "—";
                  const assistedByName = r?.userId
                    ? `${r?.userId?.firstName || ""} ${r?.userId?.lastName || ""}`
                    : "—";

                  return (
                    <tr
                      key={r._id}
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
                            checked={selectedReservations.includes(r._id)}
                            onChange={() => toggleSelectReservation(r._id)}
                            className="
                              h-5 w-5 rounded border-gray-300 
                              text-[#0c2bfc] focus:ring-[#0c2bfc]/20
                            "
                          />
                        </td>
                      )}

                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          #{r.reservationNumber}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {guestName}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-gray-700">{contact}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-gray-700 font-medium">
                          {r.paymentOption?.name || "—"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-gray-700">
                          {new Date(r.checkIn).toLocaleDateString()} -{" "}
                          {new Date(r.checkOut).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <StatusPill value={r.status} />
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-gray-700">{assistedByName}</div>
                      </td>

                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(r)}
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

                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/reservations/${r._id}/rooms`)
                              }
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
                              <FiEye className="w-4 h-4" /> View
                            </button>

                            <button
                              type="button"
                              onClick={() => openDeleteModal(r)}
                              className="
                                h-10 px-4 rounded-xl 
                                border border-gray-200 
                                bg-white
                                hover:bg-gray-50
                                text-sm font-medium inline-flex items-center gap-2
                                transition-all duration-200
                                hover:shadow-md hover:-translate-y-0.5
                                active:translate-y-0
                                text-red-600 hover:text-red-700
                              "
                            >
                              <FiTrash2 className="w-4 h-4" /> Delete
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
                      colSpan={isAdmin ? 9 : 8}
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="text-gray-700 font-medium text-lg">
                        No reservations found
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        Try adjusting your search criteria or create a new
                        reservation
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

        {/* Status Update Modal */}
        {modal.open && (
          <ReservationStatusModal
            open={modal.open}
            reservation={modal.reservation}
            onClose={closeModal}
            onSave={saveStatus}
          />
        )}

        {/* Delete Modal */}
        {deleteModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={closeDeleteModal}
            />
            <div
              className="
                relative z-10 w-full max-w-md
                rounded-2xl border border-gray-200
                bg-white p-6
                shadow-2xl
              "
            >
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#0c2bfc]/10">
                  <FiTrash2 className="h-6 w-6 text-[#0c2bfc]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {deleteModal.isBulk
                    ? `Delete ${selectedReservations.length} Reservation(s)`
                    : "Delete Reservation"}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {deleteModal.isBulk
                    ? `Are you sure you want to delete ${selectedReservations.length} selected reservation(s)? This action cannot be undone.`
                    : `Are you sure you want to delete reservation #${deleteModal.reservation?.reservationNumber}? This action cannot be undone.`}
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    className="
                      h-10 px-4 rounded-xl 
                      border border-gray-200 
                      bg-white
                      hover:bg-gray-50
                      text-sm font-medium
                      transition-all duration-200
                      hover:shadow-md hover:-translate-y-0.5
                      text-gray-700 hover:text-[#0c2bfc]
                    "
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={
                      deleteModal.isBulk
                        ? handleBulkDeleteReservations
                        : handleDeleteReservation
                    }
                    className="
                      h-10 px-4 rounded-xl 
                      bg-[#0c2bfc] 
                      hover:bg-[#0a24d6]
                      text-white text-sm font-medium
                      transition-all duration-200
                      hover:shadow-md hover:-translate-y-0.5
                    "
                  >
                    {deleteModal.isBulk
                      ? `Delete ${selectedReservations.length} Reservation(s)`
                      : "Delete Reservation"}
                  </button>
                </div>
              </div>
            </div>
          </div>
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
              text="Loading reservations..."
            />
          </div>
        )}
      </div>
    </>
  );
}
