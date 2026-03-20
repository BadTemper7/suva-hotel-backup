import { useEffect, useMemo, useState } from "react";
import {
  FiEdit2,
  FiPlus,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
  FiFilter,
  FiUser,
  FiPhone,
  FiMail,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { Helmet } from "react-helmet";

import Loader from "../components/layout/Loader.jsx";
import GuestModal from "../components/modals/GuestModal.jsx";
import { useGuestStore } from "../stores/guestStore.js";
import { getUserRole } from "../app/auth.js";
import Pagination from "../components/ui/Pagination.jsx";

function AccountBadge({ hasAccount }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        hasAccount
          ? "bg-[#00af00]/10 text-[#00af00]"
          : "bg-gray-100 text-gray-700"
      }`}
    >
      {hasAccount ? (
        <>
          <FiCheckCircle className="mr-1" size={12} />
          Registered
        </>
      ) : (
        <>
          <FiXCircle className="mr-1" size={12} />
          Walk-in
        </>
      )}
    </span>
  );
}

function GuestCard({ guest, onEdit, selected, onSelect }) {
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
        onChange={() => onSelect(guest._id)}
        className="
          mt-1 h-5 w-5 rounded border-gray-300 
          text-[#0c2bfc] focus:ring-[#0c2bfc]/20
        "
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-gray-100">
            <FiUser className="w-4 h-4 text-[#0c2bfc]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 truncate">
              {guest.firstName} {guest.lastName}
            </div>
            <div className="text-xs text-gray-600 mt-0.5">
              ID: {guest._id.substring(0, 8)}...
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FiPhone className="w-3 h-3 text-[#00af00]" />
            <span className="text-xs text-gray-600">{guest.contactNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <FiMail className="w-3 h-3 text-[#0c2bfc]" />
            <span className="text-xs text-gray-600 truncate">
              {guest.email || "No email"}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <AccountBadge hasAccount={guest.hasAccount || false} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onEdit(guest)}
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

export default function Guests() {
  const guests = useGuestStore((s) => s.guests);
  const fetchGuests = useGuestStore((s) => s.fetchGuests);
  const createGuest = useGuestStore((s) => s.createGuest);
  const updateGuest = useGuestStore((s) => s.updateGuest);
  const deleteMultipleGuests = useGuestStore((s) => s.deleteMultipleGuests);
  const loading = useGuestStore((s) => s.loading);

  const [q, setQ] = useState("");
  const [accountFilter, setAccountFilter] = useState("all"); // New filter for account type
  const [modal, setModal] = useState({ open: false, mode: "add", guest: null });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedGuests, setSelectedGuests] = useState([]);

  const role = getUserRole();
  const isAdmin = role === "admin" || role === "superadmin";

  useEffect(() => {
    fetchGuests().catch((err) =>
      toast.error(err.message || "Failed to fetch guests"),
    );
  }, [fetchGuests]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return guests.filter((g) => {
      // Account filter
      if (accountFilter === "registered" && !g.hasAccount) return false;
      if (accountFilter === "walkin" && g.hasAccount) return false;

      // Search filter
      if (!s) return true;

      const fn = String(g.firstName ?? "").toLowerCase();
      const ln = String(g.lastName ?? "").toLowerCase();
      const cn = String(g.contactNumber ?? "").toLowerCase();
      const em = String(g.email ?? "").toLowerCase();

      return (
        fn.includes(s) || ln.includes(s) || cn.includes(s) || em.includes(s)
      );
    });
  }, [guests, q, accountFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openAdd = () => setModal({ open: true, mode: "add", guest: null });
  const openEdit = (guest) => setModal({ open: true, mode: "edit", guest });
  const closeModal = () => setModal({ open: false, mode: "add", guest: null });

  const saveGuest = async (payload) => {
    try {
      if (modal.mode === "add") {
        await createGuest(payload);
        toast.success("Guest created successfully");
      } else {
        await updateGuest(payload._id, payload);
        toast.success("Guest updated successfully");
      }
      closeModal();
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
  };

  const toggleSelectGuest = (id) => {
    setSelectedGuests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedGuests.length === paged.length) setSelectedGuests([]);
    else setSelectedGuests(paged.map((g) => g._id));
  };

  const handleDeleteSelected = async () => {
    if (selectedGuests.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedGuests.length} guest(s)?`,
      )
    )
      return;

    try {
      await deleteMultipleGuests(selectedGuests);
      toast.success(`${selectedGuests.length} guest(s) deleted successfully`);
      setSelectedGuests([]);
    } catch (err) {
      toast.error(err.message || "Failed to delete selected guests");
    }
  };

  // Calculate counts for stats
  const registeredCount = guests.filter((g) => g.hasAccount).length;
  const walkinCount = guests.filter((g) => !g.hasAccount).length;

  return (
    <>
      <Helmet>
        <title>Guest Management - Resort Admin</title>
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

        {/* Header with Stats */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xl font-bold text-gray-900">
              Guest Management
            </div>
            <div className="text-sm text-gray-600">
              Manage guest records and contact information
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && selectedGuests.length > 0 && (
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
                Delete ({selectedGuests.length})
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
                <FiPlus className="w-4 h-4" /> Add Guest
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Registered Guests
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {registeredCount}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-[#00af00]/10">
                <FiCheckCircle className="text-xl text-[#00af00]" />
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">
                  Walk-in Guests
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {walkinCount}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-100">
                <FiUser className="text-xl text-gray-600" />
              </div>
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
                    placeholder="Search name, contact, email…"
                  />
                </div>
              </form>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <FiFilter className="text-gray-400" />
                <span className="text-sm text-gray-600 font-medium">
                  Account Type
                </span>
              </div>
              <select
                value={accountFilter}
                onChange={(e) => {
                  setAccountFilter(e.target.value);
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
                <option value="all">All Guests</option>
                <option value="registered">Registered</option>
                <option value="walkin">Walk-in</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile list */}
        <div className="md:hidden space-y-3">
          {paged.map((g) => (
            <GuestCard
              key={g._id}
              guest={g}
              onEdit={openEdit}
              selected={selectedGuests.includes(g._id)}
              onSelect={toggleSelectGuest}
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="text-gray-700 font-medium">No guests found</div>
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
                    selectedGuests.length === paged.length && paged.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="
                    h-5 w-5 rounded border-gray-300 
                    text-[#0c2bfc] focus:ring-[#0c2bfc]/20
                  "
                />
              )}
              <div className="text-sm font-semibold text-gray-900">
                Guest Records ({total})
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
                          selectedGuests.length === paged.length &&
                          paged.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="h-5 w-5 rounded border-gray-300 text-[#0c2bfc] focus:ring-[#0c2bfc]/20"
                      />
                    </th>
                  )}
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Guest Name
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Contact Number
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Email Address
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Account Type
                  </th>
                  {isAdmin && (
                    <th className="text-right font-semibold text-gray-700 px-6 py-4">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {paged.map((g) => (
                  <tr
                    key={g._id}
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
                          checked={selectedGuests.includes(g._id)}
                          onChange={() => toggleSelectGuest(g._id)}
                          className="
                            h-5 w-5 rounded border-gray-300 
                            text-[#0c2bfc] focus:ring-[#0c2bfc]/20
                          "
                        />
                      </td>
                    )}

                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {g.firstName} {g.lastName}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ID: {g._id.substring(0, 8)}...
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-gray-700 font-medium">
                        {g.contactNumber}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-gray-700">
                        {g.email || (
                          <span className="text-gray-400">No email</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <AccountBadge hasAccount={g.hasAccount || false} />
                    </td>

                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(g)}
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
                      colSpan={isAdmin ? 6 : 5}
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div className="text-gray-700 font-medium text-lg">
                        No guests found
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        Try adjusting your search criteria or add a new guest
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

        {/* Modal */}
        {modal.open && (
          <GuestModal
            open={modal.open}
            mode={modal.mode}
            guest={modal.guest}
            onClose={() => setModal({ open: false, mode: "add", guest: null })}
            onSave={saveGuest}
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
              text="Loading guests..."
            />
          </div>
        )}
      </div>
    </>
  );
}
