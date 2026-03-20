import { create } from "zustand";

// Prefer deployed API, fallback to local
const API_URL =
  import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

export const useRoomTypeStore = create((set, get) => ({
  roomTypes: [],
  loading: false,
  error: null,

  // Fetch all room types
  fetchRoomTypes: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/room-types`);
      if (!res.ok) throw new Error("Failed to fetch room types");
      const data = await res.json();
      set({ roomTypes: data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  // Create
  createRoomType: async (payload) => {
    const res = await fetch(`${API_URL}/room-types`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create room type");
    }

    const { roomType } = await res.json();
    set({ roomTypes: [roomType, ...get().roomTypes] });
  },

  // Update (name/status)
  updateRoomType: async (id, payload) => {
    const res = await fetch(`${API_URL}/room-types/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update room type");
    }

    const { roomType } = await res.json();

    set({
      roomTypes: get().roomTypes.map((rt) => (rt._id === id ? roomType : rt)),
    });
  },

  // Update status only
  updateRoomTypeStatus: async (id, status) => {
    const res = await fetch(`${API_URL}/room-types/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update status");
    }

    const { roomType } = await res.json();

    set({
      roomTypes: get().roomTypes.map((rt) => (rt._id === id ? roomType : rt)),
    });
  },

  // Delete
  deleteRoomType: async (id) => {
    const res = await fetch(`${API_URL}/room-types/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to delete room type");
    }

    set({
      roomTypes: get().roomTypes.filter((rt) => rt._id !== id),
    });
  },
}));
