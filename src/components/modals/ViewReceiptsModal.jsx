import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiX,
  FiTrash2,
  FiFileText,
  FiImage,
  FiDownload,
  FiCheck,
  FiEye,
  FiExternalLink,
  FiCheckCircle,
  FiXCircle,
  FiMoreVertical,
  FiClock,
  FiSend,
  FiCopy,
  FiRefreshCw,
  FiCalendar,
  FiUser,
  FiCreditCard,
} from "react-icons/fi";
import { BsThreeDots } from "react-icons/bs";
import toast from "react-hot-toast";
import Loader from "../layout/Loader";
import { useReceiptStore } from "../../stores/receiptStore";
import { useBillingStore } from "../../stores/billingStore";
import DeleteModal from "./DeleteModal";
import StatusUpdateModal from "./StatusUpdateModal";

// Money formatter function
const money = (n) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(n || 0);

function ReceiptStatusBadge({ status }) {
  const styles = {
    pending: "bg-[#0c2bfc]/10 text-[#0c2bfc] border-[#0c2bfc]/20",
    confirmed: "bg-[#00af00]/10 text-[#00af00] border-[#00af00]/20",
    rejected: "bg-red-100 text-red-700 border-red-200",
  };

  const icons = {
    pending: <FiClock className="mr-1.5" size={12} />,
    confirmed: <FiCheckCircle className="mr-1.5" size={12} />,
    rejected: <FiXCircle className="mr-1.5" size={12} />,
  };

  const labels = {
    pending: "Pending",
    confirmed: "Confirmed",
    rejected: "Rejected",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold border ${styles[status] || styles.pending}`}
    >
      {icons[status]}
      {labels[status] || status}
    </span>
  );
}

function ReceiptActionsMenu({
  receipt,
  onStatusUpdate,
  onCopyAmount,
  onRefreshBilling,
  isAdmin,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: "Confirm",
      icon: FiCheckCircle,
      onClick: () => onStatusUpdate(receipt._id, "confirmed"),
      className: "text-[#00af00] hover:bg-[#00af00]/5",
      show: receipt.status !== "confirmed",
    },
    {
      label: "Reject",
      icon: FiXCircle,
      onClick: () => onStatusUpdate(receipt._id, "rejected"),
      className: "text-red-600 hover:bg-red-50",
      show: receipt.status !== "rejected",
    },
    {
      label: "Mark as Pending",
      icon: FiClock,
      onClick: () => onStatusUpdate(receipt._id, "pending"),
      className: "text-[#0c2bfc] hover:bg-[#0c2bfc]/5",
      show: receipt.status !== "pending",
    },
    {
      label: "Copy Amount",
      icon: FiCopy,
      onClick: () => onCopyAmount(receipt.amountPaid),
      className: "text-blue-600 hover:bg-blue-50",
      show: true,
    },
    {
      label: "Refresh Billing",
      icon: FiRefreshCw,
      onClick: onRefreshBilling,
      className: "text-purple-600 hover:bg-purple-50",
      show: true,
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-gray-600 hover:text-gray-700 border border-gray-200 hover:border-gray-300"
        aria-label="More actions"
      >
        <BsThreeDots size={18} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-40 py-2"
            >
              {actions
                .filter((a) => a.show)
                .map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      action.onClick();
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-sm flex items-center gap-3 hover:bg-gray-50 transition-all duration-200 ${action.className} border-b border-gray-100 last:border-b-0`}
                  >
                    <action.icon size={16} />
                    <span className="font-medium">{action.label}</span>
                  </button>
                ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function BulkActions({
  selectedCount,
  totalAmount,
  onBulkConfirm,
  onBulkReject,
  onBulkDelete,
  isAdmin,
}) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-[#0c2bfc] text-white flex items-center justify-center shadow-sm">
          <FiCheck size={18} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">
            {selectedCount} receipt{selectedCount !== 1 ? "s" : ""} selected
          </p>
          <p className="text-xs text-gray-600 font-medium">
            Total: {money(totalAmount)}
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onBulkConfirm}
          className="h-10 px-5 rounded-xl bg-[#00af00] hover:bg-[#009500] text-white text-sm font-semibold inline-flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
        >
          <FiCheckCircle size={16} /> Confirm All
        </button>
        <button
          onClick={onBulkReject}
          className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
        >
          <FiXCircle size={16} /> Reject All
        </button>
        {isAdmin && (
          <button
            onClick={onBulkDelete}
            className="h-10 px-5 rounded-xl bg-[#0c2bfc] hover:bg-[#0a24d6] text-white text-sm font-semibold inline-flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            <FiTrash2 size={16} /> Delete Selected
          </button>
        )}
      </div>
    </div>
  );
}

