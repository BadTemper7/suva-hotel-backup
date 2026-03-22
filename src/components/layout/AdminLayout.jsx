import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  // remembers what user last chose on desktop
  const desktopPref = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)"); // Tailwind md

    const apply = () => {
      if (mq.matches) {
        // desktop: restore last desktop preference
        setCollapsed(desktopPref.current);
      } else {
        // mobile: auto-collapse
        setCollapsed(true);
      }
    };

    apply();

    // modern + fallback
    if (mq.addEventListener) mq.addEventListener("change", apply);
    else mq.addListener(apply);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", apply);
      else mq.removeListener(apply);
    };
  }, []);

  // Only update desktop preference when we are actually on desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    if (mq.matches) desktopPref.current = collapsed;
  }, [collapsed]);

  return (
    <>
      <div className="h-dvh bg-white text-gray-900">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-amber-100/20 to-rose-100/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-tl from-amber-100/20 to-rose-100/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-gradient-to-r from-amber-200/10 to-transparent rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-10 flex h-full">
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

          <div className="flex-1 min-w-0 flex flex-col h-full backdrop-blur-sm bg-white/30">
            <Header />
            <main className="flex-1 overflow-auto p-3 sm:p-6">
              <Outlet />
            </main>

            {/* Footer with resort branding */}
            <div className="px-6 py-3 text-center text-xs text-gray-500 border-t border-gray-200 bg-white/50">
              <div className="flex items-center justify-center gap-2">
                <span className="font-serif">Suva's Place Resort Antipolo</span>
                <span className="text-[#00af00]">•</span>
                <span>Est. 1971</span>
                <span className="text-[#00af00]">•</span>
                <span>Premium Resort Management System</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
