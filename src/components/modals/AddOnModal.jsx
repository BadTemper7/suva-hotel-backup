// src/components/modals/AddOnModal.jsx
import { useEffect, useState } from "react";
import { FiX, FiInfo } from "react-icons/fi";

const CATEGORY_OPTIONS = [
  { value: "food", label: "Food", icon: "🍽️" },
  { value: "beverage", label: "Beverage", icon: "🥤" },
  { value: "equipment", label: "Equipment", icon: "🔧" },
  { value: "service", label: "Service", icon: "🛎️" },
  { value: "other", label: "Other", icon: "📦" },
];

export default function AddOnModal({ open, mode, addOn, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    rate: 0,
    stock: 0,
    category: "other",
    description: "",
    status: "active",
  });

  useEffect(() => {
    if (mode === "edit" && addOn) {
      setForm({
        name: addOn.name ?? "",
        rate: addOn.rate ?? 0,
        stock: addOn.stock ?? 0,
        category: addOn.category ?? "other",
        description: addOn.description ?? "",
        status: addOn.status ?? "active",
      });
    } else {
      setForm({
        name: "",
        rate: 0,
        stock: 0,
        category: "other",
        description: "",
        status: "active",
      });
    }
  }, [mode, addOn]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();

    // Validate
    if (!form.name.trim()) {
      alert("Please enter a name for the add-on");
      return;
    }
    if (form.rate < 0) {
      alert("Rate cannot be negative");
      return;
    }
    if (form.stock < 0) {
      alert("Stock cannot be negative");
      return;
    }

    onSave?.({ ...addOn, ...form });
  };

  const getCategoryIcon = (category) => {
    const cat = CATEGORY_OPTIONS.find((c) => c.value === category);
    return cat?.icon || "📦";
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        className="
        w-full max-w-lg rounded-2xl 
        bg-white
        shadow-2xl border border-gray-200
        max-h-[90vh] overflow-y-auto
      "
      >
        <div
          className="
          px-6 py-5 border-b border-gray-200 
          flex items-center justify-between
          bg-gray-50 sticky top-0 z-10
        "
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getCategoryIcon(form.category)}</div>
            <div className="text-lg font-bold text-gray-900">
              {mode === "add" ? "Add New Add-On" : "Edit Add-On"}
            </div>
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
              Add-On Name *
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
              placeholder="e.g., Extra Pillow, Towel Set, Snacks, etc."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
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
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
              className="
                w-full rounded-xl 
                border border-gray-200 
                bg-white px-4 py-3
                text-sm text-gray-800 outline-none
                focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                transition-all duration-200
                placeholder:text-gray-400 resize-none
              "
              placeholder="Optional: Describe the add-on, its features, or usage..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rate (PHP) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  ₱
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.rate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, rate: Number(e.target.value) }))
                  }
                  className="
                    w-full h-11 rounded-xl 
                    border border-gray-200 
                    bg-white pl-8 pr-4
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
                Stock *
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
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="active"
                  checked={form.status === "active"}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, status: e.target.value }))
                  }
                  className="
                    h-4 w-4 text-[#0c2bfc] 
                    focus:ring-[#0c2bfc]/20
                  "
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="inactive"
                  checked={form.status === "inactive"}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, status: e.target.value }))
                  }
                  className="
                    h-4 w-4 text-[#0c2bfc] 
                    focus:ring-[#0c2bfc]/20
                  "
                />
                <span className="text-sm text-gray-700">Inactive</span>
              </label>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex gap-3">
              <FiInfo className="text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">About Add-Ons:</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                  <li>Add-ons are extra items guests can purchase</li>
                  <li>
                    Stock will be tracked and reduced when added to reservations
                  </li>
                  <li>Inactive add-ons won't appear in reservation forms</li>
                  <li>
                    Categories help organize add-ons for better management
                  </li>
                </ul>
              </div>
            </div>
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
              {mode === "add" ? "Create Add-On" : "Update Add-On"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
