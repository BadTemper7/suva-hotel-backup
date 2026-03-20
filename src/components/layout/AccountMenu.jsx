import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout as doLogout } from "../../app/auth.js";

export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onPointerDown(e) {
      // close only if click is outside
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }

    // capture makes it reliable even when clicking buttons fast
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  function goProfile() {
    setOpen(false); // ✅ close dropdown
    navigate("/admin/profile");
  }

  function logout() {
    setOpen(false); // ✅ close dropdown
    doLogout();
    navigate("/admin/login");
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="
          h-10 px-3 rounded-xl 
          border border-gray-200 
          bg-white
          hover:bg-gray-50
          flex items-center gap-2 cursor-pointer
          transition-all duration-300
          hover:shadow-md hover:-translate-y-0.5
          active:translate-y-0
        "
        aria-label="Account"
        title="Account"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div
          className="
          h-8 w-8 rounded-full 
          bg-[#0c2bfc]
          grid place-items-center text-xs text-white font-semibold
          shadow-sm
        "
        >
          AD
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm leading-4 font-medium text-gray-800">
            Admin
          </div>
          <div className="text-xs text-gray-500 leading-3">Resort Manager</div>
        </div>
        <span className="text-gray-400 text-lg">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          className="
            absolute right-0 mt-2
            w-[min(14rem,calc(100vw-1.5rem))]
            rounded-xl 
            bg-white
            shadow-xl overflow-hidden border border-gray-200
            animate-in fade-in slide-in-from-top-2 duration-200
          "
        >
          {/* Decorative top accent */}
          <div className="h-1 bg-[#0c2bfc] w-full"></div>

          {/* Profile section */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div
                className="
                h-10 w-10 rounded-full 
                bg-[#0c2bfc]
                grid place-items-center text-sm text-white font-semibold
                shadow-md
              "
              >
                AD
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  Admin User
                </div>
                <div className="text-xs text-gray-500">Resort Manager</div>
              </div>
            </div>
          </div>

          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              onClick={goProfile}
              className="
                w-full text-left px-4 py-3 
                text-sm text-gray-700 hover:text-[#0c2bfc]
                hover:bg-gray-50
                transition-colors duration-200
                flex items-center gap-2
              "
            >
              <svg
                className="w-4 h-4 text-gray-500"
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
              Profile Settings
            </button>

            <div className="px-4 py-2 border-t border-gray-200">
              <button
                type="button"
                role="menuitem"
                onClick={logout}
                className="
                  w-full text-left px-4 py-3 rounded-lg
                  text-sm text-[#0c2bfc] hover:text-[#0a24d6]
                  hover:bg-gray-50
                  transition-colors duration-200
                  flex items-center gap-2
                "
              >
                <svg
                  className="w-4 h-4 text-[#0c2bfc]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500 text-center">
              Suva's Place Resort
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
