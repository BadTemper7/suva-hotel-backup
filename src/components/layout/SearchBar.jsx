import { useState } from "react";
import { FiSearch } from "react-icons/fi";

export default function SearchBar() {
  const [q, setQ] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  function onSubmit(e) {
    e.preventDefault();
    console.log("Search:", q);
    // Add actual search functionality here
    setShowSuggestions(false);
  }

  function handleFocus() {
    if (q.length > 0) {
      setShowSuggestions(true);
    }
  }

  function handleBlur() {
    // Small delay to allow click on suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  }

  return (
    <div className="relative w-full max-w-md">
      <form onSubmit={onSubmit}>
        <div
          className="
          relative flex items-center gap-2 
          rounded-xl border border-gray-200 
          bg-white px-4 py-3
          shadow-sm transition-all duration-300
          focus-within:border-[#0c2bfc] 
          focus-within:ring-2 focus-within:ring-[#0c2bfc]/20
          focus-within:shadow-lg
          hover:border-gray-300 hover:bg-gray-50/50
        "
        >
          {/* Decorative primary color accent */}
          <div className="absolute -left-1 -top-1 opacity-20">
            <div className="w-4 h-4 bg-[#0c2bfc] rounded-full"></div>
          </div>

          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="
              w-full bg-transparent outline-none 
              text-sm text-gray-800 placeholder-gray-400
              placeholder:font-light
            "
            placeholder="Search resort, guests, bookings..."
          />

          <button
            type="submit"
            className="
              flex items-center justify-center
              p-2 rounded-lg bg-white
              border border-gray-200 text-gray-600
              hover:bg-gray-50 hover:text-[#0c2bfc] hover:border-[#0c2bfc]/20
              hover:shadow-md
              active:scale-95 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[#0c2bfc]/20
            "
            aria-label="Search"
          >
            <FiSearch className="text-lg" />
          </button>

          {/* Decorative corner */}
          <div className="absolute -right-1 -bottom-1 opacity-20">
            <div className="w-3 h-3 bg-[#00af00] rounded-full"></div>
          </div>
        </div>
      </form>

      {/* Quick search suggestions */}
      {showSuggestions && q.length > 0 && (
        <div
          className="
          absolute top-full left-0 right-0 mt-1
          bg-white rounded-xl 
          border border-gray-200 shadow-lg
          overflow-hidden z-50
          animate-in fade-in slide-in-from-top-1 duration-200
        "
        >
          <div className="p-2">
            <p className="text-xs text-gray-500 px-2 py-1 font-medium">
              Quick search suggestions:
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setQ(`room ${q}`);
                  setShowSuggestions(false);
                }}
                className="
                  w-full text-left px-3 py-2 rounded-lg
                  text-sm text-gray-700 hover:bg-gray-50
                  hover:text-[#0c2bfc] transition-colors
                "
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  Search for room "{q}"
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setQ(`guest ${q}`);
                  setShowSuggestions(false);
                }}
                className="
                  w-full text-left px-3 py-2 rounded-lg
                  text-sm text-gray-700 hover:bg-gray-50
                  hover:text-[#0c2bfc] transition-colors
                "
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Search for guest "{q}"
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setQ(`booking ${q}`);
                  setShowSuggestions(false);
                }}
                className="
                  w-full text-left px-3 py-2 rounded-lg
                  text-sm text-gray-700 hover:bg-gray-50
                  hover:text-[#0c2bfc] transition-colors
                "
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Search for booking "{q}"
                </div>
              </button>
            </div>
          </div>

          {/* Close suggestion button */}
          <div className="border-t border-gray-200 p-2">
            <button
              onClick={() => setShowSuggestions(false)}
              className="w-full text-xs text-gray-500 hover:text-gray-700 text-center py-1"
            >
              Close suggestions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
