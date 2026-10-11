import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiCheckCircle, FiXCircle, FiClock, FiDroplet } from "react-icons/fi";
import toast from "react-hot-toast";

const statusOptions = [
  {
    value: "active",
    label: "Active",
    icon: FiCheckCircle,
    color: "text-[#00af00]",
    bgColor: "bg-[#00af00]/10",
    borderColor: "border-[#00af00]",
    ringColor: "ring-[#00af00]/20",
  },
  {
    value: "maintenance",
    label: "Maintenance",
    icon: FiClock,
    color: "text-[#0c2bfc]",
    bgColor: "bg-[#0c2bfc]/10",
    borderColor: "border-[#0c2bfc]",
    ringColor: "ring-[#0c2bfc]/20",
  },
  {
    value: "clean",
    label: "Clean",
    icon: FiDroplet,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    ringColor: "ring-emerald-200",
  },
  {
    value: "inactive",
    label: "Inactive",
    icon: FiXCircle,
    color: "text-amber-800",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    ringColor: "ring-amber-200",
  },
];

export default function BulkStatusUpdateModal({
  open,
  onClose,
  count,
  onConfirm,
}) {
  const [status, setStatus] = useState("active");
  const [maintenanceReason, setMaintenanceReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStatus("active");
      setMaintenanceReason("");
      setSubmitting(false);
    }
  }, [open]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const submit = async (e) => {
    e.preventDefault();
    const reasonTrim = maintenanceReason.trim();
    if (status === "maintenance" && !reasonTrim) {
      toast.error("Maintenance reason is required");
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(status, status === "maintenance" ? reasonTrim : "");
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
            <motion.div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden relative max-h-[90vh] flex flex-col">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
                <div className="text-sm font-semibold text-gray-900">
                  Update status for {count} item{count === 1 ? "" : "s"}
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

              <form
                onSubmit={submit}
                className="p-5 space-y-6 overflow-y-auto flex-1 min-h-0"
              >
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-3 block">
                    New status *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {statusOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = status === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setStatus(option.value)}
                          className={`
                            rounded-xl border px-3 py-2.5 flex flex-col items-center justify-center gap-2
                            transition-all duration-200 relative
                            ${isSelected ? "ring-2 ring-offset-2" : ""}
                            ${isSelected ? option.ringColor : ""}
                            ${isSelected ? option.bgColor : "bg-white hover:bg-gray-50"}
                            ${isSelected ? option.borderColor : "border-gray-200"}
                          `}
                        >
                          <Icon
                            className={`${option.color} ${isSelected ? "scale-110" : ""}`}
                          />
                          <span
                            className={`text-xs font-medium ${isSelected ? option.color : "text-gray-700"}`}
                          >
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {status === "maintenance" && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Maintenance reason *
                    </label>
                    <textarea
                      value={maintenanceReason}
                      onChange={(e) => setMaintenanceReason(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] text-gray-700 transition-colors duration-200 resize-none"
                      placeholder="Why are these units under maintenance? Applied to all selected items — you can still edit it per item afterward."
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={submitting}
                    className="h-10 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all duration-200 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="h-10 px-4 rounded-xl text-white text-sm font-medium transition-all duration-200 bg-[#0c2bfc] hover:bg-[#0a24d6] shadow-sm hover:shadow disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Updating..." : `Update ${count} item${count === 1 ? "" : "s"}`}
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
