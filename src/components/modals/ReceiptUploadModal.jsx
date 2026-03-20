import { useState, useEffect } from "react";
import { FiX, FiUpload } from "react-icons/fi";
import { useReceiptStore } from "../../stores/receiptStore";
import usePaymentTypeStore from "../../stores/paymentTypeStore";

export default function ReceiptUploadModal({
  open,
  billing,
  onClose,
  onSuccess,
}) {
  const { createReceipt, loading, error, clearError } = useReceiptStore();
  const {
    paymentTypes,
    fetchPaymentTypes,
    loading: paymentTypesLoading,
  } = usePaymentTypeStore();

  const [formData, setFormData] = useState({
    billingId: "",
    paymentType: "",
    amountPaid: "",
    amountReceived: "",
    status: "pending",
    notes: "",
  });

  const [receiptImage, setReceiptImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [selectedPaymentType, setSelectedPaymentType] = useState(null);

  // Fetch payment types on mount
  useEffect(() => {
    if (open) {
      fetchPaymentTypes();
    }
  }, [open, fetchPaymentTypes]);

  // Initialize with billing data
  useEffect(() => {
    if (billing) {
      setFormData((prev) => ({
        ...prev,
        billingId: billing._id,
        amountPaid: billing.totalAmount - billing.amountPaid || "",
      }));
    }
  }, [billing]);

  // Handle payment type selection
  const handlePaymentTypeChange = (e) => {
    const paymentTypeId = e.target.value;
    const selected = paymentTypes.find((pt) => pt._id === paymentTypeId);

    setFormData({ ...formData, paymentType: paymentTypeId });
    setSelectedPaymentType(selected);

    // Clear file if selected payment type doesn't require receipt
    if (!selected?.isReceipt) {
      setReceiptImage(null);
      setImagePreview(null);
    }
  };

  // Calculate change
  const calculateChange = () => {
    const paid = parseFloat(formData.amountPaid) || 0;
    const received = parseFloat(formData.amountReceived) || 0;
    return Math.max(0, received - paid);
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/pdf",
      ];
      if (!validTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          receiptImage: "Please upload JPG, PNG, or PDF files only",
        }));
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          receiptImage: "File size must be less than 5MB",
        }));
        return;
      }

      setReceiptImage(file);
      setErrors((prev) => ({ ...prev, receiptImage: "" }));

      // Create preview for images only
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!formData.billingId) newErrors.billingId = "Billing ID is required";
    if (!formData.paymentType)
      newErrors.paymentType = "Payment type is required";
    if (!formData.amountPaid || formData.amountPaid <= 0) {
      newErrors.amountPaid = "Valid amount paid is required";
    }
    if (!formData.amountReceived || formData.amountReceived === "") {
      newErrors.amountReceived = "Amount received is required";
    }

    // Validate receipt image if required
    if (selectedPaymentType?.isReceipt && !receiptImage) {
      newErrors.receiptImage =
        "Receipt image is required for this payment type";
    }

    // Validate amount received >= amount paid
    const paid = parseFloat(formData.amountPaid) || 0;
    const received = parseFloat(formData.amountReceived) || 0;
    if (received < paid) {
      newErrors.amountReceived =
        "Amount received cannot be less than amount paid";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      // Prepare data for backend
      const receiptData = {
        ...formData,
        amountPaid: parseFloat(formData.amountPaid),
        amountReceived: parseFloat(formData.amountReceived),
        change: calculateChange(),
        paymentType: formData.paymentType,
        status: "confirmed",
      };

      // Use the store to create receipt
      const result = await createReceipt(receiptData, receiptImage);

      if (onSuccess) {
        onSuccess(result);
      }

      // Reset form
      resetForm();
      onClose();
    } catch (error) {
      console.error("Failed to create receipt:", error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      billingId: "",
      paymentType: "",
      amountPaid: "",
      amountReceived: "",
      status: "pending",
      notes: "",
    });
    setReceiptImage(null);
    setImagePreview(null);
    setSelectedPaymentType(null);
    setErrors({});
    clearError();
  };

  // Get available payment types (filter active ones)
  const availablePaymentTypes = paymentTypes.filter(
    (pt) => pt.isActive !== false,
  );

  const requiresReceipt = selectedPaymentType?.isReceipt || false;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl border border-gray-200">
        <button
          type="button"
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 h-9 w-9 rounded-full border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all duration-200"
          disabled={loading}
        >
          <FiX size={20} />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Upload Receipt for Billing #{billing?.billingNumber || "N/A"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Type Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Type *
            </label>
            {paymentTypesLoading ? (
              <div className="py-2 text-sm text-gray-500">
                Loading payment types...
              </div>
            ) : availablePaymentTypes.length === 0 ? (
              <div className="py-2 text-sm text-red-500">
                No active payment types available
              </div>
            ) : (
              <select
                value={formData.paymentType}
                onChange={handlePaymentTypeChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] transition-colors duration-200"
                required
                disabled={loading}
              >
                <option value="">Select a payment type</option>
                {availablePaymentTypes.map((type) => (
                  <option key={type._id} value={type._id}>
                    {type.name}
                    {!type.isReceipt && " (No receipt required)"}
                  </option>
                ))}
              </select>
            )}
            {errors.paymentType && (
              <p className="text-red-500 text-xs mt-1">{errors.paymentType}</p>
            )}
          </div>

          {/* Amount Paid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount Paid (PHP) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                ₱
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                max={billing?.totalAmount - billing?.amountPaid || 1000000}
                value={formData.amountPaid}
                onChange={(e) =>
                  setFormData({ ...formData, amountPaid: e.target.value })
                }
                className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] transition-colors duration-200"
                placeholder="0.00"
                required
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Remaining balance: ₱
              {(billing?.totalAmount - billing?.amountPaid || 0).toFixed(2)}
            </p>
            {errors.amountPaid && (
              <p className="text-red-500 text-xs mt-1">{errors.amountPaid}</p>
            )}
          </div>

          {/* Amount Received */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount Received (PHP) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                ₱
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amountReceived}
                onChange={(e) =>
                  setFormData({ ...formData, amountReceived: e.target.value })
                }
                className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] transition-colors duration-200"
                placeholder="0.00"
                required
                disabled={loading}
              />
            </div>
            {errors.amountReceived && (
              <p className="text-red-500 text-xs mt-1">
                {errors.amountReceived}
              </p>
            )}
          </div>

          {/* Change Display */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-700">
              Change:{" "}
              <span className="font-semibold text-[#0c2bfc]">
                ₱{calculateChange().toFixed(2)}
              </span>
            </p>
          </div>

          {/* Conditional Receipt Image Upload */}
          {requiresReceipt ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receipt Image *
                <span className="text-xs text-gray-500 ml-1">
                  (Required for {selectedPaymentType?.name})
                </span>
              </label>
              <div className="mt-1">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 bg-white">
                  <FiUpload className="text-[#0c2bfc]" />
                  <span className="text-sm text-gray-700">Choose File</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleImageChange}
                    className="hidden"
                    required
                    disabled={loading}
                  />
                </label>

                {receiptImage && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {receiptImage.name}
                    {receiptImage.size > 0 && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({(receiptImage.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    )}
                  </p>
                )}

                {imagePreview && receiptImage?.type?.startsWith("image/") && (
                  <div className="mt-3">
                    <img
                      src={imagePreview}
                      alt="Receipt preview"
                      className="w-32 h-32 object-cover rounded-xl border border-gray-200 shadow-sm"
                    />
                  </div>
                )}

                {receiptImage?.type === "application/pdf" && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-700">📄 PDF file selected</p>
                  </div>
                )}

                {errors.receiptImage && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.receiptImage}
                  </p>
                )}

                <p className="mt-1 text-xs text-gray-500">
                  Accepted: JPG, PNG, PDF (Max 5MB)
                </p>
              </div>
            </div>
          ) : (
            selectedPaymentType && (
              <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-xl">
                <p className="text-sm">
                  <span className="font-medium text-[#0c2bfc]">
                    {selectedPaymentType.name}
                  </span>{" "}
                  does not require a receipt upload.
                </p>
              </div>
            )
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] transition-colors duration-200"
              placeholder="Any additional notes..."
              disabled={loading}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (requiresReceipt && !receiptImage)}
              className={`h-10 px-4 rounded-xl text-white text-sm font-medium transition-all duration-200 ${
                loading || (requiresReceipt && !receiptImage)
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#0c2bfc] hover:bg-[#0a24d6] shadow-sm hover:shadow"
              }`}
            >
              {loading ? "Uploading..." : "Upload Receipt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
