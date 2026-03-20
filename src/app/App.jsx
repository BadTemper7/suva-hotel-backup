// src/App.jsx
import { useRoutes, useLocation } from "react-router-dom";
import routes from "./routes.jsx";
import IdleLogoutModal from "../components/ui/IdleLogoutModal";
import { isAuthed } from "./auth";

export default function App() {
  const location = useLocation();
  const element = useRoutes(routes);

  // Only show idle logout modal if user is authenticated AND not on login page
  const showIdleModal = isAuthed() && !location.pathname.includes("/login");

  return (
    <>
      {element}
      {showIdleModal && <IdleLogoutModal />}
    </>
  );
}
