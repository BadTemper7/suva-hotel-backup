import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout as doLogout, getUser, getUserRole } from "../../app/auth.js";

export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Get user data from auth
  const user = getUser();
  const userRole = getUserRole();
  console.log(user);
  // Get initials from user's name
  const getUserInitials = () => {
    if (!user) return "AD";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) return firstName.charAt(0).toUpperCase();
    if (lastName) return lastName.charAt(0).toUpperCase();
    return "U";
  };

  // Get user's full name
  const getUserName = () => {
    if (!user) return "Admin User";
    return (
      `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Admin User"
    );
  };

  // Get user's email
  const getUserEmail = () => {
    if (!user) return "";
    return user.email || "";
  };

  // Get role display name
  const getRoleDisplayName = () => {
    switch (userRole) {
      case "admin":
        return "Administrator";
      case "superadmin":
        return "Super Administrator";
      case "manager":
        return "Resort Manager";
      case "staff":
        return "Front Desk Staff";
      default:
        return userRole || "Staff";
    }
  };

  // Get role color
  const getRoleColor = () => {
    switch (userRole) {
      case "superadmin":
        return "text-purple-600 bg-purple-50";
      case "admin":
        return "text-[#0c2bfc] bg-[#0c2bfc]/10";
      case "manager":
        return "text-[#00af00] bg-[#00af00]/10";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

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
    navigate("/profile");
  }

  function logout() {
    setOpen(false); // ✅ close dropdown
    doLogout();
    navigate("/");
  }

  const initials = getUserInitials();
  const fullName = getUserName();
  const email = getUserEmail();
  const roleDisplay = getRoleDisplayName();
  const roleColorClass = getRoleColor();

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
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm leading-4 font-medium text-gray-800">
            {fullName}
          </div>
          <div className="text-xs text-gray-500 leading-3">{roleDisplay}</div>
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
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">
                  {fullName}
                </div>
                <div className="text-xs text-gray-500 truncate">{email}</div>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleColorClass}`}
                  >
                    {roleDisplay}
                  </span>
                </div>
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
