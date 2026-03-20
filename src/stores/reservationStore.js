// src/stores/reservationStore.js
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

export const useReservationStore = create((set, get) => ({
  // State
  reservations: [],
  loading: false,
  currentReservation: null,
  error: null,
  reportLoading: false,
  reportError: null,

  // Fetch all reservations
  fetchReservations: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/reservations`);
      const data = await safeJson(res);
      // Handle different response structures
      const reservations = Array.isArray(data)
        ? data
        : data.reservations || data.data || [];
      set({ reservations, loading: false });
      return reservations;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Fetch single reservation by ID (UPDATED for your controller response)
  fetchReservation: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/reservations/${id}`);
      const data = await safeJson(res);
      // Extract reservation from response structure
      const reservation = data.reservation || data.data || data;

      set({
        currentReservation: reservation,
        loading: false,
      });

      return reservation;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Alias for fetchReservation (backward compatibility)
  getReservationById: async (id) => {
    return get().fetchReservation(id);
  },

  // Fetch available rooms for dates
  fetchAvailableRooms: async ({ checkIn, checkOut }) => {
    set({ loading: true, error: null });
    try {
      const url = new URL(`${API}/reservations/rooms`);
      url.searchParams.set("checkIn", checkIn);
      url.searchParams.set("checkOut", checkOut);

      const res = await fetch(url.toString());
      const data = await safeJson(res);

      // Handle different response structures
      const availableRooms =
        data.availableRooms || data.rooms || data.data || data;

      set({ loading: false });
      return Array.isArray(availableRooms) ? availableRooms : [];
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Original createReservation (kept for backward compatibility)
  createReservation: async (payload) => {
    set({ loading: true, error: null });
    try {
      const user = JSON.parse(localStorage.getItem("suva_admin_user") || "{}");
      const userId = user._id || "69624f18a99b94c2c1be2f62";

      const res = await fetch(`${API}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, userId }),
      });

      const data = await safeJson(res);
      const reservation = data.reservation || data.data || data;

      set((state) => ({
        reservations: [reservation, ...state.reservations],
        loading: false,
      }));

      return reservation;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Update reservation status
  updateReservationStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/reservations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await safeJson(res);
      const reservation = data.reservation || data.data || data;

      set((state) => ({
        reservations: state.reservations.map((r) =>
          r._id === id ? reservation : r,
        ),
        currentReservation:
          state.currentReservation?._id === id
            ? reservation
            : state.currentReservation,
        loading: false,
      }));

      return reservation;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Cancel reservation
  cancelReservation: async (id) => {
    return get().updateReservationStatus(id, "cancelled");
  },

  // --- DELETE FUNCTIONS ---

  // Delete single reservation
  deleteReservation: async (id) => {
    set({ loading: true, error: null });
    try {
      if (!id) {
        throw new Error("Reservation ID is required");
      }

      const res = await fetch(`${API}/reservations/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await safeJson(res);

      // Update store state
      set((state) => ({
        reservations: state.reservations.filter((r) => r._id !== id),
        currentReservation:
          state.currentReservation?._id === id
            ? null
            : state.currentReservation,
        loading: false,
      }));

      return {
        success: true,
        message: data.message || "Reservation deleted successfully",
        deletedReservation: data.deletedReservation || { id },
      };
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to delete reservation",
      });
      throw err;
    }
  },

  // Delete multiple reservations
  deleteMultipleReservations: async (reservationIds = []) => {
    set({ loading: true, error: null });
    try {
      if (!Array.isArray(reservationIds) || reservationIds.length === 0) {
        throw new Error("reservationIds array is required");
      }

      const res = await fetch(`${API}/reservations/delete-many`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationIds }),
      });

      const data = await safeJson(res);

      set((state) => ({
        reservations: state.reservations.filter(
          (r) => !reservationIds.includes(r._id),
        ),
        currentReservation:
          state.currentReservation &&
          reservationIds.includes(state.currentReservation._id)
            ? null
            : state.currentReservation,
        loading: false,
      }));

      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to delete multiple reservations",
      });
      throw err;
    }
  },

  // Update reservation rooms (UPDATED for reservation-rooms API)
  updateReservationRooms: async ({
    reservationId,
    rooms = [],
    removeRoomIds = [],
  }) => {
    set({ loading: true, error: null });
    try {
      // Add new rooms
      if (rooms.length > 0) {
        const roomsPayload = {
          reservationId,
          rooms: rooms.map((room) => ({
            roomId: room.roomId,
            amenities: room.amenities || [],
          })),
        };

        const resAdd = await fetch(`${API}/reservation-rooms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roomsPayload),
        });

        await safeJson(resAdd);
      }

      // Remove rooms (if any)
      if (removeRoomIds.length > 0) {
        // You might need a different endpoint for removing rooms
        // This is an example - adjust based on your API
        for (const roomId of removeRoomIds) {
          await fetch(`${API}/reservation-rooms/${roomId}`, {
            method: "DELETE",
          }).catch(() => {}); // Silent fail if endpoint doesn't exist
        }
      }

      // Refresh the reservation to get updated data
      const updatedReservation = await get().fetchReservation(reservationId);

      set((state) => ({
        reservations: state.reservations.map((r) =>
          r._id === reservationId ? updatedReservation : r,
        ),
        currentReservation: updatedReservation,
        loading: false,
      }));

      return updatedReservation;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Update reservation amenities
  updateReservationAmenities: async ({
    reservationId,
    amenities = [],
    removeAmenityIds = [],
  }) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(
        `${API}/reservations/${reservationId}/update-amenities`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amenities, removeAmenityIds }),
        },
      );
      const data = await safeJson(res);
      const reservation = data.reservation || data.data || data;

      set((state) => ({
        reservations: state.reservations.map((r) =>
          r._id === reservationId ? reservation : r,
        ),
        currentReservation:
          state.currentReservation?._id === reservationId
            ? reservation
            : state.currentReservation,
        loading: false,
      }));

      return reservation;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Update reservation dates
  updateReservationDates: async ({ reservationId, checkIn, checkOut }) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(
        `${API}/reservations/${reservationId}/update-dates`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkIn, checkOut }),
        },
      );
      const data = await safeJson(res);
      const reservation = data.reservation || data.data || data;

      set((state) => ({
        reservations: state.reservations.map((r) =>
          r._id === reservationId ? reservation : r,
        ),
        currentReservation:
          state.currentReservation?._id === reservationId
            ? reservation
            : state.currentReservation,
        loading: false,
      }));

      return reservation;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Refresh current reservation
  refreshCurrentReservation: async () => {
    const state = get();
    const reservationId = state.currentReservation?._id;
    if (!reservationId) return null;

    return state.fetchReservation(reservationId);
  },

  // Clear current reservation
  clearCurrentReservation: () => {
    set({ currentReservation: null, error: null });
  },

  // Update local reservation
  updateLocalReservation: (updatedReservation) => {
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r._id === updatedReservation._id ? updatedReservation : r,
      ),
      currentReservation:
        state.currentReservation?._id === updatedReservation._id
          ? updatedReservation
          : state.currentReservation,
    }));
  },

  // --- REPORT GENERATION METHODS ---

  // Generate PDF report
  generatePDFReport: async (filters = {}) => {
    set({ reportLoading: true, reportError: null });
    try {
      const { startDate, endDate, status } = filters;

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);
      if (status) queryParams.append("status", status);

      const url = `${API}/reservations/reports/pdf${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      // Use fetch with array buffer for PDF
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.status}`);
      }

      // Create blob and download link
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      // Generate filename
      const filename = `reservation-report-${new Date().toISOString().split("T")[0]}.pdf`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      set({ reportLoading: false });
      return { success: true, filename };
    } catch (err) {
      set({ reportLoading: false, reportError: err.message });
      throw err;
    }
  },

  // Generate Excel report
  generateExcelReport: async (filters = {}) => {
    set({ reportLoading: true, reportError: null });
    try {
      const { startDate, endDate, status } = filters;

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);
      if (status) queryParams.append("status", status);

      const url = `${API}/reservations/reports/excel${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      // Use fetch with array buffer for Excel
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to generate Excel: ${response.status}`);
      }

      // Create blob and download link
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      // Generate filename
      const filename = `reservation-report-${new Date().toISOString().split("T")[0]}.xlsx`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      set({ reportLoading: false });
      return { success: true, filename };
    } catch (err) {
      set({ reportLoading: false, reportError: err.message });
      throw err;
    }
  },

  // Generate reservation confirmation PDF
  generateReservationConfirmation: async (reservationId) => {
    set({ reportLoading: true, reportError: null });
    try {
      if (!reservationId) {
        throw new Error("Reservation ID is required");
      }

      const url = `${API}/reservations/${reservationId}/confirmation`;

      // Use fetch with array buffer for PDF
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to generate confirmation: ${response.status}`);
      }

      // Create blob and download link
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      // Get reservation number for filename
      const reservation =
        get().reservations.find((r) => r._id === reservationId) ||
        get().currentReservation;
      const reservationNumber = reservation?.reservationNumber || reservationId;
      const filename = `confirmation-${reservationNumber}.pdf`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      set({ reportLoading: false });
      return { success: true, filename };
    } catch (err) {
      set({ reportLoading: false, reportError: err.message });
      throw err;
    }
  },

  // Generate and preview report in new tab
  previewReport: async (type = "pdf", filters = {}) => {
    try {
      const { startDate, endDate, status } = filters;

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);
      if (status) queryParams.append("status", status);

      const endpoint = type === "pdf" ? "reports/pdf" : "reports/excel";
      const url = `${API}/reservations/${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      // Open in new tab for preview
      window.open(url, "_blank");

      return { success: true };
    } catch (err) {
      set({ reportError: err.message });
      throw err;
    }
  },

  // Create full reservation (complete flow)
  createFullReservation: async ({
    guest,
    reservationData,
    rooms = [],
    payment,
    discountImageFile = null,
    receiptData = null,
  }) => {
    set({ loading: true, error: null });
    try {
      console.log("Starting full reservation creation...");

      // Step 0: Check room availability first
      console.log("Checking room availability...");

      // Fetch available rooms for the selected dates
      const availableRooms = await fetch(
        `${API}/reservations/rooms?checkIn=${reservationData.checkIn}&checkOut=${reservationData.checkOut}`,
      );
      const availableRoomsResponse = await safeJson(availableRooms);

      console.log("Selected rooms:", rooms);
      console.log("Available rooms:", availableRoomsResponse.availableRooms);

      // Create a Set of available room IDs for faster lookup
      const availableRoomIds = new Set(
        availableRoomsResponse.availableRooms.map((room) => room._id),
      );

      // Check each selected room
      const unavailableRooms = [];
      const availableRoomsDetails = [];

      rooms.forEach((room) => {
        const roomId = room.roomId;

        if (availableRoomIds.has(roomId)) {
          // Room is available, get its details
          const roomDetails = availableRoomsResponse.availableRooms.find(
            (availableRoom) => availableRoom._id === roomId,
          );
          availableRoomsDetails.push({
            roomId,
            roomNumber: roomDetails?.roomNumber || "Unknown",
            roomType: roomDetails?.roomType?.name || "Unknown",
            rate: roomDetails?.rate || 0,
            capacity: roomDetails?.capacity || 0,
          });
        } else {
          // Room is not available
          unavailableRooms.push(roomId);
        }
      });

      // If there are unavailable rooms, throw error
      if (unavailableRooms.length > 0) {
        // Get room numbers for error message
        const unavailableRoomNumbers = unavailableRooms.map((roomId) => {
          const room = availableRoomsResponse.availableRooms?.find(
            (r) => r._id === roomId,
          );
          return room ? `Room ${room.roomNumber}` : `Room ID: ${roomId}`;
        });

        throw new Error(
          `The following rooms are not available for the selected dates (${reservationData.checkIn} to ${reservationData.checkOut}): ` +
            `${unavailableRoomNumbers.join(", ")}. ` +
            `Please select different rooms or adjust your dates.`,
        );
      }

      // All rooms are available, continue with reservation
      console.log("All selected rooms are available:", availableRoomsDetails);

      // Step 1: Create or find guest
      let guestId;
      if (guest.email && guest.email.trim()) {
        try {
          const resGuest = await fetch(
            `${API}/guests/find-or-create-by-email`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(guest),
            },
          );
          const guestResponse = await safeJson(resGuest);
          guestId = guestResponse.guest?._id || guestResponse._id;
          console.log("Guest found/created:", guestId);
        } catch (guestErr) {
          console.warn(
            "Could not find/create guest by email, using default:",
            guestErr.message,
          );
          guestId = "6968b7aad9522d8eac7cafb3";
        }
      } else {
        guestId = "6968b7aad9522d8eac7cafb3";
      }

      // Step 2: Create reservation
      const user = JSON.parse(localStorage.getItem("suva_admin_user") || "{}");

      // Add availability check info to notes
      const availabilityNotes = availableRoomsDetails
        .map((room) => `Room ${room.roomNumber} (${room.roomType}) - Available`)
        .join(", ");

      const reservationPayload = {
        checkIn: reservationData.checkIn,
        checkOut: reservationData.checkOut,
        adults: reservationData.adults,
        children: reservationData.children || 0,
        guestId: guestId,
        notes: [
          reservationData.notes || "",
          `Availability confirmed: ${availabilityNotes}. Checked at: ${new Date().toISOString()}`,
        ]
          .filter(Boolean)
          .join(". "),
        paymentOption: reservationData.paymentOption,
        userId: user?._id || "69624f18a99b94c2c1be2f62",
        discountId: reservationData.discountId || null,
      };

      const resReservation = await fetch(`${API}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reservationPayload),
      });

      const reservationResponse = await safeJson(resReservation);
      const reservation =
        reservationResponse.reservation || reservationResponse;
      const reservationId = reservation._id || reservation.reservation?._id;

      if (!reservationId) {
        throw new Error(
          "Failed to create reservation: No reservation ID returned",
        );
      }

      console.log("Reservation created:", reservationId);

      // Update store
      set((state) => ({
        reservations: [reservation, ...state.reservations],
        currentReservation: reservation,
      }));

      // Step 3: Add rooms to reservation
      if (rooms.length > 0) {
        const roomsPayload = {
          reservationId: reservationId,
          rooms: rooms.map((room) => ({
            roomId: room.roomId,
            amenities: room.amenities || [],
          })),
        };

        await fetch(`${API}/reservation-rooms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roomsPayload),
        });
      }

      // Step 4: Generate billing
      const billingPayload = {
        reservationId: reservationId,
      };

      const resBilling = await fetch(`${API}/billings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billingPayload),
      });

      const billing = await safeJson(resBilling);
      const billingId = billing._id || billing.billing?._id;

      if (!billingId) {
        throw new Error("Failed to generate billing: No billing ID returned");
      }

      // Step 5: Upload discount image if exists
      if (reservationData.discountId && discountImageFile) {
        const discountFormData = new FormData();
        discountFormData.append("image", discountImageFile);
        discountFormData.append("discountId", reservationData.discountId);
        discountFormData.append("billingId", billingId);
        discountFormData.append("status", "confirmed");

        await fetch(`${API}/discount-images`, {
          method: "POST",
          body: discountFormData,
        });
      }

      console.log("Payment data:", payment);

      // Step 6: Create receipt if payment exists
      if (payment && payment.amountPaid > 0) {
        // Prepare receipt data
        const receiptFormData = new FormData();
        receiptFormData.append("billingId", billingId);
        receiptFormData.append("paymentType", payment.paymentType);
        receiptFormData.append("amountPaid", payment.amountPaid.toString());
        receiptFormData.append(
          "amountReceived",
          payment.amountReceived.toString(),
        );
        receiptFormData.append("status", "confirmed");
        receiptFormData.append("notes", reservationData.notes || "");

        // Add reference number if provided
        if (receiptData?.referenceNumber) {
          receiptFormData.append(
            "referenceNumber",
            receiptData.referenceNumber,
          );
        }

        // Add admin initiated flag if true
        if (receiptData?.isAdminInitiated) {
          receiptFormData.append("isAdminInitiated", "true");
        }

        // Add receipt image if provided (optional now)
        if (receiptData?.imageFile) {
          receiptFormData.append("receiptImage", receiptData.imageFile);
        }

        // Log what we're sending for debugging
        console.log("Sending receipt data:", {
          billingId,
          paymentType: payment.paymentType,
          amountPaid: payment.amountPaid,
          amountReceived: payment.amountReceived,
          referenceNumber: receiptData?.referenceNumber || null,
          hasImage: !!receiptData?.imageFile,
          isAdminInitiated: receiptData?.isAdminInitiated || false,
        });

        const receiptResponse = await fetch(`${API}/receipts/upload`, {
          method: "POST",
          body: receiptFormData,
        });

        const receiptResult = await safeJson(receiptResponse);
        console.log("Receipt creation result:", receiptResult);
      }

      // Get updated reservation
      const updatedReservation = await get().fetchReservation(reservationId);
      const resCalculateBilling = await fetch(
        `${API}/billings/calculate/${billingId}`,
        {
          method: "PUT",
        },
      );
      const calculateBilling = await safeJson(resCalculateBilling);
      set((state) => ({
        reservations: state.reservations.map((res) =>
          res._id === reservationId ? updatedReservation : res,
        ),
        currentReservation: updatedReservation,
        loading: false,
      }));

      console.log("Full reservation process completed successfully!");

      // Return reservation with availability info
      return {
        ...updatedReservation,
        availabilityChecked: true,
        availableRooms: availableRoomsDetails,
        calculateBilling,
        message: `Successfully reserved ${availableRoomsDetails.length} room(s)`,
      };
    } catch (err) {
      console.error("Error in createFullReservation:", err);
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
  clearReportError: () => set({ reportError: null }),
}));

