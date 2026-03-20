import { create } from "zustand";

const API =
  import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

export const useAmenityStore = create((set, get) => ({
  amenities: [],
  loading: false,

  fetchAmenities: async () => {
    set({ loading: true });
    try {
      const res = await fetch(`${API}/amenities`);
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Failed to fetch amenities");
      set({ amenities: data, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  createAmenity: async (payload) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API}/amenities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to create amenity");
      set((state) => ({
        amenities: [data, ...state.amenities],
        loading: false,
      }));
      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  updateAmenity: async (id, payload) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API}/amenities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update amenity");

      set((state) => ({
        amenities: state.amenities.map((a) => (a._id === id ? data : a)),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  deleteAmenity: async (id) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API}/amenities/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to delete amenity");

      set((state) => ({
        amenities: state.amenities.filter((a) => a._id !== id),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },
  deleteMultipleAmenities: async (amenityIds) => {
    if (!Array.isArray(amenityIds) || amenityIds.length === 0) {
      throw new Error("amenityIds must be a non-empty array");
    }

    set({ loading: true });
    try {
      const res = await fetch(`${API}/amenities/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amenityIds }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Failed to delete amenities");

      set((state) => ({
        amenities: state.amenities.filter((a) => !amenityIds.includes(a._id)),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },
}));
