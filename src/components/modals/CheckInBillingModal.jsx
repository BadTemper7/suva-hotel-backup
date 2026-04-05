import { FiAlertTriangle, FiX } from "react-icons/fi";
import { formatMoneyPhp } from "../../utils/billingPayment.js";

export default function CheckInBillingModal({
  open,
  kind,
  reservation,
  billing,
  loading,
  onClose,
  onConfirmCheckIn,
}) {
  if (!open || !reservation) return null;

  const guestName =
    `${reservation?.guestId?.firstName || ""} ${reservation?.guestId?.lastName || ""}`.trim() ||
    "Guest";
  const resNum = reservation?.reservationNumber || "—";

  return (
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
                  : "Not fully paid"}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {kind === "missing"
                  ? "This reservation has no billing yet. Create billing before check-in, or continue if payment will be handled at the desk."
                  : `Outstanding balance is ${formatMoneyPhp(billing?.balance)}. You can collect payment at check-in or proceed anyway.`}
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
            {loading ? "Checking in…" : "Check in anyway"}
          </button>
        </div>
      </div>
    </div>
  );
}
