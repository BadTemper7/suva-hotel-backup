import React, { useState } from "react";
import {
  FiAlertTriangle,
  FiX,
  FiRefreshCw,
  FiCheckCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import Loader from "../layout/Loader.jsx";
import { useBillingStore } from "../../stores/billingStore.js";

const formatMoney = (n) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(n || 0);

export default function RefundConfirmationModal({
  open,
  onClose,
  billing,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const processRefund = useBillingStore((state) => state.processRefund);

  if (!open) return null;

  const paid = Number(billing?.amountPaid || 0);
  const serverPreview = Number(billing?.refundAmount || 0);
  const refundAmount =
    serverPreview > 0
      ? Math.min(serverPreview, paid)
      : paid > 0
        ? paid * 0.5
        : 0;
  const isEligible = billing?.isRefundable === true && paid > 0;

  const handleRefund = async () => {
    if (!confirmed) {
      toast.error("Please confirm that you understand the refund policy");
      return;
    }

    setLoading(true);
    try {
      await processRefund(billing._id, {
        refundAmount: refundAmount,
        reason: "Refund processed by admin",
      });

      toast.success(
        `Refund of ${formatMoney(refundAmount)} processed successfully!`,
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Refund error:", error);
      toast.error(error.message || "Failed to process refund");
    } finally {
      setLoading(false);
    }
  };

  if (!isEligible) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Not Eligible</h3>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg p-1 transition-all"
              >
                <FiX size={20} />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FiAlertTriangle className="text-4xl text-gray-500" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Cannot Process Refund
              </h4>
              <p className="text-gray-600 mb-4">
                This billing is not eligible for refund. Refunds can only be
                processed for:
              </p>
              <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
                <li className="flex items-center gap-2">
                  <span className="text-red-500">•</span>
                  Paid or partially paid billings
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">•</span>
                  Reservations that haven't been checked in yet
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">•</span>
                  Within the refund policy timeframe
                </li>
              </ul>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              Refund Confirmation
            </h3>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-all"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Warning Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <FiRefreshCw className="text-3xl text-red-600" />
            </div>
          </div>

          {/* Billing Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Billing Number:</span>
                <span className="font-semibold text-gray-900">
                  {billing?.billingNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Guest Name:</span>
                <span className="font-medium text-gray-900">
                  {billing?.reservationId?.guestId?.firstName}{" "}
                  {billing?.reservationId?.guestId?.lastName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Reservation #:</span>
                <span className="font-medium text-gray-900">
                  {billing?.reservationId?.reservationNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Amount:</span>
                <span className="font-semibold text-gray-900">
                  {formatMoney(billing?.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Amount Paid:</span>
                <span className="font-semibold text-[#00af00]">
                  {formatMoney(billing?.amountPaid)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-900">
                    Refund Amount (50%):
                  </span>
                  <span className="text-xl font-bold text-red-600">
                    {formatMoney(refundAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Refund Policy */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <FiAlertTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-800 mb-1">
                  Refund Policy:
                </p>
                <ul className="text-yellow-700 space-y-1 text-xs">
                  <li>• Refund amount is 50% of the total amount paid</li>
                  <li>• Refunds are processed within 5-7 business days</li>
                  <li>
                    • Cancellation must be made at least 7 days before check-in
                  </li>
                  <li>
                    • No-shows and last-minute cancellations are non-refundable
                  </li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">
                I confirm that I have read and understood the refund policy. I
                understand that this refund will reduce the billing amount by{" "}
                <span className="font-semibold text-red-600">
                  {formatMoney(refundAmount)}
                </span>{" "}
                and this action cannot be reversed.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-all duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleRefund}
              disabled={!confirmed || loading}
              className={`
                flex-1 px-4 py-2.5 rounded-lg font-medium text-white
                transition-all duration-200 flex items-center justify-center gap-2
                ${
                  !confirmed || loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700 hover:shadow-lg hover:-translate-y-0.5"
                }
              `}
            >
              {loading ? (
                <>
                  <Loader size={20} variant="white" />
                  Processing...
                </>
              ) : (
                <>
                  <FiRefreshCw size={18} />
                  Process Refund
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
