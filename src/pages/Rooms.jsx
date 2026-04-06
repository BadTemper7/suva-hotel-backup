import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTag,
  FiUploadCloud,
  FiGrid,
  FiList,
  FiTrash2,
  FiFilter,
  FiHome,
  FiSun,
} from "react-icons/fi";

import Loader from "../components/layout/Loader.jsx";
import RoomFormModal from "../components/modals/RoomFormModal.jsx";
import CottageFormModal from "../components/modals/CottageFormModal.jsx";
import ImagePreviewModal from "../components/modals/ImagePreviewModal.jsx";
import Pagination from "../components/ui/Pagination.jsx";
import { useRoomStore } from "../stores/roomStore.js";
import { getUser } from "../app/auth.js";
import { canManageRooms } from "../utils/staffPermissions.js";
import toast, { Toaster } from "react-hot-toast";
import { Helmet } from "react-helmet";

const STATUS_STYLES = {
  active: "bg-[#00af00]/10 text-[#00af00]",
  maintenance: "bg-[#0c2bfc]/10 text-[#0c2bfc]",
  clean: "bg-emerald-50 text-emerald-800",
  "to-clean": "bg-amber-50 text-amber-900",
};

function normalizeStatus(value) {
  const raw = String(value ?? "")
    .toLowerCase()
    .trim();
  if (raw === "maintenance" || raw === "under maintenance")
    return "maintenance";
  if (raw === "clean") return "clean";
  if (raw === "to-clean" || raw === "to clean") return "to-clean";
  return "active";
}

function StatusPill({ value }) {
  const v = normalizeStatus(value);
  const labels = {
    active: "Active",
    maintenance: "Under maintenance",
    clean: "Clean",
    "to-clean": "To clean",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${STATUS_STYLES[v] ?? STATUS_STYLES.active}`}
    >
      {labels[v] ?? labels.active}
    </span>
  );
}

function ImageCell({ images, roomNo, onPreview }) {
  const arr = Array.isArray(images) ? images : [];
  const first = arr[0]?.url || arr[0];

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onPreview?.(0)}
        disabled={arr.length === 0}
        className={`h-12 w-16 rounded-xl overflow-hidden border grid place-items-center transition-all duration-200 ${
          arr.length === 0
            ? "bg-gray-100 border-gray-200 cursor-not-allowed"
            : "bg-white border-gray-200 hover:ring-2 hover:ring-[#0c2bfc]/20 hover:shadow-md hover:-translate-y-0.5"
        }`}
        title={arr.length ? "Preview images" : "No images"}
      >
        {first ? (
          <img
            src={first}
            alt={`Room ${roomNo}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <FiUploadCloud className="text-gray-400" />
        )}
      </button>
    </div>
  );
}

