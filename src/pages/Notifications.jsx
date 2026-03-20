import React, { useEffect, useState, useMemo } from "react";
import {
  FiCalendar,
  FiTool,
  FiCreditCard,
  FiUser,
  FiEye,
  FiEyeOff,
  FiTrash2,
  FiCheckCircle,
  FiBell,
  FiFilter,
  FiRefreshCw,
  FiChevronRight,
} from "react-icons/fi";
import { useNotificationStore } from "../stores/notificationStore.js";
import toast, { Toaster } from "react-hot-toast";
import Loader from "../components/layout/Loader.jsx";
import Pagination from "../components/ui/Pagination.jsx";

function iconFor(type) {
  switch (type) {
    case "reservation":
      return <FiCalendar className="w-4 h-4" />;
    case "maintenance":
      return <FiTool className="w-4 h-4" />;
    case "billing":
      return <FiCreditCard className="w-4 h-4" />;
    case "user":
      return <FiUser className="w-4 h-4" />;
    default:
      return <FiBell className="w-4 h-4" />;
  }
}

const Notifications = () => {
  const [loading, setLoading] = useState(false);
  const {
    notifications,
    loading: storeLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteMultipleNotifications,
  } = useNotificationStore();

  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setLoading(true);
        await fetchNotifications();
      } catch (error) {
        toast.error(error.message || "Failed to fetch notifications");
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (filter === "unread") {
      filtered = filtered.filter((n) => n.unread);
    } else if (filter === "read") {
      filtered = filtered.filter((n) => !n.unread);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((n) => (n.type || n.category) === typeFilter);
    }

    if (showOnlySelected && selectedNotifications.length > 0) {
      filtered = filtered.filter((n) =>
        selectedNotifications.includes(n.id || n._id),
      );
    }

    return filtered;
  }, [
    notifications,
    filter,
    typeFilter,
    showOnlySelected,
    selectedNotifications,
  ]);

  const total = filteredNotifications.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const paginatedNotifications = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredNotifications.slice(start, start + pageSize);
  }, [filteredNotifications, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [filter, typeFilter, showOnlySelected]);

  useEffect(() => {
    const visibleIds = new Set(filteredNotifications.map((n) => n.id || n._id));
    setSelectedNotifications((prev) => prev.filter((id) => visibleIds.has(id)));
  }, [filteredNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      toast.success("Notification marked as read");
    } catch (error) {
      toast.error(error.message || "Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success("All notifications marked as read");
      setSelectedNotifications([]);
    } catch (error) {
      toast.error(error.message || "Failed to mark all notifications as read");
    }
  };

  const handleDeleteNotification = async (id) => {
    if (window.confirm("Are you sure you want to delete this notification?")) {
      try {
        await deleteNotification(id);
        setSelectedNotifications((prev) => prev.filter((nId) => nId !== id));
        toast.success("Notification deleted");
      } catch (error) {
        toast.error(error.message || "Failed to delete notification");
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedNotifications.length === 0) {
      toast.error("No notifications selected");
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to delete ${selectedNotifications.length} notification(s)?`,
      )
    ) {
      try {
        await deleteMultipleNotifications(selectedNotifications);
        setSelectedNotifications([]);
        toast.success(
          `${selectedNotifications.length} notification(s) deleted`,
        );
      } catch (error) {
        toast.error(error.message || "Failed to delete notifications");
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === paginatedNotifications.length) {
      setSelectedNotifications([]);
    } else {
      const allIds = paginatedNotifications.map((n) => n.id || n._id);
      setSelectedNotifications(allIds);
    }
  };

  const toggleSelectNotification = (id) => {
    setSelectedNotifications((prev) => {
      if (prev.includes(id)) {
        return prev.filter((nId) => nId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "Just now";

    const now = new Date();
    const notificationDate = new Date(timestamp);
    const diffMs = now - notificationDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return notificationDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const unreadCount = notifications.filter((n) => n.unread).length;
  const isAllSelected =
    paginatedNotifications.length > 0 &&
    selectedNotifications.length === paginatedNotifications.length;

  const notificationTypes = [
    { value: "all", label: "All Types" },
    { value: "reservation", label: "Reservations" },
    { value: "billing", label: "Billing" },
    { value: "maintenance", label: "Maintenance" },
    { value: "user", label: "Users" },
    { value: "system", label: "System" },
  ];

  return (
    <div className="h-full min-h-0 flex flex-col gap-6">
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: "linear-gradient(to right, #fef3c7, #fde68a)",
            color: "#92400e",
            border: "1px solid #fbbf24",
          },
        }}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xl font-bold text-amber-900">Notifications</div>
          <div className="text-sm text-amber-600">
            System updates for reservations, billing, maintenance, and users
            {unreadCount > 0 && (
              <span className="ml-2 font-semibold text-amber-700">
                ({unreadCount} unread)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedNotifications.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="
                h-11 px-5 rounded-xl 
                bg-gradient-to-r from-rose-500 to-rose-600 
                hover:from-rose-600 hover:to-rose-700
                text-white text-sm font-medium inline-flex items-center gap-2
                transition-all duration-200
                hover:shadow-lg hover:-translate-y-0.5
                active:translate-y-0
              "
            >
              <FiTrash2 className="w-4 h-4" />
              Delete ({selectedNotifications.length})
            </button>
          )}

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="
                h-11 px-5 rounded-xl 
                bg-gradient-to-r from-amber-500 to-amber-600 
                hover:from-amber-600 hover:to-amber-700
                text-white text-sm font-medium inline-flex items-center gap-2
                transition-all duration-200
                hover:shadow-lg hover:-translate-y-0.5
                active:translate-y-0
              "
            >
              <FiCheckCircle className="w-4 h-4" />
              Mark All as Read
            </button>
          )}

          <button
            onClick={() => fetchNotifications()}
            disabled={loading || storeLoading}
            className="
              h-11 px-5 rounded-xl 
              border border-amber-200 
              bg-gradient-to-r from-white to-amber-50
              hover:from-amber-50 hover:to-white
              text-sm font-medium inline-flex items-center gap-2
              transition-all duration-200
              hover:shadow-md hover:-translate-y-0.5
              active:translate-y-0
              text-amber-700 hover:text-amber-800
              disabled:opacity-70 disabled:cursor-not-allowed
            "
          >
            <FiRefreshCw
              className={`w-4 h-4 ${loading || storeLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div
        className="
        rounded-xl border border-amber-200 
        bg-gradient-to-r from-white to-amber-50/50 backdrop-blur-sm
        p-4 shadow-sm
      "
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FiFilter className="text-amber-500" />
              <span className="text-sm text-amber-600 font-medium">
                Filters
              </span>
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="
                h-11 rounded-xl border border-amber-200 
                bg-white px-4 text-sm outline-none 
                focus:ring-2 focus:ring-amber-200 focus:border-amber-400
                text-amber-700 font-medium
                transition-all duration-200
              "
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="
                h-11 rounded-xl border border-amber-200 
                bg-white px-4 text-sm outline-none 
                focus:ring-2 focus:ring-amber-200 focus:border-amber-400
                text-amber-700 font-medium
                transition-all duration-200
              "
            >
              {notificationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            {selectedNotifications.length > 0 && (
              <button
                onClick={() => setShowOnlySelected(!showOnlySelected)}
                className={`
                  h-11 px-5 rounded-xl 
                  border text-sm font-medium inline-flex items-center gap-2
                  transition-all duration-200
                  hover:shadow-md hover:-translate-y-0.5
                  active:translate-y-0
                  ${
                    showOnlySelected
                      ? "border-amber-500 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700"
                      : "border-amber-200 bg-gradient-to-r from-white to-amber-50 hover:from-amber-50 hover:to-white text-amber-700 hover:text-amber-800"
                  }
                `}
              >
                {showOnlySelected ? (
                  <FiEyeOff className="w-4 h-4" />
                ) : (
                  <FiEye className="w-4 h-4" />
                )}
                Show Selected Only
              </button>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-500 font-medium">Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="
                  h-11 rounded-xl border border-amber-200 
                  bg-white px-4 text-sm outline-none 
                  focus:ring-2 focus:ring-amber-200 focus:border-amber-400
                  text-amber-700 font-medium
                  transition-all duration-200
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
      </div>

      {/* Selection Info Bar */}
      {selectedNotifications.length > 0 && (
        <div className="text-sm text-amber-700 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-xl px-5 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {selectedNotifications.length}
              </span>
              notification{selectedNotifications.length > 1 ? "s" : ""} selected
            </div>
            <button
              onClick={() => setSelectedNotifications([])}
              className="
                px-4 py-1.5 rounded-xl 
                border border-amber-200 
                bg-gradient-to-r from-white to-amber-50
                hover:from-amber-50 hover:to-white
                text-sm font-medium
                transition-all duration-200
                hover:shadow-sm
                text-amber-700 hover:text-amber-800
              "
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div
        className="flex-1 min-h-0 hidden md:flex flex-col 
        bg-gradient-to-br from-white to-amber-50/30 
        border border-amber-200 rounded-xl 
        overflow-hidden shadow-sm"
      >
        <div
          className="
          px-6 py-4 border-b border-amber-200 
          flex items-center justify-between gap-3
          bg-gradient-to-r from-amber-50/50 to-white
        "
        >
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleSelectAll}
              className="
                h-5 w-5 rounded border-amber-300 
                text-amber-600 focus:ring-amber-200
              "
            />
            <div className="text-sm font-semibold text-amber-800">
              Notifications ({total})
            </div>
          </div>

          <div className="text-xs text-amber-500">
            {unreadCount > 0 && `${unreadCount} unread • `}
            Last updated: {formatTime(new Date())}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          {notifications.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="text-amber-400 mb-3">
                <svg
                  className="w-16 h-16 mx-auto opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <div className="text-amber-600 font-medium text-lg">
                No notifications
              </div>
              <div className="text-sm text-amber-500 mt-2">
                You're all caught up!
              </div>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-amber-50/50 to-white sticky top-0 z-10">
                <tr>
                  <th className="text-left font-semibold text-amber-700 px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="h-5 w-5 rounded border-amber-300 text-amber-600 focus:ring-amber-200"
                    />
                  </th>
                  <th className="text-left font-semibold text-amber-700 px-6 py-4">
                    Notification
                  </th>
                  <th className="text-left font-semibold text-amber-700 px-6 py-4">
                    Type
                  </th>
                  <th className="text-left font-semibold text-amber-700 px-6 py-4">
                    Time
                  </th>
                  <th className="text-right font-semibold text-amber-700 px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedNotifications.map((n) => {
                  const notificationId = n.id || n._id;
                  const isSelected =
                    selectedNotifications.includes(notificationId);

                  return (
                    <tr
                      key={notificationId}
                      className={`
                        border-b border-amber-100 last:border-b-0
                        transition-colors duration-150
                        ${isSelected ? "bg-gradient-to-r from-amber-50/50 to-amber-100/30" : ""}
                        ${n.unread ? "bg-gradient-to-r from-blue-50/30 to-blue-100/10 hover:from-blue-50/50 hover:to-blue-100/30" : "hover:bg-gradient-to-r hover:from-amber-50/30 hover:to-white"}
                      `}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            toggleSelectNotification(notificationId)
                          }
                          className="
                            h-5 w-5 rounded border-amber-300 
                            text-amber-600 focus:ring-amber-200
                          "
                        />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`
                              h-10 w-10 rounded-xl border flex items-center justify-center
                              ${
                                n.unread
                                  ? "border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600"
                                  : "border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-600"
                              }
                            `}
                          >
                            {iconFor(n.type || n.category)}
                          </div>
                          <div>
                            <div className="font-semibold text-amber-800">
                              {n.title}
                            </div>
                            <div className="text-amber-600 mt-1">
                              {n.description || n.message}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="
                              px-3 py-1.5 rounded-full 
                              bg-gradient-to-r from-amber-100 to-amber-50
                              text-amber-800 text-xs font-medium
                              border border-amber-200
                              capitalize
                            "
                          >
                            {n.source || n.category || n.type || "System"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-amber-600">
                          {formatTime(n.createdAt || n.timestamp)}
                        </div>
                        {n.unread && (
                          <div className="flex items-center gap-1 mt-1">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                            <span className="text-xs text-blue-600 font-medium">
                              Unread
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {n.unread && (
                            <button
                              onClick={() => handleMarkAsRead(notificationId)}
                              className="
                                h-9 px-3 rounded-xl 
                                border border-blue-200 
                                bg-gradient-to-r from-white to-blue-50
                                hover:from-blue-50 hover:to-white
                                text-sm font-medium inline-flex items-center gap-1
                                transition-all duration-200
                                hover:shadow-md hover:-translate-y-0.5
                                active:translate-y-0
                                text-blue-700 hover:text-blue-800
                              "
                            >
                              <FiCheckCircle className="w-3.5 h-3.5" />
                              Mark as Read
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDeleteNotification(notificationId)
                            }
                            className="
                              h-9 px-3 rounded-xl 
                              border border-rose-200 
                              bg-gradient-to-r from-white to-rose-50
                              hover:from-rose-50 hover:to-white
                              text-sm font-medium inline-flex items-center gap-1
                              transition-all duration-200
                              hover:shadow-md hover:-translate-y-0.5
                              active:translate-y-0
                              text-rose-700 hover:text-rose-800
                            "
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {paginatedNotifications.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="text-amber-400 mb-3">
                        <svg
                          className="w-16 h-16 mx-auto opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                          />
                        </svg>
                      </div>
                      <div className="text-amber-600 font-medium text-lg">
                        No notifications found
                      </div>
                      <div className="text-sm text-amber-500 mt-2">
                        Try adjusting your filters or selection
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Mobile Notifications List */}
      <div className="md:hidden space-y-3">
        {paginatedNotifications.map((n) => {
          const notificationId = n.id || n._id;
          const isSelected = selectedNotifications.includes(notificationId);

          return (
            <div
              key={notificationId}
              className={`
                rounded-xl border p-4
                bg-gradient-to-r from-white to-amber-50/50 backdrop-blur-sm
                shadow-sm hover:shadow-md transition-all duration-300
                hover:-translate-y-0.5
                ${isSelected ? "border-amber-500 bg-gradient-to-r from-amber-50 to-amber-100" : "border-amber-200"}
                ${n.unread ? "border-l-4 border-l-blue-500" : ""}
              `}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelectNotification(notificationId)}
                  className="
                    mt-1 h-5 w-5 rounded border-amber-300 
                    text-amber-600 focus:ring-amber-200
                  "
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        h-10 w-10 rounded-xl border flex items-center justify-center flex-shrink-0
                        ${
                          n.unread
                            ? "border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600"
                            : "border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-600"
                        }
                      `}
                    >
                      {iconFor(n.type || n.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-amber-800 truncate">
                        {n.title}
                      </div>
                      <div className="text-xs text-amber-600 mt-1">
                        {n.description || n.message}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className="
                        px-2 py-1 rounded-full 
                        bg-gradient-to-r from-amber-100 to-amber-50
                        text-amber-700 border border-amber-200
                        capitalize
                      "
                    >
                      {n.source || n.category || n.type || "System"}
                    </span>
                    <span className="text-amber-500">
                      {formatTime(n.createdAt || n.timestamp)}
                    </span>
                    {n.unread && (
                      <span className="text-blue-600 font-medium flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
                        Unread
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {n.unread && (
                  <button
                    onClick={() => handleMarkAsRead(notificationId)}
                    className="flex-1 h-9 rounded-xl bg-gradient-to-r from-white to-blue-50 border border-blue-200 text-blue-700 text-xs font-medium inline-flex items-center justify-center gap-1 hover:from-blue-50 hover:to-white hover:shadow-sm transition-all"
                  >
                    <FiCheckCircle size={12} />
                    Mark as Read
                  </button>
                )}
                <button
                  onClick={() => handleDeleteNotification(notificationId)}
                  className="flex-1 h-9 rounded-xl bg-gradient-to-r from-white to-rose-50 border border-rose-200 text-rose-700 text-xs font-medium inline-flex items-center justify-center gap-1 hover:from-rose-50 hover:to-white hover:shadow-sm transition-all"
                >
                  <FiTrash2 size={12} />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        setPage={setPage}
        total={total}
        pageSize={pageSize}
        color="amber"
      />

      {/* Loader overlay */}
      {(loading || storeLoading) && (
        <div
          className="
          absolute inset-0 z-50 flex items-center justify-center 
          bg-gradient-to-br from-white/90 to-amber-50/90 backdrop-blur-sm
          rounded-xl
        "
        >
          <Loader
            size={60}
            variant="gradient"
            showText={true}
            text="Loading notifications..."
          />
        </div>
      )}
    </div>
  );
};

export default Notifications;
