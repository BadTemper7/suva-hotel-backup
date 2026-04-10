export const DEFAULT_RECEPTIONIST_PERMISSIONS = {
  frontDesk: "manage",
  reservations: "manage",
  rooms: "none",
  guests: "none",
  billing: "none",
};

export function isAdminRole(role) {
  return role === "admin" || role === "superadmin";
}

export function getReceptionistPermissions(user) {
  if (!user || user.role !== "receptionist") return null;
  return (
    user.receptionistPermissions || { ...DEFAULT_RECEPTIONIST_PERMISSIONS }
  );
}

export function canManageFeature(user, feature) {
  if (isAdminRole(user?.role)) return true;
  if (user?.role !== "receptionist") return false;
  const p = getReceptionistPermissions(user);
  return p[feature] === "manage";
}

export function canViewFeature(user, feature) {
  if (isAdminRole(user?.role)) return true;
  if (user?.role !== "receptionist") return false;
  const p = getReceptionistPermissions(user);
  const v = p[feature];
  return v === "view" || v === "manage";
}

export function canViewReservationsOrFrontDesk(user) {
  if (isAdminRole(user?.role)) return true;
  return (
    canViewFeature(user, "reservations") || canViewFeature(user, "frontDesk")
  );
}

export function canManageReservationsOrFrontDesk(user) {
  if (isAdminRole(user?.role)) return true;
  return (
    canManageFeature(user, "reservations") ||
    canManageFeature(user, "frontDesk")
  );
}

export function canViewRoomsOrFrontDesk(user) {
  if (isAdminRole(user?.role)) return true;
  return canViewFeature(user, "rooms") || canViewFeature(user, "frontDesk");
}

export function canManageRooms(user) {
  if (isAdminRole(user?.role)) return true;
  return canManageFeature(user, "rooms");
}

function normalizePath(pathname) {
  const p = String(pathname || "").split("?")[0].replace(/\/$/, "") || "/";
  return p;
}

export function canAccessPath(user, pathname) {
  if (!user) return false;
  if (isAdminRole(user.role)) return true;
  if (user.role !== "receptionist") return false;

  const p = normalizePath(pathname);

  const denyExact = ["/dashboard", "/users", "/reports", "/settings"];
  if (denyExact.some((d) => p === d || p.startsWith(`${d}/`))) {
    return false;
  }

  if (p === "/inbox" || p.startsWith("/inbox/")) return true;
  if (p === "/notifications" || p.startsWith("/notifications/")) return true;
  if (p === "/profile" || p.startsWith("/profile/")) return true;

  if (p === "/front-desk" || p.startsWith("/front-desk/")) {
    return canViewFeature(user, "frontDesk");
  }
  // Reservation creation lives outside `/reservations/*`.
  // Keep it restricted to receptionist(s) who can manage reservations/front desk.
  if (p === "/reservation-process" || p.startsWith("/reservation-process/")) {
    return canManageReservationsOrFrontDesk(user);
  }
  if (p.startsWith("/reservations")) {
    return canViewReservationsOrFrontDesk(user);
  }
  const roomPaths = [
    "/rooms",
    "/room-types",
    "/amenities",
    "/add-ons",
    "/available-today",
  ];
  if (roomPaths.some((rp) => p === rp || p.startsWith(`${rp}/`))) {
    return canViewRoomsOrFrontDesk(user);
  }
  if (p.startsWith("/guests")) {
    return canViewFeature(user, "guests");
  }
  if (p.startsWith("/billing")) {
    return canViewFeature(user, "billing");
  }
  if (
    p === "/payment-options" ||
    p.startsWith("/payment-options/") ||
    p === "/payment-types" ||
    p.startsWith("/payment-types/")
  ) {
    return isAdminRole(user.role);
  }
  if (p === "/discount-types" || p.startsWith("/discount-types/")) {
    return canViewReservationsOrFrontDesk(user);
  }

  if (p.startsWith("/maintenance") || p.startsWith("/lost-found")) {
    return isAdminRole(user.role);
  }

  return false;
}

export function getDefaultLandingPath(user) {
  if (!user) return "/login";
  if (isAdminRole(user.role)) return "/dashboard";

  const candidates = [
    () => canViewFeature(user, "frontDesk") && "/front-desk",
    () => canViewReservationsOrFrontDesk(user) && "/reservations",
    () => canViewRoomsOrFrontDesk(user) && "/rooms",
    () => canViewFeature(user, "guests") && "/guests",
    () => canViewFeature(user, "billing") && "/billing",
    () => "/inbox",
  ];
  for (const c of candidates) {
    const path = c();
    if (path) return path;
  }
  return "/inbox";
}