function RoomCard({ room, onEdit, onPreview, selected, onSelect, canManage }) {
  const money = (n) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(n || 0);

  const isCottage = room.category === "cottage";
  const hasDescription = room.description && room.description.trim().length > 0;

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
      {canManage && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(room._id)}
          className="
          mt-1 h-5 w-5 rounded border-gray-300 
          text-[#0c2bfc] focus:ring-[#0c2bfc]/20
        "
        />
      )}

      <ImageCell
        images={room.images}
        roomNo={room.roomNo || room.roomNumber}
        onPreview={() => onPreview(room, 0)}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-gray-900 truncate">
            {isCottage ? "Cottage" : "Room"} {room.roomNo || room.roomNumber}
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              isCottage
                ? "bg-[#00af00]/10 text-[#00af00]"
                : "bg-[#0c2bfc]/10 text-[#0c2bfc]"
            }`}
          >
            {isCottage ? "Cottage" : "Room"}
          </span>
        </div>
        <div className="text-xs text-gray-600 font-medium mt-0.5">
          {isCottage
            ? room.description || "—"
            : room.roomType?.name || room.roomType || "—"}
        </div>

        {/* Add description preview */}
        {hasDescription && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 line-clamp-2">
              {room.description}
            </p>
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-600">
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13 0A9 9 0 008.965 3.525m11.035 8.975a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">Capacity: {room.capacity}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
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
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">{money(room.rate)}</span>
          </div>
        </div>

        <div className="mt-3">
          <StatusPill value={room.status} />
          {normalizeStatus(room.status) === "maintenance" &&
            room.maintenanceReason && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {room.maintenanceReason}
              </p>
            )}
        </div>
      </div>

      {canManage && (
        <button
          type="button"
          onClick={() => onEdit(room)}
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
export default function Rooms() {
  const navigate = useNavigate();

  const rooms = useRoomStore((state) => state.rooms);
  const fetchRooms = useRoomStore((state) => state.fetchRooms);
  const loading = useRoomStore((state) => state.loading);
  const deleteMultipleRooms = useRoomStore(
    (state) => state.deleteMultipleRooms,
  );

  const [listTab, setListTab] = useState("room");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roomModal, setRoomModal] = useState({
    open: false,
    mode: "add",
    room: null,
  });
  const [cottageModal, setCottageModal] = useState({
    open: false,
    mode: "add",
    room: null,
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [preview, setPreview] = useState({
    open: false,
    room: null,
    startIndex: 0,
  });

  const [selectedRooms, setSelectedRooms] = useState([]);

  const canManageRm = canManageRooms(getUser());

  useEffect(() => {
    fetchRooms({ category: listTab }).catch((err) =>
      toast.error(err.message || "Failed to fetch rooms"),
    );
  }, [fetchRooms, listTab]);

  useEffect(() => {
    setRoomModal({ open: false, mode: "add", room: null });
    setCottageModal({ open: false, mode: "add", room: null });
  }, [listTab]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rooms.filter((r) => {
      const st = normalizeStatus(r.status);
      if (statusFilter !== "all" && st !== statusFilter) return false;

      if (!s) return true;

      const type = (r.roomType?.name ?? r.roomType ?? "").toLowerCase();
      const no = String(r.roomNo ?? r.roomNumber ?? "").toLowerCase();
      const reason = String(r.maintenanceReason ?? "").toLowerCase();
      const desc = String(r.description ?? "").toLowerCase();

      return (
        no.includes(s) ||
        type.includes(s) ||
        st.includes(s) ||
        reason.includes(s) ||
        desc.includes(s)
      );
    });
  }, [rooms, q, statusFilter]);

  useEffect(() => {
    setSelectedRooms([]);
    setPage(1);
  }, [q, statusFilter, listTab]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openAddRoom = () =>
    setRoomModal({ open: true, mode: "add", room: null });
  const openAddCottage = () =>
    setCottageModal({ open: true, mode: "add", room: null });
  const openEditRoom = (room) =>
    setRoomModal({ open: true, mode: "edit", room });
  const openEditCottage = (room) =>
    setCottageModal({ open: true, mode: "edit", room });
  const closeRoomModal = () =>
    setRoomModal({ open: false, mode: "add", room: null });
  const closeCottageModal = () =>
    setCottageModal({ open: false, mode: "add", room: null });

  const openEdit = (room) =>
    room.category === "cottage" ? openEditCottage(room) : openEditRoom(room);

  const openAdd = () =>
    listTab === "room" ? openAddRoom() : openAddCottage();
  const openOperationLogs = () =>
    navigate(`/rooms/operations-logs?unitType=${listTab}`);

  const openPreview = (room, startIndex = 0) =>
    setPreview({ open: true, room, startIndex });
  const closePreview = () =>
    setPreview({ open: false, room: null, startIndex: 0 });

  const toggleSelectRoom = (id) => {
    setSelectedRooms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedRooms.length === paged.length) setSelectedRooms([]);
    else setSelectedRooms(paged.map((r) => r._id));
  };

  const handleDeleteSelected = async () => {
    if (selectedRooms.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedRooms.length} item(s)?`,
      )
    )
      return;

    try {
      await deleteMultipleRooms(selectedRooms);
      toast.success(`${selectedRooms.length} item(s) deleted successfully`);
      setSelectedRooms([]);
    } catch (err) {
      toast.error(err.message || "Failed to delete selected items");
    }
  };

  const money = (n) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(n || 0);

  return (
    <>
      <Helmet>
        <title>Rooms & Cottages - Resort Admin</title>
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
              Rooms & Cottages Management
            </div>
            <div className="text-sm text-gray-600">
              Manage rooms and cottages
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                type="button"
                onClick={() => setListTab("room")}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200
                  ${
                    listTab === "room"
                      ? "bg-[#0c2bfc] text-white border-[#0c2bfc] shadow-md"
                      : "bg-white text-gray-700 border-gray-200 hover:border-[#0c2bfc]/40"
                  }
                `}
              >
                <FiHome className="w-4 h-4" />
                Rooms
              </button>
              <button
                type="button"
                onClick={() => setListTab("cottage")}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200
                  ${
                    listTab === "cottage"
                      ? "bg-[#00af00] text-white border-[#00af00] shadow-md"
                      : "bg-white text-gray-700 border-gray-200 hover:border-[#00af00]/40"
                  }
                `}
              >
                <FiSun className="w-4 h-4" />
                Cottages
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {listTab === "room" ? "Rooms" : "Cottages"} in list: {rooms.length}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {canManageRm && selectedRooms.length > 0 && (
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
                Delete ({selectedRooms.length})
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/room-types")}
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
                title="Go to Room Types"
              >
                <FiTag /> Room Types
              </button>

              <button
                type="button"
                onClick={() => navigate("/add-ons")}
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
                title="Go to Add-ons"
              >
                <FiGrid /> Add-ons
              </button>

              {canManageRm && (
                <button
                  type="button"
                  onClick={openOperationLogs}
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
                >
                  <FiList className="w-4 h-4" /> Logs
                </button>
              )}

              {canManageRm && (
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
                    <FiPlus className="w-4 h-4" />{" "}
                    {listTab === "room" ? "Add room" : "Add cottage"}
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
                    placeholder="Search room #, cottage #, type, status…"
                  />
                </div>
              </form>
            </div>

            <div className="flex flex-wrap items-center gap-3">
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
                <option value="all">All status</option>
                <option value="active">Active</option>
                <option value="maintenance">Under maintenance</option>
                <option value="clean">Clean</option>
                <option value="to-clean">To clean</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile list */}
        <div className="md:hidden space-y-3">
          {paged.map((r) => (
            <RoomCard
              key={r._id}
              room={r}
              onEdit={openEdit}
              onPreview={openPreview}
              selected={selectedRooms.includes(r._id)}
              onSelect={toggleSelectRoom}
              canManage={canManageRm}
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
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <div className="text-gray-700 font-medium">
                {listTab === "room" ? "No rooms found" : "No cottages found"}
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
              {canManageRm && (
                <input
                  type="checkbox"
                  checked={
                    selectedRooms.length === paged.length && paged.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="
                    h-5 w-5 rounded border-gray-300 
                    text-[#0c2bfc] focus:ring-[#0c2bfc]/20
                  "
                />
              )}
              <div className="text-sm font-semibold text-gray-900">
                {listTab === "room" ? `Rooms (${total})` : `Cottages (${total})`}
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
                  {canManageRm && (
                    <th className="px-6 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedRooms.length === paged.length &&
                          paged.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="h-5 w-5 rounded border-gray-300 text-[#0c2bfc] focus:ring-[#0c2bfc]/20"
                      />
                    </th>
                  )}
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Images
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    #
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    {listTab === "room" ? "Room type" : "—"}
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Description
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Capacity
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Rate
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Status
                  </th>
                  <th className="text-right font-semibold text-gray-700 px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {paged.map((r) => (
                  <tr
                    key={r._id}
                    className="
                      border-b border-gray-100 last:border-b-0
                      hover:bg-gray-50
                      transition-colors duration-150
                    "
                  >
                    {canManageRm && (
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedRooms.includes(r._id)}
                          onChange={() => toggleSelectRoom(r._id)}
                          className="
                            h-5 w-5 rounded border-gray-300 
                            text-[#0c2bfc] focus:ring-[#0c2bfc]/20
                          "
                        />
                      </td>
                    )}

                    <td className="px-6 py-4">
                      <ImageCell
                        images={r.images}
                        roomNo={r.roomNo || r.roomNumber}
                        onPreview={() => openPreview(r, 0)}
                      />
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {r.roomNo || r.roomNumber}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-gray-700 font-medium">
                        {listTab === "room"
                          ? r.roomType?.name || r.roomType || "—"
                          : "—"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                        {r.description || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-700 font-medium">
                        {r.capacity}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-gray-700 font-medium">
                        {money(r.rate)}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <StatusPill value={r.status} />
                        {normalizeStatus(r.status) === "maintenance" &&
                          r.maintenanceReason && (
                            <div className="text-xs text-gray-500 line-clamp-2 max-w-xs">
                              {r.maintenanceReason}
                            </div>
                          )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {canManageRm && (
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
                      )}
                    </td>
                  </tr>
                ))}

                {paged.length === 0 && (
                  <tr>
                    <td
                      colSpan={canManageRm ? 9 : 8}
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
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          />
                        </svg>
                      </div>
                      <div className="text-gray-700 font-medium text-lg">
                        {listTab === "room"
                          ? "No rooms found"
                          : "No cottages found"}
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        Try adjusting your search criteria or add a new item
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

        {roomModal.open && (
          <RoomFormModal
            open={roomModal.open}
            mode={roomModal.mode}
            room={roomModal.room}
            onClose={closeRoomModal}
          />
        )}
        {cottageModal.open && (
          <CottageFormModal
            open={cottageModal.open}
            mode={cottageModal.mode}
            room={cottageModal.room}
            onClose={closeCottageModal}
          />
        )}

        {/* Preview Modal */}
        <ImagePreviewModal
          open={preview.open}
          images={preview.room?.images ?? []}
          startIndex={preview.startIndex}
          title={
            preview.room
              ? `${preview.room.category === "cottage" ? "Cottage" : "Room"} ${preview.room.roomNo || preview.room.roomNumber} Images`
              : "Images"
          }
          onClose={closePreview}
        />

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
              text="Loading items..."
            />
          </div>
        )}
      </div>
    </>
  );
}
