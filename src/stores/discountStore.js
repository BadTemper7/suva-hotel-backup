import { create } from "zustand";

const API =
  import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

export const useDiscountTypeStore = create((set, get) => ({
  discounts: [],
  loading: false,

  /* =========================
   * FETCH DISCOUNTS
   * ========================= */
  fetchDiscounts: async (params = {}) => {
    set({ loading: true });
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API}/discounts${query ? `?${query}` : ""}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Failed to fetch discounts");

      set({ discounts: data, loading: false });
      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  /* =========================
   * CREATE DISCOUNT
   * ========================= */
  createDiscount: async (payload) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API}/discounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create discount");

      set((state) => ({
        discounts: [data.discount, ...state.discounts],
        loading: false,
      }));

      return data.discount;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  /* =========================
   * UPDATE DISCOUNT
   * ========================= */
  updateDiscount: async (id, payload) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API}/discounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update discount");

      set((state) => ({
        discounts: state.discounts.map((d) =>
          d._id === id ? data.discount : d,
        ),
        loading: false,
      }));

      return data.discount;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  /* =========================
   * DELETE SINGLE DISCOUNT
   * ========================= */
  deleteDiscount: async (id) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API}/discounts/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete discount");

      set((state) => ({
        discounts: state.discounts.filter((d) => d._id !== id),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  /* =========================
   * DELETE MULTIPLE DISCOUNTS
   * ========================= */
  deleteMultipleDiscounts: async (discountIds) => {
    if (!Array.isArray(discountIds) || discountIds.length === 0) {
      throw new Error("discountIds must be a non-empty array");
    }

    set({ loading: true });
    try {
      const res = await fetch(`${API}/discounts/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discountIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete discounts");

      set((state) => ({
        discounts: state.discounts.filter((d) => !discountIds.includes(d._id)),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },
}));
