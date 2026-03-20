import { AnimatePresence, motion } from "framer-motion";
import { FiAlertCircle, FiTrash2 } from "react-icons/fi";
import { useState, useEffect } from "react";
import Loader from "../layout/Loader";

export default function DeleteModal({
  entity,
  entityName = "item",
  entityNameField = "name",
  title = "Delete Item",
  onClose,
  onConfirm,
  isBulk = false,
  bulkItemsCount = 0,
  requireNameConfirmation = false,
}) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const entityDisplayName = entity
    ? entity[entityNameField] || entity.name || "this item"
    : "";

  const isMatch = requireNameConfirmation ? value === entityDisplayName : true;

  useEffect(() => {
    if (!requireNameConfirmation) return;
    const onKey = (e) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requireNameConfirmation]);

  async function handleConfirm() {
    try {
      setLoading(true);
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    onClose?.();
    setValue("");
  }

  return (
    <AnimatePresence>
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
              w-full max-w-md rounded-2xl 
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
              flex items-center gap-3
              bg-gray-50
            "
            >
              <div
                className="
                h-10 w-10 rounded-xl 
                bg-red-500
                grid place-items-center text-white
              "
              >
                <FiAlertCircle size={20} />
              </div>
              <div className="text-lg font-bold text-gray-900">{title}</div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                {isBulk ? (
                  <div className="flex items-start gap-4">
                    <div
                      className="
                      mt-1 p-2.5 rounded-xl 
                      bg-red-100
                      text-red-600
                    "
                    >
                      <FiTrash2 size={18} />
                    </div>
                    <div>
                      <div className="text-sm text-gray-700">
                        Are you sure you want to delete{" "}
                        <span className="font-bold text-gray-900">
                          {bulkItemsCount}
                        </span>{" "}
                        {entityName}
                        {bulkItemsCount > 1 ? "s" : ""}? This action cannot be
                        undone.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <div
                      className="
                      mt-1 p-2.5 rounded-xl 
                      bg-red-100
                      text-red-600
                    "
                    >
                      <FiTrash2 size={18} />
                    </div>
                    <div>
                      <div className="text-sm text-gray-700">
                        {requireNameConfirmation
                          ? `This action cannot be undone. Please type "${entityDisplayName}" to confirm deletion.`
                          : `Are you sure you want to delete "${entityDisplayName}"? This action cannot be undone.`}
                      </div>

                      {entity?.status && (
                        <div className="mt-3 text-xs text-gray-600">
                          Status:{" "}
                          <span
                            className={`
                              px-2.5 py-1 rounded-full text-xs font-medium
                              ${
                                entity.status === "active"
                                  ? "bg-[#00af00]/10 text-[#00af00]"
                                  : "bg-gray-100 text-gray-700"
                              }
                            `}
                          >
                            {entity.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </div>
                      )}

                      {entity?.isActive !== undefined && (
                        <div className="mt-3 text-xs text-gray-600">
                          Status:{" "}
                          <span
                            className={`
                              px-2.5 py-1 rounded-full text-xs font-medium
                              ${
                                entity.isActive
                                  ? "bg-[#00af00]/10 text-[#00af00]"
                                  : "bg-gray-100 text-gray-700"
                              }
                            `}
                          >
                            {entity.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {!isBulk && requireNameConfirmation && (
                <div className="mt-4 mb-6">
                  <input
                    type="text"
                    value={value}
                    disabled={loading}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={`Type "${entityDisplayName}" to confirm`}
                    className="
                      w-full rounded-xl border border-gray-200 
                      bg-white px-4 py-3
                      text-sm text-gray-800 outline-none
                      focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                      disabled:bg-gray-50 disabled:cursor-not-allowed
                      placeholder:text-gray-400
                    "
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    Type the {entityName} name exactly as shown above
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3">
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
                  type="button"
                  onClick={handleConfirm}
                  disabled={(!isMatch && requireNameConfirmation) || loading}
                  className={`
                    h-11 px-5 rounded-xl 
                    text-sm font-semibold 
                    transition-all duration-200
                    hover:shadow-lg hover:-translate-y-0.5
                    active:translate-y-0
                    flex items-center gap-2
                    ${
                      isMatch && !loading
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }
                  `}
                >
                  <FiTrash2 size={16} />
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
