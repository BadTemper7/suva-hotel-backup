// src/components/modals/RoomReservationModal.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import {
  FiX,
  FiChevronDown,
  FiCalendar,
  FiPlus,
  FiMinus,
  FiTrash2,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useAmenityStore } from "../../stores/amenityStore";
import { useReservationStore } from "../../stores/reservationStore";

export default function RoomReservationModal({
  open,
  mode,
  room: initialRoom,
  reservationId,
  reservationData,
  onClose,
  onSave,
}) {
  // For edit mode (single room)
  const [amenities, setAmenities] = useState(
    initialRoom?.amenities?.map((a) => ({
      amenityId: a.amenityId?._id || a.amenityId,
      quantity: a.quantity || 1,
    })) || [],
  );

  // For add mode (multiple rooms)
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [roomsWithAmenities, setRoomsWithAmenities] = useState([]);

  const [selectedAmenityId, setSelectedAmenityId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showAmenityDropdown, setShowAmenityDropdown] = useState(false);

  const dropdownRef = useRef(null);

  const { amenities: allAmenities, fetchAmenities } = useAmenityStore();
  const { fetchAvailableRooms } = useReservationStore();

  // Fetch amenities on component mount
  useEffect(() => {
    fetchAmenities().catch((err) => {
      console.error("Failed to fetch amenities:", err);
      toast.error("Failed to load amenities");
    });
  }, [fetchAmenities]);

  // Fetch available rooms when component opens (for add mode)
  useEffect(() => {
    if (
      open &&
      mode === "add" &&
      reservationData?.checkIn &&
      reservationData?.checkOut
    ) {
      fetchAvailableRoomsForReservation();
    }
  }, [open, mode, reservationData]);

  // Initialize roomsWithAmenities when selected rooms change
  useEffect(() => {
    if (mode === "add" && selectedRoomIds.length > 0) {
      // Add new rooms to roomsWithAmenities
      const newRooms = selectedRoomIds.filter(
        (roomId) => !roomsWithAmenities.some((r) => r.roomId === roomId),
      );

      if (newRooms.length > 0) {
        const newRoomsWithAmenities = newRooms.map((roomId) => {
          const room = availableRooms.find((r) => r._id === roomId);
          return {
            roomId: room?._id || roomId, // Make sure we have the ID
            amenities: [],
          };
        });

        setRoomsWithAmenities((prev) => [...prev, ...newRoomsWithAmenities]);
      }

      // Remove rooms that are no longer selected
      setRoomsWithAmenities((prev) =>
        prev.filter((room) => selectedRoomIds.includes(room.roomId)),
      );
    }
  }, [selectedRoomIds, mode, availableRooms]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAmenityDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchAvailableRoomsForReservation = async () => {
    if (
      !reservationData ||
      !reservationData.checkIn ||
      !reservationData.checkOut
    ) {
      console.error("Reservation dates not available:", reservationData);
      return;
    }

    setLoadingRooms(true);
    try {
      const rooms = await fetchAvailableRooms({
        checkIn: reservationData.checkIn,
        checkOut: reservationData.checkOut,
      });
      setAvailableRooms(rooms || []);
    } catch (error) {
      console.error("Failed to fetch available rooms:", error);
      toast.error("Failed to load available rooms");
    } finally {
      setLoadingRooms(false);
    }
  };

  // Filter active amenities
  const activeAmenities = useMemo(() => {
    return allAmenities.filter((amenity) => amenity.status === "active");
  }, [allAmenities]);

  // Get selected amenity details
  const selectedAmenity = useMemo(() => {
    return activeAmenities.find((a) => a._id === selectedAmenityId);
  }, [activeAmenities, selectedAmenityId]);

  // Get available amenity stock (considering all selected rooms)
  const getAvailableStock = (amenityId) => {
    const amenity = allAmenities.find((a) => a._id === amenityId);
    if (!amenity) return 0;

    // Check how many are already in current amenities for all rooms
    let totalReserved = 0;

    if (mode === "edit") {
      totalReserved = amenities
        .filter((a) => a.amenityId === amenityId)
        .reduce((sum, a) => sum + a.quantity, 0);
    } else if (mode === "add") {
      // Sum amenities across all selected rooms
      roomsWithAmenities.forEach((room) => {
        totalReserved += room.amenities
          .filter((a) => a.amenityId === amenityId)
          .reduce((sum, a) => sum + a.quantity, 0);
      });
    }

    return amenity.stock - totalReserved;
  };

  // Handle selecting/deselecting rooms (add mode)
  const toggleRoomSelection = (roomId) => {
    if (selectedRoomIds.includes(roomId)) {
      setSelectedRoomIds((prev) => prev.filter((id) => id !== roomId));
    } else {
      setSelectedRoomIds((prev) => [...prev, roomId]);
    }
  };

  // Handle selecting all available rooms
  const selectAllRooms = () => {
    if (selectedRoomIds.length === availableRooms.length) {
      setSelectedRoomIds([]);
    } else {
      setSelectedRoomIds(availableRooms.map((room) => room._id));
    }
  };

  // Handle adding amenity to a specific room or to all selected rooms
  const handleAddAmenity = (targetRoomId = null) => {
    if (!selectedAmenityId || quantity < 1) {
      toast.error("Please select an amenity and quantity");
      return;
    }

    const availableStock = getAvailableStock(selectedAmenityId);
    if (quantity > availableStock) {
      toast.error(`Only ${availableStock} available in stock`);
      return;
    }

    if (mode === "edit") {
      // Add to single room (edit mode)
      const existingIndex = amenities.findIndex(
        (a) => a.amenityId === selectedAmenityId,
      );
      if (existingIndex >= 0) {
        const updated = [...amenities];
        updated[existingIndex].quantity += quantity;
        setAmenities(updated);
      } else {
        setAmenities([
          ...amenities,
          { amenityId: selectedAmenityId, quantity },
        ]);
      }
      toast.success(`Added ${selectedAmenity.name} to room`);
    } else if (mode === "add") {
      // Add to specific room or all selected rooms
      if (targetRoomId) {
        // Add to specific room
        updateRoomAmenities(targetRoomId, selectedAmenityId, quantity);
        toast.success(`Added ${selectedAmenity.name} to room`);
      } else {
        // Add to all selected rooms
        selectedRoomIds.forEach((roomId) => {
          updateRoomAmenities(roomId, selectedAmenityId, quantity);
        });
        toast.success(
          `Added ${selectedAmenity.name} to ${selectedRoomIds.length} room(s)`,
        );
      }
    }

    // DON'T clear selection - keep amenity selected for adding more
    // Only reset quantity to 1 for next addition
    setQuantity(1);
  };

  // Update amenities for a specific room
  const updateRoomAmenities = (roomId, amenityId, quantityToAdd) => {
    setRoomsWithAmenities((prev) =>
      prev.map((room) => {
        if (room.roomId !== roomId) return room;

        const existingIndex = room.amenities.findIndex(
          (a) => a.amenityId === amenityId,
        );
        if (existingIndex >= 0) {
          const updatedAmenities = [...room.amenities];
          updatedAmenities[existingIndex] = {
            ...updatedAmenities[existingIndex],
            quantity: updatedAmenities[existingIndex].quantity + quantityToAdd,
          };
          return { ...room, amenities: updatedAmenities };
        } else {
          return {
            ...room,
            amenities: [
              ...room.amenities,
              {
                amenityId,
                quantity: quantityToAdd,
              },
            ],
          };
        }
      }),
    );
  };

  // Handle removing amenity from a specific room
  const handleRemoveAmenityFromRoom = (roomId, amenityId) => {
    setRoomsWithAmenities((prev) =>
      prev.map((room) => {
        if (room.roomId !== roomId) return room;
        return {
          ...room,
          amenities: room.amenities.filter((a) => a.amenityId !== amenityId),
        };
      }),
    );
  };

  // Handle updating amenity quantity in a specific room
  const handleUpdateAmenityQuantityInRoom = (
    roomId,
    amenityId,
    newQuantity,
  ) => {
    const amenity = allAmenities.find((a) => a._id === amenityId);
    if (!amenity) return;

    if (newQuantity < 1) {
      handleRemoveAmenityFromRoom(roomId, amenityId);
      return;
    }

    const totalUsedInAllRooms = roomsWithAmenities.reduce((total, room) => {
      const roomAmenity = room.amenities.find((a) => a.amenityId === amenityId);
      return total + (roomAmenity ? roomAmenity.quantity : 0);
    }, 0);

    const currentRoomAmenity = roomsWithAmenities
      .find((r) => r.roomId === roomId)
      ?.amenities.find((a) => a.amenityId === amenityId);

    const currentRoomQuantity = currentRoomAmenity
      ? currentRoomAmenity.quantity
      : 0;
    const otherRoomsQuantity = totalUsedInAllRooms - currentRoomQuantity;

    if (newQuantity + otherRoomsQuantity > amenity.stock) {
      toast.error(`Cannot exceed total stock of ${amenity.stock}`);
      return;
    }

    setRoomsWithAmenities((prev) =>
      prev.map((room) => {
        if (room.roomId !== roomId) return room;
        return {
          ...room,
          amenities: room.amenities.map((a) =>
            a.amenityId === amenityId ? { ...a, quantity: newQuantity } : a,
          ),
        };
      }),
    );
  };

  // For edit mode: handle removing amenity
  const handleRemoveAmenity = (amenityId) => {
    setAmenities(amenities.filter((a) => a.amenityId !== amenityId));
  };

  // For edit mode: handle updating amenity quantity
  const handleUpdateQuantity = (amenityId, newQuantity) => {
    const amenity = allAmenities.find((a) => a._id === amenityId);
    if (!amenity) return;

    if (newQuantity < 1) {
      handleRemoveAmenity(amenityId);
      return;
    }

    if (newQuantity > amenity.stock) {
      toast.error(`Cannot exceed stock of ${amenity.stock}`);
      return;
    }

    setAmenities(
      amenities.map((a) =>
        a.amenityId === amenityId ? { ...a, quantity: newQuantity } : a,
      ),
    );
  };

  const handleAmenitySelect = (amenityId) => {
    setSelectedAmenityId(amenityId);
    setShowAmenityDropdown(false);
    setQuantity(1);
  };

  // In RoomReservationModal.jsx - update the handleSubmit function
  const handleSubmit = () => {
    console.log("Current roomsWithAmenities:", roomsWithAmenities); // Debug

    if (mode === "add") {
      if (selectedRoomIds.length === 0) {
        toast.error("Please select at least one room");
        return;
      }

      // Filter only rooms that actually have amenities (if any)
      const roomsToSubmit = roomsWithAmenities.filter((room) =>
        selectedRoomIds.includes(room.roomId),
      );

      // Prepare payload in the exact format the store expects
      const payload = {
        reservationId,
        rooms: roomsToSubmit.map((room) => ({
          roomId: room.roomId,
          amenities: room.amenities.map((amenity) => ({
            amenityId: amenity.amenityId,
            quantity: amenity.quantity,
          })),
        })),
      };

      console.log("Submitting payload:", JSON.stringify(payload, null, 2)); // Debug

      // Call onSave with the properly formatted object
      onSave({
        reservationId: payload.reservationId,
        rooms: payload.rooms,
      });
    } else if (mode === "edit") {
      // Single room edit mode
      const payload = {
        reservationRoomId: initialRoom._id,
        amenities: amenities.map((amenity) => ({
          amenityId: amenity.amenityId,
          quantity: amenity.quantity,
        })),
      };
      console.log("Submitting edit payload:", JSON.stringify(payload, null, 2));

      // FIX: Call onSave with the payload directly
      onSave(payload); // ← Remove the wrapper object
    }
  };

  // Calculate total cost
  const totalCost = useMemo(() => {
    if (mode === "edit") {
      return amenities.reduce((total, item) => {
        const amenity = allAmenities.find((a) => a._id === item.amenityId);
        return total + (amenity ? amenity.rate * item.quantity : 0);
      }, 0);
    } else {
      // Calculate total for all rooms
      return roomsWithAmenities.reduce((total, room) => {
        return (
          total +
          room.amenities.reduce((roomTotal, item) => {
            const amenity = allAmenities.find((a) => a._id === item.amenityId);
            return roomTotal + (amenity ? amenity.rate * item.quantity : 0);
          }, 0)
        );
      }, 0);
    }
  }, [amenities, roomsWithAmenities, allAmenities, mode]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === "add"
                ? "Add Rooms to Reservation"
                : "Edit Room Amenities"}
            </h2>
            {reservationData && (
              <div className="text-sm text-gray-500 mt-1 flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <FiCalendar className="w-3 h-3 text-[#0c2bfc]" />
                  {new Date(
                    reservationData.checkIn,
                  ).toLocaleDateString()} -{" "}
                  {new Date(reservationData.checkOut).toLocaleDateString()}
                </span>
                {reservationData.guestName && (
                  <span>Guest: {reservationData.guestName}</span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full hover:bg-gray-50 grid place-items-center transition-colors text-gray-700 border border-gray-200"
          >
            <FiX />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* EDIT MODE: Single room display */}
            {mode === "edit" && initialRoom?.roomId && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Room Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Room Number:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {initialRoom.roomId.roomNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Room Type:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {initialRoom.roomId.roomType?.name || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Capacity:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {initialRoom.roomId.capacity || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Rate:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      ₱{initialRoom.roomId.rate}/hour
                    </span>
                  </div>
                  {initialRoom.roomId.floor && (
                    <div>
                      <span className="text-gray-500">Floor:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {initialRoom.roomId.floor}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ADD MODE: Room selection */}
            {mode === "add" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    Select Rooms ({selectedRoomIds.length} selected)
                  </h3>
                  {availableRooms.length > 0 && (
                    <button
                      type="button"
                      onClick={selectAllRooms}
                      className="text-sm text-[#0c2bfc] hover:text-[#0a24d6] font-medium transition-all duration-200"
                    >
                      {selectedRoomIds.length === availableRooms.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  )}
                </div>

                {loadingRooms ? (
                  <div className="text-center py-4 text-gray-500">
                    Loading available rooms...
                  </div>
                ) : availableRooms.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 border border-gray-200 rounded-xl bg-gray-50">
                    No rooms available for the selected dates.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-xl bg-white">
                    {availableRooms.map((room) => (
                      <div
                        key={room._id}
                        className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                          selectedRoomIds.includes(room._id)
                            ? "border-[#0c2bfc] bg-[#0c2bfc]/5"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => toggleRoomSelection(room._id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              Room {room.roomNumber}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {room.roomType?.name || "-"}
                            </div>
                            <div className="text-xs text-gray-500">
                              Capacity: {room.capacity} | ₱{room.rate}/hour
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedRoomIds.includes(room._id)}
                            onChange={() => toggleRoomSelection(room._id)}
                            className="h-5 w-5 rounded border-gray-300 text-[#0c2bfc] focus:ring-[#0c2bfc]/20"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Amenities Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">
                  Amenities
                  {mode === "edit" && amenities.length > 0 && (
                    <span className="ml-2 text-gray-500">
                      ({amenities.length} selected)
                    </span>
                  )}
                  {mode === "add" && roomsWithAmenities.length > 0 && (
                    <span className="ml-2 text-gray-500">
                      (
                      {roomsWithAmenities.reduce(
                        (sum, room) => sum + room.amenities.length,
                        0,
                      )}{" "}
                      total amenities)
                    </span>
                  )}
                </h3>
                {(mode === "edit" && amenities.length > 0) ||
                (mode === "add" &&
                  roomsWithAmenities.some((r) => r.amenities.length > 0)) ? (
                  <span className="text-sm font-medium text-gray-900">
                    Total: ₱{totalCost.toFixed(2)}
                  </span>
                ) : null}
              </div>

              {/* Add Amenity Form - ALWAYS VISIBLE */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <div className="md:col-span-2">
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() =>
                        setShowAmenityDropdown(!showAmenityDropdown)
                      }
                      className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-left flex items-center justify-between outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] text-gray-700 transition-colors duration-200"
                    >
                      <span
                        className={
                          selectedAmenity ? "text-gray-900" : "text-gray-500"
                        }
                      >
                        {selectedAmenity
                          ? selectedAmenity.name
                          : "Select amenity"}
                      </span>
                      <FiChevronDown
                        className={`text-gray-400 transition-transform ${showAmenityDropdown ? "rotate-180" : ""}`}
                      />
                    </button>

                    {/* Amenity dropdown */}
                    {showAmenityDropdown && (
                      <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-lg">
                        {activeAmenities.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            No amenities available
                          </div>
                        ) : (
                          activeAmenities.map((amenity) => {
                            const availableStock = getAvailableStock(
                              amenity._id,
                            );
                            return (
                              <div
                                key={amenity._id}
                                onClick={() => handleAmenitySelect(amenity._id)}
                                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                                  selectedAmenityId === amenity._id
                                    ? "bg-[#0c2bfc]/5"
                                    : ""
                                } ${availableStock === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                                title={
                                  availableStock === 0
                                    ? "Out of stock"
                                    : `Available: ${availableStock}`
                                }
                              >
                                <div className="font-medium text-gray-900">
                                  {amenity.name}
                                </div>
                                <div className="text-xs text-gray-500 flex justify-between mt-0.5">
                                  <span>₱{amenity.rate} each</span>
                                  <span
                                    className={
                                      availableStock === 0
                                        ? "text-red-500"
                                        : "text-gray-500"
                                    }
                                  >
                                    Stock: {availableStock}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max={
                      selectedAmenity
                        ? getAvailableStock(selectedAmenity._id)
                        : 100
                    }
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] text-gray-700 transition-colors duration-200 flex-1"
                    placeholder="Qty"
                    disabled={!selectedAmenity}
                  />
                  <button
                    onClick={() => handleAddAmenity()}
                    disabled={
                      !selectedAmenity ||
                      getAvailableStock(selectedAmenity._id) === 0
                    }
                    className={`h-12 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                      selectedAmenity &&
                      getAvailableStock(selectedAmenity._id) > 0
                        ? "bg-[#0c2bfc] hover:bg-[#0a24d6] text-white shadow-sm hover:shadow"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {mode === "add" && selectedRoomIds.length > 1
                      ? "Add to All Rooms"
                      : "Add"}
                  </button>
                </div>
              </div>

              {/* EDIT MODE: Selected Amenities List (Single Room) */}
              {mode === "edit" && (
                <>
                  {amenities.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-700">
                        Selected Amenities ({amenities.length}):
                      </div>

                      <div className="space-y-2">
                        {amenities.map((item) => {
                          const amenity = allAmenities.find(
                            (a) => a._id === item.amenityId,
                          );
                          if (!amenity) return null;

                          return (
                            <div
                              key={item.amenityId}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate text-gray-900">
                                  {amenity.name}
                                </div>
                                <div className="text-sm text-gray-500 mt-0.5">
                                  ₱{amenity.rate} each
                                  <span className="ml-3 text-xs">
                                    (Stock:{" "}
                                    {getAvailableStock(item.amenityId) +
                                      item.quantity}
                                    )
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateQuantity(
                                        item.amenityId,
                                        item.quantity - 1,
                                      )
                                    }
                                    className="h-8 w-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 grid place-items-center transition-colors duration-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={item.quantity <= 1}
                                  >
                                    <FiMinus className="w-3 h-3" />
                                  </button>
                                  <span className="w-8 text-center font-medium text-gray-900">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateQuantity(
                                        item.amenityId,
                                        item.quantity + 1,
                                      )
                                    }
                                    className="h-8 w-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 grid place-items-center transition-colors duration-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={
                                      item.quantity >=
                                      getAvailableStock(item.amenityId) +
                                        item.quantity
                                    }
                                  >
                                    <FiPlus className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="w-20 text-right">
                                  <div className="font-semibold text-gray-900">
                                    ₱{(amenity.rate * item.quantity).toFixed(2)}
                                  </div>
                                </div>

                                <button
                                  onClick={() =>
                                    handleRemoveAmenity(item.amenityId)
                                  }
                                  className="h-8 w-8 rounded-full border border-gray-200 bg-white hover:bg-red-50 grid place-items-center text-red-500 transition-colors duration-200"
                                >
                                  <FiX />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Total Cost Summary */}
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">
                            Total Amenities Cost
                          </span>
                          <span className="text-lg font-semibold text-gray-900">
                            ₱{totalCost.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="mb-2">No amenities selected</div>
                      <div className="text-sm text-gray-400">
                        Select an amenity from the dropdown and add it
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ADD MODE: Rooms with Amenities List */}
              {mode === "add" && selectedRoomIds.length > 0 && (
                <div className="space-y-4">
                  <div className="text-sm font-medium text-gray-700">
                    Rooms with Amenities ({roomsWithAmenities.length} rooms):
                    {selectedAmenity && (
                      <span className="ml-2 text-[#0c2bfc] font-normal">
                        • Selected: {selectedAmenity.name}
                      </span>
                    )}
                  </div>

                  {roomsWithAmenities.map((room) => {
                    const roomDetails = availableRooms.find(
                      (r) => r._id === room.roomId,
                    );
                    return (
                      <div
                        key={room.roomId}
                        className="border border-gray-200 rounded-xl p-4 bg-white"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              Room {roomDetails?.roomNumber}
                            </div>
                            <div className="text-xs text-gray-500">
                              {roomDetails?.roomType?.name || "-"}
                            </div>
                          </div>

                          {/* Add amenity to specific room button - ALWAYS VISIBLE if amenity is selected */}
                          {selectedAmenity && (
                            <button
                              onClick={() => handleAddAmenity(room.roomId)}
                              disabled={
                                getAvailableStock(selectedAmenity._id) === 0
                              }
                              className={`h-8 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                                getAvailableStock(selectedAmenity._id) > 0
                                  ? "bg-[#00af00]/10 text-[#00af00] hover:bg-[#00af00]/20 border border-[#00af00]/20"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              Add {selectedAmenity.name}
                            </button>
                          )}
                        </div>

                        {room.amenities.length > 0 ? (
                          <div className="space-y-2">
                            {room.amenities.map((item, index) => {
                              const amenity = allAmenities.find(
                                (a) => a._id === item.amenityId,
                              );
                              if (!amenity) return null;

                              return (
                                <div
                                  key={`${room.roomId}-${item.amenityId}`}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">
                                      {amenity.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      ₱{amenity.rate} each
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateAmenityQuantityInRoom(
                                            room.roomId,
                                            item.amenityId,
                                            item.quantity - 1,
                                          )
                                        }
                                        className="h-6 w-6 rounded-full border border-gray-200 bg-white hover:bg-gray-50 grid place-items-center text-gray-700 transition-colors duration-200"
                                        disabled={item.quantity <= 1}
                                      >
                                        <FiMinus className="w-2 h-2" />
                                      </button>
                                      <span className="w-6 text-center text-sm text-gray-900">
                                        {item.quantity}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateAmenityQuantityInRoom(
                                            room.roomId,
                                            item.amenityId,
                                            item.quantity + 1,
                                          )
                                        }
                                        className="h-6 w-6 rounded-full border border-gray-200 bg-white hover:bg-gray-50 grid place-items-center text-gray-700 transition-colors duration-200"
                                        disabled={
                                          item.quantity >=
                                          getAvailableStock(item.amenityId) +
                                            item.quantity
                                        }
                                      >
                                        <FiPlus className="w-2 h-2" />
                                      </button>
                                    </div>

                                    <div className="w-16 text-right text-sm font-medium text-gray-900">
                                      ₱
                                      {(amenity.rate * item.quantity).toFixed(
                                        2,
                                      )}
                                    </div>

                                    <button
                                      onClick={() =>
                                        handleRemoveAmenityFromRoom(
                                          room.roomId,
                                          item.amenityId,
                                        )
                                      }
                                      className="h-6 w-6 rounded-full border border-gray-200 bg-white hover:bg-red-50 grid place-items-center text-red-500 transition-colors duration-200"
                                    >
                                      <FiTrash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-400 text-sm italic">
                            No amenities added to this room yet
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Total Cost Summary for all rooms */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">
                        Total Amenities Cost (All Rooms)
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        ₱{totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="h-11 px-5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              (mode === "add" && selectedRoomIds.length === 0) || loadingRooms
            }
            className={`h-11 px-5 rounded-xl text-white text-sm font-medium transition-all duration-200 ${
              (mode === "add" && selectedRoomIds.length === 0) || loadingRooms
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#0c2bfc] hover:bg-[#0a24d6] shadow-sm hover:shadow"
            }`}
          >
            {mode === "add"
              ? `Add ${selectedRoomIds.length} Room(s)`
              : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
