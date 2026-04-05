// src/pages/AddOns.jsx
import { useEffect, useMemo, useState } from "react";
import {
  FiEdit2,
  FiPlus,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
  FiFilter,
  FiTag,
  FiPackage,
  FiGrid,
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

import Loader from "../components/layout/Loader.jsx";
import AddOnModal from "../components/modals/AddOnModal.jsx";
import { useAddOnStore } from "../stores/addOnStore.js";
import { getUser } from "../app/auth.js";
import { isAdminRole } from "../utils/staffPermissions.js";
import Pagination from "../components/ui/Pagination.jsx";

const STATUS_STYLES = {
  active: "bg-[#00af00]/10 text-[#00af00]",
  inactive: "bg-gray-100 text-gray-700",
};

const CATEGORY_STYLES = {
  food: "bg-orange-100 text-orange-700",
  beverage: "bg-blue-100 text-blue-700",
  equipment: "bg-purple-100 text-purple-700",
  service: "bg-green-100 text-green-700",
  other: "bg-gray-100 text-gray-600",
};

const CATEGORY_LABELS = {
  food: "Food",
  beverage: "Beverage",
  equipment: "Equipment",
  service: "Service",
  other: "Other",
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

function CategoryBadge({ category }) {
  const cat = category?.toLowerCase() || "other";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${CATEGORY_STYLES[cat]}`}
    >
      {CATEGORY_LABELS[cat] || "Other"}
    </span>
  );
}

function AddOnCard({ addOn, onEdit, selected, onSelect, canEdit = true }) {
  const money = (n) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(n || 0);

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
        onChange={() => onSelect(addOn._id)}
        className="
          mt-1 h-5 w-5 rounded border-gray-300 
          text-[#0c2bfc] focus:ring-[#0c2bfc]/20
        "
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-sm font-semibold text-gray-900 truncate">
            {addOn.name}
          </div>
          <CategoryBadge category={addOn.category} />
        </div>

        {addOn.description && (
          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
            {addOn.description}
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
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
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">{money(addOn.rate ?? 0)}</span>
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span className="font-medium">Stock: {addOn.stock ?? 0}</span>
          </div>
        </div>
        <div className="mt-3">
          <StatusPill value={addOn.status} />
        </div>
      </div>

      {canEdit && (
        <button
          type="button"
          onClick={() => onEdit(addOn)}
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
      )}
    </div>
  );
}

export default function AddOns() {
  const addOns = useAddOnStore((s) => s.addOns);
  const fetchAddOns = useAddOnStore((s) => s.fetchAddOns);
  const createAddOn = useAddOnStore((s) => s.createAddOn);
  const updateAddOn = useAddOnStore((s) => s.updateAddOn);
  const deleteMultipleAddOns = useAddOnStore((s) => s.deleteMultipleAddOns);
  const loading = useAddOnStore((s) => s.loading);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modal, setModal] = useState({
    open: false,
    mode: "add",
    addOn: null,
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedAddOns, setSelectedAddOns] = useState([]);

  const user = getUser();
  const canEditDelete = isAdminRole(user?.role);
  const canAdd = canEditDelete;
  const isViewOnly = !canEditDelete;

  useEffect(() => {
    fetchAddOns().catch((err) =>
      toast.error(err.message || "Failed to fetch add-ons"),
    );
  }, [fetchAddOns]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return addOns.filter((a) => {
      const st = normalizeStatus(a.status);
      if (statusFilter !== "all" && st !== statusFilter) return false;
      if (categoryFilter !== "all" && a.category !== categoryFilter)
        return false;
      if (!s) return true;
      const name = String(a.name ?? "").toLowerCase();
      const description = String(a.description ?? "").toLowerCase();
      return name.includes(s) || description.includes(s) || st.includes(s);
    });
  }, [addOns, q, statusFilter, categoryFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openAdd = () => {
    if (!canAdd) {
      toast.error("You don't have permission to add add-ons");
      return;
    }
    setModal({ open: true, mode: "add", addOn: null });
  };
  const openEdit = (addOn) => {
    if (!canEditDelete) {
      toast.error("You don't have permission to edit add-ons");
      return;
    }
    setModal({ open: true, mode: "edit", addOn });
  };
  const closeModal = () => setModal({ open: false, mode: "add", addOn: null });

  const saveAddOn = async (payload) => {
    if (modal.mode === "add" && !canAdd) {
      toast.error("You don't have permission to add add-ons");
      return;
    }
    if (modal.mode === "edit" && !canEditDelete) {
      toast.error("You don't have permission to edit add-ons");
      return;
    }
    const normalizedStatus = normalizeStatus(payload.status);
    try {
      if (modal.mode === "add") {
        await createAddOn({ ...payload, status: normalizedStatus });
        toast.success("Add-on created successfully");
      } else {
        await updateAddOn(payload._id, {
          ...payload,
          status: normalizedStatus,
        });
        toast.success("Add-on updated successfully");
      }
      closeModal();
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
  };

  const toggleSelectAddOn = (id) => {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedAddOns.length === paged.length) setSelectedAddOns([]);
    else setSelectedAddOns(paged.map((a) => a._id));
  };

  const handleDeleteSelected = async () => {
    if (selectedAddOns.length === 0) return;
    if (!canEditDelete) {
      toast.error("You don't have permission to delete add-ons");
      return;
    }
    if (
      !confirm(
        `Are you sure you want to delete ${selectedAddOns.length} add-on(s)?`,
      )
    )
      return;

    try {
      await deleteMultipleAddOns(selectedAddOns);
      toast.success(`${selectedAddOns.length} add-on(s) deleted successfully`);
      setSelectedAddOns([]);
    } catch (err) {
      toast.error(err.message || "Failed to delete selected add-ons");
    }
  };

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set(addOns.map((a) => a.category).filter(Boolean));
    return Array.from(cats);
  }, [addOns]);

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
          <div className="text-xl font-bold text-gray-900">
            Add-On Management
          </div>
          <div className="text-sm text-gray-600">
            Manage resort add-ons like food, beverages, equipment, and services
          </div>
          {isViewOnly && (
            <div className="mt-2 text-xs text-amber-600 bg-amber-50 inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-amber-200">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>You have view-only access to add-ons.</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {canEditDelete && selectedAddOns.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={loading}
              className="
                h-11 px-5 rounded-xl 
                bg-red-500 
                hover:bg-red-600
                text-white text-sm font-medium inline-flex items-center gap-2
                transition-all duration-200
                hover:shadow-lg hover:-translate-y-0.5
                active:translate-y-0
                disabled:opacity-70 disabled:cursor-not-allowed
              "
            >
              <FiTrash2 className="w-4 h-4" />
              Delete ({selectedAddOns.length})
            </button>
          )}

          {canAdd && (
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
              title="Add Add-On"
            >
              <FiPlus className="w-4 h-4" /> Add Add-On
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
                  placeholder="Search by name, description, category…"
                />
              </div>
            </form>
          </div>

          <div className="flex flex-wrap items-center gap-3">
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <div className="flex items-center gap-2">
              <FiTag className="text-gray-400" />
              <span className="text-sm text-gray-600 font-medium">
                Category
              </span>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
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
              <option value="all">All Categories</option>
              <option value="food">Food</option>
              <option value="beverage">Beverage</option>
              <option value="equipment">Equipment</option>
              <option value="service">Service</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile list */}
      <div className="md:hidden space-y-3">
        {paged.map((a) => (
          <AddOnCard
            key={a._id}
            addOn={a}
            onEdit={openEdit}
            selected={selectedAddOns.includes(a._id)}
            onSelect={toggleSelectAddOn}
            canEdit={canEditDelete}
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
              <FiPackage className="w-12 h-12 mx-auto" />
            </div>
            <div className="text-gray-700 font-medium">No add-ons found</div>
            <div className="text-sm text-gray-500 mt-1">
              Try adjusting your search or filters
            </div>
            {canAdd && (
              <button
                type="button"
                onClick={openAdd}
                className="
                mt-4 h-10 px-4 rounded-xl 
                bg-[#0c2bfc] 
                hover:bg-[#0a24d6]
                text-white text-sm font-medium inline-flex items-center gap-2
                transition-all duration-200
                hover:shadow-md hover:-translate-y-0.5
                active:translate-y-0
              "
              >
                <FiPlus className="w-4 h-4" />
                Add Add-On
              </button>
            )}
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
            {canEditDelete && (
              <input
                type="checkbox"
                checked={
                  selectedAddOns.length === paged.length && paged.length > 0
                }
                onChange={toggleSelectAll}
                className="
                  h-5 w-5 rounded border-gray-300 
                  text-[#0c2bfc] focus:ring-[#0c2bfc]/20
                "
              />
            )}
            <div className="text-sm font-semibold text-gray-900">
              Add-On Items ({total})
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
                {canEditDelete && (
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedAddOns.length === paged.length &&
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
                  Category
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Rate
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Stock
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Status
                </th>
                {canEditDelete && (
                  <th className="text-right font-semibold text-gray-700 px-6 py-4">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {paged.map((a) => (
                <tr
                  key={a._id}
                  className="
                    border-b border-gray-100 last:border-b-0
                    hover:bg-gray-50
                    transition-colors duration-150
                  "
                >
                  {canEditDelete && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedAddOns.includes(a._id)}
                        onChange={() => toggleSelectAddOn(a._id)}
                        className="
                          h-5 w-5 rounded border-gray-300 
                          text-[#0c2bfc] focus:ring-[#0c2bfc]/20
                        "
                      />
                    </td>
                  )}

                  <td className="px-6 py-4">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {a.name}
                      </div>
                      {a.description && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {a.description}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <CategoryBadge category={a.category} />
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700 font-medium">
                        {new Intl.NumberFormat("en-PH", {
                          style: "currency",
                          currency: "PHP",
                        }).format(a.rate ?? 0)}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="
                        px-3 py-1.5 rounded-full 
                        bg-gray-100
                        text-gray-700 text-xs font-medium
                        border border-gray-200
                      "
                      >
                        {a.stock ?? 0} units
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <StatusPill value={a.status} />
                  </td>

                  {canEditDelete && (
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(a)}
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
                    colSpan={canEditDelete ? 7 : 6}
                    className="px-6 py-16 text-center"
                  >
                    <div className="text-gray-300 mb-3">
                      <FiPackage className="w-16 h-16 mx-auto" />
                    </div>
                    <div className="text-gray-700 font-medium text-lg">
                      No add-ons found
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      {canAdd
                        ? "Try adjusting your search criteria or add a new add-on"
                        : "Try adjusting your search criteria."}
                    </div>
                    {canAdd && (
                      <button
                        type="button"
                        onClick={openAdd}
                        className="
                        mt-4 h-10 px-4 rounded-xl 
                        bg-[#0c2bfc] 
                        hover:bg-[#0a24d6]
                        text-white text-sm font-medium inline-flex items-center gap-2
                        transition-all duration-200
                        hover:shadow-md hover:-translate-y-0.5
                        active:translate-y-0
                      "
                      >
                        <FiPlus className="w-4 h-4" />
                        Add Add-On
                      </button>
                    )}
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
        <AddOnModal
          open={modal.open}
          mode={modal.mode}
          addOn={modal.addOn}
          onClose={closeModal}
          onSave={saveAddOn}
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
            text="Loading add-ons..."
          />
        </div>
      )}
    </div>
  );
}
