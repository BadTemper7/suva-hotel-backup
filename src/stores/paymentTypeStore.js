import { create } from "zustand";

const API =
  import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

// Only switch to multipart when a file or an explicit removal is involved —
// keeps plain field-only updates (e.g. toggling isActive) as simple JSON.
function buildBody(payload) {
  const hasFile = payload.qrCode instanceof File;
  const hasRemoval = payload.removeQrCode === true;

  if (!hasFile && !hasRemoval) {
    return {
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    };
  }

  const fd = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "qrCode") {
      if (hasFile) fd.append("qrCode", value);
    } else if (value !== undefined && value !== null) {
      fd.append(key, value);
    }
  });
  return { headers: {}, body: fd };
}

const usePaymentTypeStore = create((set) => ({
  paymentTypes: [],
  loading: false,
  error: null,

  // Get all payment types
  fetchPaymentTypes: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/payment-types`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch payment types");
      }

      set({ paymentTypes: data, loading: false });
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Create payment type
  createPaymentType: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { headers, body } = buildBody(payload);
      const res = await fetch(`${API}/payment-types`, {
        method: "POST",
        headers,
        body,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create payment type");
      }

      set((state) => ({
        paymentTypes: [...state.paymentTypes, data.paymentType],
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Update payment type
  updatePaymentType: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const { headers, body } = buildBody(payload);
      const res = await fetch(`${API}/payment-types/${id}`, {
        method: "PATCH",
        headers,
        body,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to update payment type");
      }

      set((state) => ({
        paymentTypes: state.paymentTypes.map((pt) =>
          pt._id === id ? data.paymentType : pt,
        ),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Delete single payment type
  deletePaymentType: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/payment-types/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete payment type");
      }

      set((state) => ({
        paymentTypes: state.paymentTypes.filter((pt) => pt._id !== id),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Delete multiple payment types (bulk)
  deleteMultiplePaymentTypes: async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("ids must be a non-empty array");
    }

    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/payment-types/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentTypeIds: ids }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete payment types");
      }

      set((state) => ({
        paymentTypes: state.paymentTypes.filter((pt) => !ids.includes(pt._id)),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default usePaymentTypeStore;
