// pages/MaintenanceDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  FiHome,
  FiCheckCircle,
  FiClock,
  FiTool,
  FiPlus,
  FiFilter,
  FiRefreshCw,
  FiCalendar,
  FiAlertCircle,
  FiClipboard,
  FiTrash2,
  FiEdit2,
  FiSearch,
} from "react-icons/fi";
import { format, startOfDay, endOfDay } from "date-fns";
import { useRoomStore } from "../stores/roomStore.js";
import Loader from "../components/layout/Loader.jsx";
import toast, { Toaster } from "react-hot-toast";
import Pagination from "../components/ui/Pagination.jsx";

export default function Maintenance() {
  const { rooms, fetchRooms, updateRoomStatus, loading } = useRoomStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [updatingRoom, setUpdatingRoom] = useState(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchRooms().catch((err) => {
      toast.error("Failed to load rooms");
      console.error(err);
    });
  }, [fetchRooms]);

  const filteredRooms = React.useMemo(() => {
    if (!rooms || !Array.isArray(rooms)) return [];

    const s = q.trim().toLowerCase();

    return rooms.filter((room) => {
      if (filter !== "all") {
        const today = new Date();
        if (filter === "due" && room.lastMaintenanceDate) {
          const lastMaintenance = new Date(room.lastMaintenanceDate);
          const daysSince = Math.floor(
            (today - lastMaintenance) / (1000 * 60 * 60 * 24),
          );
          if (daysSince < 30) return false;
        }
      }

      if (statusFilter !== "all" && room.status !== statusFilter) return false;

      if (typeFilter !== "all" && room.roomType?.name !== typeFilter)
        return false;

      if (room.maintenanceDate) {
        const roomDate = new Date(room.maintenanceDate);
        const selectedDateStart = startOfDay(selectedDate);
        const selectedDateEnd = endOfDay(selectedDate);

        if (roomDate < selectedDateStart || roomDate > selectedDateEnd) {
          return false;
        }
      }

      if (s) {
        const roomNum = String(room.roomNumber || "").toLowerCase();
        const roomType = String(room.roomType?.name || "").toLowerCase();
        const status = String(room.status || "").toLowerCase();

        return (
          roomNum.includes(s) || roomType.includes(s) || status.includes(s)
        );
      }

      return true;
    });
  }, [rooms, filter, statusFilter, typeFilter, selectedDate, q]);

  const total = filteredRooms.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRooms.slice(start, start + pageSize);
  }, [filteredRooms, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const stats = React.useMemo(() => {
    if (!rooms || !Array.isArray(rooms)) {
      return {
        total: 0,
        clean: 0,
        toClean: 0,
        maintenance: 0,
        available: 0,
        occupied: 0,
      };
    }

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    return {
      total: rooms.length,
      clean: rooms.filter((room) => room.status === "clean").length,
      toClean: rooms.filter((room) => room.status === "to_clean").length,
      maintenance: rooms.filter((room) => room.status === "maintenance").length,
      available: rooms.filter((room) => room.status === "available").length,
      occupied: rooms.filter((room) => room.status === "occupied").length,
      dueForMaintenance: rooms.filter((room) => {
        if (!room.lastMaintenanceDate) return false;
        const lastMaintenance = new Date(room.lastMaintenanceDate);
        const daysSince = Math.floor(
          (today - lastMaintenance) / (1000 * 60 * 60 * 24),
        );
        return daysSince >= 30;
      }).length,
    };
  }, [rooms]);

  const handleUpdateStatus = async (roomId, newStatus, notes = "") => {
    try {
      setUpdatingRoom(roomId);
      await updateRoomStatus(roomId, newStatus, notes);
      toast.success(`Room status updated to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update room status");
      console.error(err);
    } finally {
      setUpdatingRoom(null);
    }
  };

  const handleQuickStatus = (roomId, status) => {
    const statusMap = {
      clean: { status: "clean", notes: "Room cleaned" },
      to_clean: { status: "to_clean", notes: "Marked for cleaning" },
      maintenance: { status: "maintenance", notes: "Maintenance required" },
      available: { status: "available", notes: "Room made available" },
    };

    const update = statusMap[status];
    if (update) {
      handleUpdateStatus(roomId, update.status, update.notes);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "clean":
      case "available":
        return "bg-[#00af00]/10 text-[#00af00]";
      case "to_clean":
        return "bg-[#0c2bfc]/10 text-[#0c2bfc]";
      case "maintenance":
        return "bg-red-100 text-red-700";
      case "occupied":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "clean":
        return <FiCheckCircle className="text-[#00af00]" />;
      case "to_clean":
        return <FiClock className="text-[#0c2bfc]" />;
      case "maintenance":
        return <FiTool className="text-red-500" />;
      case "available":
        return <FiHome className="text-[#00af00]" />;
      case "occupied":
        return <FiHome className="text-blue-500" />;
      default:
        return <FiHome className="text-gray-500" />;
    }
  };

  if (loading && !rooms) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
        <Loader
          size={60}
          variant="primary"
          showText={true}
          text="Loading rooms..."
        />
      </div>
    );
  }

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
            Maintenance Dashboard
          </div>
          <div className="text-sm text-gray-600">
            Monitor and manage room maintenance status
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
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
            <FiFilter className="w-4 h-4" />
            Filters
          </button>
          <button
            type="button"
            onClick={() => fetchRooms()}
            disabled={loading}
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
              disabled:opacity-70 disabled:cursor-not-allowed
            "
          >
            <FiRefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
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
                  placeholder="Search room number, type, status…"
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
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
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
              <option value="all">All Rooms</option>
              <option value="due">Due for Maintenance</option>
              <option value="scheduled">Scheduled Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Rooms */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Rooms</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-100 border border-gray-200">
              <FiHome className="text-xl text-[#0c2bfc]" />
            </div>
          </div>
        </div>

        {/* Clean Rooms */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Clean</p>
              <p className="text-2xl font-bold text-[#00af00] mt-1">
                {stats.clean}
              </p>
              <p className="text-xs text-gray-500">
                {stats.total > 0
                  ? ((stats.clean / stats.total) * 100).toFixed(0)
                  : 0}
                %
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#00af00]/10 border border-[#00af00]/20">
              <FiCheckCircle className="text-xl text-[#00af00]" />
            </div>
          </div>
        </div>

        {/* To Clean */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">To Clean</p>
              <p className="text-2xl font-bold text-[#0c2bfc] mt-1">
                {stats.toClean}
              </p>
              <p className="text-xs text-gray-500">
                {stats.total > 0
                  ? ((stats.toClean / stats.total) * 100).toFixed(0)
                  : 0}
                %
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0c2bfc]/10 border border-[#0c2bfc]/20">
              <FiClock className="text-xl text-[#0c2bfc]" />
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {stats.maintenance}
              </p>
              <p className="text-xs text-gray-500">
                {stats.total > 0
                  ? ((stats.maintenance / stats.total) * 100).toFixed(0)
                  : 0}
                %
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-red-100 border border-red-200">
              <FiTool className="text-xl text-red-600" />
            </div>
          </div>
        </div>

        {/* Available */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-[#00af00] mt-1">
                {stats.available}
              </p>
              <p className="text-xs text-gray-500">
                {stats.total > 0
                  ? ((stats.available / stats.total) * 100).toFixed(0)
                  : 0}
                %
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-[#00af00]/10 border border-[#00af00]/20">
              <FiHome className="text-xl text-[#00af00]" />
            </div>
          </div>
        </div>

        {/* Occupied */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Occupied</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats.occupied}
              </p>
              <p className="text-xs text-gray-500">
                {stats.total > 0
                  ? ((stats.occupied / stats.total) * 100).toFixed(0)
                  : 0}
                %
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-100 border border-blue-200">
              <FiHome className="text-xl text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Rooms List */}
      <div
        className="flex-1 min-h-0 hidden md:flex flex-col 
        bg-white
        border border-gray-200 rounded-xl 
        overflow-hidden shadow-sm"
      >
        {/* Header */}
        <div
          className="
          px-6 py-4 border-b border-gray-200 
          flex items-center justify-between gap-3
          bg-gray-50
        "
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Room Maintenance Status
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {format(selectedDate, "MMMM dd, yyyy")} • Showing {paged.length}{" "}
              of {total} rooms
            </p>
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

        {/* Desktop Table */}
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Room
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Type
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Capacity
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Status
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Last Cleaned
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Last Maintenance
                </th>
                <th className="text-right font-semibold text-gray-700 px-6 py-4">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {paged.map((room) => (
                <tr
                  key={room._id}
                  className="
                    border-b border-gray-100 last:border-b-0
                    hover:bg-gray-50
                    transition-colors duration-150
                  "
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-xl flex items-center justify-center mr-3 border border-gray-200">
                        {getStatusIcon(room.status)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          Room {room.roomNumber}
                        </div>
                        <div className="text-xs text-gray-500">
                          Floor: {room.floor || "N/A"}
                        </div>
                      </div>
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
                        {room.roomType?.name || "No Type"}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700 font-medium">
                        {room.capacity}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`
                        inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium
                        ${getStatusColor(room.status)}
                      `}
                    >
                      {room.status.replace("_", " ")}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-gray-600">
                      {room.lastCleaned
                        ? format(new Date(room.lastCleaned), "MMM dd, yyyy")
                        : "Never"}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-gray-600">
                      {room.lastMaintenanceDate
                        ? format(
                            new Date(room.lastMaintenanceDate),
                            "MMM dd, yyyy",
                          )
                        : "Never"}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickStatus(room._id, "clean")}
                        disabled={updatingRoom === room._id}
                        className="
                          h-9 px-3 rounded-xl 
                          border border-[#00af00]/20 
                          bg-white
                          hover:bg-[#00af00]/5
                          text-sm font-medium inline-flex items-center gap-1
                          transition-all duration-200
                          hover:shadow-md hover:-translate-y-0.5
                          active:translate-y-0
                          text-[#00af00] hover:text-[#009500]
                          disabled:opacity-70 disabled:cursor-not-allowed
                        "
                      >
                        <FiCheckCircle className="w-3.5 h-3.5" />
                        Clean
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStatus(room._id, "to_clean")}
                        disabled={updatingRoom === room._id}
                        className="
                          h-9 px-3 rounded-xl 
                          border border-[#0c2bfc]/20 
                          bg-white
                          hover:bg-[#0c2bfc]/5
                          text-sm font-medium inline-flex items-center gap-1
                          transition-all duration-200
                          hover:shadow-md hover:-translate-y-0.5
                          active:translate-y-0
                          text-[#0c2bfc] hover:text-[#0a24d6]
                          disabled:opacity-70 disabled:cursor-not-allowed
                        "
                      >
                        <FiClock className="w-3.5 h-3.5" />
                        To Clean
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleQuickStatus(room._id, "maintenance")
                        }
                        disabled={updatingRoom === room._id}
                        className="
                          h-9 px-3 rounded-xl 
                          border border-red-200 
                          bg-white
                          hover:bg-red-50
                          text-sm font-medium inline-flex items-center gap-1
                          transition-all duration-200
                          hover:shadow-md hover:-translate-y-0.5
                          active:translate-y-0
                          text-red-600 hover:text-red-700
                          disabled:opacity-70 disabled:cursor-not-allowed
                        "
                      >
                        <FiTool className="w-3.5 h-3.5" />
                        Maintenance
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
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
                      No rooms found
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Try adjusting your search criteria or filters
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Rooms Grid */}
      <div className="md:hidden space-y-4">
        {paged.map((room) => (
          <div
            key={room._id}
            className="
              rounded-xl border border-gray-200 
              bg-white
              p-4
              shadow-sm hover:shadow-md transition-all duration-300
              hover:-translate-y-0.5
            "
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-gray-100 border border-gray-200">
                  {getStatusIcon(room.status)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Room {room.roomNumber}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {room.roomType?.name || "No Type"}
                  </p>
                </div>
              </div>
              <span
                className={`
                  inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium
                  ${getStatusColor(room.status)}
                `}
              >
                {room.status.replace("_", " ")}
              </span>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Capacity:</span>
                <span className="font-medium text-gray-900">
                  {room.capacity}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Rate:</span>
                <span className="font-medium text-gray-900">
                  ₱{room.rate?.toLocaleString() || "0"}
                </span>
              </div>
              {room.lastCleaned && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Cleaned:</span>
                  <span className="text-gray-500 text-xs">
                    {format(new Date(room.lastCleaned), "MMM dd")}
                  </span>
                </div>
              )}
              {room.lastMaintenanceDate && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Maintenance:</span>
                  <span className="text-gray-500 text-xs">
                    {format(new Date(room.lastMaintenanceDate), "MMM dd")}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleQuickStatus(room._id, "clean")}
                disabled={updatingRoom === room._id}
                className="flex-1 h-9 rounded-xl bg-white border border-[#00af00]/20 text-[#00af00] text-xs font-medium inline-flex items-center justify-center gap-1 disabled:opacity-50 hover:bg-[#00af00]/5 hover:shadow-sm transition-all"
              >
                <FiCheckCircle size={12} />
                Clean
              </button>
              <button
                type="button"
                onClick={() => handleQuickStatus(room._id, "to_clean")}
                disabled={updatingRoom === room._id}
                className="flex-1 h-9 rounded-xl bg-white border border-[#0c2bfc]/20 text-[#0c2bfc] text-xs font-medium inline-flex items-center justify-center gap-1 disabled:opacity-50 hover:bg-[#0c2bfc]/5 hover:shadow-sm transition-all"
              >
                <FiClock size={12} />
                To Clean
              </button>
              <button
                type="button"
                onClick={() => handleQuickStatus(room._id, "maintenance")}
                disabled={updatingRoom === room._id}
                className="flex-1 h-9 rounded-xl bg-white border border-red-200 text-red-600 text-xs font-medium inline-flex items-center justify-center gap-1 disabled:opacity-50 hover:bg-red-50 hover:shadow-sm transition-all"
              >
                <FiTool size={12} />
                Maintenance
              </button>
            </div>
          </div>
        ))}
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

      {/* Summary Footer */}
      <div className="text-sm text-gray-600 text-center py-2">
        <p className="font-medium">
          Today's Summary: {stats.clean} clean • {stats.toClean} to clean •{" "}
          {stats.maintenance} in maintenance • {stats.available} available •{" "}
          {stats.occupied} occupied
        </p>
        {stats.dueForMaintenance > 0 && (
          <p className="text-[#0c2bfc] mt-1 flex items-center justify-center gap-1">
            <FiAlertCircle className="text-[#0c2bfc]" />
            {stats.dueForMaintenance} room(s) due for maintenance
          </p>
        )}
      </div>
    </div>
  );
}
