import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { getToken } from "../../app/auth.js";
import { roomOffersHourlyPackage, stayRateLabel } from "../../utils/stay.js";
import Loader from "../layout/Loader.jsx";

const API =
  import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

const money = (n) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Number(n || 0),
  );

export default function ChangeRoomModal({
  open,
  onClose,
  reservation,
  reservationRoom,
  onTransferred,
}) {
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newRoomId, setNewRoomId] = useState("");
  const [reason, setReason] = useState("");

  const currentRoom = reservationRoom?.roomId;
  const stayType = reservation?.stayType || "overnight";
  const hourlyDuration = reservation?.hourlyDuration;

  // Freeze the stay window when the modal opens. Using `new Date()` in render
  // for checked-in stays made the query key change every render and kept the
  // loader spinning forever.
  const stayWindow = useMemo(() => {
    if (!open || !reservation) return { start: "", end: "" };
    const end = reservation.checkOut
      ? new Date(reservation.checkOut).toISOString()
      : "";
    const start =
      reservation.status === "checked_in"
        ? new Date().toISOString()
        : reservation.checkIn
          ? new Date(reservation.checkIn).toISOString()
          : "";
    return { start, end };
  }, [
    open,
    reservation?._id,
    reservation?.status,
    reservation?.checkIn,
    reservation?.checkOut,
  ]);

  useEffect(() => {
    if (!open || !reservation?._id || !stayWindow.start || !stayWindow.end) {
      return undefined;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          checkIn: stayWindow.start,
          checkOut: stayWindow.end,
          excludeReservationId: reservation._id,
        });
        const res = await fetch(`${API}/reservations/rooms?${params}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to load rooms");
        if (!cancelled) {
          setAvailable(data.availableRooms || []);
          setNewRoomId("");
          setReason("");
        }
      } catch (err) {
        if (!cancelled) toast.error(err.message || "Failed to load rooms");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, reservation?._id, stayWindow.start, stayWindow.end]);

  const options = useMemo(() => {
    return (available || []).filter((room) => {
      if (!room || String(room._id) === String(currentRoom?._id)) return false;
      if (currentRoom?.category && room.category !== currentRoom.category) {
        return false;
      }
      if (stayType === "hourly" && !roomOffersHourlyPackage(room, hourlyDuration)) {
        return false;
      }
      return true;
    });
  }, [available, currentRoom, stayType, hourlyDuration]);

  const selected = options.find((r) => r._id === newRoomId);
  const oldRate = stayType === "hourly"
    ? Number(currentRoom?.hourlyRates?.[`hours${hourlyDuration}`] || 0)
    : Number(currentRoom?.rate || 0);
  const newRate = stayType === "hourly"
    ? Number(selected?.hourlyRates?.[`hours${hourlyDuration}`] || 0)
    : Number(selected?.rate || 0);
  const rateChanged = selected && oldRate !== newRate;

  async function submit(e) {
    e.preventDefault();
    if (!newRoomId) {
      toast.error("Select a replacement room");
      return;
    }
    if (!reason.trim()) {
      toast.error("A reason is required");
      return;
    }
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(
        `${API}/reservation-rooms/${reservationRoom._id}/transfer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ newRoomId, reason: reason.trim() }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || "Transfer failed");
      toast.success(data.message || "Room changed");
      onTransferred?.(data);
      onClose?.();
    } catch (err) {
      toast.error(err.message || "Transfer failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="Close"
            onClick={onClose}
          />
          <div className="absolute inset-0 flex items-end sm:items-center justify-center p-3 sm:p-6">
            <motion.div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden relative max-h-[90vh] flex flex-col">
              {(loading || saving) && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                  <Loader size={44} variant="primary" />
                </div>
              )}
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Change room
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Current: {currentRoom?.roomNumber || "—"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm inline-flex items-center gap-2"
                >
                  <FiX /> Close
                </button>
              </div>
              <form onSubmit={submit} className="p-5 space-y-4 overflow-y-auto">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Replacement *
                  </label>
                  <select
                    value={newRoomId}
                    onChange={(e) => setNewRoomId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]"
                    required
                  >
                    <option value="">Select a room</option>
                    {options.map((room) => (
                      <option key={room._id} value={room._id}>
                        {room.roomNumber}
                        {room.roomType?.name ? ` · ${room.roomType.name}` : ""}{" "}
                        · {money(stayType === "hourly"
                          ? room.hourlyRates?.[`hours${hourlyDuration}`] || 0
                          : room.rate)}{" "}
                        {stayRateLabel(stayType, hourlyDuration)}
                      </option>
                    ))}
                  </select>
                  {options.length === 0 && !loading && (
                    <p className="text-xs text-amber-700 mt-2">
                      No matching available rooms for this stay window.
                    </p>
                  )}
                </div>
                {rateChanged && (
                  <div className="text-sm rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                    Rate changes from {money(oldRate)} to {money(newRate)}. Billing
                    will be recalculated.
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Reason *
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    required
                    placeholder="e.g. AC not working, leak, guest requested..."
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-10 px-4 rounded-xl border border-gray-200 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !newRoomId || !reason.trim()}
                    className="h-10 px-4 rounded-xl bg-[#0c2bfc] text-white text-sm font-medium disabled:opacity-60"
                  >
                    Confirm change
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
