import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import Loader from "../layout/Loader";

export default function EditBillingModal({ open, onClose, billing, onSave }) {
  const [subTotal, setSubTotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [balance, setBalance] = useState(0);
  const [status, setStatus] = useState("unpaid");
  const [refundAmount, setRefundAmount] = useState(0);
  const [isRefundable, setIsRefundable] = useState(false);
  const [amountDueNow, setAmountDueNow] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !billing) return;

    setSubTotal(billing.subTotal || 0);
    setDiscountAmount(billing.discountAmount || 0);
    setTotalAmount(billing.totalAmount || 0);
    setAmountPaid(billing.amountPaid || 0);
    setBalance(billing.balance || 0);
    setStatus(billing.status || "unpaid");
    setRefundAmount(billing.refundAmount || 0);
    setIsRefundable(billing.isRefundable || false);
    setAmountDueNow(billing.amountDueNow || 0);

    setError("");
  }, [open, billing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const canSave = !loading;

  async function submit(e) {
    e.preventDefault();
    if (!canSave || !billing) return;

    setLoading(true);
    setError("");

    try {
      await onSave?.(billing._id, {
        subTotal,
        discountAmount,
        totalAmount,
        amountPaid,
        balance,
        status,
        refundAmount,
        isRefundable,
        amountDueNow,
      });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    onClose?.();
  }

  const money = (n) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(n || 0);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50">
          {loading && (
            <div
              className="
              absolute inset-0 z-50 flex items-center justify-center 
              bg-white/90 backdrop-blur-sm
            "
            >
              <Loader size={60} variant="primary" />
            </div>
          )}

          <motion.button
            type="button"
            onClick={handleClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              className="
                w-full max-w-2xl rounded-2xl 
                bg-white
                shadow-2xl border border-gray-200 overflow-hidden
              "
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="
                px-6 py-5 border-b border-gray-200 
                flex items-center justify-between
                bg-gray-50
              "
              >
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    Edit Billing #{billing?.billingNumber}
                  </div>
                  <div className="text-sm text-gray-600">
                    Update billing information
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="
                    h-10 px-4 rounded-xl 
                    border border-gray-200 
                    bg-white
                    hover:bg-gray-50
                    text-sm font-medium text-gray-700
                    transition-all duration-200
                    hover:shadow-md hover:-translate-y-0.5
                    active:translate-y-0
                    flex items-center gap-2
                  "
                >
                  <FiX />
                  Close
                </button>
              </div>

              <form onSubmit={submit} className="p-6 space-y-5">
                {error && (
                  <div
                    className="
                    text-sm text-red-700 
                    bg-red-50
                    border border-red-200 rounded-xl px-4 py-3
                  "
                  >
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Subtotal
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={subTotal}
                      onChange={(e) => setSubTotal(Number(e.target.value))}
                      disabled={loading}
                      className="
                        w-full rounded-xl border border-gray-200 
                        bg-white px-4 py-3
                        text-sm text-gray-800 outline-none
                        focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                        transition-all duration-200
                        disabled:bg-gray-50
                      "
                    />
                    <div className="text-sm text-gray-600 mt-2">
                      {money(subTotal)}
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Discount Amount
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={discountAmount}
                      onChange={(e) =>
                        setDiscountAmount(Number(e.target.value))
                      }
                      disabled={loading}
                      className="
                        w-full rounded-xl border border-gray-200 
                        bg-white px-4 py-3
                        text-sm text-gray-800 outline-none
                        focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                        transition-all duration-200
                        disabled:bg-gray-50
                      "
                    />
                    <div className="text-sm text-gray-600 mt-2">
                      {money(discountAmount)}
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Total Amount
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(Number(e.target.value))}
                      disabled={loading}
                      className="
                        w-full rounded-xl border border-gray-200 
                        bg-white px-4 py-3
                        text-sm text-gray-800 outline-none
                        focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                        transition-all duration-200
                        disabled:bg-gray-50
                      "
                    />
                    <div className="text-sm text-gray-600 mt-2">
                      {money(totalAmount)}
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Amount Paid
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      disabled={loading}
                      className="
                        w-full rounded-xl border border-gray-200 
                        bg-white px-4 py-3
                        text-sm text-gray-800 outline-none
                        focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                        transition-all duration-200
                        disabled:bg-gray-50
                      "
                    />
                    <div className="text-sm text-gray-600 mt-2">
                      {money(amountPaid)}
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Balance
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={balance}
                      onChange={(e) => setBalance(Number(e.target.value))}
                      disabled={loading}
                      className="
                        w-full rounded-xl border border-gray-200 
                        bg-white px-4 py-3
                        text-sm text-gray-800 outline-none
                        focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                        transition-all duration-200
                        disabled:bg-gray-50
                      "
                    />
                    <div className="text-sm text-gray-600 mt-2">
                      {money(balance)}
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </div>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={loading}
                      className="
                        w-full rounded-xl border border-gray-200 
                        bg-white px-4 py-3
                        text-sm text-gray-800 outline-none
                        focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                        transition-all duration-200
                        disabled:bg-gray-50
                      "
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="partial">Partially Paid</option>
                      <option value="paid">Paid</option>
                      {(billing?.isComplimentary || status === "free") && (
                        <option value="free">Free</option>
                      )}
                      {/* Only show Refunded option if isRefundable is true */}
                      {isRefundable && (
                        <option value="refunded">Refunded</option>
                      )}
                      <option value="voided">Voided</option>
                    </select>
                    {!isRefundable && (
                      <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                        <span className="font-medium">Note:</span> This billing
                        is non-refundable. Refund option is disabled.
                      </div>
                    )}
                  </label>

                  <label className="block">
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Refund Amount
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(Number(e.target.value))}
                      disabled={loading || !isRefundable}
                      className="
                        w-full rounded-xl border border-gray-200 
                        bg-white px-4 py-3
                        text-sm text-gray-800 outline-none
                        focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                        transition-all duration-200
                        disabled:bg-gray-50 disabled:cursor-not-allowed
                      "
                    />
                    <div className="text-sm text-gray-600 mt-2">
                      {money(refundAmount)}
                    </div>
                    {!isRefundable && (
                      <p className="text-xs text-gray-500 mt-1">
                        Refund amount disabled for non-refundable billings
                      </p>
                    )}
                  </label>

                  <label className="block">
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Amount Due Now
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={amountDueNow}
                      onChange={(e) => setAmountDueNow(Number(e.target.value))}
                      disabled={loading}
                      className="
                        w-full rounded-xl border border-gray-200 
                        bg-white px-4 py-3
                        text-sm text-gray-800 outline-none
                        focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                        transition-all duration-200
                        disabled:bg-gray-50
                      "
                    />
                    <div className="text-sm text-gray-600 mt-2">
                      {money(amountDueNow)}
                    </div>
                  </label>
                </div>

                <label
                  className="
                  flex items-center gap-3 cursor-pointer
                  p-4 rounded-xl border border-gray-200 
                  bg-gray-50
                "
                >
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isRefundable}
                      onChange={(e) => {
                        setIsRefundable(e.target.checked);
                        // If unchecking refundable and status is refunded, reset to paid or unpaid
                        if (!e.target.checked && status === "refunded") {
                          setStatus(balance === 0 ? "paid" : "unpaid");
                        }
                      }}
                      disabled={loading}
                      className="
                        h-5 w-5 rounded 
                        border-gray-300 text-[#0c2bfc] 
                        focus:ring-[#0c2bfc]/20
                        disabled:opacity-50
                      "
                    />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">
                      Refundable
                    </div>
                    <div className="text-sm text-gray-600">
                      Check if this billing is refundable
                    </div>
                  </div>
                </label>

                {/* Warning for non-refundable billings that have refund amount */}
                {!isRefundable && refundAmount > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-600">
                      <span className="font-medium">Warning:</span> This billing
                      is marked as non-refundable but has a refund amount of{" "}
                      {money(refundAmount)}. Please adjust the refund amount or
                      mark as refundable.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="
                      h-11 px-5 rounded-xl 
                      border border-gray-200 
                      bg-white
                      hover:bg-gray-50
                      text-sm font-semibold text-gray-700
                      transition-all duration-200
                      hover:shadow-md hover:-translate-y-0.5
                      active:translate-y-0
                      disabled:opacity-60 disabled:cursor-not-allowed
                    "
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !canSave ||
                      (!isRefundable &&
                        refundAmount > 0 &&
                        status === "refunded")
                    }
                    className={`
                      h-11 px-5 rounded-xl 
                      text-sm font-semibold
                      transition-all duration-200
                      hover:shadow-lg hover:-translate-y-0.5
                      active:translate-y-0
                      ${
                        canSave &&
                        !isRefundable &&
                        refundAmount > 0 &&
                        status === "refunded"
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : canSave
                            ? "bg-[#0c2bfc] hover:bg-[#0a24d6] text-white"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }
                    `}
                  >
                    {loading ? "Updating..." : "Update Billing"}
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
