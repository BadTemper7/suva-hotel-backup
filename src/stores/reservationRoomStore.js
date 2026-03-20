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

export const useReservationRoomStore = create((set, get) => ({
  rooms: [],
  loading: false,
  error: null,

  // Fetch rooms by reservation ID
  fetchRoomsByReservationId: async (reservationId) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/reservation-rooms/${reservationId}`);
      const data = await safeJson(res);
      set({
        rooms: data.rooms || [],
        loading: false,
      });
      return data.rooms;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Add rooms to reservation
  addReservationRooms: async ({ reservationId, rooms }) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/reservation-rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, rooms }),
      });
      const data = await safeJson(res);
      // Refresh rooms list after adding
      const billingRes = await fetch(`${API}/billings/${reservationId}`);
      const billing = await safeJson(billingRes);
      const billingId = billing.billing._id;
      await fetch(`${API}/billings/calculate/${billingId}`, {
        method: "PUT",
      });
      await get().fetchRoomsByReservationId(reservationId);
      set({ loading: false });
      return data.rooms;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Update reservation rooms and amenities
  updateReservationRoom: async ({
    reservationId,
    reservationRoomId,
    amenities,
  }) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/reservation-rooms/${reservationRoomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amenities }),
      });
      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to update reservation room");
      }
      const billingRes = await fetch(`${API}/billings/${reservationId}`);
      const billing = await safeJson(billingRes);
      const billingId = billing.billing._id;
      await fetch(`${API}/billings/calculate/${billingId}`, {
        method: "PUT",
      });
      // Update the state while preserving populated data
      set((state) => {
        // Get the existing room to preserve populated data
        const existingRoom = state.rooms?.find(
          (room) => room._id === reservationRoomId,
        );

        if (!existingRoom) {
          // If room not found in state, just return current state
          return { loading: false };
        }

        // Map the new amenities while preserving the amenityId object data if available
        const updatedAmenities = amenities.map((newAmenity) => {
          // Try to find the existing amenity to get populated data
          const existingAmenity = existingRoom.amenities?.find(
            (a) =>
              a.amenityId?._id === newAmenity.amenityId ||
              a.amenityId === newAmenity.amenityId,
          );

          if (
            existingAmenity &&
            existingAmenity.amenityId &&
            typeof existingAmenity.amenityId === "object"
          ) {
            // Preserve the populated amenity object
            return {
              amenityId: existingAmenity.amenityId, // Keep the populated object
              quantity: newAmenity.quantity,
            };
          } else {
            // No populated data found, just use the ID
            return newAmenity;
          }
        });

        // Update the rooms array
        return {
          rooms:
            state.rooms?.map((room) =>
              room._id === reservationRoomId
                ? {
                    ...room,
                    amenities: updatedAmenities,
                  }
                : room,
            ) || [],
          loading: false,
        };
      });

      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Remove rooms from reservation
  removeReservationRooms: async ({ reservationId, roomIds }) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/reservation-rooms/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, roomIds }),
      });
      const data = await safeJson(res);
      const billingRes = await fetch(`${API}/billings/${reservationId}`);
      const billing = await safeJson(billingRes);
      const billingId = billing.billing._id;
      await fetch(`${API}/billings/calculate/${billingId}`, {
        method: "PUT",
      });
      // Refresh rooms list after removing
      await get().fetchRoomsByReservationId(reservationId);
      set({ loading: false });
      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },
  deleteMultipleReservationRooms: async (reservationId, input) => {
    set({ loading: true, error: null });
    try {
      console.log("Reservation ID:", reservationId);
      console.log("Raw input:", input);

      // Extract reservationRoomIds from input
      let reservationRoomIds;

      if (Array.isArray(input)) {
        reservationRoomIds = input;
      } else if (
        input &&
        typeof input === "object" &&
        input.reservationRoomIds
      ) {
        reservationRoomIds = input.reservationRoomIds;
      } else if (typeof input === "string") {
        reservationRoomIds = [input];
      } else {
        throw new Error(
          "Input must be an array, object with reservationRoomIds, or string",
        );
      }

      // Validate
      if (
        !Array.isArray(reservationRoomIds) ||
        reservationRoomIds.length === 0
      ) {
        throw new Error("reservationRoomIds array is required");
      }

      const res = await fetch(`${API}/reservation-rooms/delete-many`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationRoomIds, reservationId }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete reservation rooms");
      }
      const billingRes = await fetch(`${API}/billings/${reservationId}`);
      const billing = await safeJson(billingRes);
      const billingId = billing.billing._id;
      await fetch(`${API}/billings/calculate/${billingId}`, {
        method: "PUT",
      });
      // Update state - filter out deleted rooms
      set((state) => ({
        rooms:
          state.rooms?.filter(
            (room) => !reservationRoomIds.includes(room._id),
          ) || [],
        loading: false,
      }));

      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to delete reservation rooms",
      });
      throw err;
    }
  },
  // Clear rooms
  clearRooms: () => set({ rooms: [], error: null }),
  clearError: () => set({ error: null }),
  isLoading: () => get().loading,
}));
