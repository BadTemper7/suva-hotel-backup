// src/components/IdleLogoutModal.jsx
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiAlertCircle, FiClock } from "react-icons/fi";
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
  const shouldRun = isAuthed() && !location.pathname.includes("/login");

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
    navigate("/login", { replace: true });
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
  }, [shouldRun, navigate, location.pathname, IDLE_TIMEOUT]); // Add IDLE_TIMEOUT to dependencies

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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleStayLoggedIn} // Clicking outside modal extends session
        >
          <motion.div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()} // Prevent overlay click when clicking modal
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 bg-amber-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                  <FiClock size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Session About to Expire
                  </div>
                  <div className="text-xs text-amber-600 mt-0.5">
                    Due to inactivity
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-5">
              <div className="mb-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 rounded-lg bg-amber-50 text-amber-600">
                    <FiAlertCircle size={16} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">
                      Your session will expire in{" "}
                      <span className="font-bold text-amber-600">
                        {countdown} seconds
                      </span>{" "}
                      due to inactivity.
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Click "Stay Logged In" or anywhere outside this modal to
                      extend your session.
                    </div>
                    <div className="mt-1 text-xs text-blue-600">
                      Session timeout: {IDLE_TIMEOUT / 60000} minutes
                    </div>
                  </div>
                </div>

                {/* Countdown Progress Bar */}
                <div className="mt-4">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-amber-500"
                      initial={{ width: "100%" }}
                      animate={{
                        width: `${(countdown / (WARNING_TIME / 1000)) * 100}%`,
                      }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleLogoutNow}
                  className="h-10 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  Logout Now
                </button>
                <button
                  type="button"
                  onClick={handleStayLoggedIn}
                  className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                >
                  Stay Logged In
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
