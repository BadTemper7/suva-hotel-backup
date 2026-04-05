import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiTrash2, FiEdit2, FiSearch, FiFilter } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { Helmet } from "react-helmet";

import RoomTypeModal from "../components/modals/RoomTypeModal.jsx";
import { useRoomTypeStore } from "../stores/roomTypeStore.js";
import Loader from "../components/layout/Loader.jsx";
import { getUser } from "../app/auth.js";
import { isAdminRole } from "../utils/staffPermissions.js";

const STATUS_STYLES = {
  active: "bg-[#00af00]/10 text-[#00af00]",
  inactive: "bg-gray-100 text-gray-700",
};

function StatusPill({ value }) {
  const v = String(value ?? "").toLowerCase();
  const isActive = v === "active";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${
        STATUS_STYLES[isActive ? "active" : "inactive"]
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function RoomTypeCard({
  type,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}) {
  return (
    <div
      className={`
        group relative overflow-hidden
        rounded-xl border border-gray-200
        bg-white p-5 text-left
        shadow-sm transition-all duration-300
        ${
          canEdit
            ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0c2bfc]/20"
            : "cursor-default"
        }
      `}
      role={canEdit ? "button" : "article"}
      tabIndex={canEdit ? 0 : undefined}
      onClick={() => canEdit && onEdit(type)}
      onKeyDown={(e) => canEdit && e.key === "Enter" && onEdit(type)}
      title={canEdit ? "Click to edit" : "View only"}
    >
      {/* Accent bar */}
      <div
        className={`absolute inset-x-0 top-0 h-1.5 ${
          type.status === "active" ? "bg-[#0c2bfc]" : "bg-gray-300"
        }`}
      />

      {/* Delete button - only show if user can delete */}
      {canDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(type);
          }}
          className="
            absolute right-3 top-3 z-10
            rounded-xl p-2
            text-[#0c2bfc]
            opacity-0 group-hover:opacity-100
            bg-white
            hover:bg-gray-50
            hover:text-[#0a24d6] hover:shadow-md
            focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#0c2bfc]/20
            transition-all duration-200
          "
          title="Delete room type"
        >
          <FiTrash2 size={16} />
        </button>
      )}

      {/* Content */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{type.name}</h2>

          <div className="mt-3">
            <StatusPill value={type.status} />
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 flex items-center gap-1">
          {canEdit ? (
            <>
              <FiEdit2 className="w-3 h-3" />
              Click card to edit room type
            </>
          ) : (
            <>
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              View only - Cannot edit
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RoomTypes() {
  const {
    roomTypes,
    fetchRoomTypes,
    createRoomType,
    updateRoomType,
    deleteRoomType,
    loading,
  } = useRoomTypeStore();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState({
    open: false,
    mode: "add", // add | edit
    roomType: null,
  });

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    roomType: null,
  });

  const user = getUser();
  const userRole = user?.role;
  const canEdit = isAdminRole(userRole);
  const canDelete = isAdminRole(userRole);
  const canAdd = isAdminRole(userRole);

  useEffect(() => {
    fetchRoomTypes().catch((err) =>
      toast.error(err.message || "Failed to fetch room types"),
    );
  }, [fetchRoomTypes]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return roomTypes.filter((type) => {
      if (statusFilter !== "all" && type.status !== statusFilter) return false;
      if (!s) return true;
      const name = String(type.name ?? "").toLowerCase();
      const status = String(type.status ?? "").toLowerCase();
      return name.includes(s) || status.includes(s);
    });
  }, [roomTypes, q, statusFilter]);

  const title = useMemo(
    () => (modal.mode === "add" ? "Add Room Type" : "Edit Room Type"),
    [modal.mode],
  );

  function openAdd() {
    if (!canAdd) {
      toast.error("You don't have permission to add room types");
      return;
    }
    setModal({ open: true, mode: "add", roomType: null });
  }

  function openEdit(roomType) {
    if (!canEdit) {
      toast.error("You don't have permission to edit room types");
      return;
    }
    setModal({ open: true, mode: "edit", roomType });
  }

  function closeModal() {
    setModal({ open: false, mode: "add", roomType: null });
  }

  async function saveRoomType(payload) {
    if (modal.mode === "add" && !canAdd) {
      toast.error("You don't have permission to add room types");
      return;
    }
    if (modal.mode === "edit" && !canEdit) {
      toast.error("You don't have permission to edit room types");
      return;
    }
    try {
      if (modal.mode === "add") {
        await createRoomType({
          name: payload.name,
          status: "active",
        });
        toast.success("Room type created successfully!");
      } else {
        await updateRoomType(payload._id, {
          name: payload.name,
          status: payload.status,
        });
        toast.success("Room type updated successfully!");
      }
      closeModal();
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
  }

  async function confirmDelete() {
    try {
      await deleteRoomType(deleteModal.roomType._id);
      toast.success("Room type deleted successfully!");
      setDeleteModal({ open: false, roomType: null });
    } catch (err) {
      toast.error(err.message || "Failed to delete room type");
    }
  }

  const handleOpenDelete = (type) => {
    if (!canDelete) {
      toast.error("You don't have permission to delete room types");
      return;
    }
    setDeleteModal({
      open: true,
      roomType: type,
    });
  };

  const isViewOnlyForEdit = !canEdit;
  const getRoleWarningMessage = () =>
    isViewOnlyForEdit ? "You have view-only access to room types." : "";

  return (
    <>
      <Helmet>
        <title>Room Type Management - Resort Admin</title>
      </Helmet>
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
              Room Type Management
            </div>
            <div className="text-sm text-gray-600">
              Manage room type names and availability status
            </div>
            {isViewOnlyForEdit && (
              <div className="mt-2 text-xs text-amber-600 bg-amber-50 inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-amber-200">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{getRoleWarningMessage()}</span>
              </div>
            )}
          </div>

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
              title="Add Room Type"
            >
              <FiPlus className="w-4 h-4" />
              Add Room Type
            </button>
          )}
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
                    onChange={(e) => setQ(e.target.value)}
                    className="
                      w-full bg-transparent outline-none 
                      text-sm text-gray-800 placeholder-gray-400
                    "
                    placeholder="Search room type name, status…"
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
                onChange={(e) => setStatusFilter(e.target.value)}
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

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader
                size={60}
                variant="primary"
                showText={true}
                text="Loading room types..."
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div
            className="
            flex-1 flex flex-col items-center justify-center
            rounded-xl border border-gray-200 
            bg-white
            px-6 py-16 text-center
          "
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div className="text-gray-700 font-medium text-lg">
              No room types found
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {q || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : canAdd
                  ? "Add your first room type to get started"
                  : "No room types match the current filters."}
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
                Add Room Type
              </button>
            )}
          </div>
        )}

        {/* Room Type Cards Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((type) => (
              <RoomTypeCard
                key={type._id}
                type={type}
                onEdit={openEdit}
                onDelete={handleOpenDelete}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}

        {/* Edit / Add Modal */}
        {modal.open && (
          <RoomTypeModal
            open={modal.open}
            mode={modal.mode}
            title={title}
            roomType={modal.roomType}
            onClose={closeModal}
            onSave={saveRoomType}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setDeleteModal({ open: false, roomType: null })}
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
                  Delete Room Type
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-gray-900">
                    {deleteModal.roomType?.name}
                  </span>
                  ? This action cannot be undone.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteModal({ open: false, roomType: null })
                    }
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
                    onClick={confirmDelete}
                    className="
                      h-10 px-4 rounded-xl 
                      bg-[#0c2bfc] 
                      hover:bg-[#0a24d6]
                      text-white text-sm font-medium
                      transition-all duration-200
                      hover:shadow-md hover:-translate-y-0.5
                    "
                  >
                    Delete Room Type
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
