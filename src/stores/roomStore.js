/* -------------------- roomStore.js -------------------- */
import { create } from "zustand";
import { getToken } from "../app/auth.js";

const API_URL =
  import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

export const useRoomStore = create((set, get) => ({
  rooms: [],
  loading: false,
  error: null,
  lastListParams: {},

  fetchRooms: async (params = {}) => {
    set({ loading: true, error: null, lastListParams: params });
    try {
      const token = getToken();
      if (!token) throw new Error("No token found, please login");

      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_URL}/rooms?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch rooms");
      }

      const data = await res.json();
      set({ rooms: data, loading: false });
    } catch (err) {
      set({ error: err.message || "Failed to fetch rooms", loading: false });
    }
  },

  createRoom: async (payload) => {
    set({ loading: true, error: null });
    try {
      const token = getToken();
      if (!token) throw new Error("No token found, please login");

      const body =
        payload instanceof FormData
          ? payload
          : (() => {
              const fd = new FormData();
              Object.entries(payload).forEach(([key, value]) => {
                if (key === "images")
                  value?.forEach((file) => fd.append("images", file));
                else fd.append(key, value);
              });
              return fd;
            })();

      const res = await fetch(`${API_URL}/rooms`, {
        method: "POST",
        body,
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok)
        throw new Error(data.message || data.error || "Failed to create room");

      await get().fetchRooms(get().lastListParams);
      set({ loading: false });
      return data;
    } catch (err) {
      set({ error: err.message || "Failed to create room", loading: false });
      throw err;
    }
  },

  updateRoom: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const token = getToken();
      if (!token) throw new Error("No token found, please login");

      const body =
        payload instanceof FormData
          ? payload
          : (() => {
              const fd = new FormData();
              Object.entries(payload).forEach(([key, value]) => {
                if (key === "images")
                  value?.forEach((file) => fd.append("images", file));
                else fd.append(key, value);
              });
              return fd;
            })();

      const res = await fetch(`${API_URL}/rooms/${id}`, {
        method: "PUT",
        body,
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data.message || data.error || "Failed to update room");

      await get().fetchRooms(get().lastListParams);
      set({ loading: false });
      return data;
    } catch (err) {
      set({ error: err.message || "Failed to update room", loading: false });
      throw err;
    }
  },

  /* -------------------- DELETE SINGLE ROOM -------------------- */
  deleteRoom: async (id) => {
    set({ loading: true, error: null });
    try {
      const token = getToken();
      if (!token) throw new Error("No token found, please login");

      const res = await fetch(`${API_URL}/rooms/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete room");
      }

      set({
        rooms: get().rooms.filter((r) => r._id !== id),
        loading: false,
      });
    } catch (err) {
      set({ error: err.message || "Failed to delete room", loading: false });
      throw err;
    }
  },

  /* -------------------- DELETE MULTIPLE ROOMS -------------------- */
  deleteMultipleRooms: async (roomIds) => {
    set({ loading: true, error: null });
    try {
      if (!Array.isArray(roomIds) || roomIds.length === 0)
        throw new Error("roomIds array is required");

      const token = getToken();
      if (!token) throw new Error("No token found, please login");

      const res = await fetch(`${API_URL}/rooms/delete-multiple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomIds }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete rooms");
      }

      await get().fetchRooms(get().lastListParams);
      set({ loading: false });
    } catch (err) {
      set({ error: err.message || "Failed to delete rooms", loading: false });
      throw err;
    }
  },

  /* -------------------- DELETE ROOM IMAGE -------------------- */
  deleteRoomImage: async ({ roomId, publicId }) => {
    set({ loading: true, error: null });
    try {
      const token = getToken();
      if (!token) throw new Error("No token found, please login");

      const res = await fetch(`${API_URL}/rooms/delete-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId, publicId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete image");
      }

      const room = await res.json();
      set({
        rooms: get().rooms.map((r) => (r._id === room._id ? room : r)),
        loading: false,
      });

      return room;
    } catch (err) {
      set({ error: err.message || "Failed to delete image", loading: false });
      throw err;
    }
  },
}));
