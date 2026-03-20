import { AnimatePresence, motion } from "framer-motion";
import { FiAlertCircle } from "react-icons/fi";

export default function DeletePaymentTypeModal({
  paymentType,
  onClose,
  onConfirm,
}) {
  function handleClose() {
    onClose?.();
  }

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50">
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
            className="w-full max-w-md rounded-2xl bg-gradient-to-b from-white to-amber-50 shadow-2xl border border-amber-200 overflow-hidden"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-amber-200 bg-gradient-to-r from-rose-50 to-amber-50 flex items-center gap-3">
              <div className="text-rose-600">
                <FiAlertCircle size={20} />
              </div>
              <div className="text-sm font-semibold text-amber-900">
                Delete Payment Type
              </div>
            </div>

            {/* Body */}
            <div className="p-5">
              <div className="text-sm text-amber-700 mb-4">
                Are you sure you want to delete{" "}
                <span className="font-medium text-amber-900">
                  {paymentType?.name}
                </span>
                ? This action cannot be undone.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-10 px-4 rounded-xl border border-amber-200 hover:bg-amber-50 text-sm text-amber-700 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="h-10 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
