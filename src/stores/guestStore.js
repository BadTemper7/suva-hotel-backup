// src/stores/guestStore.js
import { create } from "zustand";

const API =
  import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

async function safeJson(res) {
  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text();
  if (!res.ok) {
    const msg =
      (isJson && data && (data.message || data.error)) ||
      (!isJson && typeof data === "string" && data.trim()) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

export const useGuestStore = create((set, get) => ({
  // State
  guests: [],
  currentGuest: null,
  loading: false,
  error: null,
  guestExists: false,
  checkingEmail: false,

  // Find guest by email
  findGuestByEmail: async (email) => {
    set({ checkingEmail: true, error: null, guestExists: false });

    if (!email) {
      set({ checkingEmail: false });
      return { exists: false, guest: null };
    }

    try {
      const response = await fetch(
        `${API}/guests/find-by-email?email=${encodeURIComponent(email)}`,
      );
      const data = await safeJson(response);

      if (data.success) {
        if (data.exists && data.guest) {
          set({
            currentGuest: data.guest,
            guestExists: true,
            checkingEmail: false,
          });
          return { exists: true, guest: data.guest };
        } else {
          set({
            currentGuest: null,
            guestExists: false,
            checkingEmail: false,
          });
          return { exists: false, guest: null };
        }
      } else {
        set({
          error: data.message || "Error checking guest email",
          checkingEmail: false,
        });
        return { exists: false, guest: null };
      }
    } catch (error) {
      console.error("Error finding guest by email:", error);
      set({
        error: error.message,
        checkingEmail: false,
      });
      return { exists: false, guest: null };
    }
  },

  // Create new guest
  createGuest: async (guestData) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guestData),
      });
      const data = await safeJson(res);
      const guest = data.guest || data;

      set((state) => ({
        guests: [guest, ...state.guests],
        currentGuest: guest,
        loading: false,
      }));

      return guest;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Find or create guest by email
  findOrCreateGuestByEmail: async (guestData) => {
    const { findGuestByEmail, createGuest } = get();

    // First, try to find existing guest
    const result = await findGuestByEmail(guestData.email);

    if (result.exists && result.guest) {
      // Guest exists, return the existing guest
      return result.guest;
    } else {
      // Guest doesn't exist, create new one
      try {
        const newGuest = await createGuest(guestData);
        return newGuest;
      } catch (error) {
        // If creation fails, return null
        console.error("Failed to create guest:", error);
        return null;
      }
    }
  },

  // Update guest
  updateGuest: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/guests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await safeJson(res);
      const guest = data.guest || data;

      set((state) => ({
        guests: state.guests.map((g) => (g._id === id ? guest : g)),
        currentGuest:
          state.currentGuest?._id === id ? guest : state.currentGuest,
        loading: false,
      }));

      return guest;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Get all guests
  fetchGuests: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/guests`);
      const data = await safeJson(res);
      const guests = Array.isArray(data)
        ? data
        : data.guests || data.data || [];

      set({ guests, loading: false });
      return guests;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Get guest by ID
  getGuestById: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/guests/${id}`);
      const data = await safeJson(res);
      const guest = data.guest || data.data || data;

      set({ currentGuest: guest, loading: false });
      return guest;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },
  deleteMultipleGuests: async (guestIds) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${API}/guests/bulk`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestIds }), // Send guest IDs in the body
      });

      const data = await safeJson(response);

      if (response.ok) {
        // If successful, update the guests state by filtering out the deleted guests
        set((state) => ({
          guests: state.guests.filter((guest) => !guestIds.includes(guest._id)),
          loading: false,
        }));
        return data; // Return the response to know how many guests were deleted
      } else {
        // If failed, set the error message from the response
        set({
          error: data.message || "Failed to delete guests",
          loading: false,
        });
        throw new Error(data.message);
      }
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },
  // Clear current guest
  clearCurrentGuest: () => {
    set({ currentGuest: null, guestExists: false, error: null });
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Get loading state
  isLoading: () => get().loading,

  // Get checking email state
  isCheckingEmail: () => get().checkingEmail,

  // Get guest exists state
  doesGuestExist: () => get().guestExists,
}));
