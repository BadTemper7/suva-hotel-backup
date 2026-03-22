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
  FiX,
  FiCheck,
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

  const clearSelection = () => {
    setSelectedNotifications([]);
    setShowOnlySelected(false);
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
          <div className="text-xl font-bold text-gray-900">Notifications</div>
          <div className="text-sm text-gray-600">
            System updates for reservations, billing, maintenance, and users
            {unreadCount > 0 && (
              <span className="ml-2 font-semibold text-[#0c2bfc]">
                ({unreadCount} unread)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedNotifications.length > 0 && (
            <>
              <button
                onClick={handleDeleteSelected}
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
                <FiTrash2 className="w-4 h-4" />
                Delete ({selectedNotifications.length})
              </button>
              <button
                onClick={clearSelection}
                className="
                  h-11 px-5 rounded-xl 
                  border border-gray-200 
                  bg-white
                  hover:bg-gray-50
                  text-sm font-medium inline-flex items-center gap-2
                  transition-all duration-200
                  hover:shadow-md hover:-translate-y-0.5
                  active:translate-y-0
                  text-gray-700
                "
              >
                <FiX className="w-4 h-4" />
                Clear
              </button>
            </>
          )}

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="
                h-11 px-5 rounded-xl 
                bg-[#00af00] 
                hover:bg-[#009c00]
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
              border border-gray-200 
              bg-white
              hover:bg-gray-50
              text-sm font-medium inline-flex items-center gap-2
              transition-all duration-200
              hover:shadow-md hover:-translate-y-0.5
              active:translate-y-0
              text-gray-700
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
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-500" />
              <span className="text-sm text-gray-600 font-medium">Filters</span>
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="
                h-11 rounded-xl border border-gray-200 
                bg-white px-4 text-sm outline-none 
                focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
                text-gray-700 font-medium
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
                h-11 rounded-xl border border-gray-200 
                bg-white px-4 text-sm outline-none 
                focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
                text-gray-700 font-medium
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
                      ? "border-[#0c2bfc] bg-[#0c2bfc]/5 text-[#0c2bfc]"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
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
              <span className="text-xs text-gray-500 font-medium">Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
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
        <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                {selectedNotifications.length}
              </span>
              notification{selectedNotifications.length > 1 ? "s" : ""} selected
            </div>
            <button
              onClick={clearSelection}
              className="
                px-4 py-1.5 rounded-xl 
                border border-gray-200 
                bg-white
                hover:bg-gray-50
                text-sm font-medium
                transition-all duration-200
                hover:shadow-sm
                text-gray-700
              "
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Notifications Grid */}
      <div className="grid grid-cols-1 gap-4">
        {notifications.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
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
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <div className="text-gray-700 font-medium text-lg">
              No notifications
            </div>
            <div className="text-sm text-gray-500 mt-2">
              You're all caught up!
            </div>
          </div>
        ) : (
          paginatedNotifications.map((n) => {
            const notificationId = n.id || n._id;
            const isSelected = selectedNotifications.includes(notificationId);

            return (
              <div
                key={notificationId}
                className={`
                  group relative cursor-pointer
                  rounded-xl border-2
                  bg-white
                  p-5 shadow-sm
                  transition-all duration-300
                  hover:shadow-lg hover:-translate-y-1
                  focus:outline-none focus:ring-2 focus:ring-[#0c2bfc]/20
                  ${
                    isSelected
                      ? "border-[#0c2bfc] bg-[#0c2bfc]/5"
                      : "border-gray-200 hover:border-gray-300"
                  }
                  ${n.unread ? "border-l-4 border-l-[#0c2bfc]" : ""}
                `}
                onClick={() => {
                  if (n.unread) {
                    handleMarkAsRead(notificationId);
                  }
                }}
              >
                {/* Selection checkbox */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelectNotification(notificationId);
                  }}
                  className={`
                    absolute left-5 top-5 z-10
                    w-5 h-5 rounded border-2 flex items-center justify-center
                    transition-all duration-200
                    ${
                      isSelected
                        ? "bg-[#0c2bfc] border-[#0c2bfc] text-white"
                        : "bg-white border-gray-300 hover:border-[#0c2bfc] hover:shadow-sm"
                    }
                  `}
                  title={isSelected ? "Deselect" : "Select"}
                >
                  {isSelected && <FiCheck size={12} />}
                </button>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNotification(notificationId);
                  }}
                  className="
                    absolute right-5 top-5 z-10
                    w-9 h-9 rounded-xl
                    bg-white
                    border border-gray-200
                    text-[#0c2bfc]
                    opacity-0 group-hover:opacity-100
                    hover:bg-gray-50
                    hover:border-gray-300 hover:shadow-md
                    focus:opacity-100
                    focus:outline-none focus:ring-2 focus:ring-[#0c2bfc]/20
                    transition-all duration-200
                    grid place-items-center
                  "
                  title="Delete notification"
                >
                  <FiTrash2 size={16} />
                </button>

                {/* Content */}
                <div className="ml-7">
                  <div className="flex items-start gap-4">
                    <div
                      className={`
                        h-12 w-12 rounded-xl border flex items-center justify-center flex-shrink-0
                        ${
                          n.unread
                            ? "border-[#0c2bfc] bg-[#0c2bfc]/10 text-[#0c2bfc]"
                            : "border-gray-200 bg-gray-50 text-gray-500"
                        }
                      `}
                    >
                      {iconFor(n.type || n.category)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-base font-semibold text-gray-900 group-hover:text-[#0c2bfc] transition-colors duration-200">
                            {n.title}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {n.description || n.message}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTime(n.createdAt || n.timestamp)}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span
                          className={`
                            px-3 py-1.5 rounded-full text-xs font-medium
                            ${
                              n.source === "Front Desk"
                                ? "bg-[#0c2bfc]/10 text-[#0c2bfc]"
                                : "bg-gray-100 text-gray-700"
                            }
                            capitalize
                          `}
                        >
                          {n.source || n.category || n.type || "System"}
                        </span>
                        {n.unread && (
                          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                            Unread
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Select All / Deselect All */}
      {paginatedNotifications.length > 0 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="
              text-sm font-medium inline-flex items-center gap-2
              text-[#0c2bfc] hover:text-[#0a24d6]
              transition-colors duration-200
            "
          >
            {isAllSelected ? "Deselect All" : "Select All"}
          </button>
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{total}</span>{" "}
            notification{total > 1 ? "s" : ""} total
          </div>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        setPage={setPage}
        total={total}
        pageSize={pageSize}
        color="blue"
      />

      {/* Loader overlay */}
      {(loading || storeLoading) && (
        <div
          className="
          absolute inset-0 z-50 flex items-center justify-center 
          bg-white/90 backdrop-blur-sm
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
