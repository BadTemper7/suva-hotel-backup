import { create } from "zustand";

const API =
  import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

export const useNotificationStore = create((set) => ({
  notifications: [],
  loading: false,

  // Fetch notifications from the backend
  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const res = await fetch(`${API}/notifications`);
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Failed to fetch notifications");

      set({ notifications: data.items, loading: false });
      return data.items;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  // Mark a notification as read
  markAsRead: async (id) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API}/notifications/${id}/read`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Failed to mark notification as read");

      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, unread: false } : n
        ),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    set({ loading: true });
    try {
      const res = await fetch(`${API}/notifications/read-all`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || "Failed to mark all notifications as read"
        );

      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          unread: false,
        })),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  // Delete a single notification
  deleteNotification: async (id) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API}/notifications/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Failed to delete notification");

      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  // Delete multiple notifications
  deleteMultipleNotifications: async (notificationIds) => {
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      throw new Error("notificationIds must be a non-empty array");
    }

    set({ loading: true });
    try {
      const res = await fetch(`${API}/notifications/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Failed to delete notifications");

      set((state) => ({
        notifications: state.notifications.filter(
          (n) => !notificationIds.includes(n.id)
        ),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },
}));
