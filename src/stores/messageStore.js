/* -------------------- messageStore.js (Admin Inbox) -------------------- */
import { create } from "zustand";
import { getToken } from "../app/auth.js";

const API_URL =
  import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

export const useMessageStore = create((set, get) => ({
  messages: [],
  loading: false,
  error: null,
  stats: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },

  /* -------------------- FETCH MESSAGES -------------------- */
  fetchMessages: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const token = getToken();
      if (!token) throw new Error("No token found, please login");

      const { status, search, page = 1, limit = 20 } = filters;
      const queryParams = new URLSearchParams();
      if (status) queryParams.append("status", status);
      if (search) queryParams.append("search", search);
      if (page) queryParams.append("page", page);
      if (limit) queryParams.append("limit", limit);

      const res = await fetch(`${API_URL}/messages?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch messages");
      }

      const data = await res.json();
      set({
        messages: data.messages,
        pagination: data.pagination,
        loading: false,
      });
    } catch (err) {
      set({ error: err.message || "Failed to fetch messages", loading: false });
      throw err;
    }
  },

  /* -------------------- FETCH MESSAGE STATS -------------------- */
  fetchMessageStats: async () => {
    set({ loading: true, error: null });
    try {
      const token = getToken();
      if (!token) throw new Error("No token found, please login");

      const res = await fetch(`${API_URL}/messages/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch stats");
      }

      const data = await res.json();
      set({ stats: data, loading: false });
      return data;
    } catch (err) {
      set({ error: err.message || "Failed to fetch stats", loading: false });
      throw err;
    }
  },

  /* -------------------- FETCH SINGLE MESSAGE -------------------- */
  fetchMessageById: async (id) => {
    set({ loading: true, error: null });
    try {
      const token = getToken();
      if (!token) throw new Error("No token found, please login");

      const res = await fetch(`${API_URL}/messages/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch message");
      }

      const data = await res.json();
      set({ loading: false });
      return data;
    } catch (err) {
      set({ error: err.message || "Failed to fetch message", loading: false });
      throw err;
    }
  },

  /* -------------------- REPLY TO MESSAGE -------------------- */
  replyToMessage: async (id, replyMessage) => {
    set({ loading: true, error: null });
    try {
      const token = getToken();
      if (!token) throw new Error("No token found, please login");

      const res = await fetch(`${API_URL}/messages/${id}/reply`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ replyMessage }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to send reply");
      }

      // Update message in state if it exists
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === id ? data.data : msg,
        ),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ error: err.message || "Failed to send reply", loading: false });
      throw err;
    }
  },

  /* -------------------- UPDATE MESSAGE STATUS -------------------- */
  updateMessageStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const token = getToken();
      if (!token) throw new Error("No token found, please login");

      const res = await fetch(`${API_URL}/messages/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.message || data.error || "Failed to update status",
        );
      }

      // Update message in state
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === id ? data.data : msg,
        ),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ error: err.message || "Failed to update status", loading: false });
      throw err;
    }
  },

  /* -------------------- DELETE SINGLE MESSAGE -------------------- */
  deleteMessage: async (id) => {
    set({ loading: true, error: null });
    try {
      const token = getToken();
      if (!token) throw new Error("No token found, please login");

      const res = await fetch(`${API_URL}/messages/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete message");
      }

      // Remove deleted message from state
      set({
        messages: get().messages.filter((msg) => msg._id !== id),
        loading: false,
      });
    } catch (err) {
      set({ error: err.message || "Failed to delete message", loading: false });
      throw err;
    }
  },

  /* -------------------- DELETE MULTIPLE MESSAGES -------------------- */
  deleteMultipleMessages: async (messageIds) => {
    set({ loading: true, error: null });
    try {
      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        throw new Error("messageIds array is required");
      }

      const token = getToken();
      if (!token) throw new Error("No token found, please login");

      const res = await fetch(`${API_URL}/messages/bulk/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messageIds }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.message || data.error || "Failed to delete messages",
        );
      }

      // Remove deleted messages from state
      set({
        messages: get().messages.filter((msg) => !messageIds.includes(msg._id)),
        loading: false,
      });

      return data;
    } catch (err) {
      set({
        error: err.message || "Failed to delete messages",
        loading: false,
      });
      throw err;
    }
  },

  /* -------------------- CLEAR ERROR -------------------- */
  clearError: () => {
    set({ error: null });
  },

  /* -------------------- RESET STORE -------------------- */
  reset: () => {
    set({
      messages: [],
      loading: false,
      error: null,
      stats: null,
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0,
      },
    });
  },
}));
