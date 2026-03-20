import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";

export default function AmenityModal({ open, mode, amenity, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    rate: 0,
    stock: 0,
    status: "active",
  });

  useEffect(() => {
    if (mode === "edit" && amenity) {
      setForm({
        name: amenity.name ?? "",
        rate: amenity.rate ?? 0,
        stock: amenity.stock ?? 0,
        status: amenity.status ?? "active",
      });
    } else {
      setForm({ name: "", rate: 0, stock: 0, status: "active" });
    }
  }, [mode, amenity]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    onSave?.({ ...amenity, ...form });
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
          <div className="text-lg font-bold text-gray-900">
            {mode === "add" ? "Add Amenity" : "Edit Amenity"}
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amenity Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="
                w-full h-11 rounded-xl 
                border border-gray-200 
                bg-white px-4
                text-sm text-gray-800 outline-none
                focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                transition-all duration-200
                placeholder:text-gray-400
              "
              placeholder="Extra Pillow, Towels, etc."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rate (PHP)
              </label>
              <input
                type="number"
                min="0"
                value={form.rate}
                onChange={(e) =>
                  setForm((p) => ({ ...p, rate: Number(e.target.value) }))
                }
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
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stock
              </label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) =>
                  setForm((p) => ({ ...p, stock: Number(e.target.value) }))
                }
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
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value }))
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
              {mode === "add" ? "Create Amenity" : "Update Amenity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
