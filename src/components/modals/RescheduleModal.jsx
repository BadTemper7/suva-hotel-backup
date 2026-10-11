// src/components/modals/RescheduleModal.jsx
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { getUser } from "../../app/auth.js";
import { isAdminRole } from "../../utils/staffPermissions.js";

const CUTOFF_MS = 7 * 24 * 60 * 60 * 1000;

function toDateInputValue(d) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default function RescheduleModal({ open, reservation, onClose, onConfirm }) {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [overrideCutoff, setOverrideCutoff] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = isAdminRole(getUser()?.role);

  useEffect(() => {
    if (open && reservation) {
      setCheckIn(toDateInputValue(reservation.checkIn));
      setCheckOut(toDateInputValue(reservation.checkOut));
      setOverrideCutoff(false);
      setOverrideReason("");
      setSubmitting(false);
    }
  }, [open, reservation]);

  if (!open) return null;

  const withinCutoff = reservation
    ? new Date(reservation.checkIn).getTime() - Date.now() < CUTOFF_MS
    : false;

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!checkIn || !checkOut) {
      toast.error("Select both new check-in and check-out dates.");
      return;
    }
    if (withinCutoff && isAdmin && !overrideCutoff) {
      toast.error(
        "This reservation is within 7 days of check-in — check the override box to proceed anyway, or pick dates further out.",
      );
      return;
    }
    if (withinCutoff && isAdmin && overrideCutoff && !overrideReason.trim()) {
      toast.error("A reason is required to override the 7-day cutoff.");
      return;
    }
    if (withinCutoff && !isAdmin) {
      toast.error(
        "This reservation is within 7 days of check-in — only an admin can override that.",
      );
      return;
    }

    // Preserve the original check-in/check-out times (e.g. 2:00 PM / 12:00 PM),
    // just move the calendar dates.
    const prevCheckIn = new Date(reservation.checkIn);
    const prevCheckOut = new Date(reservation.checkOut);
    const newCheckIn = new Date(`${checkIn}T00:00:00`);
    newCheckIn.setHours(
      prevCheckIn.getHours(),
      prevCheckIn.getMinutes(),
      0,
      0,
    );
    const newCheckOut = new Date(`${checkOut}T00:00:00`);
    newCheckOut.setHours(
      prevCheckOut.getHours(),
      prevCheckOut.getMinutes(),
      0,
      0,
    );

    if (newCheckOut <= newCheckIn) {
      toast.error("Check-out must be after check-in.");
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm({
        checkIn: newCheckIn.toISOString(),
        checkOut: newCheckOut.toISOString(),
        overrideCutoff: withinCutoff && isAdmin ? overrideCutoff : undefined,
        overrideReason:
          withinCutoff && isAdmin && overrideCutoff
            ? overrideReason.trim()
            : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="Close"
            onClick={handleClose}
          />

          <div className="absolute inset-0 flex items-end sm:items-center justify-center p-3 sm:p-6">
            <motion.div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden relative">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">
                  Reschedule reservation
                  {reservation?.reservationNumber
                    ? ` #${reservation.reservationNumber}`
                    : ""}
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-9 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm inline-flex items-center gap-2 text-gray-700 transition-all duration-200"
                >
                  <FiX />
                  Close
                </button>
              </div>

              <form onSubmit={submit} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      New check-in
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] text-gray-700"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      New check-out
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] text-gray-700"
                      required
                    />
                  </div>
                </div>

                {withinCutoff && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    This reservation checks in within 7 days — per policy,
                    reservations can normally only be rescheduled at least 7
                    days before check-in.
                    {!isAdmin && (
                      <span className="block mt-1 font-medium">
                        Only an admin can override this.
                      </span>
                    )}
                  </div>
                )}

                {withinCutoff && isAdmin && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <label className="flex items-start gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={overrideCutoff}
                        onChange={(e) => setOverrideCutoff(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#0c2bfc] focus:ring-[#0c2bfc]/30"
                      />
                      Override the 7-day cutoff for this reschedule
                    </label>
                    {overrideCutoff && (
                      <textarea
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        rows={2}
                        placeholder="Reason for overriding the cutoff (required)"
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] text-gray-700"
                        required
                      />
                    )}
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  The room(s) on this reservation will be checked for
                  availability on the new dates when you submit.
                </p>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={submitting}
                    className="h-10 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all duration-200 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-10 px-4 rounded-xl bg-[#0c2bfc] hover:bg-[#0a24d6] text-white text-sm font-medium transition-all duration-200 shadow-sm hover:shadow disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Rescheduling..." : "Reschedule"}
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
