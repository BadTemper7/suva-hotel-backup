// routes.jsx
import { lazy, Suspense } from "react";
import ProtectedRoute from "./ProtectedRoute.jsx";
import AdminLayout from "../components/layout/AdminLayout.jsx";
import Loader from "../components/layout/Loader.jsx";
import { ReservationProvider } from "../context/ReservationContext.jsx";

// Lazy pages
const Dashboard = lazy(() => import("../pages/admin/Dashboard.jsx"));
const Rooms = lazy(() => import("../pages/admin/Rooms.jsx"));
const Reservations = lazy(() => import("../pages/admin/Reservations.jsx"));
const ReservationProcess = lazy(
  () => import("../pages/admin/ReservationProcess.jsx"),
);
const RoomReservation = lazy(
  () => import("../pages/admin/RoomReservation.jsx"),
);
const AmenityReservation = lazy(
  () => import("../pages/admin/AmenityReservation.jsx"),
);
const Guests = lazy(() => import("../pages/admin/Guests.jsx"));
const Billing = lazy(() => import("../pages/admin/Billing.jsx"));
const Maintenance = lazy(() => import("../pages/admin/Maintenance.jsx"));
const LostFound = lazy(() => import("../pages/admin/LostFound.jsx"));
const Settings = lazy(() => import("../pages/admin/Settings.jsx"));
const Profile = lazy(() => import("../pages/admin/Profile.jsx"));
const Login = lazy(() => import("../pages/admin/Login.jsx"));
const NotFound = lazy(() => import("../pages/admin/NotFound.jsx"));
const Reports = lazy(() => import("../pages/admin/Reports.jsx"));
const Users = lazy(() => import("../pages/admin/Users.jsx"));
const Notifications = lazy(() => import("../pages/admin/Notifications.jsx"));
const RoomTypes = lazy(() => import("../pages/admin/RoomTypes.jsx"));
const Amenities = lazy(() => import("../pages/admin/Amenities.jsx"));
const AvailableToday = lazy(() => import("../pages/admin/AvailableToday.jsx"));
const DiscountTypes = lazy(() => import("../pages/admin/DiscountTypes.jsx"));
const PaymentOption = lazy(() => import("../pages/admin/PaymentOption.jsx"));
const PaymentTypes = lazy(() => import("../pages/admin/PaymentTypes.jsx"));

const withLoader = (el, label) => (
  <Suspense
    fallback={
      <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
        <Loader size={60} variant="primary" showText={true} text={label} />
      </div>
    }
  >
    {el}
  </Suspense>
);

const withReservationProvider = (el, label) => (
  <ReservationProvider>
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
          <Loader size={60} variant="primary" showText={true} text={label} />
        </div>
      }
    >
      {el}
    </Suspense>
  </ReservationProvider>
);

export default [
  { path: "/admin/login", element: withLoader(<Login />, "Loading login...") },

  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          {
            index: true,
            path: "dashboard",
            element: withLoader(<Dashboard />, "Loading dashboard..."),
          },

          {
            path: "available-today",
            element: withLoader(
              <AvailableToday />,
              "Loading available rooms...",
            ),
          },
          {
            path: "room-types",
            element: withLoader(<RoomTypes />, "Loading room types..."),
          },
          { path: "rooms", element: withLoader(<Rooms />, "Loading rooms...") },
          {
            path: "amenities",
            element: withLoader(<Amenities />, "Loading amenities..."),
          },
          {
            path: "reservations",
            element: withLoader(<Reservations />, "Loading reservations..."),
          },
          {
            path: "reservation-process",
            element: withLoader(
              <ReservationProcess />,
              "Loading reservation process...",
            ),
          },
          {
            path: "reservations/:reservationId/rooms",
            element: withReservationProvider(
              <RoomReservation />,
              "Loading room reservation...",
            ),
          },
          {
            path: "reservations/:reservationId/amenities",
            element: withReservationProvider(
              <AmenityReservation />,
              "Loading amenity reservation...",
            ),
          },
          {
            path: "guests",
            element: withLoader(<Guests />, "Loading guests..."),
          },
          {
            path: "billing",
            element: withLoader(<Billing />, "Loading billing..."),
          },
          { path: "users", element: withLoader(<Users />, "Loading users...") },
          {
            path: "reports",
            element: withLoader(<Reports />, "Loading reports..."),
          },
          {
            path: "maintenance",
            element: withLoader(<Maintenance />, "Loading maintenance..."),
          },
          {
            path: "lost-found",
            element: withLoader(<LostFound />, "Loading lost & found..."),
          },
          {
            path: "profile",
            element: withLoader(<Profile />, "Loading profile..."),
          },
          {
            path: "notifications",
            element: withLoader(<Notifications />, "Loading notifications..."),
          },
          {
            path: "discount-types",
            element: withLoader(<DiscountTypes />, "Loading discount types..."),
          },
          {
            path: "payment-options",
            element: withLoader(
              <PaymentOption />,
              "Loading payment options...",
            ),
          },
          {
            path: "payment-types",
            element: withLoader(<PaymentTypes />, "Loading payment types..."),
          },
          {
            path: "settings",
            element: withLoader(<Settings />, "Loading settings..."),
          },
        ],
      },
    ],
  },

  { path: "*", element: withLoader(<NotFound />, "Loading...") },
];
