import { create } from "zustand";

const API =
  import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

export const usePaymentOptionStore = create((set, get) => ({
  paymentOptions: [],
  loading: false,

  /* =========================
   * FETCH PAYMENT OPTIONS
   * ========================= */
  fetchPaymentOptions: async () => {
    set({ loading: true });
    try {
      const res = await fetch(`${API}/payment-options`);
      const data = await res.json();

      if (!res.ok)
        throw new Error(data?.error || "Failed to fetch payment options");

      set({ paymentOptions: data, loading: false });
      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  /* =========================
   * CREATE PAYMENT OPTION
   * ========================= */
  createPaymentOption: async (payload) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API}/payment-options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to create payment option");

      set((state) => ({
        paymentOptions: [data.paymentOption, ...state.paymentOptions],
        loading: false,
      }));

      return data.paymentOption;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  /* =========================
   * UPDATE PAYMENT OPTION
   * ========================= */
  updatePaymentOption: async (id, payload) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API}/payment-options/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to update payment option");

      set((state) => ({
        paymentOptions: state.paymentOptions.map((po) =>
          po._id === id ? data.paymentOption : po,
        ),
        loading: false,
      }));

      return data.paymentOption;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  /* =========================
   * DELETE SINGLE PAYMENT OPTION
   * ========================= */
  deletePaymentOption: async (id) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API}/payment-options/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to delete payment option");

      set((state) => ({
        paymentOptions: state.paymentOptions.filter((po) => po._id !== id),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  /* =========================
   * DELETE MULTIPLE PAYMENT OPTIONS
   * ========================= */
  deleteMultiplePaymentOptions: async (paymentOptionIds) => {
    if (!Array.isArray(paymentOptionIds) || paymentOptionIds.length === 0) {
      throw new Error("paymentOptionIds must be a non-empty array");
    }

    set({ loading: true });
    try {
      const res = await fetch(`${API}/payment-options/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentOptionIds }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to delete payment options");

      set((state) => ({
        paymentOptions: state.paymentOptions.filter(
          (po) => !paymentOptionIds.includes(po._id),
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
