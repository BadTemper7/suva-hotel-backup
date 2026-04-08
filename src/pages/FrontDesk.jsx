import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiUser,
  FiPhone,
  FiLogIn,
  FiLogOut,
  FiExternalLink,
  FiSun,
  FiArrowRight,
  FiCheckCircle,
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { Helmet } from "react-helmet";

import Loader from "../components/layout/Loader.jsx";
import CheckInBillingModal from "../components/modals/CheckInBillingModal.jsx";
import { useReservationStore } from "../stores/reservationStore.js";
import { useBillingStore } from "../stores/billingStore.js";
import { isBillingFullyPaid } from "../utils/billingPayment.js";
import {
  isSameCalendarDay,
  selectArrivalsToday,
  selectPastDueArrivals,
  selectInHouse,
  selectDeparturesToday,
  selectCheckedOutToday,
} from "../utils/frontDesk.js";
import { getUser } from "../app/auth.js";
import { canManageFeature } from "../utils/staffPermissions.js";

const STANDARD_CHECKOUT_HOUR = 12;
const STANDARD_CHECKOUT_MINUTE = 0;

function formatStandardCheckoutTime() {
  const d = new Date(
    2000,
    0,
    1,
    STANDARD_CHECKOUT_HOUR,
    STANDARD_CHECKOUT_MINUTE,
  );
  return d.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatScheduledCheckoutTime(isoOrDate) {
  if (!isoOrDate) return "—";
  const x = new Date(isoOrDate);
  if (Number.isNaN(x.getTime())) return "—";
  return x.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_STYLES = {
  pending: "bg-[#0c2bfc]/10 text-[#0c2bfc]",
  confirmed: "bg-[#00af00]/10 text-[#00af00]",
  checked_in: "bg-blue-100 text-blue-700",
  checked_out: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-700",
  no_show: "bg-orange-100 text-orange-700",
};

function normalizeStatus(v) {
  const s = String(v || "")
    .toLowerCase()
    .trim();
  if (
    [
      "pending",
      "confirmed",
      "checked_in",
      "checked_out",
      "cancelled",
      "expired",
      "no_show",
    ].includes(s)
  )
    return s;
  return "pending";
}

function StatusPill({ value }) {
  const v = normalizeStatus(value);
  const label =
    v === "checked_in"
      ? "Checked In"
      : v === "checked_out"
        ? "Checked Out"
        : v === "no_show"
          ? "No Show"
          : v.charAt(0).toUpperCase() + v.slice(1);
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${STATUS_STYLES[v]}`}
    >
      {label}
    </span>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-[#0c2bfc] text-white shadow-md"
          : "bg-white border border-gray-200 text-gray-700 hover:border-[#0c2bfc]/40"
      }`}
    >
      {children}
    </button>
  );
}

