import { useEffect, useRef, useState } from "react";
import { FiUploadCloud, FiTrash2, FiX } from "react-icons/fi";

const PAYMENT_METHODS = [
  { label: "Cash", value: "cash" },
  { label: "GCash", value: "gcash" },
  { label: "Maya", value: "maya" },
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "Credit Card", value: "credit_card" },
  { label: "Debit Card", value: "debit_card" },
  { label: "PayPal", value: "paypal" },
];

const formatMoney = (n) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Number(n || 0),
  );

const clampFiles = (files, max = 10) => Array.from(files || []).slice(0, max);

export default function BillingStatusModal({ open, billing, onClose, onSave }) {
  const [method, setMethod] = useState("cash");
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState("");

  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const isCash = method === "cash";

  const clearFiles = () => {
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setFiles([]);
    setPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (!billing) return;

    setMethod(billing.method || "cash");

    const total = Number(billing.totalAmount || 0);
    const paid = Number(billing.amountPaid || 0);
    const balance = Number(billing.balance ?? Math.max(0, total - paid));
    const remaining = Math.max(0, balance);

    setAmountPaid(remaining > 0 ? remaining : 0);

    setNotes("");
    clearFiles();
  }, [billing, open]);

  useEffect(() => {
    if (isCash && files.length > 0) clearFiles();
  }, [isCash]);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, []);

  if (!open) return null;

  const total = Number(billing?.totalAmount || 0);
  const alreadyPaid = Number(billing?.amountPaid || 0);
  const remaining = Math.max(0, total - alreadyPaid);

  const afterPay = alreadyPaid + Number(amountPaid || 0);
  const afterBalance = Math.max(0, total - afterPay);
  const afterChange = Math.max(0, afterPay - total);

  const onPickFiles = (fileList) => {
    const picked = clampFiles(fileList, 10);
    previews.forEach((p) => URL.revokeObjectURL(p.url));

    const nextPrev = picked.map((f) => ({
      url: URL.createObjectURL(f),
      name: f.name,
      size: f.size,
    }));

    setFiles(picked);
    setPreviews(nextPrev);
  };

  const removeFileAt = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => {
      const x = prev[idx];
      if (x?.url) URL.revokeObjectURL(x.url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const submit = (e) => {
    e.preventDefault();

    const allowedValues = PAYMENT_METHODS.map((m) => m.value);
    if (!allowedValues.includes(method)) {
      alert("Invalid payment method");
      return;
    }

    const amt = Number(amountPaid);
    if (!Number.isFinite(amt) || amt < 0) {
      alert("Amount paid must be a valid number >= 0");
      return;
    }
    if (amt <= 0) {
      alert("Amount paid must be greater than 0");
      return;
    }

    onSave?.({
      method,
      amountPaid: amt,
      notes: notes?.trim() || "",
      files: isCash ? [] : files,
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        className="
        w-full max-w-lg rounded-2xl 
        bg-white
        shadow-2xl border border-gray-200
      "
      >
        <div
          className="
          px-6 py-5 border-b border-gray-200 
          flex items-center justify-between
          bg-gray-50
        "
        >
          <div className="text-lg font-bold text-gray-900">Add Payment</div>
          <button
            type="button"
            onClick={onClose}
            className="
              h-10 w-10 rounded-xl 
              border border-gray-200 
              bg-white
              hover:bg-gray-50
              grid place-items-center
              transition-all duration-200
              hover:shadow-md hover:-translate-y-0.5
              active:translate-y-0 text-gray-700 hover:text-[#0c2bfc]
            "
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          {/* Summary */}
          <div
            className="
            rounded-xl border border-gray-200 
            bg-gray-50
            p-4 space-y-2
          "
          >
            <div className="text-sm text-gray-700">
              Total:{" "}
              <span className="font-bold text-gray-900">
                {formatMoney(total)}
              </span>
            </div>
            <div className="text-sm text-gray-700">
              Already paid:{" "}
              <span className="font-bold text-gray-900">
                {formatMoney(alreadyPaid)}
              </span>
            </div>
            <div className="text-sm text-gray-700">
              Remaining:{" "}
              <span className="font-bold text-gray-900">
                {formatMoney(remaining)}
              </span>
            </div>

            <div className="pt-3 text-xs text-gray-500 border-t border-gray-200">
              After this payment: Balance{" "}
              <b className="text-gray-700">{formatMoney(afterBalance)}</b> •
              Change <b className="text-gray-700">{formatMoney(afterChange)}</b>
            </div>
          </div>

          {/* Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="
                w-full h-11 rounded-xl 
                border border-gray-200 
                bg-white px-4
                text-sm text-gray-800 outline-none
                focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                transition-all duration-200
              "
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            {isCash && (
              <div className="text-xs text-gray-500 mt-2">
                Cash payments don't require receipt upload.
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount Paid
            </label>
            <input
              type="number"
              min="1"
              value={amountPaid}
              onChange={(e) => setAmountPaid(Number(e.target.value))}
              className="
                w-full h-11 rounded-xl 
                border border-gray-200 
                bg-white px-4
                text-sm text-gray-800 outline-none
                focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                transition-all duration-200
              "
              required
            />
            <div className="text-xs text-gray-500 mt-2">
              You can overpay; system will compute change automatically.
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes (optional)
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="
                w-full h-11 rounded-xl 
                border border-gray-200 
                bg-white px-4
                text-sm text-gray-800 outline-none
                focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                transition-all duration-200
                placeholder:text-gray-400
              "
              placeholder="e.g. deposit, 2nd payment, etc."
            />
          </div>

          {/* Upload section ONLY if NOT CASH */}
          {!isCash && (
            <div
              className="
              rounded-xl border border-gray-200 
              bg-white
              p-4
            "
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Receipt Images (optional)
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Upload up to 10 images.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {files.length > 0 && (
                    <button
                      type="button"
                      onClick={clearFiles}
                      className="
                        h-9 px-3 rounded-xl 
                        border border-gray-200 
                        bg-white
                        hover:bg-gray-50
                        text-sm font-medium text-gray-700
                        transition-all duration-200
                        hover:shadow-md hover:-translate-y-0.5
                        active:translate-y-0
                        flex items-center gap-2
                      "
                    >
                      <FiX /> Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="
                      h-9 px-3 rounded-xl 
                      bg-[#0c2bfc] 
                      hover:bg-[#0a24d6]
                      text-white text-sm font-semibold
                      transition-all duration-200
                      hover:shadow-md hover:-translate-y-0.5
                      active:translate-y-0
                      flex items-center gap-2
                    "
                  >
                    <FiUploadCloud /> Upload
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onPickFiles(e.target.files)}
              />

              {previews.length === 0 ? (
                <div
                  className="
                  rounded-xl border-2 border-dashed border-gray-200 
                  bg-gray-50
                  p-6 text-center text-sm text-gray-500
                "
                >
                  No images selected.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {previews.map((p, idx) => (
                    <div
                      key={`${p.url}-${idx}`}
                      className="
                        rounded-xl border border-gray-200 
                        bg-white overflow-hidden
                        hover:shadow-md transition-shadow
                      "
                    >
                      <div className="relative">
                        <img
                          src={p.url}
                          alt={p.name}
                          className="h-36 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFileAt(idx)}
                          className="
                            absolute top-2 right-2 
                            h-9 w-9 rounded-xl 
                            bg-white
                            border border-gray-200 hover:bg-gray-50
                            grid place-items-center
                            transition-all duration-200
                            hover:shadow-md
                          "
                          title="Remove"
                        >
                          <FiTrash2 className="text-[#0c2bfc]" />
                        </button>
                      </div>
                      <div className="p-3">
                        <div className="text-xs font-medium text-gray-900 truncate">
                          {p.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {(p.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
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
              Add Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
