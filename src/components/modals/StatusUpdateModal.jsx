import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCheckCircle, FiXCircle, FiClock } from "react-icons/fi";
import toast from "react-hot-toast";

function StatusUpdateModal({
  open,
  onClose,
  receiptId,
  newStatus,
  isBulk,
  bulkCount = 0,
  onConfirm,
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const statusConfig = {
    confirmed: {
      title: isBulk
        ? `Confirm ${bulkCount} Receipt${bulkCount > 1 ? "s" : ""}`
        : "Confirm Receipt",
      description: isBulk
        ? `Are you sure you want to confirm ${bulkCount} receipt${bulkCount > 1 ? "s" : ""}?`
        : "Are you sure you want to confirm this receipt?",
      icon: FiCheckCircle,
      color: "text-[#00af00]",
      bgColor: "bg-[#00af00]/10",
      buttonColor: "bg-[#00af00] hover:bg-[#009500]",
      confirmText: "Confirm Receipts",
    },
    rejected: {
      title: isBulk
        ? `Reject ${bulkCount} Receipt${bulkCount > 1 ? "s" : ""}`
        : "Reject Receipt",
      description: isBulk
        ? `Are you sure you want to reject ${bulkCount} receipt${bulkCount > 1 ? "s" : ""}? Please provide a reason.`
        : "Are you sure you want to reject this receipt? Please provide a reason.",
      icon: FiXCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      buttonColor: "bg-red-600 hover:bg-red-700",
      confirmText: "Reject Receipts",
    },
    pending: {
      title: "Mark as Pending",
      description: "Mark this receipt as pending review.",
      icon: FiClock,
      color: "text-[#0c2bfc]",
      bgColor: "bg-[#0c2bfc]/10",
      buttonColor: "bg-[#0c2bfc] hover:bg-[#0a24d6]",
      confirmText: "Mark as Pending",
    },
  };

  const config = statusConfig[newStatus] || statusConfig.confirmed;
  const Icon = config.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newStatus === "rejected" && !reason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setLoading(true);
    try {
      await onConfirm(reason);
      // The parent component will close the modal after success
    } catch (error) {
      // Reset loading state on error
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (loading) return "Updating...";
    if (isBulk) {
      return `${config.confirmText} (${bulkCount})`;
    }
    return config.confirmText;
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md pointer-events-auto shadow-2xl border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-12 w-12 rounded-xl ${config.bgColor} flex items-center justify-center border border-gray-200`}
                    >
                      <Icon className={config.color} size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {config.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Update receipt status
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="h-9 w-9 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors text-gray-700"
                    aria-label="Close"
                    disabled={loading}
                  >
                    <FiX size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-xl ${config.bgColor} border border-gray-200`}
                    >
                      <p className="text-sm text-gray-700">
                        {config.description}
                      </p>
                    </div>

                    {newStatus === "rejected" && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Reason for rejection
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Enter reason for rejection..."
                          className="w-full h-32 px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] text-gray-700 transition-colors duration-200"
                          required
                          disabled={loading}
                        />
                        <p className="text-xs text-gray-500">
                          This will be visible to the uploader
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 h-11 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`flex-1 h-11 rounded-xl text-white text-sm font-medium transition-all duration-200 shadow-sm hover:shadow ${config.buttonColor} ${
                        loading ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                      disabled={loading}
                    >
                      {getButtonText()}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default StatusUpdateModal;
