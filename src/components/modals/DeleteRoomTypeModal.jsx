import { useState } from "react";
import Loader from "../layout/Loader";

export default function DeleteRoomTypeModal({ roomType, onClose, onConfirm }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const isMatch = value === roomType.name;

  async function handleConfirm() {
    try {
      setLoading(true);
      await onConfirm();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-amber-900/40 to-rose-900/30 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-white to-amber-50 p-6 shadow-2xl border border-amber-200">
        <h2 className="text-lg font-semibold text-amber-900">
          Delete Room Type
        </h2>

        <p className="mt-2 text-sm text-amber-700">
          This action cannot be undone. Please type{" "}
          <strong className="text-amber-900">{roomType.name}</strong> to
          confirm.
        </p>

        <input
          type="text"
          value={value}
          disabled={loading}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type room type name"
          className="
            mt-4 w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm
            focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200
            disabled:bg-amber-50 disabled:cursor-not-allowed transition-colors duration-200
          "
        />

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="
              rounded-xl px-4 py-2 text-sm text-amber-700 border border-amber-200
              hover:bg-amber-50 transition-all duration-200
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            Cancel
          </button>

          <button
            disabled={!isMatch || loading}
            onClick={handleConfirm}
            className={[
              "rounded-xl px-4 py-2 text-sm font-medium text-white transition-all duration-200 inline-flex items-center gap-2",
              isMatch && !loading
                ? "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-sm hover:shadow"
                : "cursor-not-allowed bg-rose-300",
            ].join(" ")}
          >
            Delete
          </button>
        </div>

        {/* Loader overlay – only when loading */}
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 rounded-2xl">
            <Loader size={50} />
          </div>
        )}
      </div>
    </div>
  );
}
