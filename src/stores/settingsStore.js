// src/stores/settingsStore.js
import { create } from "zustand";
import { getToken } from "../app/auth.js";

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

export const useSettingsStore = create((set, get) => ({
  // State
  settings: {},
  flatSettings: {},
  categories: [],
  loading: false,
  uploading: false,
  error: null,

  // Fetch all settings
  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/settings`);
      const data = await safeJson(res);

      set({
        settings: data.settings || {},
        flatSettings: data.flatSettings || {},
        categories: data.categories || [],
        loading: false,
      });

      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  updateSettings: async (updates) => {
    set({ loading: true, error: null });
    try {
      // Get token from auth.js
      const token = getToken();

      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      const res = await fetch(`${API}/settings/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Add this line
        },
        body: JSON.stringify({ updates }),
      });

      const data = await safeJson(res);

      // Update local state
      set((state) => ({
        flatSettings: { ...state.flatSettings, ...updates },
        loading: false,
      }));

      // Re-fetch to get updated grouped settings
      await get().fetchSettings();

      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Update resetToDefaults function
  resetToDefaults: async () => {
    set({ loading: true, error: null });
    try {
      const token = getToken();

      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      const res = await fetch(`${API}/settings/reset-defaults`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // Add this
        },
      });

      const data = await safeJson(res);

      // Re-fetch settings
      await get().fetchSettings();

      set({ loading: false });
      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Update uploadLogo function
  uploadLogo: async (file) => {
    set({ uploading: true, error: null });
    try {
      const token = getToken();

      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch(`${API}/settings/upload-logo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // Add this
        },
        body: formData,
      });

      const data = await safeJson(res);

      // Update local state
      set((state) => ({
        flatSettings: { ...state.flatSettings, systemLogo: data.imageUrl },
        uploading: false,
      }));

      // Re-fetch to get updated grouped settings
      await get().fetchSettings();

      return data;
    } catch (err) {
      set({ uploading: false, error: err.message });
      throw err;
    }
  },

  // Update uploadFavicon function
  uploadFavicon: async (file) => {
    set({ uploading: true, error: null });
    try {
      const token = getToken();

      if (!token) {
        throw new Error("No authentication token found. Please login again.");
      }

      const formData = new FormData();
      formData.append("favicon", file);

      const res = await fetch(`${API}/settings/upload-favicon`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`, // Add this
        },
        body: formData,
      });

      const data = await safeJson(res);

      // Update local state
      set((state) => ({
        flatSettings: { ...state.flatSettings, systemFavicon: data.imageUrl },
        uploading: false,
      }));

      // Re-fetch to get updated grouped settings
      await get().fetchSettings();

      return data;
    } catch (err) {
      set({ uploading: false, error: err.message });
      throw err;
    }
  },
  // Get session timeout in milliseconds
  getSessionTimeout: () => {
    const { flatSettings } = get();
    const timeoutMinutes = parseInt(flatSettings.sessionTimeout) || 15;
    return timeoutMinutes * 60 * 1000; // Convert to milliseconds
  },
  getWarningTime: () => {
    const { flatSettings } = get();
    const warningMinutes = parseInt(flatSettings.sessionWarningTime) || 1;
    return warningMinutes * 60 * 1000; // Convert to milliseconds
  },
  // Get specific setting value
  getSetting: (key, defaultValue = null) => {
    const { flatSettings } = get();
    return flatSettings[key] !== undefined ? flatSettings[key] : defaultValue;
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
