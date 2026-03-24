// src/stores/addOnStore.js
import { create } from "zustand";

const API =
  import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

export const useAddOnStore = create((set, get) => ({
  addOns: [],
  loading: false,
  error: null,

  // Fetch all add-ons
  fetchAddOns: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = queryParams
        ? `${API}/add-ons?${queryParams}`
        : `${API}/add-ons`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to fetch add-ons");
      set({ addOns: data, loading: false, error: null });
      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Create a new add-on
  createAddOn: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/add-ons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to create add-on");
      set((state) => ({
        addOns: [data, ...state.addOns],
        loading: false,
        error: null,
      }));
      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Update an add-on
  updateAddOn: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/add-ons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update add-on");

      set((state) => ({
        addOns: state.addOns.map((a) => (a._id === id ? data : a)),
        loading: false,
        error: null,
      }));

      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Update add-on stock
  updateAddOnStock: async (id, stock, operation = "set") => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/add-ons/${id}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock, operation }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update stock");

      set((state) => ({
        addOns: state.addOns.map((a) => (a._id === id ? data.addOn : a)),
        loading: false,
        error: null,
      }));

      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Delete a single add-on
  deleteAddOn: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/add-ons/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to delete add-on");

      set((state) => ({
        addOns: state.addOns.filter((a) => a._id !== id),
        loading: false,
        error: null,
      }));

      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Delete multiple add-ons
  deleteMultipleAddOns: async (addOnIds) => {
    if (!Array.isArray(addOnIds) || addOnIds.length === 0) {
      throw new Error("addOnIds must be a non-empty array");
    }

    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/add-ons/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addOnIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to delete add-ons");

      set((state) => ({
        addOns: state.addOns.filter((a) => !addOnIds.includes(a._id)),
        loading: false,
        error: null,
      }));

      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Get a single add-on by ID
  getAddOnById: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/add-ons/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to fetch add-on");
      set({ loading: false, error: null });
      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Get add-ons by category
  getAddOnsByCategory: async (category) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/add-ons?category=${category}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to fetch add-ons");
      set({ addOns: data, loading: false, error: null });
      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Get active add-ons only
  getActiveAddOns: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/add-ons?activeOnly=true`);
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Failed to fetch active add-ons");
      set({ addOns: data, loading: false, error: null });
      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Clear all add-ons (useful for logout/reset)
  clearAddOns: () => {
    set({ addOns: [], loading: false, error: null });
  },

  // Get add-on by name (for search)
  getAddOnByName: async (name) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/add-ons?q=${encodeURIComponent(name)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to search add-ons");
      set({ addOns: data, loading: false, error: null });
      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Get low stock add-ons (stock < threshold)
  getLowStockAddOns: async (threshold = 10) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(
        `${API}/add-ons?lowStock=true&threshold=${threshold}`,
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Failed to fetch low stock add-ons");
      set({ addOns: data, loading: false, error: null });
      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Bulk update add-on status
  bulkUpdateStatus: async (addOnIds, status) => {
    if (!Array.isArray(addOnIds) || addOnIds.length === 0) {
      throw new Error("addOnIds must be a non-empty array");
    }

    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/add-ons/bulk/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addOnIds, status }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Failed to update add-on status");

      set((state) => ({
        addOns: state.addOns.map((a) =>
          addOnIds.includes(a._id) ? { ...a, status } : a,
        ),
        loading: false,
        error: null,
      }));

      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Get add-on categories (for filter dropdowns)
  getCategories: () => {
    const categories = [
      ...new Set(
        get()
          .addOns.map((a) => a.category)
          .filter(Boolean),
      ),
    ];
    return categories;
  },

  // Get add-on count by category
  getCountByCategory: () => {
    const counts = {};
    get().addOns.forEach((addOn) => {
      const category = addOn.category || "other";
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  },

  // Get total stock value (for dashboard)
  getTotalStockValue: () => {
    return get().addOns.reduce((total, addOn) => {
      return total + addOn.rate * addOn.stock;
    }, 0);
  },

  // Check if add-on name exists (for validation)
  checkNameExists: (name, excludeId = null) => {
    return get().addOns.some(
      (addOn) =>
        addOn.name.toLowerCase() === name.toLowerCase() &&
        addOn._id !== excludeId,
    );
  },
}));
