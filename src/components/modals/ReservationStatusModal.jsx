// src/components/modals/ReservationStatusModal.jsx
import { useEffect, useMemo, useState } from "react";
import { FiX, FiImage, FiRefreshCw } from "react-icons/fi";
import toast from "react-hot-toast";
import ImagePreviewModal from "./ImagePreviewModal.jsx";

const STATUS_STYLES = {
  pending: "bg-[#0c2bfc]/10 text-[#0c2bfc]",
  confirmed: "bg-[#00af00]/10 text-[#00af00]",
  checked_in: "bg-blue-100 text-blue-700",
  checked_out: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-700",
  no_show: "bg-orange-100 text-orange-700",
};

const BILLING_STYLES = {
  unpaid: "bg-gray-100 text-gray-700",
  partial: "bg-[#0c2bfc]/10 text-[#0c2bfc]",
  paid: "bg-[#00af00]/10 text-[#00af00]",
};

const RECEIPT_STATUS_STYLES = {
  pending: "bg-[#0c2bfc]/10 text-[#0c2bfc]",
  confirmed: "bg-[#00af00]/10 text-[#00af00]",
  rejected: "bg-red-100 text-red-700",
};

function normalizeReservationStatus(v) {
  const s = String(v || "")
    .toLowerCase()
    .trim();
  if (Object.keys(STATUS_STYLES).includes(s)) return s;
  return "pending";
}

function normalizeBillingStatus(v) {
  const s = String(v || "")
    .toLowerCase()
    .trim();
  if (s === "paid") return "paid";
  if (s === "partial" || s === "partially paid") return "partial";
  return "unpaid";
}

function normalizeReceiptStatus(v) {
  const s = String(v || "")
    .toLowerCase()
    .trim();
  if (["pending", "confirmed", "rejected"].includes(s)) return s;
  return "pending";
}

