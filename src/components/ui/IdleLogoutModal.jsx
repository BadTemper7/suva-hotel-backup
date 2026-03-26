// src/components/IdleLogoutModal.jsx
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiAlertCircle, FiClock, FiLogOut, FiRefreshCw } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { logout, isAuthed } from "../../app/auth";
import { useSettingsStore } from "../../stores/settingsStore";

export default function IdleLogoutModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getSessionTimeout, getSetting } = useSettingsStore();

  // Get settings dynamically
  const IDLE_TIMEOUT = getSessionTimeout(); // This will get from settings
  const WARNING_TIME = getSetting("sessionWarningTime", 60000);

  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60); // 60 seconds for WARNING_TIME
  const timerRef = useRef({
    logoutTimer: null,
    warningTimer: null,
    countdownInterval: null,
  });
  const isTrackingRef = useRef(true); // Track whether we're listening for activity

  // Don't do anything if user is not authenticated or is on login page
  const shouldRun = isAuthed() && !location.pathname.includes("/");

  const startCountdown = () => {
    if (!shouldRun) return;

    setCountdown(Math.floor(WARNING_TIME / 1000));

    // Clear any existing countdown interval
    if (timerRef.current.countdownInterval) {
      clearInterval(timerRef.current.countdownInterval);
    }

    // Start new countdown
    timerRef.current.countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current.countdownInterval);
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetTimers = () => {
    // Don't set timers if shouldn't run
    if (!shouldRun) {
      clearAllTimers();
      return;
    }

    // If modal is showing, DON'T reset - we want the countdown to continue
    if (showWarning) {
      return;
    }

    // Clear existing timers
    clearTimeout(timerRef.current.logoutTimer);
    clearTimeout(timerRef.current.warningTimer);
    clearInterval(timerRef.current.countdownInterval);

    setShowWarning(false);
    setCountdown(Math.floor(WARNING_TIME / 1000));

    // Set warning timer
    timerRef.current.warningTimer = setTimeout(() => {
      if (!shouldRun) return;
      setShowWarning(true);
      startCountdown();
      isTrackingRef.current = false; // Stop tracking activity when modal shows
    }, IDLE_TIMEOUT - WARNING_TIME);

    // Set logout timer
    timerRef.current.logoutTimer = setTimeout(() => {
      if (!shouldRun) return;
      handleLogout();
    }, IDLE_TIMEOUT);
  };

  const clearAllTimers = () => {
    clearTimeout(timerRef.current.logoutTimer);
    clearTimeout(timerRef.current.warningTimer);
    clearInterval(timerRef.current.countdownInterval);
    setShowWarning(false);
    isTrackingRef.current = true; // Reset tracking
  };

  const handleLogout = () => {
    if (!isAuthed()) return;
    logout();
    navigate("/", { replace: true });
  };

  useEffect(() => {
    // Don't set up timers if shouldn't run
    if (!shouldRun) {
      clearAllTimers();
      return;
    }

    const handleUserActivity = () => {
      // Only reset if we're tracking activity (modal is not showing)
      if (isTrackingRef.current) {
        resetTimers();
      }
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "keypress",
    ];

    events.forEach((e) => window.addEventListener(e, handleUserActivity));

    // Start timers
    resetTimers();

    return () => {
      clearAllTimers();
      events.forEach((e) => window.removeEventListener(e, handleUserActivity));
    };
  }, [shouldRun, navigate, location.pathname, IDLE_TIMEOUT]);

  // Effect to handle when modal shows/hides
  useEffect(() => {
    if (showWarning) {
      isTrackingRef.current = false; // Stop tracking when modal shows
    } else {
      isTrackingRef.current = true; // Resume tracking when modal hides
    }
  }, [showWarning]);

  const handleStayLoggedIn = () => {
    // Clear all timers and restart
    clearAllTimers();
    isTrackingRef.current = true;
    resetTimers();
  };

  const handleLogoutNow = () => {
    handleLogout();
  };

  // Don't render the modal if shouldn't run
  if (!shouldRun) return null;

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleStayLoggedIn}
        >
          <motion.div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated Gradient Header */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600" />
              {/* Fixed: Properly escaped SVG pattern */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />

              <div className="relative px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-xl bg-white/20 blur-sm" />
                    <div className="relative p-2.5 rounded-xl bg-white/10 backdrop-blur-sm">
                      <FiClock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">
                      Session About to Expire
                    </h3>
                    <p className="text-sm text-white/80 mt-0.5">
                      Due to inactivity
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="flex-shrink-0">
                    <div className="p-2 rounded-lg bg-amber-100">
                      <FiAlertCircle className="w-4 h-4 text-amber-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      Your session will expire in{" "}
                      <span className="font-bold text-amber-600">
                        {countdown} seconds
                      </span>{" "}
                      due to inactivity.
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Click "Stay Logged In" or anywhere outside this modal to
                      extend your session.
                    </p>
                  </div>
                </div>

                {/* Countdown Progress Bar with Animation */}
                <div className="mt-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-600">
                      Auto-logout in
                    </span>
                    <span className="text-xs font-semibold text-blue-600">
                      {countdown}s
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                      initial={{ width: "100%" }}
                      animate={{
                        width: `${(countdown / (WARNING_TIME / 1000)) * 100}%`,
                      }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>
                </div>

                {/* Session Info */}
                <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Session timeout</span>
                    <span className="font-medium text-gray-700">
                      {IDLE_TIMEOUT / 60000} minutes
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleLogoutNow}
                  className="flex-1 h-11 px-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  <FiLogOut className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
                  Logout Now
                </button>
                <button
                  type="button"
                  onClick={handleStayLoggedIn}
                  className="flex-1 h-11 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 group"
                >
                  <FiRefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                  Stay Logged In
                </button>
              </div>

              {/* Tip */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400">
                  Your session will be extended for another{" "}
                  {IDLE_TIMEOUT / 60000} minutes
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
