// components/modals/UploadDiscountImageModal.jsx
import { useState, useEffect } from "react";
import {
  FiX,
  FiUpload,
  FiTag,
  FiImage,
  FiTrash2,
  FiInfo,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useDiscountImageStore } from "../../stores/discountImageStore";
import { useDiscountTypeStore } from "../../stores/discountStore";
import Loader from "../layout/Loader";

export default function UploadDiscountImageModal({
  open,
  onClose,
  billing,
  onSuccess,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [discountId, setDiscountId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { createDiscountImage, loading: imageLoading } =
    useDiscountImageStore();
  const {
    discounts,
    fetchDiscounts,
    loading: discountsLoading,
  } = useDiscountTypeStore();

  useEffect(() => {
    if (open) {
      fetchDiscounts({ isActive: true }); // Only fetch active discounts
    }
  }, [open, fetchDiscounts]);

  // Clean up preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    // Check file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, or WEBP)");
      return;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(previewUrl);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error("Please select an image");
      return;
    }

    if (!discountId) {
      toast.error("Please select a discount type");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("discountId", discountId);
    formData.append("billingId", billing._id);
    formData.append("status", "pending");

    try {
      await createDiscountImage(formData);
      toast.success("Discount image uploaded successfully");
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err) {
      toast.error(err.message || "Failed to upload discount image");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    setDiscountId("");
    onClose();
  };

  // Get selected discount details
  const selectedDiscount = discounts?.find((d) => d._id === discountId);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-[#0c2bfc]/5 to-transparent">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-[#0c2bfc] flex items-center justify-center shadow-lg">
                <FiTag className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Upload Discount Image
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Billing #{billing?.billingNumber}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              disabled={uploading}
            >
              <FiX size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Discount Type Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Discount Type <span className="text-red-500">*</span>
              </label>
              {discountsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader size={30} variant="primary" />
                </div>
              ) : (
                <>
                  <select
                    value={discountId}
                    onChange={(e) => setDiscountId(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] outline-none transition-all duration-200 bg-white"
                    required
                    disabled={uploading}
                  >
                    <option value="">Select a discount type...</option>
                    {discounts && discounts.length > 0 ? (
                      discounts
                        .filter((d) => d.isActive !== false)
                        .map((discount) => (
                          <option key={discount._id} value={discount._id}>
                            {discount.name} - {discount.discountPercent}% off
                            {discount.appliesToAllRooms
                              ? " (All Rooms)"
                              : " (Selected Rooms)"}
                          </option>
                        ))
                    ) : (
                      <option disabled>No discount types available</option>
                    )}
                  </select>

                  {/* Discount Details Card */}
                  {selectedDiscount && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-start gap-2">
                        <FiInfo className="text-[#0c2bfc] mt-0.5" size={14} />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-700 mb-1">
                            Discount Details
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">Name:</span>
                              <span className="ml-1 font-medium text-gray-900">
                                {selectedDiscount.name}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Percentage:</span>
                              <span className="ml-1 font-semibold text-[#00af00]">
                                {selectedDiscount.discountPercent}%
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Priority:</span>
                              <span className="ml-1 font-medium capitalize">
                                {selectedDiscount.discountPriority || "Normal"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Applies To:</span>
                              <span className="ml-1 font-medium">
                                {selectedDiscount.appliesToAllRooms
                                  ? "All Rooms"
                                  : "Selected Rooms"}
                              </span>
                            </div>
                            {selectedDiscount.maxRoomCount && (
                              <div>
                                <span className="text-gray-500">
                                  Max Rooms:
                                </span>
                                <span className="ml-1 font-medium">
                                  {selectedDiscount.maxRoomCount}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-500">Status:</span>
                              <span
                                className={`ml-1 font-medium ${selectedDiscount.isActive === false ? "text-red-500" : "text-green-500"}`}
                              >
                                {selectedDiscount.isActive === false
                                  ? "Inactive"
                                  : "Active"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Image Upload Area */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Discount Image <span className="text-red-500">*</span>
              </label>

              {!preview ? (
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer
                    ${
                      dragActive
                        ? "border-[#0c2bfc] bg-[#0c2bfc]/5"
                        : "border-gray-300 hover:border-[#0c2bfc] hover:bg-gray-50"
                    }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() =>
                    document.getElementById("discount-image-input").click()
                  }
                >
                  <input
                    id="discount-image-input"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="text-center">
                    <div className="flex justify-center mb-3">
                      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                        <FiImage className="text-gray-400" size={28} />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      JPEG, PNG, or WEBP (max 5MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-auto max-h-64 object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
                    disabled={uploading}
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Info Note */}
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Uploaded discount images will be pending
                review by an administrator. Once confirmed, the discount will be
                automatically applied to this billing.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="h-11 px-6 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              !selectedFile || !discountId || uploading || discountsLoading
            }
            className={`
              h-11 px-6 rounded-xl font-medium transition-all duration-200 flex items-center gap-2
              ${
                !selectedFile || !discountId || uploading || discountsLoading
                  ? "bg-gray-300 cursor-not-allowed text-gray-500"
                  : "bg-[#0c2bfc] hover:bg-[#0a24d6] text-white hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              }
            `}
          >
            {uploading ? (
              <>
                <Loader size={20} variant="white" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <FiUpload size={16} />
                <span>Upload Discount</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
