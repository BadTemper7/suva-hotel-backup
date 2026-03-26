// src/stores/userStore.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  getToken,
  setToken,
  setUser,
  logout as authLogout,
  isSuperAdmin as checkIsSuperAdmin,
  isAdmin as checkIsAdmin,
  getUserRole,
  getUserId,
} from "../app/auth.js";

const API_URL =
  import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

export const useUserStore = create(
  persist(
    (set, get) => ({
      // State
      users: [],
      currentUser: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      authInitialized: false,

      /* -------------------- Initialize -------------------- */
      initialize: () => {
        try {
          const storedUser = localStorage.getItem("suva_admin_user");
          const token = getToken();

          if (storedUser && token) {
            const user = JSON.parse(storedUser);
            set({
              currentUser: user,
              isAuthenticated: true,
              loading: false,
              authInitialized: true,
            });
          } else {
            set({ authInitialized: true });
          }
        } catch (error) {
          console.error("Error initializing auth:", error);
          set({ authInitialized: true });
          authLogout();
        }
      },

      /* -------------------- Login -------------------- */
      login: async (username, password) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/users/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || "Login failed");
          }

          if (data.success) {
            // Store auth data
            setToken(data.token);
            setUser(data.user);

            set({
              currentUser: data.user,
              isAuthenticated: true,
              loading: false,
              error: null,
              authInitialized: true,
            });

            return { success: true, user: data.user, token: data.token };
          } else {
            throw new Error(data.message || "Login failed");
          }
        } catch (err) {
          set({
            loading: false,
            error: err.message,
            isAuthenticated: false,
            currentUser: null,
            authInitialized: true,
          });
          return { success: false, error: err.message };
        }
      },

      /* -------------------- Logout -------------------- */
      logout: () => {
        authLogout();
        set({
          users: [],
          currentUser: null,
          loading: false,
          error: null,
          isAuthenticated: false,
          authInitialized: true,
        });
      },

      /* -------------------- Fetch Users -------------------- */
      fetchUsers: async () => {
        const token = getToken();
        if (!token) {
          set({ error: "No authentication token", loading: false });
          return [];
        }

        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/users`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await res.json();

          if (!res.ok) {
            // Handle unauthorized - token might be expired
            if (res.status === 401) {
              get().logout();
              throw new Error("Session expired. Please login again.");
            }
            throw new Error(data.message || "Failed to fetch users");
          }

          const users = data.users || [];
          set({ users, loading: false });
          return users;
        } catch (err) {
          set({ error: err.message, loading: false });
          throw err;
        }
      },

      /* -------------------- Create User (Superadmin only) -------------------- */
      createUser: async (payload) => {
        const token = getToken();
        if (!token) {
          return { success: false, error: "No authentication token" };
        }

        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/users`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          const data = await res.json();

          if (!res.ok) {
            if (res.status === 403) {
              throw new Error("You don't have permission to create users");
            }
            throw new Error(data.message || "Failed to create user");
          }

          if (data.success) {
            const newUser = data.user;
            set({
              users: [...get().users, newUser],
              loading: false,
            });
            return { success: true, user: newUser, message: data.message };
          } else {
            throw new Error(data.message || "Failed to create user");
          }
        } catch (err) {
          set({ error: err.message, loading: false });
          return { success: false, error: err.message };
        }
      },

      /* -------------------- Update User -------------------- */
      updateUser: async (id, payload) => {
        const token = getToken();
        if (!token) {
          return { success: false, error: "No authentication token" };
        }

        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/users/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || "Failed to update user");
          }

          if (data.success) {
            const updatedUser = data.user;

            // Update users list
            set({
              users: get().users.map((u) => (u._id === id ? updatedUser : u)),
              loading: false,
            });

            // Update current user if it's the same
            if (get().currentUser?._id === id) {
              set({ currentUser: updatedUser });
              setUser(updatedUser); // Update localStorage
            }

            return { success: true, user: updatedUser, message: data.message };
          } else {
            throw new Error(data.message || "Failed to update user");
          }
        } catch (err) {
          set({ error: err.message, loading: false });
          return { success: false, error: err.message };
        }
      },

      /* -------------------- Delete User -------------------- */
      deleteUser: async (id) => {
        const token = getToken();
        if (!token) {
          return { success: false, error: "No authentication token" };
        }

        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/users/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || "Failed to delete user");
          }

          set({
            users: get().users.filter((u) => u._id !== id),
            loading: false,
          });

          return { success: true, message: data.message };
        } catch (err) {
          set({ error: err.message, loading: false });
          return { success: false, error: err.message };
        }
      },

      /* -------------------- Delete Many Users -------------------- */
      deleteManyUsers: async (ids) => {
        if (!Array.isArray(ids) || ids.length === 0) {
          return { success: false, error: "No user IDs provided" };
        }

        const token = getToken();
        if (!token) {
          return { success: false, error: "No authentication token" };
        }

        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/users`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ ids }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || "Failed to delete users");
          }

          set({
            users: get().users.filter((u) => !ids.includes(u._id)),
            loading: false,
          });

          return {
            success: true,
            message: data.message,
            deletedCount: data.deletedCount,
          };
        } catch (err) {
          set({ error: err.message, loading: false });
          return { success: false, error: err.message };
        }
      },

      /* -------------------- Unlock User Account -------------------- */
      unlockUser: async (id) => {
        const token = getToken();
        if (!token) {
          return { success: false, error: "No authentication token" };
        }

        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/users/${id}/unlock`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || "Failed to unlock user");
          }

          if (data.success) {
            const unlockedUser = data.user;

            set({
              users: get().users.map((u) => (u._id === id ? unlockedUser : u)),
              loading: false,
            });

            return { success: true, user: unlockedUser, message: data.message };
          } else {
            throw new Error(data.message || "Failed to unlock user");
          }
        } catch (err) {
          set({ error: err.message, loading: false });
          return { success: false, error: err.message };
        }
      },

      requestPasswordReset: async (email) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/users/reset-password-request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          const data = await res.json();
          set({ loading: false });

          if (data.success) {
            return { success: true, message: data.message };
          } else {
            return { success: false, error: data.message };
          }
        } catch (err) {
          set({ loading: false, error: err.message });
          return { success: false, error: err.message };
        }
      },

      resetPassword: async (token, newPassword) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/users/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, newPassword }),
          });

          const data = await res.json();
          set({ loading: false });

          if (data.success) {
            return { success: true, message: data.message };
          } else {
            return { success: false, error: data.message };
          }
        } catch (err) {
          set({ loading: false, error: err.message });
          return { success: false, error: err.message };
        }
      },

      /* -------------------- Get User Stats -------------------- */
      getUserStats: async () => {
        const token = getToken();
        if (!token) {
          set({ error: "No authentication token", loading: false });
          return [];
        }

        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/users/stats/login`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || "Failed to fetch user stats");
          }

          set({ loading: false });
          return data.stats || [];
        } catch (err) {
          set({ error: err.message, loading: false });
          return [];
        }
      },

      /* -------------------- Get Current User (from API) -------------------- */
      getCurrentUserFromAPI: async () => {
        const token = getToken();
        if (!token) {
          return { success: false, error: "No authentication token" };
        }

        set({ loading: true, error: null });
        try {
          const res = await fetch(`${API_URL}/users/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || "Failed to fetch user");
          }

          if (data.success) {
            const user = data.user;
            set({
              currentUser: user,
              loading: false,
              isAuthenticated: true,
            });
            setUser(user); // Update localStorage
            return { success: true, user };
          } else {
            throw new Error(data.message || "Failed to fetch user");
          }
        } catch (err) {
          set({ error: err.message, loading: false });
          return { success: false, error: err.message };
        }
      },
      changePassword: async (newPassword, confirmPassword) => {
        set({ loading: true, error: null });
        try {
          const { currentUser } = get();
          if (!currentUser || !currentUser._id) {
            throw new Error("No user logged in");
          }

          if (newPassword !== confirmPassword) {
            throw new Error("Passwords do not match");
          }

          if (newPassword.length < 8) {
            throw new Error("Password must be at least 8 characters");
          }

          if (newPassword.length > 16) {
            throw new Error("Password cannot exceed 16 characters");
          }

          if (!/[A-Z]/.test(newPassword)) {
            throw new Error(
              "Password must contain at least one uppercase letter",
            );
          }

          if (!/[a-z]/.test(newPassword)) {
            throw new Error(
              "Password must contain at least one lowercase letter",
            );
          }

          if (!/[0-9]/.test(newPassword)) {
            throw new Error("Password must contain at least one number");
          }

          if (!/[_!@#$%^&*]/.test(newPassword)) {
            throw new Error(
              "Password must contain at least one special character (_!@#$%^&*)",
            );
          }

          if (/\s/.test(newPassword)) {
            throw new Error("Password cannot contain spaces");
          }

          const token = getToken();
          const res = await fetch(`${API_URL}/users/change-password`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              userId: currentUser._id,
              newPassword,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || "Failed to change password");
          }

          if (data.success) {
            // Update local storage with new user data (without password)
            const updatedUser = data.user || currentUser;
            setUser(updatedUser);

            set({
              currentUser: updatedUser,
              loading: false,
            });

            return { success: true, message: data.message };
          } else {
            throw new Error(data.message || "Failed to change password");
          }
        } catch (err) {
          set({ loading: false, error: err.message });
          return { success: false, error: err.message };
        }
      },
      /* -------------------- Helper Methods -------------------- */
      clearError: () => set({ error: null }),

      isLoading: () => get().loading,

      getCurrentUser: () => get().currentUser,

      isAdmin: () => {
        const user = get().currentUser;
        return user && (user.role === "admin" || user.role === "superadmin");
      },

      isSuperAdmin: () => {
        const user = get().currentUser;
        return user && user.role === "superadmin";
      },

      isReceptionist: () => {
        const user = get().currentUser;
        return user && user.role === "receptionist";
      },

      canManageUsers: () => {
        const user = get().currentUser;
        return user && (user.role === "admin" || user.role === "superadmin");
      },

      canManageSettings: () => {
        const user = get().currentUser;
        return user && user.role === "superadmin";
      },

      getUserRole: () => {
        return get().currentUser?.role || null;
      },

      getUserFullName: () => {
        const user = get().currentUser;
        if (!user) return "";
        return `${user.firstName} ${user.lastName}`;
      },
    }),
    {
      name: "user-store", // unique name for localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// Initialize the store on import
const store = useUserStore.getState();
store.initialize();

// Export store instance for use in non-React files
export default useUserStore;
