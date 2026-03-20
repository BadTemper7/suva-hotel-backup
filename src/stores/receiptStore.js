// stores/receiptStore.js
import { create } from "zustand";

const API =
  import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

export const useReceiptStore = create((set) => ({
  receipts: [],
  loading: false,
  error: null,

  // Create a new receipt
  createReceipt: async (receiptData, file) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();

      // Append all receipt data
      Object.keys(receiptData).forEach((key) => {
        if (key === "paymentType" && typeof receiptData[key] === "object") {
          // If paymentType is an object, use its _id
          formData.append(key, receiptData[key]._id || receiptData[key]);
        } else {
          formData.append(key, receiptData[key]);
        }
      });

      // Append file if provided
      if (file) {
        formData.append("receiptImage", file);
      }

      const res = await fetch(`${API}/receipts/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to create receipt");
      }

      const billingId = data.receipt.billingId;
      await fetch(`${API}/billings/calculate/${billingId}`, {
        method: "PUT",
      });

      set((state) => ({
        receipts: [...state.receipts, data.receipt],
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // ✅ Update receipt status (pending | confirmed | rejected)
  updateReceiptStatus: async (receiptId, status, reason = "") => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/receipts/${receiptId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update receipt status");
      }
      const billingId = data.receipt.billingId._id;
      await fetch(`${API}/billings/calculate/${billingId}`, {
        method: "PUT",
      });

      // Update receipt in local state with the returned receipt
      set((state) => ({
        receipts: state.receipts.map((receipt) =>
          receipt._id === receiptId ? data.receipt : receipt,
        ),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Confirm a receipt
  confirmReceipt: async (receiptId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/receipts/${receiptId}/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to confirm receipt");
      }

      set((state) => ({
        receipts: state.receipts.map((receipt) =>
          receipt._id === receiptId ? data.receipt : receipt,
        ),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Reject a receipt
  rejectReceipt: async (receiptId, reason) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/receipts/${receiptId}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to reject receipt");
      }

      set((state) => ({
        receipts: state.receipts.map((receipt) =>
          receipt._id === receiptId ? data.receipt : receipt,
        ),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Delete a receipt
  deleteReceipt: async (receiptId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/receipts/${receiptId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete receipt");
      }

      set((state) => ({
        receipts: state.receipts.filter((receipt) => receipt._id !== receiptId),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Bulk delete receipts
  deleteMultipleReceipts: async (receiptIds) => {
    if (!Array.isArray(receiptIds) || receiptIds.length === 0) {
      throw new Error("receiptIds must be a non-empty array");
    }

    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/receipts/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptIds }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete receipts");
      }

      // Remove deleted receipts from state
      set((state) => ({
        receipts: state.receipts.filter((r) => !receiptIds.includes(r._id)),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Bulk confirm receipts
  confirmMultipleReceipts: async (receiptIds) => {
    if (!Array.isArray(receiptIds) || receiptIds.length === 0) {
      throw new Error("receiptIds must be a non-empty array");
    }

    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/receipts/bulk/confirm`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to confirm receipts");
      }

      // Update the receipts in local state
      set((state) => ({
        receipts: state.receipts.map((receipt) =>
          receiptIds.includes(receipt._id)
            ? { ...receipt, status: "confirmed" }
            : receipt,
        ),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Bulk reject receipts
  rejectMultipleReceipts: async (receiptIds, reason = "") => {
    if (!Array.isArray(receiptIds) || receiptIds.length === 0) {
      throw new Error("receiptIds must be a non-empty array");
    }

    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/receipts/bulk/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptIds, reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to reject receipts");
      }

      // Update the receipts in local state
      set((state) => ({
        receipts: state.receipts.map((receipt) =>
          receiptIds.includes(receipt._id)
            ? {
                ...receipt,
                status: "rejected",
                notes: reason ? `Bulk rejected: ${reason}` : receipt.notes,
              }
            : receipt,
        ),
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Fetch receipts for a billing
  fetchReceiptsByBilling: async (billingId) => {
    // Validate that billingId is a valid ID, not "bulk"
    if (billingId === "bulk" || !billingId) {
      throw new Error("Invalid billing ID");
    }

    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/receipts/billing/${billingId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch receipts");
      }

      set({ receipts: data, loading: false });
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Get receipt by ID
  getReceiptById: async (receiptId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/receipts/${receiptId}`);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch receipt");
      }

      set({ loading: false });
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
