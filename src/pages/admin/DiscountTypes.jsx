import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiSearch, FiTrash2, FiFilter } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

import Loader from "../../components/layout/Loader.jsx";
import DiscountTypeModal from "../../components/modals/DiscountTypeModal.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import { useDiscountTypeStore } from "../../stores/discountStore.js";
import { getUserRole } from "../../app/auth.js";

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

function DiscountCard({ discount, onEdit, selected, onSelect }) {
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
        onChange={() => onSelect(discount._id)}
        className="
          mt-1 h-5 w-5 rounded border-gray-300 
          text-[#0c2bfc] focus:ring-[#0c2bfc]/20
        "
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-gray-900 truncate">
            {discount.name}
          </div>
          <span
            className="
            px-2.5 py-0.5 rounded-full text-xs font-medium
            bg-[#0c2bfc]/10 text-[#0c2bfc]
          "
          >
            {discount.discountPercent}%
          </span>
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
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <span className="font-medium">
              Priority: {discount.discountPriority}
            </span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <svg
              className="w-4 h-4 text-[#00af00]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span className="font-medium">
              Rooms:{" "}
              {discount.appliesToAllRooms
                ? "All"
                : `${discount.maxRoomCount || 0} max`}
            </span>
          </div>
        </div>
        <div className="mt-3">
          <StatusPill value={discount.status} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onEdit(discount)}
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

export default function Discounts() {
  const discounts = useDiscountTypeStore((s) => s.discounts);
  const fetchDiscounts = useDiscountTypeStore((s) => s.fetchDiscounts);
  const createDiscount = useDiscountTypeStore((s) => s.createDiscount);
  const updateDiscount = useDiscountTypeStore((s) => s.updateDiscount);
  const deleteMultipleDiscounts = useDiscountTypeStore(
    (s) => s.deleteMultipleDiscounts,
  );
  const loading = useDiscountTypeStore((s) => s.loading);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modal, setModal] = useState({
    open: false,
    mode: "add",
    discount: null,
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedDiscounts, setSelectedDiscounts] = useState([]);

  const role = getUserRole();
  const isAdmin = role === "admin" || role === "superadmin";

  useEffect(() => {
    fetchDiscounts().catch((err) =>
      toast.error(err.message || "Failed to fetch discounts"),
    );
  }, [fetchDiscounts]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return discounts.filter((d) => {
      const st = normalizeStatus(d.status);
      if (statusFilter !== "all" && st !== statusFilter) return false;

      if (typeFilter !== "all") {
        if (typeFilter === "allRooms" && !d.appliesToAllRooms) return false;
        if (typeFilter === "perId" && !d.isPerId) return false;
      }

      if (!s) return true;
      return d.name?.toLowerCase().includes(s) || st.includes(s);
    });
  }, [discounts, q, statusFilter, typeFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openAdd = () => setModal({ open: true, mode: "add", discount: null });
  const openEdit = (discount) =>
    setModal({ open: true, mode: "edit", discount });
  const closeModal = () =>
    setModal({ open: false, mode: "add", discount: null });

  const saveDiscount = async (payload) => {
    const normalizedStatus = normalizeStatus(payload.status);
    try {
      if (modal.mode === "add") {
        await createDiscount({ ...payload, status: normalizedStatus });
        toast.success("Discount created successfully");
      } else {
        await updateDiscount(payload._id, {
          ...payload,
          status: normalizedStatus,
        });
        toast.success("Discount updated successfully");
      }
      closeModal();
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
  };

  const toggleSelectDiscount = (id) => {
    setSelectedDiscounts((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedDiscounts.length === paged.length) setSelectedDiscounts([]);
    else setSelectedDiscounts(paged.map((d) => d._id));
  };

  const handleDeleteSelected = async () => {
    if (selectedDiscounts.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedDiscounts.length} discount(s)?`,
      )
    )
      return;
    try {
      await deleteMultipleDiscounts(selectedDiscounts);
      toast.success(
        `${selectedDiscounts.length} discount(s) deleted successfully`,
      );
      setSelectedDiscounts([]);
    } catch (err) {
      toast.error(err.message || "Failed to delete selected discounts");
    }
  };

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
            Discount Management
          </div>
          <div className="text-sm text-gray-600">
            Manage discount types, percentages, and application rules
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && selectedDiscounts.length > 0 && (
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
              Delete ({selectedDiscounts.length})
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
              <FiPlus className="w-4 h-4" /> Add Discount
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
                  placeholder="Search discount name, status…"
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
              <option value="allRooms">All Rooms</option>
              <option value="perId">Per Guest ID</option>
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
        {paged.map((d) => (
          <DiscountCard
            key={d._id}
            discount={d}
            onEdit={openEdit}
            selected={selectedDiscounts.includes(d._id)}
            onSelect={toggleSelectDiscount}
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-gray-700 font-medium">No discounts found</div>
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
                  selectedDiscounts.length === paged.length && paged.length > 0
                }
                onChange={toggleSelectAll}
                className="
                  h-5 w-5 rounded border-gray-300 
                  text-[#0c2bfc] focus:ring-[#0c2bfc]/20
                "
              />
            )}
            <div className="text-sm font-semibold text-gray-900">
              Discount Types ({total})
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
                        selectedDiscounts.length === paged.length &&
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
                  Percentage
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  All Rooms
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Max Room
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Priority
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Per Guest ID
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
              {paged.map((d) => (
                <tr
                  key={d._id}
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
                        checked={selectedDiscounts.includes(d._id)}
                        onChange={() => toggleSelectDiscount(d._id)}
                        className="
                          h-5 w-5 rounded border-gray-300 
                          text-[#0c2bfc] focus:ring-[#0c2bfc]/20
                        "
                      />
                    </td>
                  )}

                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{d.name}</div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="
                        px-3 py-1.5 rounded-full 
                        bg-[#0c2bfc]/10
                        text-[#0c2bfc] text-xs font-medium
                      "
                      >
                        {d.discountPercent}%
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`
                          px-3 py-1.5 rounded-full text-xs font-medium
                          ${
                            d.appliesToAllRooms
                              ? "bg-[#00af00]/10 text-[#00af00]"
                              : "bg-gray-100 text-gray-700"
                          }
                        `}
                      >
                        {d.appliesToAllRooms ? "Yes" : "No"}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-gray-700 font-medium">
                      {d.maxRoomCount || 0}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-gray-700 font-medium capitalize">
                      {d.discountPriority}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`
                          px-3 py-1.5 rounded-full text-xs font-medium
                          ${
                            d.isPerId
                              ? "bg-[#0c2bfc]/10 text-[#0c2bfc]"
                              : "bg-gray-100 text-gray-700"
                          }
                        `}
                      >
                        {d.isPerId ? "Yes" : "No"}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <StatusPill value={d.status} />
                  </td>

                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(d)}
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
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-gray-700 font-medium text-lg">
                      No discounts found
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Try adjusting your search criteria or add a new discount
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
        <DiscountTypeModal
          open={modal.open}
          mode={modal.mode}
          data={modal.discount}
          onClose={closeModal}
          onSave={saveDiscount}
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
            text="Loading discounts..."
          />
        </div>
      )}
    </div>
  );
}
