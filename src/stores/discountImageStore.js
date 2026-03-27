// stores/discountImageStore.js
import { create } from "zustand";

const API =
  import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

export const useDiscountImageStore = create((set, get) => ({
  discountImages: [],
  loading: false,
  error: null,

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
      const response = await fetch(`${API}/billings/calculate/${billingId}`, {
        method: "PUT",
        headers: get().getAuthHeaders(),
      });

      if (response.ok) {
        console.log(`✅ Recalculated billing ${billingId}`);
      } else {
        console.error(
          `Failed to recalculate billing ${billingId}: ${response.status}`,
        );
      }
    } catch (error) {
      console.error(`Error recalculating billing ${billingId}:`, error);
    }
  },

  // Helper to recalculate multiple billings
  recalculateMultipleBillings: async (billingIds) => {
    const uniqueBillingIds = [...new Set(billingIds.filter((id) => id))];
    if (uniqueBillingIds.length === 0) return;

    console.log(
      `🔄 Recalculating ${uniqueBillingIds.length} affected billings...`,
    );
    const promises = uniqueBillingIds.map((id) => get().recalculateBilling(id));
    await Promise.all(promises);
  },

  /* =========================
   * FETCH DISCOUNT IMAGES BY BILLING
   * ========================= */
  fetchDiscountImagesByBilling: async (billingId) => {
    if (!billingId) {
      throw new Error("Billing ID is required");
    }

    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/discount-images/billing/${billingId}`);
      const data = await res.json();

      if (!res.ok)
        throw new Error(data?.error || "Failed to fetch discount images");

      set({ discountImages: data, loading: false });
      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  /* =========================
   * FETCH ALL DISCOUNT IMAGES
   * ========================= */
  fetchAllDiscountImages: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(
        `${API}/discount-images${query ? `?${query}` : ""}`,
        {
          headers: get().getAuthHeaders(),
        },
      );
      const data = await res.json();

      if (!res.ok)
        throw new Error(data?.error || "Failed to fetch discount images");

      set({ discountImages: data, loading: false });
      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  /* =========================
   * CREATE DISCOUNT IMAGE
   * ========================= */
  createDiscountImage: async (formData) => {
    set({ loading: true, error: null });

    // Extract billingId before sending
    const billingId = formData.get("billingId");

    try {
      const res = await fetch(`${API}/discount-images`, {
        method: "POST",
        headers: get().getAuthHeaders(),
        body: formData,
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to upload discount image");

      set((state) => ({
        discountImages: [data.discountImage, ...state.discountImages],
        loading: false,
      }));

      // Recalculate billing to reflect the pending discount
      if (billingId) {
        await get().recalculateBilling(billingId);
      }

      return data.discountImage;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  /* =========================
   * CONFIRM DISCOUNT IMAGE
   * ========================= */
  confirmDiscountImage: async (discountImageId, userId) => {
    set({ loading: true, error: null });

    // Get the current image to know its billingId before update
    const currentImage = get().discountImages.find(
      (img) => img._id === discountImageId,
    );
    const billingId = currentImage?.billingId?._id || currentImage?.billingId;

    try {
      const res = await fetch(`${API}/discount-images/confirm`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...get().getAuthHeaders(),
        },
        body: JSON.stringify({ discountImageId, userId }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to confirm discount image");

      set((state) => ({
        discountImages: state.discountImages.map((img) =>
          img._id === discountImageId ? data.discountImage : img,
        ),
        loading: false,
      }));

      // Recalculate billing to apply the confirmed discount
      if (billingId) {
        await get().recalculateBilling(billingId);
      }

      return data.discountImage;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  /* =========================
   * REJECT DISCOUNT IMAGE
   * ========================= */
  rejectDiscountImage: async (discountImageId, userId, reason) => {
    set({ loading: true, error: null });

    // Get the current image to know its billingId before update
    const currentImage = get().discountImages.find(
      (img) => img._id === discountImageId,
    );
    const billingId = currentImage?.billingId?._id || currentImage?.billingId;

    try {
      const res = await fetch(`${API}/discount-images/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...get().getAuthHeaders(),
        },
        body: JSON.stringify({ discountImageId, userId, reason }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to reject discount image");

      set((state) => ({
        discountImages: state.discountImages.map((img) =>
          img._id === discountImageId ? data.discountImage : img,
        ),
        loading: false,
      }));

      // Recalculate billing to remove the rejected discount
      if (billingId) {
        await get().recalculateBilling(billingId);
      }

      return data.discountImage;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  /* =========================
   * DELETE SINGLE DISCOUNT IMAGE
   * ========================= */
  deleteDiscountImage: async (discountImageId) => {
    set({ loading: true, error: null });

    // Get the image before deletion to know its billingId
    const currentImage = get().discountImages.find(
      (img) => img._id === discountImageId,
    );
    const billingId = currentImage?.billingId?._id || currentImage?.billingId;

    try {
      const res = await fetch(`${API}/discount-images/${discountImageId}`, {
        method: "DELETE",
        headers: get().getAuthHeaders(),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to delete discount image");

      set((state) => ({
        discountImages: state.discountImages.filter(
          (img) => img._id !== discountImageId,
        ),
        loading: false,
      }));

      // Recalculate billing if the deleted image was associated with a billing
      if (billingId) {
        await get().recalculateBilling(billingId);
      }

      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  /* =========================
   * DELETE MULTIPLE DISCOUNT IMAGES
   * ========================= */
  deleteMultipleDiscountImages: async (discountImageIds) => {
    if (!Array.isArray(discountImageIds) || discountImageIds.length === 0) {
      throw new Error("discountImageIds must be a non-empty array");
    }

    set({ loading: true, error: null });

    // Get unique billingIds from images being deleted
    const currentImages = get().discountImages;
    const affectedBillingIds = new Set();

    discountImageIds.forEach((id) => {
      const image = currentImages.find((img) => img._id === id);
      const billingId = image?.billingId?._id || image?.billingId;
      if (billingId) {
        affectedBillingIds.add(billingId);
      }
    });

    try {
      const res = await fetch(`${API}/discount-images/bulk`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...get().getAuthHeaders(),
        },
        body: JSON.stringify({ discountImageIds }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to delete discount images");

      set((state) => ({
        discountImages: state.discountImages.filter(
          (img) => !discountImageIds.includes(img._id),
        ),
        loading: false,
      }));

      // Recalculate all affected billings
      if (affectedBillingIds.size > 0) {
        await get().recalculateMultipleBillings(Array.from(affectedBillingIds));
      }

      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  /* =========================
   * CLEAR DISCOUNT IMAGES
   * ========================= */
  clearDiscountImages: () => {
    set({ discountImages: [], error: null });
  },

  /* =========================
   * CLEAR ERROR
   * ========================= */
  clearError: () => set({ error: null }),
}));
