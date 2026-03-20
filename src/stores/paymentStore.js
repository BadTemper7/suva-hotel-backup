// src/stores/paymentStore.js
import { create } from "zustand";

const API =
  import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

async function safeJson(res) {
  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text();
  if (!res.ok) {
    const msg =
      (isJson && data?.message) ||
      (!isJson && typeof data === "string" && data.trim()) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export const usePaymentStore = create((set, get) => ({
  // State
  paymentOptions: [],
  paymentTypes: [],
  discounts: [],
  selectedPaymentOption: null,
  selectedPaymentType: null,
  selectedDiscount: null,
  loading: false,
  error: null,

  // Fetch payment options
  fetchPaymentOptions: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/payment-options`);
      const data = await safeJson(res);
      set({ paymentOptions: data || [], loading: false });
      return data || [];
    } catch (err) {
      set({
        loading: false,
        error: err.message,
        paymentOptions: [],
      });
      console.error("Failed to fetch payment options:", err);
      return [];
    }
  },

  // Fetch payment types
  fetchPaymentTypes: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/payment-types`);
      const data = await safeJson(res);
      set({ paymentTypes: data || [], loading: false });
      return data || [];
    } catch (err) {
      set({
        loading: false,
        error: err.message,
        paymentTypes: [],
      });
      console.error("Failed to fetch payment types:", err);
      return [];
    }
  },

  // Fetch discounts
  fetchDiscounts: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/discounts`);
      const data = await safeJson(res);
      set({ discounts: data || [], loading: false });
      return data || [];
    } catch (err) {
      set({
        loading: false,
        error: err.message,
        discounts: [],
      });
      console.error("Failed to fetch discounts:", err);
      return [];
    }
  },

  // Select a payment option
  selectPaymentOption: (optionId) =>
    set((state) => ({
      selectedPaymentOption:
        state.paymentOptions.find((o) => o._id === optionId) || null,
    })),

  // Select a payment type
  selectPaymentType: (typeId) =>
    set((state) => ({
      selectedPaymentType:
        state.paymentTypes.find((t) => t._id === typeId) || null,
    })),

  // Select a discount
  selectDiscount: (discountId) =>
    set((state) => ({
      selectedDiscount:
        state.discounts.find((d) => d._id === discountId) || null,
    })),

  // Calculate discount amount
  calculateDiscount: (roomTotals, discountId) => {
    const { discounts } = get();
    const discount = discounts.find((d) => d._id === discountId);

    if (!discount || !roomTotals || roomTotals.length === 0) {
      return { amount: 0, percent: 0, name: "", roomId: null };
    }

    if (discount.appliesToAllRooms) {
      // Apply discount to total amount of all rooms
      const totalAmount = roomTotals.reduce((sum, room) => sum + room.total, 0);
      const discountAmount = (totalAmount * discount.discountPercent) / 100;
      return {
        amount: discountAmount,
        percent: discount.discountPercent,
        name: discount.name,
        roomId: null,
      };
    } else {
      // Apply discount to specific room based on priority
      let targetRoom;
      if (discount.discountPriority === "highest") {
        targetRoom = roomTotals.reduce((max, room) =>
          room.total > max.total ? room : max
        );
      } else {
        // "lowest" priority
        targetRoom = roomTotals.reduce((min, room) =>
          room.total < min.total ? room : min
        );
      }

      const discountAmount =
        (targetRoom.total * discount.discountPercent) / 100;
      return {
        amount: discountAmount,
        percent: discount.discountPercent,
        name: discount.name,
        roomId: targetRoom.roomId,
      };
    }
  },

  // Get active payment options
  getActivePaymentOptions: () => {
    const { paymentOptions } = get();
    return paymentOptions.filter((option) => option.isActive);
  },

  // Get active payment types
  getActivePaymentTypes: () => {
    const { paymentTypes } = get();
    return paymentTypes.filter((type) => type.isActive);
  },

  // Get active discounts
  getActiveDiscounts: () => {
    const { discounts } = get();
    return discounts.filter((discount) => discount.isActive);
  },

  // Get payment type by ID
  getPaymentTypeById: (typeId) => {
    const { paymentTypes } = get();
    return paymentTypes.find((type) => type._id === typeId);
  },

  // Get payment option by ID
  getPaymentOptionById: (optionId) => {
    const { paymentOptions } = get();
    return paymentOptions.find((option) => option._id === optionId);
  },

  // Get discount by ID
  getDiscountById: (discountId) => {
    const { discounts } = get();
    return discounts.find((discount) => discount._id === discountId);
  },

  // Calculate amount due based on payment option
  calculateAmountDue: (totalAmount, paymentOptionId) => {
    const { getPaymentOptionById } = get();
    const paymentOption = getPaymentOptionById(paymentOptionId);

    if (!paymentOption) return totalAmount;

    if (paymentOption.paymentType === "full") {
      return totalAmount;
    } else if (paymentOption.paymentType === "partial") {
      return (totalAmount * (paymentOption.amount || 50)) / 100;
    }

    return totalAmount;
  },

  // Reset all selections
  resetSelections: () => {
    set({
      selectedPaymentOption: null,
      selectedPaymentType: null,
      selectedDiscount: null,
    });
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
