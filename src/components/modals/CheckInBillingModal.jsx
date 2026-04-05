import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiAlertTriangle, FiUpload, FiX } from "react-icons/fi";
import {
  formatMoneyPhp,
  isBillingFullyPaid,
} from "../../utils/billingPayment.js";
import ReceiptUploadModal from "./ReceiptUploadModal.jsx";

export default function CheckInBillingModal({
  open,
  kind,
  reservation,
  billing,
  loading,
  onClose,
  onConfirmCheckIn,
  onBillingRefresh,
}) {
  const [receiptOpen, setReceiptOpen] = useState(false);

  if (!open || !reservation) return null;

  const guestName =
    `${reservation?.guestId?.firstName || ""} ${reservation?.guestId?.lastName || ""}`.trim() ||
    "Guest";
  const resNum = reservation?.reservationNumber || "—";
  const fullyPaid =
    kind === "unpaid" && billing && isBillingFullyPaid(billing);

  const handleReceiptSuccess = async () => {
    if (onBillingRefresh) {
      try {
        await onBillingRefresh();
        toast.success("Payment recorded. Billing updated.");
      } catch (e) {
        toast.error(e.message || "Could not refresh billing");
      }
    } else {
      toast.success("Payment recorded.");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] grid place-items-center bg-black/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <FiAlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-semibold text-gray-900">
                  {kind === "missing"
                    ? "No billing record"
                    : fullyPaid
                      ? "Ready to check in"
                      : "Not fully paid"}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {kind === "missing"
                    ? "This reservation has no billing yet. Create billing before check-in, or continue if payment will be handled at the desk."
                    : fullyPaid
                      ? "This reservation is now fully paid. You can complete check-in below."
                      : `Outstanding balance is ${formatMoneyPhp(billing?.balance)}. Record a payment (with proof if required), collect at the desk, or proceed anyway.`}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-xl border border-gray-200 grid place-items-center hover:bg-gray-50 text-gray-700 shrink-0"
              aria-label="Close"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 py-4 bg-gray-50 text-sm text-gray-700 space-y-1">
            <div>
              <span className="text-gray-500">Reservation</span>{" "}
              <span className="font-semibold text-gray-900">#{resNum}</span>
            </div>
            <div>
              <span className="text-gray-500">Guest</span>{" "}
              <span className="font-semibold text-gray-900">{guestName}</span>
            </div>
            {kind === "unpaid" && billing && (
              <>
                <div>
                  <span className="text-gray-500">Total</span>{" "}
                  <span className="font-semibold text-gray-900">
                    {formatMoneyPhp(billing.totalAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Paid</span>{" "}
                  <span className="font-semibold text-[#00af00]">
                    {formatMoneyPhp(billing.amountPaid)}
                  </span>
                </div>
              </>
            )}
          </div>

          {fullyPaid && (
            <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100 text-sm text-emerald-900">
              Balance cleared for this billing. Tap <strong>Check in</strong>{" "}
              to finish.
            </div>
          )}

          {kind === "unpaid" && billing?._id && !fullyPaid && (
            <div className="px-5 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setReceiptOpen(true)}
                disabled={loading}
                className="w-full h-10 rounded-xl border border-[#0c2bfc]/30 bg-[#0c2bfc]/5 text-[#0c2bfc] text-sm font-medium hover:bg-[#0c2bfc]/10 inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <FiUpload className="h-4 w-4" />
                Record payment / upload proof
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Opens the same receipt flow as Billing (payment type, amounts,
                optional bill image).
              </p>
            </div>
          )}

          {kind === "missing" && (
            <div className="px-5 py-4 border-t border-gray-100">
              <Link
                to="/billing"
                onClick={onClose}
                className="block w-full h-10 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50 text-center leading-10"
              >
                Open Billing
              </Link>
            </div>
          )}

          <div className="px-5 py-4 flex justify-end gap-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirmCheckIn}
              disabled={loading}
              className="h-10 px-4 rounded-xl bg-[#0c2bfc] hover:bg-[#0a24d6] text-white text-sm font-medium disabled:opacity-60"
            >
              {loading
                ? "Checking in…"
                : fullyPaid
                  ? "Check in"
                  : "Check in anyway"}
            </button>
          </div>
        </div>
      </div>

      {kind === "unpaid" && billing?._id && (
        <ReceiptUploadModal
          open={receiptOpen}
          billing={billing}
          overlayZClass="z-[70]"
          onClose={() => setReceiptOpen(false)}
          onSuccess={handleReceiptSuccess}
        />
      )}
    </>
  );
}
