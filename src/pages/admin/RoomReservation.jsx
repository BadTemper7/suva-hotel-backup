import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiEdit2,
  FiPlus,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
  FiEye,
  FiUploadCloud,
  FiFilter,
  FiPackage,
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { Helmet } from "react-helmet";

import Loader from "../../components/layout/Loader.jsx";
import RoomReservationModal from "../../components/modals/RoomReservationModal.jsx";
import { useReservationStore } from "../../stores/reservationStore.js";
import { useReservationRoomStore } from "../../stores/reservationRoomStore.js";
import { getUserRole } from "../../app/auth.js";
import Pagination from "../../components/ui/Pagination.jsx";

function ImageCell({ images, roomNo, onPreview }) {
  const arr = Array.isArray(images) ? images : [];
  const first = arr[0]?.url || arr[0];

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onPreview?.(0)}
        disabled={arr.length === 0}
        className={`
          h-12 w-16 rounded-xl overflow-hidden border grid place-items-center
          transition-all duration-200
          ${
            arr.length === 0
              ? "bg-gray-100 border-gray-200 cursor-not-allowed"
              : "bg-white border-gray-200 hover:ring-2 hover:ring-[#0c2bfc]/20 hover:shadow-md hover:-translate-y-0.5"
          }
        `}
        title={arr.length ? "Preview images" : "No images"}
      >
        {first ? (
          <img
            src={first}
            alt={`Room ${roomNo}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <FiUploadCloud className="text-gray-400" />
        )}
      </button>
    </div>
  );
}

function RoomCard({ roomData, onEdit, onView, onPreview, selected, onSelect }) {
  const { roomId, amenities } = roomData;
  const money = (n) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(n || 0);

  return (
    <div
      className="
        rounded-xl border border-gray-200 
        bg-white
        p-4 flex items-start gap-4
        shadow-sm hover:shadow-md transition-all duration-300
        hover:-translate-y-0.5
      "
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect(roomData._id)}
        className="
          mt-1 h-5 w-5 rounded border-gray-300 
          text-[#0c2bfc] focus:ring-[#0c2bfc]/20
        "
      />

      <ImageCell
        images={roomId?.images}
        roomNo={roomId?.roomNumber}
        onPreview={() => onPreview(roomData, 0)}
      />

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900 truncate">
          Room {roomId?.roomNumber}
        </div>
        <div className="text-xs text-gray-600 font-medium mt-0.5">
          {roomId?.roomType?.name ?? "-"}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <svg
              className="w-4 h-4 text-[#0c2bfc]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13 0A9 9 0 008.965 3.525m11.035 8.975a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">
              Capacity: {roomId?.capacity || "-"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <svg
              className="w-4 h-4 text-[#00af00]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">{money(roomId?.rate)}</span>
          </div>
        </div>

        {/* Amenities summary */}
        <div className="mt-4">
          <div className="text-xs font-medium text-gray-700 mb-1">
            Amenities
          </div>
          {amenities && amenities.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {amenities.slice(0, 3).map((amenity, idx) => (
                <span
                  key={idx}
                  className="
                    px-2 py-1 rounded-full text-xs 
                    bg-gray-100 
                    border border-gray-200 text-gray-700
                  "
                >
                  {amenity.amenityId?.name || amenity.amenityId}
                  {amenity.quantity > 1 && ` (×${amenity.quantity})`}
                </span>
              ))}
              {amenities.length > 3 && (
                <span className="px-2 py-1 rounded-full text-xs bg-gray-50 border border-gray-200 text-gray-500">
                  +{amenities.length - 3} more
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic">No amenities</div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onEdit(roomData)}
          className="
            h-10 px-4 rounded-xl 
            border border-gray-200 
            bg-white
            hover:bg-gray-50
            text-sm font-medium inline-flex items-center gap-2
            transition-all duration-200
            hover:shadow-md hover:-translate-y-0.5
            active:translate-y-0
            text-gray-700 hover:text-[#0c2bfc]
          "
        >
          <FiEdit2 className="w-4 h-4" /> Edit
        </button>
        <button
          type="button"
          onClick={() => onView(roomId?._id)}
          className="
            h-10 px-4 rounded-xl 
            border border-gray-200 
            bg-white
            hover:bg-gray-50
            text-sm font-medium inline-flex items-center gap-2
            transition-all duration-200
            hover:shadow-md hover:-translate-y-0.5
            active:translate-y-0
            text-gray-700 hover:text-[#0c2bfc]
          "
        >
          <FiEye className="w-4 h-4" /> View
        </button>
      </div>
    </div>
  );
}

export default function RoomReservation() {
  const { reservationId } = useParams();
  const navigate = useNavigate();

  const { fetchReservation } = useReservationStore();
  const {
    rooms: reservationRooms,
    fetchRoomsByReservationId,
    addReservationRooms,
    updateReservationRoom,
    removeReservationRooms,
    deleteMultipleReservationRooms,
    loading,
  } = useReservationRoomStore();

  const [reservation, setReservation] = useState(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [modal, setModal] = useState({
    open: false,
    mode: "add",
    room: null,
    reservationId: reservationId,
    reservationData: null,
  });

  const role = getUserRole();
  const isAdmin = role === "admin" || role === "superadmin";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedReservation] = await Promise.all([
          fetchReservation(reservationId).catch(() => null),
          fetchRoomsByReservationId(reservationId),
        ]);

        setReservation(fetchedReservation);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load reservation data");
      }
    };

    if (reservationId) {
      fetchData();
    }
  }, [reservationId, fetchReservation, fetchRoomsByReservationId]);

  const filtered = useMemo(() => {
    const searchTerm = q.trim().toLowerCase();
    if (!searchTerm) return reservationRooms || [];

    return (reservationRooms || []).filter((roomData) => {
      const room = roomData.roomId;
      if (!room) return false;

      const roomNumber = String(room.roomNumber || "").toLowerCase();
      const roomType = String(room.roomType?.name || "").toLowerCase();

      return roomNumber.includes(searchTerm) || roomType.includes(searchTerm);
    });
  }, [reservationRooms, q]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const paged = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  useEffect(() => {
    setSelectedRooms([]);
    setPage(1);
  }, [q]);

  const openAddModal = () => {
    if (!reservation) {
      toast.error("Please wait for reservation data to load");
      return;
    }

    setModal({
      open: true,
      mode: "add",
      room: null,
      reservationId,
      reservationData: reservation,
    });
  };

  const openEditModal = (roomData) => {
    if (!reservation) {
      toast.error("Please wait for reservation data to load");
      return;
    }

    setModal({
      open: true,
      mode: "edit",
      room: roomData,
      reservationId,
      reservationData: reservation,
    });
  };

  const closeModal = () => {
    setModal({
      open: false,
      mode: "add",
      room: null,
      reservationId: null,
      reservationData: null,
    });
  };

  const saveRoom = async (payload) => {
    try {
      if (modal.mode === "add") {
        await addReservationRooms({
          reservationId: payload.reservationId,
          rooms: payload.rooms,
        });
        toast.success(`${payload.rooms.length} room(s) added successfully`);
      } else if (modal.mode === "edit") {
        await updateReservationRoom({
          reservationId: modal.reservationId,
          reservationRoomId: payload.reservationRoomId,
          amenities: payload.amenities,
        });
        toast.success("Room updated successfully");
      }
      closeModal();
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
  };

  const toggleSelectRoom = (id) => {
    setSelectedRooms((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedRooms.length === paged.length) setSelectedRooms([]);
    else setSelectedRooms(paged.map((r) => r._id));
  };

  const handleDeleteSelected = async () => {
    if (selectedRooms.length === 0) return;

    const count = selectedRooms.length;
    if (
      !confirm(
        `Are you sure you want to remove ${count} room(s) from this reservation?`,
      )
    )
      return;

    try {
      await deleteMultipleReservationRooms(reservationId, selectedRooms);
      toast.success(`${count} room(s) removed successfully`);
      setSelectedRooms([]);
    } catch (err) {
      toast.error(err.message || "Failed to remove selected rooms");
    }
  };

  const navigateToRoom = (roomId) => {
    if (roomId) {
      navigate(`/admin/rooms/${roomId}`);
    }
  };

  const money = (n) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(n || 0);

  return (
    <>
      <Helmet>
        <title>Room Reservations - Resort Admin</title>
      </Helmet>
      <div className="h-full min-h-0 flex flex-col gap-6">
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            style: {
              background: "#ffffff",
              color: "#1f2937",
              border: "1px solid #e5e7eb",
            },
          }}
        />

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xl font-bold text-gray-900">
              Room Reservations
            </div>
            <div className="text-sm text-gray-600">
              {reservation ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-900">
                      Reservation #{reservation.reservationNumber}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span>
                      Check-in:{" "}
                      {new Date(reservation.checkIn).toLocaleDateString()}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span>
                      Check-out:{" "}
                      {new Date(reservation.checkOut).toLocaleDateString()}
                    </span>
                    {reservation.guestId && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span>
                          Guest: {reservation.guestId.firstName}{" "}
                          {reservation.guestId.lastName}
                        </span>
                      </>
                    )}
                  </div>
                </>
              ) : (
                "Loading reservation details..."
              )}
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={openAddModal}
              className="
                h-11 px-5 rounded-xl 
                bg-[#0c2bfc] 
                hover:bg-[#0a24d6]
                text-white text-sm font-medium inline-flex items-center gap-2
                transition-all duration-200
                hover:shadow-lg hover:-translate-y-0.5
                active:translate-y-0
              "
            >
              <FiPlus className="w-4 h-4" /> Add Room
            </button>
          )}
        </div>

        {/* Search + Info */}
        <div
          className="
          rounded-xl border border-gray-200 
          bg-white
          p-4 shadow-sm
        "
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <form onSubmit={(e) => e.preventDefault()}>
                <div
                  className="
                  flex items-center gap-2 rounded-xl 
                  border border-gray-200 
                  bg-white px-4 py-3
                  focus-within:ring-2 focus-within:ring-[#0c2bfc]/20
                  focus-within:border-[#0c2bfc] transition-all duration-200
                "
                >
                  <FiSearch className="text-gray-400 shrink-0" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="
                      w-full bg-transparent outline-none 
                      text-sm text-gray-800 placeholder-gray-400
                    "
                    placeholder="Search room number, room type..."
                  />
                </div>
              </form>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FiPackage className="text-[#0c2bfc]" />
                <span>
                  Total Rooms:{" "}
                  <span className="font-semibold text-gray-900">
                    {reservationRooms?.length || 0}
                  </span>
                </span>
              </div>
              <div className="h-4 w-px bg-gray-200"></div>
              <div>
                Filtered:{" "}
                <span className="font-semibold text-gray-900">
                  {filtered.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Selection Info Bar */}
        {isAdmin && selectedRooms.length > 0 && (
          <div
            className="
            rounded-xl border border-gray-200 
            bg-gray-50
            px-6 py-3 flex justify-between items-center
          "
          >
            <span className="text-sm font-medium text-gray-700">
              {selectedRooms.length} room(s) selected
            </span>
            <button
              onClick={handleDeleteSelected}
              disabled={loading}
              className="
                h-9 px-4 rounded-xl 
                bg-[#0c2bfc] 
                hover:bg-[#0a24d6]
                text-white text-sm font-medium inline-flex items-center gap-2
                transition-all duration-200
                hover:shadow-md hover:-translate-y-0.5
                active:translate-y-0
                disabled:opacity-70 disabled:cursor-not-allowed
              "
            >
              <FiTrash2 className="w-4 h-4" /> Remove Selected
            </button>
          </div>
        )}

        {/* Mobile list */}
        <div className="md:hidden space-y-3">
          {paged.map((roomData) => (
            <RoomCard
              key={roomData._id}
              roomData={roomData}
              onEdit={openEditModal}
              onView={navigateToRoom}
              onPreview={() => {}}
              selected={selectedRooms.includes(roomData._id)}
              onSelect={toggleSelectRoom}
            />
          ))}

          {paged.length === 0 && (
            <div
              className="
              rounded-xl border border-gray-200 
              bg-white
              px-6 py-12 text-center
            "
            >
              <div className="text-gray-300 mb-3">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <div className="text-gray-700 font-medium">
                {loading
                  ? "Loading rooms..."
                  : "No rooms found for this reservation"}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {!loading && q
                  ? "Try adjusting your search"
                  : "Add rooms to this reservation"}
              </div>
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div
          className="
          min-h-0 hidden md:flex flex-col 
          bg-white
          border border-gray-200 rounded-xl 
          overflow-hidden shadow-sm
        "
        >
          <div
            className="
            px-6 py-4 border-b border-gray-200 
            flex items-center justify-between gap-3
            bg-gray-50
          "
          >
            <div className="flex items-center gap-3">
              {isAdmin && (
                <input
                  type="checkbox"
                  checked={
                    selectedRooms.length === paged.length && paged.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="
                    h-5 w-5 rounded border-gray-300 
                    text-[#0c2bfc] focus:ring-[#0c2bfc]/20
                  "
                />
              )}
              <div className="text-sm font-semibold text-gray-900">
                Reserved Rooms ({total})
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="
                    h-10 rounded-xl border border-gray-200 
                    bg-white px-3 text-sm outline-none 
                    focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
                    text-gray-700 font-medium
                  "
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  {isAdmin && (
                    <th className="px-6 py-4 w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedRooms.length === paged.length &&
                          paged.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="h-5 w-5 rounded border-gray-300 text-[#0c2bfc] focus:ring-[#0c2bfc]/20"
                      />
                    </th>
                  )}
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Images
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Room #
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Room Type
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Capacity
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Rate
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Amenities
                  </th>
                  {isAdmin && (
                    <th className="text-right font-semibold text-gray-700 px-6 py-4">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {paged.map((roomData) => {
                  const { roomId, amenities } = roomData;

                  return (
                    <tr
                      key={roomData._id}
                      className="
                        border-b border-gray-100 last:border-b-0
                        hover:bg-gray-50
                        transition-colors duration-150
                      "
                    >
                      {isAdmin && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedRooms.includes(roomData._id)}
                            onChange={() => toggleSelectRoom(roomData._id)}
                            className="
                              h-5 w-5 rounded border-gray-300 
                              text-[#0c2bfc] focus:ring-[#0c2bfc]/20
                            "
                          />
                        </td>
                      )}

                      <td className="px-6 py-4">
                        <ImageCell
                          images={roomId?.images}
                          roomNo={roomId?.roomNumber}
                          onPreview={() => {}}
                        />
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">
                          {roomId?.roomNumber || "N/A"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-gray-700 font-medium">
                          {roomId?.roomType?.name || "-"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-gray-700 font-medium">
                          {roomId?.capacity || "-"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-gray-700 font-medium">
                          {money(roomId?.rate)}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {amenities && amenities.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {amenities.slice(0, 2).map((amenity, idx) => (
                              <span
                                key={idx}
                                className="
                                  px-2 py-1 rounded-full text-xs 
                                  bg-gray-100 
                                  border border-gray-200 text-gray-700
                                "
                              >
                                {amenity.amenityId?.name || amenity.amenityId}
                                {amenity.quantity > 1 &&
                                  ` (×${amenity.quantity})`}
                              </span>
                            ))}
                            {amenities.length > 2 && (
                              <span
                                className="
                                  px-2 py-1 rounded-full text-xs 
                                  bg-gray-50 
                                  border border-gray-200 text-gray-500
                                "
                              >
                                +{amenities.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">None</span>
                        )}
                      </td>

                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(roomData)}
                              className="
                                h-10 px-4 rounded-xl 
                                border border-gray-200 
                                bg-white
                                hover:bg-gray-50
                                text-sm font-medium inline-flex items-center gap-2
                                transition-all duration-200
                                hover:shadow-md hover:-translate-y-0.5
                                active:translate-y-0
                                text-gray-700 hover:text-[#0c2bfc]
                              "
                            >
                              <FiEdit2 className="w-4 h-4" /> Edit
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}

                {paged.length === 0 && (
                  <tr>
                    <td
                      colSpan={isAdmin ? 8 : 7}
                      className="px-6 py-16 text-center"
                    >
                      <div className="text-gray-300 mb-3">
                        <svg
                          className="w-16 h-16 mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          />
                        </svg>
                      </div>
                      <div className="text-gray-700 font-medium text-lg">
                        {loading ? "Loading rooms..." : "No rooms found"}
                      </div>
                      <div className="text-sm text-gray-500 mt-2">
                        {!loading && "Try adding rooms to this reservation"}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          total={total}
          pageSize={pageSize}
          color="blue"
        />

        {/* Modal */}
        {modal.open && (
          <RoomReservationModal
            open={modal.open}
            mode={modal.mode}
            room={modal.room}
            reservationId={modal.reservationId}
            reservationData={modal.reservationData}
            onClose={closeModal}
            onSave={saveRoom}
          />
        )}

        {/* Loader overlay */}
        {loading && (
          <div
            className="
            absolute inset-0 z-50 flex items-center justify-center 
            bg-white/90 backdrop-blur-sm
          "
          >
            <Loader
              size={60}
              variant="primary"
              showText={true}
              text="Loading reservation rooms..."
            />
          </div>
        )}
      </div>
    </>
  );
}