export default function FrontDesk() {
  const navigate = useNavigate();
  const canManageFrontDesk = canManageFeature(getUser(), "frontDesk");
  const reservations = useReservationStore((s) => s.reservations);
  const fetchReservations = useReservationStore((s) => s.fetchReservations);
  const updateReservationStatus = useReservationStore(
    (s) => s.updateReservationStatus,
  );
  const loading = useReservationStore((s) => s.loading);
  const fetchBillingByReservationId = useBillingStore(
    (s) => s.fetchBillingByReservationId,
  );

  const [tab, setTab] = useState("arrivals");
  const [checkInGuard, setCheckInGuard] = useState({
    open: false,
    kind: null,
    reservation: null,
    billing: null,
  });
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkoutLoadingId, setCheckoutLoadingId] = useState(null);

  useEffect(() => {
    fetchReservations().catch((err) =>
      toast.error(err.message || "Failed to load reservations"),
    );
  }, [fetchReservations]);

  const arrivals = useMemo(
    () => selectArrivalsToday(reservations),
    [reservations],
  );
  const pastDueArrivals = useMemo(
    () => selectPastDueArrivals(reservations),
    [reservations],
  );
  const inHouse = useMemo(() => selectInHouse(reservations), [reservations]);
  const departures = useMemo(
    () => selectDeparturesToday(reservations),
    [reservations],
  );
  const checkedOutToday = useMemo(
    () => selectCheckedOutToday(reservations),
    [reservations],
  );

  const checkInTodayCount = useMemo(
    () =>
      (reservations || []).filter((r) =>
        isSameCalendarDay(r.checkIn, new Date()),
      ).length,
    [reservations],
  );
  const checkOutTodayCount = useMemo(
    () =>
      (reservations || []).filter((r) =>
        isSameCalendarDay(r.checkOut, new Date()),
      ).length,
    [reservations],
  );

  const showActualCheckIn = tab === "inHouse" || tab === "departures";
  const showActualCheckOut = tab === "departures" || tab === "checkedOut";

  const rows = useMemo(() => {
    if (tab === "arrivals") return arrivals;
    if (tab === "pastDueArrivals") return pastDueArrivals;
    if (tab === "inHouse") return inHouse;
    if (tab === "departures") return departures;
    return checkedOutToday;
  }, [tab, arrivals, pastDueArrivals, inHouse, departures, checkedOutToday]);

  const runCheckIn = useCallback(
    async (reservation) => {
      if (!reservation?._id) return;
      setCheckInLoading(true);
      try {
        const billing = await fetchBillingByReservationId(reservation._id);
        if (!billing) {
          setCheckInGuard({
            open: true,
            kind: "missing",
            reservation,
            billing: null,
          });
          return;
        }
        if (!isBillingFullyPaid(billing)) {
          setCheckInGuard({
            open: true,
            kind: "unpaid",
            reservation,
            billing,
          });
          return;
        }
      } catch (err) {
        toast.error(err.message || "Could not load billing");
        return;
      } finally {
        setCheckInLoading(false);
      }
      try {
        await updateReservationStatus(reservation._id, "checked_in");
        toast.success(`Checked in #${reservation.reservationNumber}`);
        setCheckInGuard({
          open: false,
          kind: null,
          reservation: null,
          billing: null,
        });
        setTab("inHouse");
      } catch (err) {
        toast.error(err.message || "Check-in failed");
      }
    },
    [fetchBillingByReservationId, updateReservationStatus, setTab],
  );

  const closeGuard = () => {
    setCheckInGuard({
      open: false,
      kind: null,
      reservation: null,
      billing: null,
    });
  };

  const refreshBillingInGuard = useCallback(async () => {
    const r = checkInGuard.reservation;
    if (!r?._id) return;
    const b = await fetchBillingByReservationId(r._id);
    setCheckInGuard((prev) => ({ ...prev, billing: b }));
  }, [checkInGuard.reservation, fetchBillingByReservationId]);

  const confirmCheckInAnyway = async () => {
    const r = checkInGuard.reservation;
    if (!r) return;
    setCheckInLoading(true);
    try {
      await updateReservationStatus(r._id, "checked_in");
      toast.success(`Checked in #${r.reservationNumber}`);
      closeGuard();
      setTab("inHouse");
    } catch (err) {
      toast.error(err.message || "Check-in failed");
    } finally {
      setCheckInLoading(false);
    }
  };

  const runCheckOut = async (reservation) => {
    if (!reservation?._id) return;
    if (
      !window.confirm(
        `Check out reservation #${reservation.reservationNumber}?`,
      )
    )
      return;
    setCheckoutLoadingId(reservation._id);
    try {
      await updateReservationStatus(reservation._id, "checked_out");
      toast.success(`Checked out #${reservation.reservationNumber}`);
    } catch (err) {
      toast.error(err.message || "Check-out failed");
    } finally {
      setCheckoutLoadingId(null);
    }
  };

  const fmtDt = (d) =>
    d ? new Date(d).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) : "—";

  return (
    <>
      <Helmet>
        <title>Front desk - Resort Admin</title>
      </Helmet>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#1f2937",
            border: "1px solid #e5e7eb",
          },
        }}
      />

      <div className="min-h-full flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FiLogIn className="text-[#0c2bfc]" />
              Front desk
            </h1>
            <p className="text-sm text-gray-600">
              Arrivals, in-house guests, departures, and check-outs today
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-medium text-gray-800">
                Standard checkout time:
              </span>{" "}
              {formatStandardCheckoutTime()}{" "}
              <span className="text-gray-500">
                (scheduled checkout per booking is shown in the table)
              </span>
            </p>
          </div>
          <Link
            to="/reservations"
            className="text-sm font-medium text-[#0c2bfc] hover:underline inline-flex items-center gap-1"
          >
            All reservations <FiExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTab("arrivals")}
            className={`
              rounded-xl border p-4 text-left transition-all duration-200
              hover:shadow-md hover:-translate-y-0.5
              ${
                tab === "arrivals"
                  ? "border-green-500 bg-green-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-green-300"
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <FiSun className="w-5 h-5" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Check-in Today
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {checkInTodayCount}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  All reservations with arrival date today · opens Arrivals tab
                </div>
              </div>
              {tab === "arrivals" && (
                <div className="text-green-600 shrink-0">
                  <FiCheckCircle className="w-6 h-6" />
                </div>
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTab("departures")}
            className={`
              rounded-xl border p-4 text-left transition-all duration-200
              hover:shadow-md hover:-translate-y-0.5
              ${
                tab === "departures"
                  ? "border-orange-500 bg-orange-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-orange-300"
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-orange-600 mb-1">
                  <FiArrowRight className="w-5 h-5" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Check-out Today
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {checkOutTodayCount}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  All reservations with departure date today · opens Departures
                  tab
                </div>
              </div>
              {tab === "departures" && (
                <div className="text-orange-600 shrink-0">
                  <FiCheckCircle className="w-6 h-6" />
                </div>
              )}
            </div>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <TabButton active={tab === "arrivals"} onClick={() => setTab("arrivals")}>
            Arrivals today ({arrivals.length})
          </TabButton>
          <TabButton active={tab === "inHouse"} onClick={() => setTab("inHouse")}>
            In-house ({inHouse.length})
          </TabButton>
          <TabButton
            active={tab === "departures"}
            onClick={() => setTab("departures")}
          >
            Departures today ({departures.length})
          </TabButton>
          <TabButton
            active={tab === "checkedOut"}
            onClick={() => setTab("checkedOut")}
          >
            Checked out today ({checkedOutToday.length})
          </TabButton>
          <TabButton
            active={tab === "pastDueArrivals"}
            onClick={() => setTab("pastDueArrivals")}
          >
            Past Confirmed Bookings (no check-in) ({pastDueArrivals.length})
          </TabButton>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {loading && reservations.length === 0 ? (
            <div className="py-20 flex justify-center">
              <Loader size={48} variant="primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left font-semibold text-gray-700 px-4 py-3">
                      Reservation
                    </th>
                    <th className="text-left font-semibold text-gray-700 px-4 py-3">
                      Guest
                    </th>
                    <th className="text-left font-semibold text-gray-700 px-4 py-3">
                      Stay / checkout
                    </th>
                    <th className="text-left font-semibold text-gray-700 px-4 py-3">
                      Status
                    </th>
                    {showActualCheckIn && (
                      <th className="text-left font-semibold text-gray-700 px-4 py-3">
                        Checked in at
                      </th>
                    )}
                    {showActualCheckOut && (
                      <th className="text-left font-semibold text-gray-700 px-4 py-3">
                        Actual check-out
                      </th>
                    )}
                    <th className="text-right font-semibold text-gray-700 px-4 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const guestName =
                      `${r?.guestId?.firstName || ""} ${r?.guestId?.lastName || ""}`.trim() ||
                      "—";
                    const contact = r?.guestId?.contactNumber || "—";
                    return (
                      <tr
                        key={r._id}
                        className="border-b border-gray-100 hover:bg-gray-50/80"
                      >
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          #{r.reservationNumber}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-gray-900 font-medium">
                            <FiUser className="text-[#0c2bfc] shrink-0" />
                            {guestName}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <FiPhone className="shrink-0" />
                            {contact}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <FiCalendar className="shrink-0" />
                            Stay
                          </div>
                          <div className="whitespace-nowrap">
                            {new Date(r.checkIn).toLocaleDateString()} →{" "}
                            {new Date(r.checkOut).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Scheduled checkout{" "}
                            <span className="font-medium text-gray-700">
                              {new Date(r.checkOut).toLocaleDateString("en-PH", {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              {formatScheduledCheckoutTime(r.checkOut)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill value={r.status} />
                        </td>
                        {showActualCheckIn && (
                          <td className="px-4 py-3 text-gray-700 text-xs">
                            {fmtDt(r.actualCheckInAt)}
                          </td>
                        )}
                        {showActualCheckOut && (
                          <td className="px-4 py-3 text-gray-700 text-xs">
                            {fmtDt(r.actualCheckOutAt)}
                          </td>
                        )}
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/reservations/${r._id}/rooms`)}
                              className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Rooms
                            </button>
                            {tab === "arrivals" && (
                              <button
                                type="button"
                                onClick={() => runCheckIn(r)}
                                disabled={checkInLoading || !canManageFrontDesk}
                                className="h-9 px-3 rounded-xl bg-[#0c2bfc] text-white text-xs font-medium hover:bg-[#0a24d6] disabled:opacity-60 inline-flex items-center gap-1"
                              >
                                <FiLogIn className="h-3.5 w-3.5" />
                                Check in
                              </button>
                            )}
                            {tab === "pastDueArrivals" && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled
                                  className="h-9 px-3 rounded-xl bg-gray-100 text-gray-500 text-xs font-medium inline-flex items-center gap-1 cursor-not-allowed"
                                  title="Check-in is no longer allowed because the arrival date has passed."
                                >
                                  <FiLogIn className="h-3.5 w-3.5" />
                                  Check in
                                </button>
                                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                                  Check-in not allowed
                                </span>
                              </div>
                            )}
                            {(tab === "inHouse" || tab === "departures") && (
                              <button
                                type="button"
                                onClick={() => runCheckOut(r)}
                                disabled={
                                  checkoutLoadingId === r._id ||
                                  !canManageFrontDesk
                                }
                                className="h-9 px-3 rounded-xl border border-orange-200 bg-orange-50 text-orange-800 text-xs font-medium hover:bg-orange-100 disabled:opacity-60 inline-flex items-center gap-1"
                              >
                                <FiLogOut className="h-3.5 w-3.5" />
                                {checkoutLoadingId === r._id
                                  ? "…"
                                  : "Check out"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={
                          5 +
                          (showActualCheckIn ? 1 : 0) +
                          (showActualCheckOut ? 1 : 0)
                        }
                        className="px-4 py-16 text-center text-gray-500"
                      >
                        No reservations in this list.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <CheckInBillingModal
        open={checkInGuard.open}
        kind={checkInGuard.kind}
        reservation={checkInGuard.reservation}
        billing={checkInGuard.billing}
        loading={checkInLoading}
        onClose={closeGuard}
        onConfirmCheckIn={confirmCheckInAnyway}
        onBillingRefresh={refreshBillingInGuard}
      />
    </>
  );
}
