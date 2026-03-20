import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiCalendar,
  FiTool,
  FiCreditCard,
  FiUser,
} from "react-icons/fi";
import { useNotificationStore } from "../../stores/notificationStore";
import Loader from "./Loader";

export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const {
    notifications,
    loading: storeLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    unreadCount: storeUnreadCount,
  } = useNotificationStore();

  // Show only recent notifications (last 5)
  const recentNotifications = notifications.slice(0, 5);

  const unreadCount = notifications.filter((n) => n.unread).length;

  function getIcon(type) {
    switch (type) {
      case "reservation":
        return <FiCalendar className="text-[#0c2bfc]" />;
      case "maintenance":
        return <FiTool className="text-[#00af00]" />;
      case "billing":
        return <FiCreditCard className="text-[#00af00]" />;
      case "user":
        return <FiUser className="text-[#0c2bfc]" />;
      default:
        return <FiBell className="text-gray-400" />;
    }
  }

  // Format time relative to now
  const formatTime = (timestamp) => {
    if (!timestamp) return "Just now";

    const now = new Date();
    const notificationDate = new Date(timestamp);
    const diffMs = now - notificationDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return notificationDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      if (open) {
        try {
          setLoading(true);
          await fetchNotifications();
        } catch (error) {
          console.error("Failed to fetch notifications:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadNotifications();
  }, [open, fetchNotifications]);

  function goToAllNotifications() {
    setOpen(false);
    navigate("/admin/notifications");
  }

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (notification.unread) {
      try {
        await markAsRead(notification.id || notification._id);
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }

    // Navigate based on notification type
    switch (notification.type || notification.category) {
      case "reservation":
        navigate("/admin/reservations");
        break;
      case "maintenance":
        navigate("/admin/maintenance");
        break;
      case "billing":
        navigate("/admin/billing");
        break;
      case "user":
        navigate("/admin/users");
        break;
      default:
        navigate("/admin/notifications");
    }

    setOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleBellClick = () => {
    setOpen((prev) => {
      const newState = !prev;
      if (newState && unreadCount === 0) {
        // Optional: refresh notifications when opening with no unread
        fetchNotifications().catch(console.error);
      }
      return newState;
    });
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={handleBellClick}
        className="
          relative h-10 w-10
          rounded-xl border border-gray-200
          bg-white
          hover:bg-gray-50
          grid place-items-center
          transition-all duration-300
          hover:shadow-md hover:-translate-y-0.5
          active:translate-y-0
          group
        "
        aria-label="Notifications"
        title="Notifications"
      >
        <FiBell className="text-gray-600 text-xl group-hover:text-[#0c2bfc] transition-colors" />
        {unreadCount > 0 && (
          <span
            className="
            absolute top-2 right-2 h-2 w-2 
            rounded-full 
            bg-[#0c2bfc]
            animate-pulse shadow-sm
          "
          />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
          absolute right-0 mt-2 
          w-[min(24rem,calc(100vw-1.5rem))] 
          rounded-xl 
          bg-white
          shadow-xl overflow-hidden border border-gray-200 z-50
          animate-in fade-in slide-in-from-top-2 duration-200
        "
        >
          {/* Header */}
          <div
            className="
            px-4 py-3 
            bg-gray-50
            border-b border-gray-200
          "
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  Resort Notifications
                </div>
                <div className="text-xs text-gray-500">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                    : `${notifications.length} notification${notifications.length !== 1 ? "s" : ""}`}
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="
                    text-xs font-medium 
                    text-[#0c2bfc] hover:text-[#0a24d6]
                    px-2 py-1 
                    bg-white
                    border border-gray-200
                    rounded-lg 
                    transition-all duration-200
                    hover:shadow-sm hover:-translate-y-0.5
                    active:translate-y-0
                  "
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading || storeLoading ? (
              <div className="px-4 py-8 flex justify-center">
                <Loader size={30} variant="primary" />
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="text-gray-300 mb-2">
                  <FiBell className="w-8 h-8 mx-auto" />
                </div>
                <div className="text-sm text-gray-500">
                  No new notifications
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Resort updates will appear here
                </div>
              </div>
            ) : (
              recentNotifications.map((n) => (
                <div
                  key={n.id || n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`
                    px-4 py-3 
                    transition-all duration-200
                    cursor-pointer
                    border-b border-gray-200 last:border-b-0
                    ${
                      n.unread
                        ? "bg-gray-50 hover:bg-gray-100"
                        : "hover:bg-gray-50"
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="
                      h-10 w-10 rounded-full 
                      bg-white
                      border border-gray-200
                      grid place-items-center 
                      shrink-0 shadow-sm
                    "
                    >
                      {getIcon(n.type || n.category)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm leading-snug">
                          <span
                            className={`font-medium ${
                              n.unread ? "text-gray-800" : "text-gray-700"
                            }`}
                          >
                            {n.title}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 shrink-0">
                          {formatTime(n.createdAt || n.timestamp)}
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 truncate mt-1">
                        {n.description || n.message}
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className="
                          text-xs px-2 py-0.5 
                          bg-gray-100
                          text-gray-700 rounded-full
                          border border-gray-200
                        "
                        >
                          {n.source || n.category}
                        </span>
                        {n.unread && (
                          <span
                            className="
                            text-xs font-medium 
                            text-[#0c2bfc]
                            px-2 py-0.5
                            bg-[#0c2bfc]/5
                            rounded-full
                          "
                          >
                            Unread
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer - Only show if there are more notifications */}
          {(notifications.length > 0 || unreadCount > 0) && (
            <div
              className="
              px-4 py-3 
              border-t border-gray-200
              bg-gray-50
            "
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={goToAllNotifications}
                  className="
                    text-sm font-medium 
                    text-[#0c2bfc] hover:text-[#0a24d6]
                    hover:underline cursor-pointer
                    transition-colors
                  "
                >
                  View all notifications
                </button>
                {notifications.length > 5 && (
                  <span className="text-xs text-gray-500">
                    Showing 5 of {notifications.length}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
