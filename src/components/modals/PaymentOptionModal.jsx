import { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";

export default function PaymentOptionModal({
  open,
  mode,
  paymentOption,
  onClose,
  onSave,
}) {
  const [name, setName] = useState("");
  const [paymentType, setPaymentType] = useState("full");
  const [amount, setAmount] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (paymentOption) {
      setName(paymentOption.name || "");
      setPaymentType(paymentOption.paymentType || "full");
      setAmount(paymentOption.amount || "");
      setIsActive(paymentOption.isActive ?? true);
    } else {
      setName("");
      setPaymentType("full");
      setAmount("");
      setIsActive(true);
    }
    setErrors({});
  }, [paymentOption]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!paymentType) newErrors.paymentType = "Payment type is required";
    if (paymentType === "partial") {
      if (!amount) newErrors.amount = "Amount is required for partial payments";
      else if (amount <= 0 || amount > 100)
        newErrors.amount = "Amount must be between 1 and 100";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    await onSave({
      _id: paymentOption?._id,
      name: name.trim(),
      paymentType,
      amount: paymentType === "partial" ? Number(amount) : undefined,
      isActive,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        className="
        bg-white
        rounded-2xl w-full max-w-md p-6 relative
        shadow-2xl border border-gray-200
      "
      >
        <button
          type="button"
          onClick={onClose}
          className="
            absolute top-4 right-4 
            h-9 w-9 rounded-xl 
            border border-gray-200 
            bg-white
            hover:bg-gray-50
            grid place-items-center
            transition-all duration-200
            hover:shadow-md hover:-translate-y-0.5
            active:translate-y-0 text-gray-700 hover:text-[#0c2bfc]
          "
        >
          <FiX size={20} />
        </button>

        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {mode === "add" ? "Add Payment Option" : "Edit Payment Option"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="
                w-full h-11 rounded-xl 
                border border-gray-200 
                bg-white px-4
                text-sm text-gray-800 outline-none
                focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                transition-all duration-200
                placeholder:text-gray-400
              "
              placeholder="Deposit, Full Payment, etc."
            />
            {errors.name && (
              <p className="text-red-600 text-xs mt-2">{errors.name}</p>
            )}
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Payment Type
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value)}
              className="
                w-full h-11 rounded-xl 
                border border-gray-200 
                bg-white px-4
                text-sm text-gray-800 outline-none
                focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                transition-all duration-200
              "
            >
              <option value="full">Full Payment</option>
              <option value="partial">Partial Payment</option>
            </select>
            {errors.paymentType && (
              <p className="text-red-600 text-xs mt-2">{errors.paymentType}</p>
            )}
          </div>

          {/* Amount / Percentage */}
          {paymentType === "partial" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Amount (%) <span className="text-gray-500">(1–100)</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="
                  w-full h-11 rounded-xl 
                  border border-gray-200 
                  bg-white px-4
                  text-sm text-gray-800 outline-none
                  focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                  transition-all duration-200
                  placeholder:text-gray-400
                "
                placeholder="Enter percentage"
              />
              {errors.amount && (
                <p className="text-red-600 text-xs mt-2">{errors.amount}</p>
              )}
            </div>
          )}

          {/* Active toggle */}
          <div
            className="
            flex items-center gap-3 p-3 rounded-xl 
            border border-gray-200 bg-gray-50
          "
          >
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="
                h-5 w-5 rounded 
                border-gray-300 text-[#0c2bfc] 
                focus:ring-[#0c2bfc]/20
              "
            />
            <label className="text-sm font-medium text-gray-800">Active</label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="
                h-11 px-5 rounded-xl 
                border border-gray-200 
                bg-white
                hover:bg-gray-50
                text-sm font-semibold text-gray-700
                transition-all duration-200
                hover:shadow-md hover:-translate-y-0.5
                active:translate-y-0
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              className="
                h-11 px-5 rounded-xl 
                bg-[#0c2bfc] 
                hover:bg-[#0a24d6]
                text-white text-sm font-semibold
                transition-all duration-200
                hover:shadow-lg hover:-translate-y-0.5
                active:translate-y-0
              "
            >
              {mode === "add" ? "Add Option" : "Update Option"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
