// src/stores/userStore.js
import { create } from "zustand";
import { getToken } from "../app/auth.js";

const API_URL =
  import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

export const useUserStore = create((set, get) => ({
  users: [],
  loading: false,
  error: null,

  /* -------------------- Fetch Users -------------------- */
  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to fetch users");
      }

      const data = await res.json();
      set({ users: data, loading: false });
    } catch (err) {
      set({ error: err.message || "Failed to fetch users", loading: false });
    }
  },

  /* -------------------- Create User -------------------- */
  createUser: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create user");
      }

      const user = await res.json();
      set({ users: [...get().users, user], loading: false });
      return user;
    } catch (err) {
      set({ error: err.message || "Failed to create user", loading: false });
      throw err;
    }
  },

  /* -------------------- Update User -------------------- */
  updateUser: async (id, payload) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to update user");

      set({
        users: get().users.map((u) => (u._id === id ? data : u)),
        loading: false,
      });
      return data;
    } catch (err) {
      set({ error: err.message || "Failed to update user", loading: false });
      throw err;
    }
  },

  deleteUser: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete user");
      }

      set({
        users: get().users.filter((u) => u._id !== id),
        loading: false,
      });
    } catch (err) {
      set({ error: err.message || "Failed to delete user", loading: false });
      throw err;
    }
  },

  /* -------------------- Bulk Delete Users -------------------- */
  deleteManyUsers: async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete users");
      }

      set({
        users: get().users.filter((u) => !ids.includes(u._id)),
        loading: false,
      });
    } catch (err) {
      set({ error: err.message || "Failed to delete users", loading: false });
      throw err;
    }
  },
}));
