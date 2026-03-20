import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import Loader from "../layout/Loader";

export default function PaymentTypeModal({
  open,
  mode, // "add" | "edit"
  title,
  paymentType,
  onClose,
  onSave,
}) {
  const [name, setName] = useState("");
  const [isReceipt, setIsReceipt] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && paymentType) {
      setName(paymentType.name ?? "");
      setIsReceipt(paymentType.isReceipt ?? false);
      setIsActive(paymentType.isActive ?? true);
    } else {
      setName("");
      setIsReceipt(false);
      setIsActive(true);
    }

    setError("");
  }, [open, mode, paymentType]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const canSave = String(name).trim().length > 0 && !loading;

  async function submit(e) {
    e.preventDefault();
    if (!canSave) return;

    setLoading(true);
    setError("");

    try {
      await onSave?.({
        ...(paymentType ?? {}),
        name: String(name).trim(),
        isReceipt,
        isActive,
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50">
          {loading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-2xl">
              <Loader size={50} variant="primary" />
            </div>
          )}
          {/* Overlay */}
          <motion.button
            type="button"
            onClick={handleClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">
                  {title ||
                    (mode === "add" ? "Add Payment Type" : "Edit Payment Type")}
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="h-9 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm inline-flex items-center gap-2 text-gray-700 transition-all duration-200"
                >
                  <FiX />
                  Close
                </button>
              </div>

              {/* Body */}
              <form onSubmit={submit} className="p-5 space-y-4">
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    {error}
                  </div>
                )}

                <label className="block">
                  <div className="text-xs font-medium text-gray-600 mb-1">
                    Payment Type Name *
                  </div>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] transition-colors duration-200"
                    placeholder="e.g. Credit Card, Cash, Bank Transfer"
                    required
                  />
                </label>

                <div className="flex items-center justify-between space-x-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isReceipt}
                        onChange={(e) => setIsReceipt(e.target.checked)}
                        disabled={loading}
                        className="sr-only"
                      />
                      <div
                        className={`
                          w-10 h-6 rounded-full transition-colors duration-200
                          ${isReceipt ? "bg-[#0c2bfc]" : "bg-gray-300"}
                        `}
                      >
                        <div
                          className={`
                            absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm
                            ${isReceipt ? "transform translate-x-5" : "transform translate-x-1"}
                          `}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">
                        Receipt Required
                      </div>
                      <div className="text-xs text-gray-500">
                        Check if this payment type requires a receipt
                      </div>
                    </div>
                  </label>

                  {mode === "edit" && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          disabled={loading}
                          className="sr-only"
                        />
                        <div
                          className={`
                            w-10 h-6 rounded-full transition-colors duration-200
                            ${isActive ? "bg-[#00af00]" : "bg-gray-300"}
                          `}
                        >
                          <div
                            className={`
                              absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm
                              ${isActive ? "transform translate-x-5" : "transform translate-x-1"}
                            `}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700">
                          Active Status
                        </div>
                        <div className="text-xs text-gray-500">
                          {isActive ? "Enabled" : "Disabled"}
                        </div>
                      </div>
                    </label>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="h-10 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm text-gray-700 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!canSave}
                    className={[
                      "h-10 px-4 rounded-xl text-sm font-medium transition-all duration-200",
                      canSave
                        ? "bg-[#0c2bfc] text-white hover:bg-[#0a24d6] shadow-sm hover:shadow"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed",
                    ].join(" ")}
                  >
                    {loading
                      ? mode === "add"
                        ? "Saving..."
                        : "Updating..."
                      : mode === "add"
                        ? "Save"
                        : "Update"}
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
