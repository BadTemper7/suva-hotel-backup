import { create } from "zustand";

const API =
  import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

export const useReceiptStore = create((set, get) => ({
  receipts: [],
  loading: false,
  error: null,
  lastUpdatedReservation: null,

  // Helper to get auth token
  getAuthHeaders: () => {
    const token =
      localStorage.getItem("suva_guest_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("suva_admin_token");

    return {
      Authorization: token ? `Bearer ${token}` : "",
    };
  },

  // Helper to recalculate billing
  recalculateBilling: async (billingId) => {
    if (!billingId) return;
    try {
      await fetch(`${API}/billings/calculate/${billingId}`, {
        method: "PUT",
      });
      console.log(`✅ Recalculated billing ${billingId}`);
    } catch (error) {
      console.error(`Failed to recalculate billing ${billingId}:`, error);
    }
  },

  // Helper to recalculate multiple billings
  recalculateMultipleBillings: async (billingIds) => {
    const uniqueBillingIds = [...new Set(billingIds.filter((id) => id))];
    if (uniqueBillingIds.length === 0) return;

    console.log(
      `Recalculating ${uniqueBillingIds.length} affected billings...`,
    );
    const promises = uniqueBillingIds.map((id) => get().recalculateBilling(id));
    await Promise.all(promises);
  },

  // Create a new receipt with reference number support
  createReceipt: async (receiptData, file, referenceNumber = null) => {
    set({ loading: true, error: null });
    try {
      const formData = new FormData();

      // Append all receipt data
      formData.append("billingId", receiptData.billingId);
      formData.append("paymentType", receiptData.paymentType);
      formData.append("amountPaid", receiptData.amountPaid);
      formData.append("amountReceived", receiptData.amountReceived);
      formData.append("status", receiptData.status || "confirmed");

      if (receiptData.notes) {
        formData.append("notes", receiptData.notes);
      }

      if (referenceNumber && referenceNumber.trim()) {
        formData.append("referenceNumber", referenceNumber.trim());
      }

      const user = JSON.parse(localStorage.getItem("suva_admin_user") || "{}");
      const userRole = user.role;
      const isAdmin = userRole === "admin" || userRole === "superadmin";
      const isReceptionist = userRole === "receptionist";

      if (isAdmin || isReceptionist) {
        formData.append("isAdminInitiated", "true");
      }

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
      if (billingId) {
        await get().recalculateBilling(billingId);
      }

      set((state) => ({
        receipts: [data.receipt, ...state.receipts],
        loading: false,
      }));

      return data;
    } catch (err) {
      console.error("Create receipt error:", err);
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Delete single receipt
  deleteReceipt: async (receiptId) => {
    set({ loading: true, error: null });
    try {
      const headers = get().getAuthHeaders();
      const receiptToDelete = get().receipts.find((r) => r._id === receiptId);
      const billingId =
        receiptToDelete?.billingId?._id || receiptToDelete?.billingId;

      const res = await fetch(`${API}/receipts/${receiptId}`, {
        method: "DELETE",
        headers,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete receipt");
      }

      if (billingId) {
        await get().recalculateBilling(billingId);
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
      const headers = get().getAuthHeaders();

      const receiptsToDelete = get().receipts.filter((r) =>
        receiptIds.includes(r._id),
      );
      const uniqueBillingIds = receiptsToDelete.map(
        (r) => r.billingId?._id || r.billingId,
      );

      const res = await fetch(`${API}/receipts/bulk`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ receiptIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete receipts");
      }

      await get().recalculateMultipleBillings(uniqueBillingIds);

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

  // Update receipt status
  updateReceiptStatus: async (
    receiptId,
    status,
    reservationId,
    reason = "",
  ) => {
    set({ loading: true, error: null });
    try {
      const headers = get().getAuthHeaders();
      const res = await fetch(`${API}/receipts/${receiptId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ status, reservationId, reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update receipt status");
      }

      const billingId = data.receipt.billingId?._id || data.receipt.billingId;
      if (billingId) {
        await get().recalculateBilling(billingId);
      }

      if (status === "confirmed" && reservationId) {
        try {
          const reservationRes = await fetch(
            `${API}/reservations/${reservationId}/status`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                ...headers,
              },
              body: JSON.stringify({ status: "confirmed" }),
            },
          );

          const reservationData = await reservationRes.json();
          if (reservationRes.ok) {
            const reservation =
              reservationData.reservation ||
              reservationData.data ||
              reservationData;
            set({ lastUpdatedReservation: reservation });
          }
        } catch (reservationErr) {
          console.error("Error updating reservation status:", reservationErr);
        }
      }

      set((state) => ({
        receipts: state.receipts.map((receipt) =>
          receipt._id === receiptId ? data.receipt : receipt,
        ),
        loading: false,
      }));

      return {
        ...data,
        reservationUpdated: status === "confirmed" && !!reservationId,
      };
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Confirm single receipt
  confirmReceipt: async (receiptId, reservationId = null) => {
    set({ loading: true, error: null });
    try {
      const headers = get().getAuthHeaders();
      const res = await fetch(`${API}/receipts/${receiptId}/confirm`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ reservationId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to confirm receipt");
      }

      const billingId = data.receipt.billingId?._id || data.receipt.billingId;
      if (billingId) {
        await get().recalculateBilling(billingId);
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

  // Bulk confirm receipts
  confirmMultipleReceipts: async (receiptIds) => {
    if (!Array.isArray(receiptIds) || receiptIds.length === 0) {
      throw new Error("receiptIds must be a non-empty array");
    }

    set({ loading: true, error: null });
    try {
      const headers = get().getAuthHeaders();
      const receiptsToConfirm = get().receipts.filter((r) =>
        receiptIds.includes(r._id),
      );
      const uniqueBillingIds = receiptsToConfirm.map(
        (r) => r.billingId?._id || r.billingId,
      );

      const res = await fetch(`${API}/receipts/bulk/confirm`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ receiptIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to confirm receipts");
      }

      await get().recalculateMultipleBillings(uniqueBillingIds);

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
      const headers = get().getAuthHeaders();
      const receiptsToReject = get().receipts.filter((r) =>
        receiptIds.includes(r._id),
      );
      const uniqueBillingIds = receiptsToReject.map(
        (r) => r.billingId?._id || r.billingId,
      );

      const res = await fetch(`${API}/receipts/bulk/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ receiptIds, reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to reject receipts");
      }

      await get().recalculateMultipleBillings(uniqueBillingIds);

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
