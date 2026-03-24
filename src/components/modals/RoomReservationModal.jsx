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
import { useAddOnStore } from "../../stores/addOnStore";
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
  const [addOns, setAddOns] = useState(
    initialRoom?.addOns?.map((a) => ({
      addOnId: a.addOnId?._id || a.addOnId,
      quantity: a.quantity || 1,
    })) || [],
  );

  // For add mode (multiple rooms)
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [roomsWithAddOns, setRoomsWithAddOns] = useState([]);

  const [selectedAddOnId, setSelectedAddOnId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showAddOnDropdown, setShowAddOnDropdown] = useState(false);

  const dropdownRef = useRef(null);

  const { addOns: allAddOns, fetchAddOns } = useAddOnStore();
  const { fetchAvailableRooms } = useReservationStore();

  // Fetch add-ons on component mount
  useEffect(() => {
    fetchAddOns().catch((err) => {
      console.error("Failed to fetch add-ons:", err);
      toast.error("Failed to load add-ons");
    });
  }, [fetchAddOns]);

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

  // Initialize roomsWithAddOns when selected rooms change
  useEffect(() => {
    if (mode === "add" && selectedRoomIds.length > 0) {
      // Add new rooms to roomsWithAddOns
      const newRooms = selectedRoomIds.filter(
        (roomId) => !roomsWithAddOns.some((r) => r.roomId === roomId),
      );

      if (newRooms.length > 0) {
        const newRoomsWithAddOns = newRooms.map((roomId) => {
          const room = availableRooms.find((r) => r._id === roomId);
          return {
            roomId: room?._id || roomId,
            roomNumber: room?.roomNumber || "Unknown",
            rate: room?.rate || 0, // Store the rate for display
            capacity: room?.capacity || 0,
            category: room?.category || "room",
            addOns: [],
          };
        });

        setRoomsWithAddOns((prev) => [...prev, ...newRoomsWithAddOns]);
      }

      // Remove rooms that are no longer selected
      setRoomsWithAddOns((prev) =>
        prev.filter((room) => selectedRoomIds.includes(room.roomId)),
      );
    }
  }, [selectedRoomIds, mode, availableRooms]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAddOnDropdown(false);
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
      console.log("Available rooms fetched:", rooms); // Debug log
      setAvailableRooms(rooms || []);
    } catch (error) {
      console.error("Failed to fetch available rooms:", error);
      toast.error("Failed to load available rooms");
    } finally {
      setLoadingRooms(false);
    }
  };

  // Filter active add-ons
  const activeAddOns = useMemo(() => {
    return allAddOns.filter((addOn) => addOn.status === "active");
  }, [allAddOns]);

  // Get selected add-on details
  const selectedAddOn = useMemo(() => {
    return activeAddOns.find((a) => a._id === selectedAddOnId);
  }, [activeAddOns, selectedAddOnId]);

  // Get available add-on stock (considering all selected rooms)
  const getAvailableStock = (addOnId) => {
    const addOn = allAddOns.find((a) => a._id === addOnId);
    if (!addOn) return 0;

    // Check how many are already in current add-ons for all rooms
    let totalReserved = 0;

    if (mode === "edit") {
      totalReserved = addOns
        .filter((a) => a.addOnId === addOnId)
        .reduce((sum, a) => sum + a.quantity, 0);
    } else if (mode === "add") {
      // Sum add-ons across all selected rooms
      roomsWithAddOns.forEach((room) => {
        totalReserved += room.addOns
          .filter((a) => a.addOnId === addOnId)
          .reduce((sum, a) => sum + a.quantity, 0);
      });
    }

    return addOn.stock - totalReserved;
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

  // Handle adding add-on to a specific room or to all selected rooms
  const handleAddAddOn = (targetRoomId = null) => {
    if (!selectedAddOnId || quantity < 1) {
      toast.error("Please select an add-on and quantity");
      return;
    }

    const availableStock = getAvailableStock(selectedAddOnId);
    if (quantity > availableStock) {
      toast.error(`Only ${availableStock} available in stock`);
      return;
    }

    if (mode === "edit") {
      // Add to single room (edit mode)
      const existingIndex = addOns.findIndex(
        (a) => a.addOnId === selectedAddOnId,
      );
      if (existingIndex >= 0) {
        const updated = [...addOns];
        updated[existingIndex].quantity += quantity;
        setAddOns(updated);
      } else {
        setAddOns([...addOns, { addOnId: selectedAddOnId, quantity }]);
      }
      toast.success(`Added ${selectedAddOn.name} to room`);
    } else if (mode === "add") {
      // Add to specific room or all selected rooms
      if (targetRoomId) {
        // Add to specific room
        updateRoomAddOns(targetRoomId, selectedAddOnId, quantity);
        toast.success(`Added ${selectedAddOn.name} to room`);
      } else {
        // Add to all selected rooms
        selectedRoomIds.forEach((roomId) => {
          updateRoomAddOns(roomId, selectedAddOnId, quantity);
        });
        toast.success(
          `Added ${selectedAddOn.name} to ${selectedRoomIds.length} room(s)`,
        );
      }
    }

    // Keep add-on selected for adding more
    setQuantity(1);
  };

  // Update add-ons for a specific room
  const updateRoomAddOns = (roomId, addOnId, quantityToAdd) => {
    setRoomsWithAddOns((prev) =>
      prev.map((room) => {
        if (room.roomId !== roomId) return room;

        const existingIndex = room.addOns.findIndex(
          (a) => a.addOnId === addOnId,
        );
        if (existingIndex >= 0) {
          const updatedAddOns = [...room.addOns];
          updatedAddOns[existingIndex] = {
            ...updatedAddOns[existingIndex],
            quantity: updatedAddOns[existingIndex].quantity + quantityToAdd,
          };
          return { ...room, addOns: updatedAddOns };
        } else {
          return {
            ...room,
            addOns: [
              ...room.addOns,
              {
                addOnId,
                quantity: quantityToAdd,
              },
            ],
          };
        }
      }),
    );
  };

  // Handle removing add-on from a specific room
  const handleRemoveAddOnFromRoom = (roomId, addOnId) => {
    setRoomsWithAddOns((prev) =>
      prev.map((room) => {
        if (room.roomId !== roomId) return room;
        return {
          ...room,
          addOns: room.addOns.filter((a) => a.addOnId !== addOnId),
        };
      }),
    );
  };

  // Handle updating add-on quantity in a specific room
  const handleUpdateAddOnQuantityInRoom = (roomId, addOnId, newQuantity) => {
    const addOn = allAddOns.find((a) => a._id === addOnId);
    if (!addOn) return;

    if (newQuantity < 1) {
      handleRemoveAddOnFromRoom(roomId, addOnId);
      return;
    }

    const totalUsedInAllRooms = roomsWithAddOns.reduce((total, room) => {
      const roomAddOn = room.addOns.find((a) => a.addOnId === addOnId);
      return total + (roomAddOn ? roomAddOn.quantity : 0);
    }, 0);

    const currentRoomAddOn = roomsWithAddOns
      .find((r) => r.roomId === roomId)
      ?.addOns.find((a) => a.addOnId === addOnId);

    const currentRoomQuantity = currentRoomAddOn
      ? currentRoomAddOn.quantity
      : 0;
    const otherRoomsQuantity = totalUsedInAllRooms - currentRoomQuantity;

    if (newQuantity + otherRoomsQuantity > addOn.stock) {
      toast.error(`Cannot exceed total stock of ${addOn.stock}`);
      return;
    }

    setRoomsWithAddOns((prev) =>
      prev.map((room) => {
        if (room.roomId !== roomId) return room;
        return {
          ...room,
          addOns: room.addOns.map((a) =>
            a.addOnId === addOnId ? { ...a, quantity: newQuantity } : a,
          ),
        };
      }),
    );
  };

  // For edit mode: handle removing add-on
  const handleRemoveAddOn = (addOnId) => {
    setAddOns(addOns.filter((a) => a.addOnId !== addOnId));
  };

  // For edit mode: handle updating add-on quantity
  const handleUpdateQuantity = (addOnId, newQuantity) => {
    const addOn = allAddOns.find((a) => a._id === addOnId);
    if (!addOn) return;

    if (newQuantity < 1) {
      handleRemoveAddOn(addOnId);
      return;
    }

    if (newQuantity > addOn.stock) {
      toast.error(`Cannot exceed stock of ${addOn.stock}`);
      return;
    }

    setAddOns(
      addOns.map((a) =>
        a.addOnId === addOnId ? { ...a, quantity: newQuantity } : a,
      ),
    );
  };

  const handleAddOnSelect = (addOnId) => {
    setSelectedAddOnId(addOnId);
    setShowAddOnDropdown(false);
    setQuantity(1);
  };

  const handleSubmit = () => {
    if (mode === "add") {
      if (selectedRoomIds.length === 0) {
        toast.error("Please select at least one room");
        return;
      }

      // Filter only rooms that are selected
      const roomsToSubmit = roomsWithAddOns.filter((room) =>
        selectedRoomIds.includes(room.roomId),
      );

      // Prepare payload in the exact format the store expects
      const payload = {
        reservationId,
        rooms: roomsToSubmit.map((room) => ({
          roomId: room.roomId,
          addOns: room.addOns.map((addOn) => ({
            addOnId: addOn.addOnId,
            quantity: addOn.quantity,
          })),
        })),
      };

      console.log("Submitting payload:", payload); // Debug log
      onSave(payload);
    } else if (mode === "edit") {
      // Single room edit mode
      const payload = {
        reservationRoomId: initialRoom._id,
        addOns: addOns.map((addOn) => ({
          addOnId: addOn.addOnId,
          quantity: addOn.quantity,
        })),
      };
      console.log("Submitting edit payload:", payload); // Debug log
      onSave(payload);
    }
  };

  // Calculate total cost (only for add-ons, room rate is handled separately)
  const totalCost = useMemo(() => {
    if (mode === "edit") {
      return addOns.reduce((total, item) => {
        const addOn = allAddOns.find((a) => a._id === item.addOnId);
        return total + (addOn ? addOn.rate * item.quantity : 0);
      }, 0);
    } else {
      // Calculate total for all rooms
      return roomsWithAddOns.reduce((total, room) => {
        return (
          total +
          room.addOns.reduce((roomTotal, item) => {
            const addOn = allAddOns.find((a) => a._id === item.addOnId);
            return roomTotal + (addOn ? addOn.rate * item.quantity : 0);
          }, 0)
        );
      }, 0);
    }
  }, [addOns, roomsWithAddOns, allAddOns, mode]);

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
                : "Edit Room Add-Ons"}
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
                      ₱{initialRoom.roomId.rate}/night
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
                              {room.category === "cottage" ? "Cottage" : "Room"}{" "}
                              {room.roomNumber}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {room.roomType?.name || "-"}
                            </div>
                            <div className="text-xs text-gray-500">
                              Capacity: {room.capacity} | ₱{room.rate}/night
                            </div>
                            {room.category === "cottage" && (
                              <div className="text-xs text-[#00af00] mt-1">
                                ✨ Cottage (Add-ons not available)
                              </div>
                            )}
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

            {/* Add-Ons Section - Only show for rooms (not cottages) */}
            {mode === "add" && selectedRoomIds.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    Add-Ons
                    {roomsWithAddOns.length > 0 && (
                      <span className="ml-2 text-gray-500">
                        (
                        {roomsWithAddOns.reduce(
                          (sum, room) => sum + room.addOns.length,
                          0,
                        )}{" "}
                        total add-ons)
                      </span>
                    )}
                  </h3>
                  {roomsWithAddOns.some((r) => r.addOns.length > 0) && (
                    <span className="text-sm font-medium text-gray-900">
                      Total: ₱{totalCost.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Add Add-On Form - ALWAYS VISIBLE */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                  <div className="md:col-span-2">
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowAddOnDropdown(!showAddOnDropdown)}
                        className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-left flex items-center justify-between outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] text-gray-700 transition-colors duration-200"
                      >
                        <span
                          className={
                            selectedAddOn ? "text-gray-900" : "text-gray-500"
                          }
                        >
                          {selectedAddOn
                            ? `${selectedAddOn.name} (${selectedAddOn.category || "other"})`
                            : "Select add-on"}
                        </span>
                        <FiChevronDown
                          className={`text-gray-400 transition-transform ${showAddOnDropdown ? "rotate-180" : ""}`}
                        />
                      </button>

                      {/* Add-On dropdown */}
                      {showAddOnDropdown && (
                        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-lg">
                          {activeAddOns.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500">
                              No add-ons available
                            </div>
                          ) : (
                            activeAddOns.map((addOn) => {
                              const availableStock = getAvailableStock(
                                addOn._id,
                              );
                              return (
                                <div
                                  key={addOn._id}
                                  onClick={() => handleAddOnSelect(addOn._id)}
                                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                                    selectedAddOnId === addOn._id
                                      ? "bg-[#0c2bfc]/5"
                                      : ""
                                  } ${availableStock === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                                  title={
                                    availableStock === 0
                                      ? "Out of stock"
                                      : `Available: ${availableStock}`
                                  }
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium text-gray-900">
                                      {addOn.name}
                                    </div>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                      {addOn.category || "other"}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 flex justify-between mt-0.5">
                                    <span>₱{addOn.rate} each</span>
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
                                  {addOn.description && (
                                    <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                                      {addOn.description}
                                    </div>
                                  )}
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
                        selectedAddOn
                          ? getAvailableStock(selectedAddOn._id)
                          : 100
                      }
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] text-gray-700 transition-colors duration-200 flex-1"
                      placeholder="Qty"
                      disabled={!selectedAddOn}
                    />
                    <button
                      onClick={() => handleAddAddOn()}
                      disabled={
                        !selectedAddOn ||
                        getAvailableStock(selectedAddOn._id) === 0
                      }
                      className={`h-12 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                        selectedAddOn &&
                        getAvailableStock(selectedAddOn._id) > 0
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

                {/* Rooms with Add-Ons List */}
                {roomsWithAddOns.length > 0 && (
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-gray-700">
                      Rooms with Add-Ons ({roomsWithAddOns.length} rooms):
                      {selectedAddOn && (
                        <span className="ml-2 text-[#0c2bfc] font-normal">
                          • Selected: {selectedAddOn.name}
                        </span>
                      )}
                    </div>

                    {roomsWithAddOns.map((room) => {
                      const roomDetails = availableRooms.find(
                        (r) => r._id === room.roomId,
                      );
                      const isCottage = roomDetails?.category === "cottage";

                      return (
                        <div
                          key={room.roomId}
                          className="border border-gray-200 rounded-xl p-4 bg-white"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="font-medium text-gray-900">
                                {isCottage ? "Cottage" : "Room"}{" "}
                                {roomDetails?.roomNumber || room.roomNumber}
                              </div>
                              <div className="text-xs text-gray-500">
                                Rate: ₱{roomDetails?.rate || room.rate}/night
                              </div>
                            </div>

                            {/* Add add-on to specific room button - ONLY for rooms, NOT for cottages */}
                            {selectedAddOn && !isCottage && (
                              <button
                                onClick={() => handleAddAddOn(room.roomId)}
                                disabled={
                                  getAvailableStock(selectedAddOn._id) === 0
                                }
                                className={`h-8 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                                  getAvailableStock(selectedAddOn._id) > 0
                                    ? "bg-[#00af00]/10 text-[#00af00] hover:bg-[#00af00]/20 border border-[#00af00]/20"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                              >
                                Add {selectedAddOn.name}
                              </button>
                            )}
                          </div>

                          {isCottage ? (
                            <div className="text-center py-4 text-gray-400 text-sm italic bg-gray-50 rounded-lg">
                              ℹ️ Add-ons are not available for cottages
                            </div>
                          ) : room.addOns.length > 0 ? (
                            <div className="space-y-2">
                              {room.addOns.map((item) => {
                                const addOn = allAddOns.find(
                                  (a) => a._id === item.addOnId,
                                );
                                if (!addOn) return null;

                                return (
                                  <div
                                    key={`${room.roomId}-${item.addOnId}`}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className="text-sm font-medium text-gray-900">
                                          {addOn.name}
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                                          {addOn.category || "other"}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        ₱{addOn.rate} each
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleUpdateAddOnQuantityInRoom(
                                              room.roomId,
                                              item.addOnId,
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
                                            handleUpdateAddOnQuantityInRoom(
                                              room.roomId,
                                              item.addOnId,
                                              item.quantity + 1,
                                            )
                                          }
                                          className="h-6 w-6 rounded-full border border-gray-200 bg-white hover:bg-gray-50 grid place-items-center text-gray-700 transition-colors duration-200"
                                          disabled={
                                            item.quantity >=
                                            getAvailableStock(item.addOnId) +
                                              item.quantity
                                          }
                                        >
                                          <FiPlus className="w-2 h-2" />
                                        </button>
                                      </div>

                                      <div className="w-16 text-right text-sm font-medium text-gray-900">
                                        ₱
                                        {(addOn.rate * item.quantity).toFixed(
                                          2,
                                        )}
                                      </div>

                                      <button
                                        onClick={() =>
                                          handleRemoveAddOnFromRoom(
                                            room.roomId,
                                            item.addOnId,
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
                              No add-ons added to this room yet
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Total Cost Summary for all rooms */}
                    {roomsWithAddOns.some((r) => r.addOns.length > 0) && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">
                            Total Add-Ons Cost (All Rooms)
                          </span>
                          <span className="text-lg font-semibold text-gray-900">
                            ₱{totalCost.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* EDIT MODE: Selected Add-Ons List (Single Room) */}
            {mode === "edit" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    Add-Ons
                    {addOns.length > 0 && (
                      <span className="ml-2 text-gray-500">
                        ({addOns.length} selected)
                      </span>
                    )}
                  </h3>
                  {addOns.length > 0 && (
                    <span className="text-sm font-medium text-gray-900">
                      Total: ₱{totalCost.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Add Add-On Form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                  <div className="md:col-span-2">
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowAddOnDropdown(!showAddOnDropdown)}
                        className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-left flex items-center justify-between outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] text-gray-700 transition-colors duration-200"
                      >
                        <span
                          className={
                            selectedAddOn ? "text-gray-900" : "text-gray-500"
                          }
                        >
                          {selectedAddOn
                            ? `${selectedAddOn.name} (${selectedAddOn.category || "other"})`
                            : "Select add-on"}
                        </span>
                        <FiChevronDown
                          className={`text-gray-400 transition-transform ${showAddOnDropdown ? "rotate-180" : ""}`}
                        />
                      </button>

                      {showAddOnDropdown && (
                        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-lg">
                          {activeAddOns.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-gray-500">
                              No add-ons available
                            </div>
                          ) : (
                            activeAddOns.map((addOn) => {
                              const availableStock = getAvailableStock(
                                addOn._id,
                              );
                              return (
                                <div
                                  key={addOn._id}
                                  onClick={() => handleAddOnSelect(addOn._id)}
                                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                                    selectedAddOnId === addOn._id
                                      ? "bg-[#0c2bfc]/5"
                                      : ""
                                  } ${availableStock === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                                  title={
                                    availableStock === 0
                                      ? "Out of stock"
                                      : `Available: ${availableStock}`
                                  }
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium text-gray-900">
                                      {addOn.name}
                                    </div>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                      {addOn.category || "other"}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 flex justify-between mt-0.5">
                                    <span>₱{addOn.rate} each</span>
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
                        selectedAddOn
                          ? getAvailableStock(selectedAddOn._id)
                          : 100
                      }
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] text-gray-700 transition-colors duration-200 flex-1"
                      placeholder="Qty"
                      disabled={!selectedAddOn}
                    />
                    <button
                      onClick={() => handleAddAddOn()}
                      disabled={
                        !selectedAddOn ||
                        getAvailableStock(selectedAddOn._id) === 0
                      }
                      className={`h-12 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                        selectedAddOn &&
                        getAvailableStock(selectedAddOn._id) > 0
                          ? "bg-[#0c2bfc] hover:bg-[#0a24d6] text-white shadow-sm hover:shadow"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {addOns.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700">
                      Selected Add-Ons ({addOns.length}):
                    </div>

                    <div className="space-y-2">
                      {addOns.map((item) => {
                        const addOn = allAddOns.find(
                          (a) => a._id === item.addOnId,
                        );
                        if (!addOn) return null;

                        return (
                          <div
                            key={item.addOnId}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="font-medium truncate text-gray-900">
                                  {addOn.name}
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                                  {addOn.category || "other"}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 mt-0.5">
                                ₱{addOn.rate} each
                                <span className="ml-3 text-xs">
                                  (Stock:{" "}
                                  {getAvailableStock(item.addOnId) +
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
                                      item.addOnId,
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
                                      item.addOnId,
                                      item.quantity + 1,
                                    )
                                  }
                                  className="h-8 w-8 rounded-full border border-gray-200 bg-white hover:bg-gray-50 grid place-items-center transition-colors duration-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={
                                    item.quantity >=
                                    getAvailableStock(item.addOnId) +
                                      item.quantity
                                  }
                                >
                                  <FiPlus className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="w-20 text-right">
                                <div className="font-semibold text-gray-900">
                                  ₱{(addOn.rate * item.quantity).toFixed(2)}
                                </div>
                              </div>

                              <button
                                onClick={() => handleRemoveAddOn(item.addOnId)}
                                className="h-8 w-8 rounded-full border border-gray-200 bg-white hover:bg-red-50 grid place-items-center text-red-500 transition-colors duration-200"
                              >
                                <FiX />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">
                          Total Add-Ons Cost
                        </span>
                        <span className="text-lg font-semibold text-gray-900">
                          ₱{totalCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="mb-2">No add-ons selected</div>
                    <div className="text-sm text-gray-400">
                      Select an add-on from the dropdown and add it
                    </div>
                  </div>
                )}
              </div>
            )}
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
