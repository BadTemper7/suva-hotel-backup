// src/components/modals/ReservationHistoryModal.jsx
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiClock, FiUser } from "react-icons/fi";
import { format, formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { useReservationStore } from "../../stores/reservationStore.js";

const ACTION_LABELS = {
  status_changed: "Status change",
  dates_changed: "Dates changed",
  room_added: "Room added",
  room_removed: "Room removed",
  room_transferred: "Room transferred",
  addon_changed: "Add-ons changed",
};

const ACTION_STYLES = {
  status_changed: "bg-[#00af00]/10 text-[#00af00]",
  dates_changed: "bg-[#0c2bfc]/10 text-[#0c2bfc]",
  room_added: "bg-emerald-50 text-emerald-700",
  room_removed: "bg-red-100 text-red-700",
  room_transferred: "bg-amber-50 text-amber-800",
  addon_changed: "bg-purple-100 text-purple-700",
};

export default function ReservationHistoryModal({
  open,
  reservation,
  onClose,
}) {
  const fetchReservationHistory = useReservationStore(
    (s) => s.fetchReservationHistory,
  );
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !reservation?._id) return;
    let cancelled = false;
    setLoading(true);
    fetchReservationHistory(reservation._id)
      .then((entries) => {
        if (!cancelled) setHistory(entries);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err?.message || "Failed to load history");
          setHistory([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, reservation?._id, fetchReservationHistory]);

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
            <motion.div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden relative max-h-[85vh] flex flex-col">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Change history
                  </div>
                  {reservation?.reservationNumber && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      #{reservation.reservationNumber}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm inline-flex items-center gap-2 text-gray-700 transition-all duration-200"
                >
                  <FiX />
                  Close
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 min-h-0 space-y-3">
                {loading ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    Loading history…
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No recorded changes yet.
                  </div>
                ) : (
                  history.map((entry) => (
                    <div
                      key={entry._id}
                      className="rounded-xl border border-gray-200 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            ACTION_STYLES[entry.action] ||
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {ACTION_LABELS[entry.action] || entry.action}
                        </span>
                        <span
                          className="text-xs text-gray-500 whitespace-nowrap"
                          title={format(
                            new Date(entry.createdAt),
                            "MMM dd, yyyy h:mm a",
                          )}
                        >
                          <FiClock className="inline mr-1 -mt-0.5" size={12} />
                          {formatDistanceToNow(new Date(entry.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800 mt-2">
                        {entry.summary}
                      </p>
                      <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                        <FiUser size={12} />
                        {entry.actorLabel || "System"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