// ------------------ Helpers ------------------
export const reservationHelpers = {
  formatRoomData: (rooms) =>
    rooms.map((room) => ({ roomId: room._id || room.roomId })),

  formatAmenityData: (amenities) =>
    amenities.map((a) => ({
      amenityId: a._id || a.amenityId,
      quantity: a.quantity || 1,
    })),

  calculateTotals: (reservation) => {
    if (!reservation)
      return {
        nights: 0,
        roomsSubtotal: 0,
        amenitiesSubtotal: 0,
        totalAmount: 0,
      };

    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(reservation.checkOut);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    // Calculate rooms total
    const roomsSubtotal = (reservation.rooms || []).reduce((sum, room) => {
      const roomRate = room.rate || room.roomId?.rate || 0;
      return sum + roomRate * nights;
    }, 0);

    // Calculate amenities total
    const amenitiesSubtotal = (reservation.amenities || []).reduce(
      (sum, amenity) => {
        const rate = amenity.rate || amenity.amenityId?.rate || 0;
        const quantity = amenity.quantity || 1;
        return sum + rate * quantity;
      },
      0,
    );

    const totalAmount = roomsSubtotal + amenitiesSubtotal;
    return { nights, roomsSubtotal, amenitiesSubtotal, totalAmount };
  },

  canModifyReservation: (reservation) =>
    reservation && !["checked_out", "cancelled"].includes(reservation.status),

  canModifyDates: (reservation) =>
    reservation &&
    !["checked_in", "checked_out", "cancelled"].includes(reservation.status),

  // Get rooms with amenities from reservation
  getReservationRooms: (reservation) => {
    if (!reservation || !reservation.rooms) return [];

    return reservation.rooms.map((room) => ({
      roomId: room._id || room.roomId?._id || room.roomId,
      roomNumber: room.roomNumber || room.roomId?.roomNumber,
      roomTypeName: room.roomTypeName || room.roomId?.roomType?.name,
      rate: room.rate || room.roomId?.rate,
      capacity: room.capacity || room.roomId?.capacity,
      amenities: room.amenities || [],
    }));
  },

  // Format reservation for display
  formatReservation: (reservation) => {
    if (!reservation) return null;

    return {
      ...reservation,
      guestName: reservation.guestId
        ? `${reservation.guestId.firstName} ${reservation.guestId.lastName}`
        : "Unknown Guest",
      paymentOptionName: reservation.paymentOption?.name || "Unknown",
      discountName: reservation.discountId?.name || null,
      userName:
        reservation.userId?.username || reservation.userId?.name || "System",
    };
  },

  // Report generation helpers
  getReportFilters: (filters = {}) => {
    const defaultFilters = {
      startDate: filters.startDate || "",
      endDate: filters.endDate || "",
      status: filters.status || "",
      format: filters.format || "pdf",
    };
    return defaultFilters;
  },

  formatDateForReport: (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  },

  getStatusColor: (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "checked_in":
        return "bg-blue-100 text-blue-800";
      case "checked_out":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  },

  getReportSummary: (reservations) => {
    if (!reservations || !Array.isArray(reservations)) {
      return {
        total: 0,
        confirmed: 0,
        pending: 0,
        checkedIn: 0,
        checkedOut: 0,
        cancelled: 0,
        totalNights: 0,
        totalAdults: 0,
        totalChildren: 0,
      };
    }

    return {
      total: reservations.length,
      confirmed: reservations.filter((r) => r.status === "confirmed").length,
      pending: reservations.filter((r) => r.status === "pending").length,
      checkedIn: reservations.filter((r) => r.status === "checked_in").length,
      checkedOut: reservations.filter((r) => r.status === "checked_out").length,
      cancelled: reservations.filter((r) => r.status === "cancelled").length,
      totalNights: reservations.reduce((sum, r) => sum + (r.nights || 0), 0),
      totalAdults: reservations.reduce((sum, r) => sum + (r.adults || 0), 0),
      totalChildren: reservations.reduce(
        (sum, r) => sum + (r.children || 0),
        0,
      ),
    };
  },

  // Delete helper function
  confirmDeleteReservation: async (reservation, store) => {
    if (!reservation) return false;

    const confirmMessage = `Are you sure you want to delete reservation ${reservation.reservationNumber}?\n\nThis action will also delete all related billing, receipts, and room assignments.\n\nThis action cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      try {
        await store.deleteReservation(reservation._id);
        return true;
      } catch (error) {
        console.error("Failed to delete reservation:", error);
        alert(`Failed to delete reservation: ${error.message}`);
        return false;
      }
    }
    return false;
  },

  // Confirm and delete multiple reservations
  confirmDeleteMultipleReservations: async (selectedReservations, store) => {
    if (!selectedReservations || selectedReservations.length === 0) {
      return false;
    }

    const reservationList = selectedReservations
      .slice(0, 5)
      .map((r) => `• ${r.reservationNumber || r._id}`)
      .join("\n");

    const moreCount =
      selectedReservations.length > 5
        ? `\n...and ${selectedReservations.length - 5} more`
        : "";

    const confirmMessage = `Are you sure you want to delete ${selectedReservations.length} reservation(s)?\n\n${reservationList}${moreCount}\n\nThis action will also delete all related billing, receipts, and room assignments.\n\nThis action cannot be undone.`;

    if (window.confirm(confirmMessage)) {
      try {
        const reservationIds = selectedReservations.map((r) => r._id);
        await store.deleteMultipleReservations(reservationIds);
        return true;
      } catch (error) {
        console.error("Failed to delete reservations:", error);
        alert(`Failed to delete reservations: ${error.message}`);
        return false;
      }
    }
    return false;
  },
};
