// src/components/layout/GuestLayout.jsx
import { Outlet } from "react-router-dom";
import GuestHeader from "./GuestHeader.jsx";
import GuestFooter from "./GuestFooter.jsx";

export default function GuestLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-amber-200/20 to-rose-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-tl from-amber-200/20 to-rose-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-gradient-to-r from-amber-300/10 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-gradient-to-l from-rose-200/10 to-transparent rounded-full blur-2xl"></div>

        {/* Decorative tropical leaves pattern */}
        <div className="absolute bottom-0 left-0 w-64 h-64 opacity-5">
          <svg
            viewBox="0 0 200 200"
            fill="currentColor"
            className="text-green-800"
          >
            <path d="M100,20 L120,60 L100,100 L80,60 L100,20 Z M60,80 L100,60 L140,80 L100,120 L60,80 Z M40,140 L100,100 L160,140 L100,180 L40,140 Z" />
          </svg>
        </div>
      </div>

      <div className="relative z-10">
        <GuestHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <GuestFooter />
      </div>
    </div>
  );
}