function StatusPill({ value, variant = "reservation" }) {
  const v =
    variant === "billing"
      ? normalizeBillingStatus(value)
      : normalizeReservationStatus(value);

  const styles = variant === "billing" ? BILLING_STYLES : STATUS_STYLES;

  const label =
    variant === "billing"
      ? v === "paid"
        ? "Paid"
        : v === "partial"
          ? "Partially Paid"
          : "Unpaid"
      : v === "checked_in"
        ? "Checked In"
        : v === "checked_out"
          ? "Checked Out"
          : v === "no_show"
            ? "No Show"
            : v.charAt(0).toUpperCase() + v.slice(1);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles[v]}`}
    >
      {label}
    </span>
  );
}

const money = (n) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(n || 0));

const addDays = (dateLike, days) => {
  const d = new Date(dateLike);
  d.setDate(d.getDate() + days);
  return d;
};

const formatDateTime = (dateLike) => {
  if (!dateLike) return "—";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

export default function ReservationStatusModal({
  open,
  reservation,
  onClose,
  onSave,
}) {
  const [status, setStatus] = useState("pending");

  const [billingLoading, setBillingLoading] = useState(false);
  const [billing, setBilling] = useState(null);
  const [paymentTypes, setPaymentTypes] = useState([]);

  const [preview, setPreview] = useState({
    open: false,
    images: [],
    startIndex: 0,
    title: "",
  });

  const API =
    import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

  useEffect(() => {
    if (reservation) setStatus(reservation.status || "pending");
  }, [reservation]);

  const reservationId = reservation?._id;
  const reservationNumber = reservation?.reservationNumber;

  const fetchBilling = async () => {
    if (!reservationId) return;
    setBillingLoading(true);
    try {
      const res = await fetch(`${API}/billings/${reservationId}`);
      const data = await safeJson(res);
      setBilling(data.billing);
    } catch (err) {
      setBilling(null);
      toast.error(err?.message || "Failed to fetch billing details");
    } finally {
      setBillingLoading(false);
    }
  };

  const fetchPaymentTypes = async () => {
    try {
      const res = await fetch(`${API}/payment-types`);
      const data = await safeJson(res);
      setPaymentTypes(Array.isArray(data) ? data : []);
    } catch {
      setPaymentTypes([]);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchBilling();
    fetchPaymentTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reservationId]);

  const billingStatus = useMemo(
    () => normalizeBillingStatus(billing?.status),
    [billing?.status],
  );

  // ✅ Due Date rule: show ONLY when billing is UNPAID
  // Default: 1 day after reservation creation (or billing creation)
  const dueDate = useMemo(() => {
    if (billingStatus !== "unpaid") return null;

    if (billing?.dueDate) return new Date(billing.dueDate);

    const base = reservation?.createdAt || billing?.createdAt;
    if (!base) return null;

    return addDays(base, 1);
  }, [
    billingStatus,
    billing?.dueDate,
    billing?.createdAt,
    reservation?.createdAt,
  ]);

  const isOverdue = useMemo(() => {
    if (!dueDate) return false; // hidden anyway unless unpaid
    return new Date() > new Date(dueDate);
  }, [dueDate]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    onSave?.(status);
  };

  // Flatten ALL receipt images for preview (latest receipts first)
  const receiptImagesFlat = useMemo(() => {
    const receipts = Array.isArray(billing?.receipts) ? billing.receipts : [];
    const imgs = [];
    for (const r of receipts) {
      for (const img of r?.receiptImages || []) {
        if (!img) continue;
        imgs.push(img);
      }
    }
    return imgs;
  }, [billing]);

  const receiptList = useMemo(() => {
    return Array.isArray(billing?.receipts) ? billing.receipts : [];
  }, [billing?.receipts]);

  const paymentTypeNameById = useMemo(() => {
    return new Map(
      (Array.isArray(paymentTypes) ? paymentTypes : []).map((pt) => [
        String(pt?._id || ""),
        pt?.name || "",
      ]),
    );
  }, [paymentTypes]);

  const openReceiptsPreview = (startIndex = 0) => {
    setPreview({
      open: true,
      images: receiptImagesFlat,
      startIndex,
      title: "Receipt Images",
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4">
        <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div>
              <div className="text-base font-semibold text-gray-900">
                Update Reservation Status
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Check billing info before confirming.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchBilling}
                disabled={billingLoading}
                className={`h-9 px-3 rounded-xl border border-gray-200 bg-white text-sm inline-flex items-center gap-2 text-gray-700 transition-all duration-200 ${billingLoading
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:bg-gray-50"
                  }`}
                title="Refresh billing"
              >
                <FiRefreshCw />
                Refresh
              </button>

              <button
                onClick={onClose}
                className="h-9 w-9 rounded-xl border border-gray-200 grid place-items-center hover:bg-gray-50 text-gray-700 transition-all duration-200"
                title="Close"
              >
                <FiX />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 grid gap-4 lg:grid-cols-2">
            {/* Left: Reservation */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">
                  Reservation
                </div>
                <StatusPill value={reservation?.status} />
              </div>

              <div className="mt-3 text-sm text-gray-700 space-y-1">
                <div>
                  Reservation ID:{" "}
                  <span className="font-semibold text-gray-900">
                    {reservationNumber}
                  </span>
                </div>
                <div>
                  Guest:{" "}
                  <span className="font-semibold text-gray-900">
                    {reservation?.guestId
                      ? `${reservation.guestId.firstName} ${reservation.guestId.lastName}`
                      : "—"}
                  </span>
                </div>
                <div>
                  Dates:{" "}
                  <span className="font-semibold text-gray-900">
                    {reservation?.checkIn
                      ? new Date(reservation.checkIn).toLocaleDateString()
                      : "—"}{" "}
                    -{" "}
                    {reservation?.checkOut
                      ? new Date(reservation.checkOut).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <div>
                  Total:{" "}
                  <span className="font-semibold text-gray-900">
                    {money(reservation?.totalAmount || 0)}
                  </span>
                </div>
              </div>

              <form onSubmit={submit} className="mt-4 space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-1 w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] text-gray-700 transition-colors duration-200"
                  >
                    {normalizeReservationStatus(reservation?.status) ===
                      "checked_in" && (
                      <option value="checked_in" disabled>
                        Checked In (use Front desk to change)
                      </option>
                    )}
                    {normalizeReservationStatus(reservation?.status) ===
                      "checked_out" && (
                      <option value="checked_out" disabled>
                        Checked Out (use Front desk to change)
                      </option>
                    )}
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="expired">Expired</option>
                    <option value="no_show">No Show</option>
                  </select>
                  <p className="mt-1.5 text-xs text-gray-500">
                    Check-in and check-out are set from the Front desk page, not
                    here.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="h-10 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-4 rounded-xl bg-[#0c2bfc] hover:bg-[#0a24d6] text-white text-sm font-medium transition-all duration-200 shadow-sm hover:shadow"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Billing */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">
                  Billing
                </div>
                <div className="flex items-center gap-2">
                  {billing ? (
                    <StatusPill value={billing?.status} variant="billing" />
                  ) : (
                    <span className="text-xs text-gray-500">—</span>
                  )}
                </div>
              </div>

              {billingLoading ? (
                <div className="py-10 flex items-center justify-center">
                  <div className="text-sm text-gray-500">Loading billing…</div>
                </div>
              ) : !billing ? (
                <div className="mt-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                  No billing details found for this reservation.
                </div>
              ) : (
                <>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">Total Amount</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {money(billing.totalAmount)}
                      </div>
                    </div>

                    {Number(billing.discountAmount || 0) > 0 && (
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                        <div className="text-xs text-gray-500">
                          Discount
                          {reservation?.discount?.name
                            ? ` (${reservation.discount.name})`
                            : ""}
                        </div>
                        <div className="text-sm font-semibold text-[#00af00]">
                          -{money(billing.discountAmount)}
                        </div>
                        {Number(reservation?.discount?.discountPercent || 0) >
                          0 ? (
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {reservation.discount.discountPercent}% off
                          </div>
                        ) : null}
                      </div>
                    )}

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">Amount Paid</div>
                      <div className="text-sm font-semibold text-[#00af00]">
                        {money(billing.amountPaid)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">
                        Remaining Balance
                      </div>
                      <div className="text-sm font-semibold text-orange-600">
                        {money(billing.balance)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">Payment Option</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {reservation?.paymentOption?.name || "N/A"}
                      </div>
                      {reservation?.paymentOption?.paymentType === "partial" && (
                        <div className="text-xs text-gray-500 mt-1">
                          {reservation?.paymentOption?.amount || 0}% down payment
                        </div>
                      )}
                    </div>

                  </div>

                  <div className="mt-3 text-sm text-gray-700 space-y-1">
                    {/* Due Date appears ONLY when unpaid */}
                    {billingStatus === "unpaid" && (
                      <div>
                        Due Date:{" "}
                        <span
                          className={`font-medium ${isOverdue ? "text-red-600" : "text-gray-900"
                            }`}
                        >
                          {formatDateTime(dueDate)}
                        </span>
                        {isOverdue && (
                          <span className="ml-2 text-xs font-medium text-red-600">
                            Overdue
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Receipts */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-gray-900">
                        Receipts
                      </div>

                      {receiptImagesFlat.length > 0 && (
                        <button
                          type="button"
                          onClick={() => openReceiptsPreview(0)}
                          className="h-9 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm inline-flex items-center gap-2 text-gray-700 transition-all duration-200"
                        >
                          <FiImage /> Preview
                        </button>
                      )}
                    </div>

                    {receiptImagesFlat.length === 0 ? (
                      <div className="mt-2 text-sm text-gray-500">
                        No receipts uploaded.
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {receiptImagesFlat.slice(0, 6).map((img, idx) => {
                            const url =
                              typeof img === "string" ? img : img?.url;
                            return (
                              <button
                                key={(img?.publicId || url || idx) + idx}
                                type="button"
                                onClick={() => openReceiptsPreview(idx)}
                                className="h-9 w-9 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-gray-100"
                                title="Open receipt"
                              >
                                <img
                                  src={url}
                                  alt="Receipt"
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              </button>
                            );
                          })}
                        </div>

                        {receiptImagesFlat.length > 6 && (
                          <div className="text-xs text-gray-500">
                            +{receiptImagesFlat.length - 6} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {receiptList.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-semibold text-gray-900 mb-2">
                        Receipt Details
                      </div>
                      <div className="space-y-2 max-h-56 overflow-auto pr-1">
                        {receiptList.map((receipt) => {
                          const receiptStatus = normalizeReceiptStatus(
                            receipt?.status,
                          );
                          const rawPaymentType = receipt?.paymentType;
                          const paymentTypeName =
                            (rawPaymentType &&
                              typeof rawPaymentType === "object" &&
                              rawPaymentType?.name) ||
                            paymentTypeNameById.get(
                              String(
                                (rawPaymentType &&
                                  typeof rawPaymentType === "object" &&
                                  rawPaymentType?._id) ||
                                rawPaymentType ||
                                "",
                              ),
                            ) ||
                            "Payment";
                          return (
                            <div
                              key={receipt?._id || `${receipt?.createdAt || ""}-${receipt?.referenceNumber || ""}`}
                              className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${RECEIPT_STATUS_STYLES[receiptStatus]}`}
                                >
                                  {receiptStatus.charAt(0).toUpperCase() +
                                    receiptStatus.slice(1)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDateTime(receipt?.createdAt)}
                                </span>
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                <div className="text-gray-600">
                                  Payment Type:{" "}
                                  <span className="font-semibold text-gray-900">
                                    {paymentTypeName}
                                  </span>
                                </div>
                                <div className="text-gray-600">
                                  Amount Paid:{" "}
                                  <span className="font-semibold text-gray-900">
                                    {money(receipt?.amountPaid)}
                                  </span>
                                </div>
                                <div className="text-gray-600">
                                  Amount Received:{" "}
                                  <span className="font-semibold text-gray-900">
                                    {money(
                                      receipt?.amountReceived ??
                                      receipt?.amountPaid,
                                    )}
                                  </span>
                                </div>
                                <div className="text-gray-600">
                                  Change:{" "}
                                  <span className="font-semibold text-gray-900">
                                    {money(receipt?.change || 0)}
                                  </span>
                                </div>
                              </div>

                              {receipt?.referenceNumber && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500">
                                    Reference Number
                                  </p>
                                  <p className="text-xs font-mono text-gray-700 bg-white p-2 rounded-lg mt-1 border border-gray-200">
                                    {receipt.referenceNumber}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 text-xs text-gray-500">
                    Tip: Confirm reservation when billing is{" "}
                    <b className="text-[#00af00]">Paid</b>. Partial payments may
                    still be pending.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <ImagePreviewModal
        open={preview.open}
        images={preview.images}
        startIndex={preview.startIndex}
        title={preview.title}
        onClose={() =>
          setPreview({ open: false, images: [], startIndex: 0, title: "" })
        }
      />
    </>
  );
}
