import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthed } from "./auth.js";

export default function ProtectedRoute() {
  const location = useLocation();

  if (!isAuthed()) {
    return (
      <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
    );
  }

  return <Outlet />;
}
