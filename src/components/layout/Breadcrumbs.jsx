// components/layout/Breadcrumbs.jsx
import { Link, useLocation } from "react-router-dom";

const labelMap = {
  admin: "Admin",
  dashboard: "Dashboard",
  rooms: "Rooms",
  "room-types": "Room Types",
  amenities: "Amenities",
  "add-ons": "Add-Ons",
  reservations: "Reservations",
  guests: "Guests",
  billing: "Billing",
  inbox: "Inbox",
  maintenance: "Maintenance",
  "lost-found": "Lost & Found",
  employees: "Employees",
  reports: "Reports",
  settings: "Settings",
  profile: "Profile",
  users: "Users",
  notifications: "Notifications",
  "available-today": "Available Today",
  "reservation-process": "Reservation Process",
  "discount-types": "Discount Types",
  "payment-types": "Payment Types",
  "payment-options": "Payment Options",
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  // Remove "admin" segment if present
  const actualSegments = segments[0] === "admin" ? segments.slice(1) : segments;

  // Check for parent-child relationships
  const isUnderRooms = ["room-types", "amenities", "add-ons"].includes(
    actualSegments[0],
  );
  const isUnderReservations = [
    "available-today",
    "reservation-process",
  ].includes(actualSegments[0]);
  const isUnderBilling = [
    "payment-options",
    "payment-types",
    "discount-types",
  ].includes(actualSegments[0]);

  // Check for reservation detail pages
  const isRoomReservation =
    actualSegments.length >= 3 &&
    actualSegments[0] === "reservations" &&
    actualSegments[1] !== undefined &&
    actualSegments[2] === "rooms";
  const isAmenityReservation =
    actualSegments.length >= 3 &&
    actualSegments[0] === "reservations" &&
    actualSegments[1] !== undefined &&
    actualSegments[2] === "amenities";
  const isAddOnReservation =
    actualSegments.length >= 3 &&
    actualSegments[0] === "reservations" &&
    actualSegments[1] !== undefined &&
    actualSegments[2] === "add-ons";

  let crumbs = [];

  // Always start with Dashboard
  if (actualSegments.length > 0 && actualSegments[0] !== "dashboard") {
    crumbs.push({ to: "/dashboard", label: "Dashboard" });
  }

  // Handle reservation detail pages first
  if (isRoomReservation) {
    const reservationId = actualSegments[1];
    crumbs.push(
      { to: "/reservations", label: "Reservations" },
      {
        to: `/reservations/${reservationId}`,
        label: `Reservation #${reservationId.slice(-6)}`,
      },
      {
        to: `/reservations/${reservationId}/rooms`,
        label: "Add Rooms",
      },
    );
  } else if (isAmenityReservation) {
    const reservationId = actualSegments[1];
    crumbs.push(
      { to: "/reservations", label: "Reservations" },
      {
        to: `/reservations/${reservationId}`,
        label: `Reservation #${reservationId.slice(-6)}`,
      },
      {
        to: `/reservations/${reservationId}/amenities`,
        label: "Manage Amenities",
      },
    );
  } else if (isAddOnReservation) {
    const reservationId = actualSegments[1];
    crumbs.push(
      { to: "/reservations", label: "Reservations" },
      {
        to: `/reservations/${reservationId}`,
        label: `Reservation #${reservationId.slice(-6)}`,
      },
      {
        to: `/reservations/${reservationId}/add-ons`,
        label: "Manage Add-Ons",
      },
    );
  }
  // Handle pages under Rooms
  else if (isUnderRooms) {
    const parent = "rooms";
    const child = actualSegments[0];

    crumbs.push(
      { to: `/${parent}`, label: labelMap[parent] || "Rooms" },
      {
        to: `/${child}`,
        label:
          labelMap[child] ||
          child.charAt(0).toUpperCase() + child.slice(1).replace(/-/g, " "),
      },
    );
  }
  // Handle pages under Reservations
  else if (isUnderReservations) {
    const parent = "reservations";
    const child = actualSegments[0];

    crumbs.push(
      { to: `/${parent}`, label: labelMap[parent] || "Reservations" },
      {
        to: `/${child}`,
        label:
          labelMap[child] ||
          child.charAt(0).toUpperCase() + child.slice(1).replace(/-/g, " "),
      },
    );
  }
  // Handle pages under Billing
  else if (isUnderBilling) {
    const parent = "billing";
    const child = actualSegments[0];

    crumbs.push(
      { to: `/${parent}`, label: labelMap[parent] || "Billing" },
      {
        to: `/${child}`,
        label:
          labelMap[child] ||
          child.charAt(0).toUpperCase() + child.slice(1).replace(/-/g, " "),
      },
    );
  }
  // Handle top-level pages
  else if (actualSegments.length > 0) {
    actualSegments.forEach((seg, i) => {
      const to = "/" + actualSegments.slice(0, i + 1).join("/");

      // Skip if it's dashboard (already handled)
      if (seg === "dashboard") return;

      crumbs.push({
        to,
        label:
          labelMap[seg] ||
          seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
      });
    });
  }

  // If we're on dashboard and no crumbs were added, add Dashboard
  if (crumbs.length === 0 || actualSegments.length === 0) {
    crumbs = [{ to: "/dashboard", label: "Dashboard" }];
  }

  return (
    <div className="min-w-0">
      {/* Admin label with decorative element */}
      <div className="flex items-center gap-2 mb-1">
        <div className="relative">
          <div className="absolute w-3 h-3 bg-[#0c2bfc]/20 rounded-full blur-sm opacity-70"></div>
          <svg
            className="relative w-3 h-3 text-[#0c2bfc]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <span className="text-xs font-medium text-[#0c2bfc] tracking-wide uppercase">
          Resort Management
        </span>
      </div>

      {/* Breadcrumb trail */}
      <div className="flex items-center gap-2 text-sm min-w-0 flex-wrap">
        {crumbs.map((c, idx) => {
          const isLast = idx === crumbs.length - 1;

          return (
            <span key={c.to} className="flex items-center gap-2 min-w-0 group">
              {idx > 0 && (
                <span className="text-gray-300">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              )}

              {isLast ? (
                <span
                  className="
                  px-3 py-1.5 rounded-lg 
                  bg-[#0c2bfc]/10
                  border border-[#0c2bfc]/20
                  text-[#0c2bfc] font-semibold
                  truncate shadow-sm
                "
                >
                  {c.label}
                </span>
              ) : (
                <Link
                  to={c.to}
                  className="
                    px-3 py-1.5 rounded-lg
                    bg-white
                    border border-gray-200
                    text-gray-600 hover:text-[#0c2bfc]
                    hover:bg-gray-50
                    hover:border-[#0c2bfc]/20
                    hover:shadow-md
                    transition-all duration-300
                    truncate group-hover:-translate-y-0.5
                    flex items-center gap-1
                  "
                >
                  {c.label}
                  <svg
                    className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
              )}
            </span>
          );
        })}
      </div>

      {/* Decorative line */}
      <div className="mt-3">
        <div className="h-0.5 w-12 bg-gradient-to-r from-[#0c2bfc] to-transparent rounded-full"></div>
      </div>
    </div>
  );
}
