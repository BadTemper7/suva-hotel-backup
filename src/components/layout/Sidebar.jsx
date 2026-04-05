import { NavLink } from "react-router-dom";
import { useState } from "react";
import {
  FiHome,
  FiGrid,
  FiCalendar,
  FiUsers,
  FiCreditCard,
  FiTool,
  FiSearch,
  FiSettings,
  FiChevronsLeft,
  FiChevronsRight,
  FiBarChart2,
  FiShield,
  FiMail,
  FiLogIn,
} from "react-icons/fi";

import Logo from "./Logo"; // Import the Logo component
import { useUserStore } from "../../stores/userStore.js";
import { getStoredUser } from "../../app/auth.js";
import { canAccessPath } from "../../utils/staffPermissions.js";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: FiGrid },
  { to: "/rooms", label: "Rooms & Cottages", icon: FiHome },
  { to: "/reservations", label: "Reservations", icon: FiCalendar },
  { to: "/front-desk", label: "Front desk", icon: FiLogIn },
  { to: "/guests", label: "Guest", icon: FiUsers },
  { to: "/users", label: "Users", icon: FiShield },
  { to: "/billing", label: "Billing", icon: FiCreditCard },
  { to: "/reports", label: "Reports", icon: FiBarChart2 },
  // { to: "/maintenance", label: "Maintenance", icon: FiTool },
  // { to: "/lost-found", label: "Lost & Found", icon: FiSearch },
  { to: "/inbox", label: "Inbox", icon: FiMail },
  { to: "/settings", label: "Settings", icon: FiSettings },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const storeUser = useUserStore((s) => s.currentUser);
  const user = getStoredUser() ?? storeUser;
  const navItems = user
    ? NAV.filter((item) => canAccessPath(user, item.to))
    : NAV;

  const active = "bg-[#0c2bfc] text-white shadow-md";
  const inactive =
    "text-gray-600 hover:bg-gray-50 hover:text-[#0c2bfc] hover:border-gray-200";

  // Track which nav item is being hovered for tooltips
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleMouseEnter = (itemLabel) => {
    if (collapsed) {
      setHoveredItem(itemLabel);
    }
  };

  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  return (
    <aside
      className={[
        "h-dvh shrink-0 bg-white border-r border-gray-200 shadow-xl flex flex-col",
        "transition-[width] duration-300 ease-in-out max-h-screen",
        collapsed ? "w-16 sm:w-20" : "w-[82vw] max-w-[16rem] sm:w-64",
      ].join(" ")}
    >
      {/* Decorative top accent with solid primary color */}
      <div className="h-1 bg-[#0c2bfc] w-full"></div>

      {/* Brand Section using Logo component - group-hover works fine here */}
      <div className="px-4 py-6">
        <Logo
          collapsed={collapsed}
          showFullBrand={true}
          compactMode={false}
          className="mb-4"
        />

        {!collapsed && (
          <div className="mt-2 text-center">
            <div className="inline-flex items-center gap-1 text-xs text-[#00af00] bg-[#00af00]/5 px-3 py-1 rounded-full border border-[#00af00]/20">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Resort Management</span>
            </div>
          </div>
        )}
      </div>

      {/* Nav - Using custom scrollbar classes from index.css */}
      <nav
        className={[
          "p-4 space-y-2 flex-1 overflow-y-auto overflow-x-visible relative",
          "sidebar-scroll", // Custom scrollbar styling
          "sidebar-nav", // For responsive height adjustments
        ].join(" ")}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isHovered = hoveredItem === item.label;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onMouseEnter={() => handleMouseEnter(item.label)}
              onMouseLeave={handleMouseLeave}
              className={({ isActive }) =>
                [
                  "group relative flex items-center gap-3",
                  "rounded-xl px-4 py-3 text-sm font-medium",
                  "transition-all duration-300 transform hover:-translate-y-0.5",
                  "border border-transparent hover:border-gray-200",
                  collapsed ? "justify-center" : "",
                  isActive ? active : inactive,
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`
                    text-lg leading-none transition-all duration-300
                    ${
                      isActive
                        ? "text-white"
                        : "text-gray-500 group-hover:text-[#0c2bfc] group-hover:scale-110"
                    }
                  `}
                  >
                    <Icon />
                  </span>

                  {!collapsed && (
                    <span
                      className={`truncate font-medium transition-colors duration-300
                      ${
                        isActive
                          ? "text-white"
                          : "text-gray-600 group-hover:text-[#0c2bfc]"
                      }
                    `}
                    >
                      {item.label}
                    </span>
                  )}

                  {/* Tooltip (collapsed only) - Using state instead of group-hover */}
                  {collapsed && (
                    <div
                      className={`
                        absolute left-full top-1/2 -translate-y-1/2
                        ml-3 z-[99999] pointer-events-none
                        transition-opacity duration-200
                        ${isHovered ? "opacity-100" : "opacity-0"}
                      `}
                    >
                      <div
                        className="
                          whitespace-nowrap rounded-xl bg-white px-3 py-2
                          text-xs text-gray-800 shadow-lg border border-gray-200
                        "
                      >
                        {item.label}
                      </div>
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom: Collapse/expand button */}
      <div
        className={[
          "p-4 border-t border-gray-200 relative shrink-0",
          collapsed ? "flex justify-center" : "flex justify-end",
        ].join(" ")}
      >
        <button
          onClick={() => setCollapsed((v) => !v)}
          onMouseEnter={() => collapsed && setHoveredItem("expand")}
          onMouseLeave={handleMouseLeave}
          className="
            group relative h-12 w-12 rounded-full 
            bg-[#0c2bfc] hover:bg-[#0a24d6]
            transition-all duration-300 grid place-items-center cursor-pointer shadow-lg
            hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0
          "
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="text-lg text-white transform group-hover:scale-110 transition-transform">
            {collapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
          </span>

          {/* Tooltip for expand button - Using state */}
          {collapsed && (
            <div
              className={`
                absolute left-full top-1/2 -translate-y-1/2
                ml-3 z-[99999] pointer-events-none
                transition-opacity duration-200
                ${hoveredItem === "expand" ? "opacity-100" : "opacity-0"}
              `}
            >
              <div
                className="
                  whitespace-nowrap rounded-xl bg-white px-3 py-2
                  text-xs text-gray-800 shadow-lg border border-gray-200
                "
              >
                Expand
              </div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
