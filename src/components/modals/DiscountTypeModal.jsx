import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";

export default function DiscountTypeModal({
  open,
  mode,
  data,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState({
    name: "",
    discountPercent: 0,
    isActive: true,
    appliesToAllRooms: false,
    maxRoomCount: null,
    discountPriority: "highest",
    isPerId: false,
  });

  useEffect(() => {
    if (mode === "edit" && data) {
      setForm({
        name: data.name ?? "",
        discountPercent: data.discountPercent ?? 0,
        isActive: data.isActive ?? true,
        appliesToAllRooms: data.appliesToAllRooms ?? false,
        maxRoomCount: data.maxRoomCount ?? null,
        discountPriority: data.discountPriority ?? "highest",
        isPerId: data.isPerId ?? false,
      });
    } else {
      setForm({
        name: "",
        discountPercent: 0,
        isActive: true,
        appliesToAllRooms: false,
        maxRoomCount: null,
        discountPriority: "highest",
        isPerId: false,
      });
    }
  }, [mode, data]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    onSave?.({ ...data, ...form });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        className="
        w-full max-w-lg rounded-2xl 
        bg-white
        shadow-2xl border border-gray-200
        overflow-hidden
      "
      >
        <div
          className="
          px-6 py-5 border-b border-gray-200 
          flex items-center justify-between
          bg-gray-50
        "
        >
          <div className="text-lg font-bold text-gray-900">
            {mode === "add" ? "Add Discount" : "Edit Discount"}
          </div>
          <button
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
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Discount Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Summer Promo"
              className="
                w-full h-11 rounded-xl 
                border border-gray-200 
                bg-white px-4
                text-sm text-gray-800 outline-none
                focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                transition-all duration-200
                placeholder:text-gray-400
              "
              required
            />
          </div>

          {/* Discount Percent */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Discount Percent (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.discountPercent}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  discountPercent: Number(e.target.value),
                }))
              }
              placeholder="10"
              className="
                w-full h-11 rounded-xl 
                border border-gray-200 
                bg-white px-4
                text-sm text-gray-800 outline-none
                focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                transition-all duration-200
                placeholder:text-gray-400
              "
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              value={form.isActive ? "active" : "inactive"}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  isActive: e.target.value === "active",
                }))
              }
              className="
                w-full h-11 rounded-xl 
                border border-gray-200 
                bg-white px-4
                text-sm text-gray-800 outline-none
                focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                transition-all duration-200
              "
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Applies to All Rooms */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
            <input
              type="checkbox"
              checked={form.appliesToAllRooms}
              onChange={(e) =>
                setForm((p) => ({ ...p, appliesToAllRooms: e.target.checked }))
              }
              id="appliesToAllRooms"
              className="
                h-5 w-5 rounded 
                border-gray-300 text-[#0c2bfc] 
                focus:ring-[#0c2bfc]/20
              "
            />
            <label
              htmlFor="appliesToAllRooms"
              className="text-sm font-medium text-gray-800"
            >
              Applies to All Rooms
            </label>
          </div>

          {/* Max Room Count */}
          {!form.appliesToAllRooms && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Max Room Count
              </label>
              <input
                type="number"
                min="1"
                value={form.maxRoomCount ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    maxRoomCount: e.target.value
                      ? Number(e.target.value)
                      : null,
                  }))
                }
                placeholder="5"
                className="
                  w-full h-11 rounded-xl 
                  border border-gray-200 
                  bg-white px-4
                  text-sm text-gray-800 outline-none
                  focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                  transition-all duration-200
                  placeholder:text-gray-400
                "
              />
            </div>
          )}

          {/* Discount Priority */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Discount Priority
            </label>
            <select
              value={form.discountPriority}
              onChange={(e) =>
                setForm((p) => ({ ...p, discountPriority: e.target.value }))
              }
              className="
                w-full h-11 rounded-xl 
                border border-gray-200 
                bg-white px-4
                text-sm text-gray-800 outline-none
                focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                transition-all duration-200
              "
            >
              <option value="highest">Highest</option>
              <option value="lowest">Lowest</option>
            </select>
          </div>

          {/* Per ID */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50">
            <input
              type="checkbox"
              checked={form.isPerId}
              onChange={(e) =>
                setForm((p) => ({ ...p, isPerId: e.target.checked }))
              }
              id="isPerId"
              className="
                h-5 w-5 rounded 
                border-gray-300 text-[#0c2bfc] 
                focus:ring-[#0c2bfc]/20
              "
            />
            <label
              htmlFor="isPerId"
              className="text-sm font-medium text-gray-800"
            >
              Apply per Guest ID
            </label>
          </div>

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
              {mode === "add" ? "Create Discount" : "Update Discount"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
