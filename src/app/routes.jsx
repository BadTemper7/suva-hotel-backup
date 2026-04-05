// routes.jsx
import { lazy, Suspense } from "react";
import ProtectedRoute from "./ProtectedRoute.jsx";
import AdminLayout from "../components/layout/AdminLayout.jsx";
import Loader from "../components/layout/Loader.jsx";
import { ReservationProvider } from "../context/ReservationContext.jsx";

// Lazy pages
const Dashboard = lazy(() => import("../pages/Dashboard.jsx"));
const Rooms = lazy(() => import("../pages/Rooms.jsx"));
const Reservations = lazy(() => import("../pages/Reservations.jsx"));
const FrontDesk = lazy(() => import("../pages/FrontDesk.jsx"));
const ReservationProcess = lazy(
  () => import("../pages/ReservationProcess.jsx"),
);
const RoomReservation = lazy(() => import("../pages/RoomReservation.jsx"));
const AmenityReservation = lazy(
  () => import("../pages/AmenityReservation.jsx"),
);
const Guests = lazy(() => import("../pages/Guests.jsx"));
const Billing = lazy(() => import("../pages/Billing.jsx"));
const Maintenance = lazy(() => import("../pages/Maintenance.jsx"));
const LostFound = lazy(() => import("../pages/LostFound.jsx"));
const Settings = lazy(() => import("../pages/Settings.jsx"));
const Profile = lazy(() => import("../pages/Profile.jsx"));
const Login = lazy(() => import("../pages/Login.jsx"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("../pages/ResetPassword.jsx"));
const NotFound = lazy(() => import("../pages/NotFound.jsx"));
const Reports = lazy(() => import("../pages/Reports.jsx"));
const Users = lazy(() => import("../pages/Users.jsx"));
const Inbox = lazy(() => import("../pages/Inbox.jsx"));
const Notifications = lazy(() => import("../pages/Notifications.jsx"));
const RoomTypes = lazy(() => import("../pages/RoomTypes.jsx"));
const Amenities = lazy(() => import("../pages/Amenities.jsx"));
const AddOns = lazy(() => import("../pages/AddOns.jsx"));
const AvailableToday = lazy(() => import("../pages/AvailableToday.jsx"));
const DiscountTypes = lazy(() => import("../pages/DiscountTypes.jsx"));
const PaymentOption = lazy(() => import("../pages/PaymentOption.jsx"));
const PaymentTypes = lazy(() => import("../pages/PaymentTypes.jsx"));

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
  { path: "/", element: withLoader(<Login />, "Loading login...") },
  {
    path: "/forgot-password",
    element: withLoader(<ForgotPassword />, "Loading forgot password..."),
  },
  {
    path: "/reset-password",
    element: withLoader(<ResetPassword />, "Loading reset password..."),
  },

  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
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
            path: "add-ons",
            element: withLoader(<AddOns />, "Loading add-ons..."),
          },
          {
            path: "reservations",
            element: withLoader(<Reservations />, "Loading reservations..."),
          },
          {
            path: "front-desk",
            element: withLoader(<FrontDesk />, "Loading front desk..."),
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
          { path: "inbox", element: withLoader(<Inbox />, "Loading inbox...") },
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
