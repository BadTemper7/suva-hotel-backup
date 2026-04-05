import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUserStore } from "../stores/userStore.js";
import { getStoredUser } from "./auth.js";
import {
  canAccessPath,
  getDefaultLandingPath,
} from "../utils/staffPermissions.js";

export default function StaffRouteGuard() {
  const location = useLocation();
  const storeUser = useUserStore((s) => s.currentUser);
  const user = getStoredUser() ?? storeUser;

  if (!user) {
    return <Outlet />;
  }

  if (!canAccessPath(user, location.pathname)) {
    return <Navigate to={getDefaultLandingPath(user)} replace />;
  }

  return <Outlet />;
}
