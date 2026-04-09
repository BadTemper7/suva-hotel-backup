// components/modals/ViewDiscountImagesModal.jsx
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiX,
  FiImage,
  FiDownload,
  FiExternalLink,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiRefreshCw,
  FiUser,
  FiTag,
  FiPercent,
  FiStar,
  FiTarget,
  FiTrash2,
} from "react-icons/fi";
import toast from "react-hot-toast";
import Loader from "../layout/Loader";
import { useDiscountImageStore } from "../../stores/discountImageStore";
import { useDiscountTypeStore } from "../../stores/discountStore";

// Money formatter
const money = (n) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(n || 0);

function DiscountImageStatusBadge({ status }) {
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

function DiscountInfoCard({ discount }) {
  if (!discount) return null;

  return (
    <div className="bg-gradient-to-r from-[#0c2bfc]/5 to-transparent rounded-xl p-4 border border-[#0c2bfc]/20">
      <div className="flex items-center gap-2 mb-3">
        <FiTag className="text-[#0c2bfc]" size={16} />
        <h4 className="text-sm font-semibold text-gray-900">
          Discount Details
        </h4>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500">Discount Name</p>
          <p className="text-sm font-medium text-gray-900">{discount.name}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Discount Percent</p>
          <p className="text-sm font-bold text-[#00af00] flex items-center gap-1">
            <FiPercent size={12} /> {discount.discountPercent}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Priority</p>
          <p className="text-sm font-medium text-gray-900 capitalize flex items-center gap-1">
            {discount.discountPriority === "highest" ? (
              <FiStar size={12} className="text-yellow-500" />
            ) : discount.discountPriority === "lowest" ? (
              <FiTarget size={12} className="text-blue-500" />
            ) : null}
            {discount.discountPriority || "Normal"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Applies To</p>
          <p className="text-sm font-medium text-gray-900">
            {discount.appliesToAllRooms ? "All Rooms" : "Selected Rooms"}
          </p>
        </div>
        {discount.maxRoomCount && (
          <div>
            <p className="text-xs text-gray-500">Max Rooms</p>
            <p className="text-sm font-medium text-gray-900">
              {discount.maxRoomCount}
            </p>
          </div>
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
          Discount Images ({images.length})
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
            alt={`Discount ${selectedImage + 1}`}
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
              download={`discount-${selectedImage + 1}.jpg`}
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

function DiscountActionsMenu({
  image,
  onConfirm,
  onReject,
  onDelete,
  isAdmin,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: "Confirm",
      icon: FiCheckCircle,
      onClick: () => onConfirm(image._id),
      className: "text-[#00af00] hover:bg-[#00af00]/5",
      show: image.status !== "confirmed",
    },
    {
      label: "Reject",
      icon: FiXCircle,
      onClick: () => onReject(image._id),
      className: "text-red-600 hover:bg-red-50",
      show: image.status !== "rejected",
    },
    {
      label: "Delete",
      icon: FiTrash2,
      onClick: () => onDelete(image._id),
      className: "text-red-600 hover:bg-red-50",
      show: isAdmin,
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-gray-600 hover:text-gray-700 border border-gray-200 hover:border-gray-300"
        aria-label="More actions"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
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
              className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-40 py-2"
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
                    className={`w-full px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-gray-50 transition-all duration-200 ${action.className} border-b border-gray-100 last:border-b-0`}
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

function RejectReasonModal({ open, onClose, onConfirm }) {
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    onConfirm(reason);
    setReason("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Reject Discount Image
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Please provide a reason for rejecting this discount image.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
          placeholder="Enter rejection reason..."
        />
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all"
          >
            Confirm Rejection
          </button>
          <button
            onClick={() => onClose()}
            className="flex-1 h-10 border border-gray-200 hover:bg-gray-50 rounded-xl font-semibold transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ open, onClose, onConfirm, image }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Delete Discount Image
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete this discount image? This action
          cannot be undone.
        </p>
        {image?.discountId?.name && (
          <p className="text-sm text-gray-500 mb-4">
            Discount:{" "}
            <span className="font-semibold">{image.discountId.name}</span>
          </p>
        )}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onConfirm}
            className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-10 border border-gray-200 hover:bg-gray-50 rounded-xl font-semibold transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ViewDiscountImagesModal({
  billing,
  open,
  onClose,
  onDiscountReviewComplete,
}) {
  const {
    discountImages,
    fetchDiscountImagesByBilling,
    confirmDiscountImage,
    rejectDiscountImage,
    deleteDiscountImage,
    loading,
    clearError,
  } = useDiscountImageStore();

  const [refreshing, setRefreshing] = useState(false);
  const [rejectModal, setRejectModal] = useState({
    open: false,
    imageId: null,
  });
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    image: null,
  });

  // Get user role from localStorage
  const user = JSON.parse(localStorage.getItem("suva_admin_user") || "{}");
  const userRole = user.role;
  const isAdmin = userRole === "admin" || userRole === "superadmin";
  const userId = user._id;

  useEffect(() => {
    if (open && billing?._id) {
      fetchDiscountImagesByBilling(billing._id).catch((err) => {
        toast.error(err.message || "Failed to fetch discount images");
      });
    }
  }, [open, billing?._id, fetchDiscountImagesByBilling]);

  useEffect(() => {
    if (open) {
      const onKey = (e) => e.key === "Escape" && handleClose();
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
  }, [open]);

  const handleClose = () => {
    clearError();
    onClose();
  };

  const refreshData = async () => {
    if (!billing?._id) return;

    setRefreshing(true);
    try {
      await fetchDiscountImagesByBilling(billing._id);
      toast.success("Discount images refreshed");
    } catch (err) {
      toast.error(err.message || "Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const handleConfirm = async (imageId) => {
    try {
      await confirmDiscountImage(imageId, userId);
      toast.success("Discount image confirmed and applied to billing");
      await refreshData();
      if (billing?._id) await onDiscountReviewComplete?.(billing._id);
    } catch (err) {
      toast.error(err.message || "Failed to confirm discount image");
    }
  };

  const handleReject = (imageId) => {
    setRejectModal({ open: true, imageId });
  };

  const handleRejectConfirm = async (reason) => {
    try {
      await rejectDiscountImage(rejectModal.imageId, userId, reason);
      toast.success("Discount image rejected");
      setRejectModal({ open: false, imageId: null });
      await refreshData();
      if (billing?._id) await onDiscountReviewComplete?.(billing._id);
    } catch (err) {
      toast.error(err.message || "Failed to reject discount image");
    }
  };

  const handleDelete = (image) => {
    setDeleteModal({ open: true, image });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.image) return;

    try {
      await deleteDiscountImage(deleteModal.image._id);
      toast.success("Discount image deleted successfully");
      setDeleteModal({ open: false, image: null });
      await refreshData();
      if (billing?._id) await onDiscountReviewComplete?.(billing._id);
    } catch (err) {
      toast.error(err.message || "Failed to delete discount image");
    }
  };

  if (!billing || !open) return null;

  // Calculate discount statistics
  const confirmedDiscounts = discountImages.filter(
    (img) => img.status === "confirmed",
  );
  const pendingDiscounts = discountImages.filter(
    (img) => img.status === "pending",
  );
  const rejectedDiscounts = discountImages.filter(
    (img) => img.status === "rejected",
  );
  const totalDiscountAmount = billing.discountAmount || 0;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
        <div
          className="
          w-full max-w-5xl max-h-[90vh] flex flex-col
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
                <FiTag className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Discount Images for Billing #{billing.billingNumber}
                </h2>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      Total Discount:
                    </span>
                    <span className="text-sm font-semibold text-[#00af00]">
                      {money(totalDiscountAmount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      Confirmed:
                    </span>
                    <span className="text-sm font-semibold text-[#00af00]">
                      {confirmedDiscounts.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      Pending:
                    </span>
                    <span className="text-sm font-semibold text-[#0c2bfc]">
                      {pendingDiscounts.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      Rejected:
                    </span>
                    <span className="text-sm font-semibold text-red-600">
                      {rejectedDiscounts.length}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={refreshData}
                disabled={refreshing}
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
                title="Refresh discount images"
              >
                <FiRefreshCw
                  size={18}
                  className={`${refreshing ? "animate-spin" : ""}`}
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

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader size={50} variant="primary" />
              </div>
            ) : discountImages.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center border border-gray-200">
                  <FiTag className="text-gray-400" size={40} />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  No Discount Images Found
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  No discount images have been uploaded for this billing yet.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Discount Images Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {discountImages.map((image) => (
                    <motion.div
                      key={image._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition-all duration-200 bg-white"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <DiscountImageStatusBadge status={image.status} />
                        </div>
                        <div className="flex items-center gap-2">
                          {isAdmin && (
                            <DiscountActionsMenu
                              image={image}
                              onConfirm={handleConfirm}
                              onReject={handleReject}
                              onDelete={handleDelete}
                              isAdmin={isAdmin}
                            />
                          )}
                        </div>
                      </div>

                      {/* Discount Info */}
                      {image.discountId && (
                        <div className="mb-4">
                          <DiscountInfoCard discount={image.discountId} />
                        </div>
                      )}

                      {/* Image Preview */}
                      {image.url && (
                        <div className="mb-4">
                          <ImagePreview images={[{ url: image.url }]} />
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Uploaded At
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            {new Date(image.createdAt).toLocaleString("en-PH", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        {image.reviewedBy && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Reviewed By
                            </p>
                            <p className="text-sm text-gray-700 mt-1 flex items-center gap-1">
                              <FiUser size={12} />
                              {image.reviewedBy.firstName
                                ? `${image.reviewedBy.firstName} ${image.reviewedBy.lastName || ""}`
                                : image.reviewedBy.username || image.reviewedBy}
                            </p>
                          </div>
                        )}
                        {image.reviewedAt && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Reviewed At
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                              {new Date(image.reviewedAt).toLocaleString(
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
                        )}
                      </div>

                      {/* Rejection Reason */}
                      {image.status === "rejected" && image.rejectionReason && (
                        <div className="mt-4 pt-4 border-t border-red-200">
                          <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">
                            Rejection Reason
                          </p>
                          <p className="text-sm text-red-700 bg-red-50 rounded-xl p-3 border border-red-200">
                            {image.rejectionReason}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-5 flex justify-between items-center bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-700 font-medium">
                {discountImages.length} discount image
                {discountImages.length !== 1 && "s"}
              </div>
              {totalDiscountAmount > 0 && (
                <div className="text-sm text-[#00af00] font-semibold">
                  Total Discount: {money(totalDiscountAmount)}
                </div>
              )}
            </div>
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

      {/* Reject Reason Modal */}
      <RejectReasonModal
        open={rejectModal.open}
        onClose={() => setRejectModal({ open: false, imageId: null })}
        onConfirm={handleRejectConfirm}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, image: null })}
        onConfirm={handleDeleteConfirm}
        image={deleteModal.image}
      />
    </>
  );
}