function ImagePreview({ images }) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!images || images.length === 0) return null;

  const currentImage = images[selectedImage]?.url;
  if (!currentImage) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
          <FiImage className="inline mr-2" size={14} />
          Receipt Images ({images.length})
        </p>
        <div className="text-xs text-gray-600 bg-gray-100 rounded-full px-3 py-1.5 border border-gray-200 font-medium">
          {selectedImage + 1} of {images.length}
        </div>
      </div>

      {/* Main Image */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 bg-white">
        <div className="aspect-video bg-gray-100">
          <img
            src={currentImage}
            alt={`Receipt ${selectedImage + 1}`}
            className="w-full h-full object-contain p-4"
            onError={(e) => {
              e.target.src =
                "https://via.placeholder.com/400x300?text=Image+Error";
            }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-5 right-5 flex gap-3">
            <button
              onClick={() => window.open(currentImage, "_blank")}
              className="p-3 bg-white/95 hover:bg-white rounded-xl text-gray-700 transition-all duration-200 transform hover:scale-105 shadow-lg border border-gray-200"
              title="Open in new tab"
            >
              <FiExternalLink size={20} />
            </button>
            <a
              href={currentImage}
              download={`receipt-${selectedImage + 1}.jpg`}
              className="p-3 bg-white/95 hover:bg-white rounded-xl text-gray-700 transition-all duration-200 transform hover:scale-105 shadow-lg border border-gray-200"
              title="Download image"
            >
              <FiDownload size={20} />
            </a>
          </div>
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-3 pt-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                selectedImage === idx
                  ? "border-[#0c2bfc] ring-3 ring-[#0c2bfc]/20 shadow-lg transform scale-105"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"
              }`}
            >
              <div className="w-full h-full bg-gray-100">
                <img
                  src={img.url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/96?text=Error";
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ViewReceiptsModal({ billing, open, onClose }) {
  const {
    receipts,
    fetchReceiptsByBilling,
    loading,
    deleteMultipleReceipts,
    updateReceiptStatus,
    confirmMultipleReceipts,
    rejectMultipleReceipts,
  } = useReceiptStore();

  const { fetchBillings } = useBillingStore();

  const [selectedReceipts, setSelectedReceipts] = useState([]);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    isBulk: false,
    receipt: null,
  });
  const [statusModal, setStatusModal] = useState({
    open: false,
    receiptId: null,
    newStatus: null,
    isBulk: false,
  });
  const [refreshingBilling, setRefreshingBilling] = useState(false);

  // Get user role from localStorage
  const user = JSON.parse(localStorage.getItem("suva_admin_user") || "{}");
  const userRole = user.role;
  const isAdmin = userRole === "admin" || userRole === "superadmin";
  const isReceptionist = userRole === "receptionist";

  useEffect(() => {
    if (open && billing?._id) {
      fetchReceiptsByBilling(billing._id).catch((err) => {
        toast.error(err.message || "Failed to fetch receipts");
      });
    }
  }, [open, billing?._id, fetchReceiptsByBilling]);

  useEffect(() => {
    if (open) {
      const onKey = (e) => e.key === "Escape" && handleClose();
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [open]);

  const handleClose = () => {
    setSelectedReceipts([]);
    onClose();
  };

  const refreshBillingData = async () => {
    if (!billing?._id) return;

    setRefreshingBilling(true);
    try {
      await Promise.all([fetchReceiptsByBilling(billing._id), fetchBillings()]);
    } catch (err) {
      console.error("Failed to refresh billing data:", err);
    } finally {
      setRefreshingBilling(false);
    }
  };

  const handleStatusUpdate = async (receiptId, newStatus, reason = "") => {
    try {
      await updateReceiptStatus(
        receiptId,
        newStatus,
        billing.reservationId?._id,
        reason,
      );
      toast.success(`Receipt ${newStatus} successfully`);
      setSelectedReceipts((prev) => prev.filter((id) => id !== receiptId));
      await refreshBillingData();
    } catch (err) {
      toast.error(err.message || `Failed to ${newStatus} receipt`);
    }
  };

  const handleBulkStatusUpdate = async (newStatus, reason = "") => {
    if (selectedReceipts.length === 0) {
      toast.error("No receipts selected");
      return;
    }

    try {
      if (newStatus === "confirmed") {
        await confirmMultipleReceipts(selectedReceipts);
        toast.success(`${selectedReceipts.length} receipt(s) confirmed`);
      } else if (newStatus === "rejected") {
        await rejectMultipleReceipts(selectedReceipts, reason);
        toast.success(`${selectedReceipts.length} receipt(s) rejected`);
      }
      setSelectedReceipts([]);
      await refreshBillingData();
    } catch (err) {
      toast.error(err.message || `Failed to ${newStatus} receipts`);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await deleteMultipleReceipts(selectedReceipts);
      toast.success(
        `${selectedReceipts.length} receipt(s) deleted successfully`,
      );
      setSelectedReceipts([]);
      setDeleteModal({ open: false, isBulk: false, receipt: null });
      await refreshBillingData();
    } catch (err) {
      toast.error(err.message || "Failed to delete receipts");
    }
  };

  const toggleSelectReceipt = (id) => {
    setSelectedReceipts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedReceipts.length === receipts.length) {
      setSelectedReceipts([]);
    } else {
      setSelectedReceipts(receipts.map((r) => r._id));
    }
  };

  const copyAmountToClipboard = (amount) => {
    navigator.clipboard.writeText(money(amount));
    toast.success("Amount copied to clipboard");
  };

  const totalSelectedAmount = receipts
    .filter((r) => selectedReceipts.includes(r._id))
    .reduce((sum, r) => sum + (r.amountPaid || 0), 0);
  const isComplimentary =
    Boolean(billing?.isComplimentary) || Number(billing?.totalAmount || 0) <= 0;

  if (!billing || !open) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
        <div
          className="
          w-full max-w-6xl max-h-[90vh] flex flex-col
          rounded-2xl 
          bg-white
          shadow-2xl border border-gray-200
          overflow-hidden
        "
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="
            px-6 py-5 border-b border-gray-200 
            flex items-center justify-between
            bg-gray-50
          "
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-[#0c2bfc] flex items-center justify-center shadow-lg">
                <FiFileText className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Receipts for Billing #{billing.billingNumber}
                </h2>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      Total:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {money(billing.totalAmount || 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      Balance:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {money(billing.balance || 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      Paid:
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {money(billing.amountPaid || 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      Status:
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        billing.status === "paid"
                          ? "bg-[#00af00]/10 text-[#00af00]"
                          : billing.status === "partial"
                            ? "bg-[#0c2bfc]/10 text-[#0c2bfc]"
                            : billing.status === "free"
                              ? "bg-purple-100 text-purple-700"
                              : billing.status === "refunded"
                                ? "bg-purple-100 text-purple-700"
                                : billing.status === "voided"
                                  ? "bg-gray-100 text-gray-700"
                                  : "bg-red-100 text-red-700"
                      }`}
                    >
                      {billing.status?.charAt(0).toUpperCase() +
                        billing.status?.slice(1)}
                    </span>
                  </div>
                  {isComplimentary && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">
                        Note:
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
                      Free
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-3 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                  Non-VAT: All billing amounts are VAT-exempt.
                </div>
              </div>
              <button
                onClick={refreshBillingData}
                disabled={refreshingBilling}
                className="
                  h-10 w-10 rounded-xl 
                  border border-gray-200 
                  bg-white
                  hover:bg-gray-50
                  grid place-items-center
                  transition-all duration-200
                  hover:shadow-md hover:-translate-y-0.5
                  active:translate-y-0 text-gray-700
                  ml-auto
                "
                title="Refresh billing data"
              >
                <FiRefreshCw
                  size={18}
                  className={`${refreshingBilling ? "animate-spin" : ""}`}
                />
              </button>
            </div>
            <button
              onClick={handleClose}
              className="
                h-10 w-10 rounded-xl 
                border border-gray-200 
                bg-white
                hover:bg-gray-50
                grid place-items-center
                transition-all duration-200
                hover:shadow-md hover:-translate-y-0.5
                active:translate-y-0 text-gray-700
              "
              aria-label="Close"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Bulk Actions Bar - Only show delete button for admin */}
          {selectedReceipts.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#0c2bfc] text-white flex items-center justify-center shadow-sm">
                    <FiCheck size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedReceipts.length} receipt
                      {selectedReceipts.length !== 1 ? "s" : ""} selected
                    </p>
                    <p className="text-xs text-gray-600 font-medium">
                      Total: {money(totalSelectedAmount)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        setStatusModal({
                          open: true,
                          isBulk: true,
                          newStatus: "confirmed",
                        })
                      }
                      className="h-10 px-5 rounded-xl bg-[#00af00] hover:bg-[#009500] text-white text-sm font-semibold inline-flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <FiCheckCircle size={16} /> Confirm All
                    </button>
                    <button
                      onClick={() =>
                        setStatusModal({
                          open: true,
                          isBulk: true,
                          newStatus: "rejected",
                        })
                      }
                      className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <FiXCircle size={16} /> Reject All
                    </button>
                    {/* Delete Selected Button - Only show for admin */}
                    {isAdmin && (
                      <button
                        onClick={() =>
                          setDeleteModal({
                            open: true,
                            isBulk: true,
                            receipt: null,
                          })
                        }
                        className="h-10 px-5 rounded-xl bg-[#0c2bfc] hover:bg-[#0a24d6] text-white text-sm font-semibold inline-flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <FiTrash2 size={16} /> Delete Selected
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader size={50} variant="primary" />
              </div>
            ) : receipts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center border border-gray-200">
                  <FiFileText className="text-gray-400" size={40} />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  No Receipts Found
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  No receipts have been uploaded for this billing yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Select All Bar */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={
                        receipts.length > 0 &&
                        selectedReceipts.length === receipts.length
                      }
                      onChange={toggleSelectAll}
                      className="h-5 w-5 rounded-lg border-gray-300 text-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Select all receipts ({receipts.length})
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    {receipts.length} receipt{receipts.length !== 1 && "s"}{" "}
                    total •{" "}
                    <span className="text-gray-700">
                      {money(
                        receipts.reduce(
                          (sum, r) => sum + (r.amountPaid || 0),
                          0,
                        ),
                      )}{" "}
                      total amount
                    </span>
                  </div>
                </div>

                {/* Receipts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {receipts.map((receipt) => {
                    const isSelected = selectedReceipts.includes(receipt._id);
                    return (
                      <motion.div
                        key={receipt._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`border rounded-2xl p-5 transition-all duration-200 ${
                          isSelected
                            ? "border-[#0c2bfc] bg-[#0c2bfc]/5 shadow-md"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-lg bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectReceipt(receipt._id)}
                              className="h-5 w-5 rounded-lg border-gray-300 text-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20"
                            />
                            <ReceiptStatusBadge status={receipt.status} />
                          </div>
                          <div className="flex items-center gap-2">
                            <ReceiptActionsMenu
                              receipt={receipt}
                              onStatusUpdate={(id, status) =>
                                setStatusModal({
                                  open: true,
                                  receiptId: id,
                                  newStatus: status,
                                  isBulk: false,
                                })
                              }
                              onCopyAmount={copyAmountToClipboard}
                              onRefreshBilling={refreshBillingData}
                              isAdmin={isAdmin}
                            />
                            {/* Delete Button - Only show for admin */}
                            {isAdmin && (
                              <button
                                onClick={() =>
                                  setDeleteModal({
                                    open: true,
                                    isBulk: false,
                                    receipt,
                                  })
                                }
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200 border border-gray-200 hover:border-red-200"
                                title="Delete receipt"
                                aria-label="Delete receipt"
                              >
                                <FiTrash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Payment Type
                            </p>
                            <p className="text-sm font-medium text-gray-900 bg-gray-50 rounded-lg p-3 border border-gray-200">
                              {receipt.paymentType?.name || "N/A"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Amount Paid
                            </p>
                            <p className="text-sm font-bold text-[#00af00] bg-[#00af00]/5 rounded-lg p-3 border border-[#00af00]/20">
                              {money(receipt.amountPaid)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Amount Received
                            </p>
                            <p className="text-sm font-bold text-[#0c2bfc] bg-[#0c2bfc]/5 rounded-lg p-3 border border-[#0c2bfc]/20">
                              {money(receipt.amountReceived ?? receipt.amountPaid)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Change
                            </p>
                            <p className="text-sm font-medium text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200">
                              {money(receipt.change || 0)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Date & Time
                            </p>
                            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-200">
                              {new Date(receipt.createdAt).toLocaleDateString(
                                "en-PH",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Uploaded By */}
                        {receipt.uploadedBy?.name && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              Uploaded By
                            </p>
                            <p className="text-sm font-medium text-gray-900 bg-gray-50 rounded-lg p-3 border border-gray-200">
                              {receipt.uploadedBy.name}
                            </p>
                          </div>
                        )}

                        {/* Reference Number */}
                        {receipt.referenceNumber && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              Reference Number
                            </p>
                            <p className="text-sm font-mono font-medium text-gray-900 bg-gray-50 rounded-lg p-3 border border-gray-200">
                              {receipt.referenceNumber}
                            </p>
                          </div>
                        )}

                        {/* Receipt Images */}
                        {receipt.receiptImages?.length > 0 && (
                          <div className="mb-4">
                            <ImagePreview images={receipt.receiptImages} />
                          </div>
                        )}

                        {/* Notes */}
                        {receipt.notes && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              Notes
                            </p>
                            <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-200">
                              {receipt.notes}
                            </p>
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {receipt.status === "rejected" &&
                          receipt.rejectionReason && (
                            <div className="mt-4 pt-4 border-t border-red-200">
                              <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">
                                Rejection Reason
                              </p>
                              <p className="text-sm text-red-700 bg-red-50 rounded-xl p-3 border border-red-200">
                                {receipt.rejectionReason}
                              </p>
                            </div>
                          )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-5 flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-700 font-medium">
                {receipts.length} receipt{receipts.length !== 1 && "s"}
              </div>
              {selectedReceipts.length > 0 && (
                <div className="text-sm text-gray-600">
                  ({selectedReceipts.length} selected)
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedReceipts([])}
                className="
                  h-10 px-5 rounded-xl 
                  border border-gray-200 
                  bg-white
                  hover:bg-gray-50
                  text-sm font-medium text-gray-700
                  transition-all duration-200
                  hover:shadow-md hover:-translate-y-0.5 active:translate-y-0
                "
              >
                Clear Selection
              </button>
              <button
                onClick={handleClose}
                className="
                  h-10 px-6 rounded-xl 
                  bg-[#0c2bfc] hover:bg-[#0a24d6]
                  text-white text-sm font-medium
                  transition-all duration-200
                  shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0
                "
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal - Only show for admin, but we'll keep it for bulk operations */}
      {deleteModal.open && (
        <DeleteModal
          entity={deleteModal.isBulk ? null : deleteModal.receipt}
          entityName="receipt"
          entityNameField="_id"
          title={
            deleteModal.isBulk
              ? `Delete ${selectedReceipts.length} Receipt${selectedReceipts.length > 1 ? "s" : ""}`
              : "Delete Receipt"
          }
          onClose={() =>
            setDeleteModal({ open: false, isBulk: false, receipt: null })
          }
          onConfirm={handleDeleteSelected}
          isBulk={deleteModal.isBulk}
          bulkItemsCount={selectedReceipts.length}
          requireNameConfirmation={false}
        />
      )}

      {/* Status Update Modal */}
      {statusModal.open && (
        <StatusUpdateModal
          open={statusModal.open}
          onClose={() =>
            setStatusModal({
              open: false,
              receiptId: null,
              newStatus: null,
              isBulk: false,
            })
          }
          receiptId={statusModal.receiptId}
          newStatus={statusModal.newStatus}
          isBulk={statusModal.isBulk}
          bulkCount={selectedReceipts.length}
          onConfirm={async (reason) => {
            try {
              if (statusModal.isBulk) {
                await handleBulkStatusUpdate(statusModal.newStatus, reason);
              } else {
                await handleStatusUpdate(
                  statusModal.receiptId,
                  statusModal.newStatus,
                  reason,
                );
              }
              setStatusModal({
                open: false,
                receiptId: null,
                newStatus: null,
                isBulk: false,
              });
            } catch (error) {
              console.error("Status update failed:", error);
            }
          }}
        />
      )}
    </>
  );
}

export default ViewReceiptsModal;
