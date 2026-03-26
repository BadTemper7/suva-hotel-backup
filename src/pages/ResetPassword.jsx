// src/pages/ResetPassword.jsx (Admin/User side)
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
  FiLock,
} from "react-icons/fi";
import Loader from "../components/layout/Loader.jsx";
import { LogoVariations } from "../components/layout/Logo.jsx";
import { useUserStore } from "../stores/userStore.js";
import { toast } from "react-hot-toast";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const resetPassword = useUserStore((state) => state.resetPassword);

  // Password validation (matches admin requirements)
  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password.length > 16) return "Password cannot exceed 16 characters";
    if (!/[A-Z]/.test(password))
      return "Must contain at least one uppercase letter";
    if (!/[a-z]/.test(password))
      return "Must contain at least one lowercase letter";
    if (!/[0-9]/.test(password)) return "Must contain at least one number";
    if (!/[_!@#$%^&*]/.test(password))
      return "Must contain at least one special character (_!@#$%^&*)";
    if (/\s/.test(password)) return "Password cannot contain spaces";
    return "";
  };

  useEffect(() => {
    if (!token) {
      setError("No reset token provided. Please request a new password reset.");
    }
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    // Validate password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await resetPassword(token, newPassword);

      if (result.success) {
        setSuccess(true);
        toast.success(
          "Password reset successful! Please login with your new password.",
        );
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        setError(result.error || "Failed to reset password. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  // If no token and not loading, show error
  if (!token && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
            <div className="relative px-6 py-5 bg-gray-50 border-b border-gray-200">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600"></div>
              <div className="flex flex-col items-center">
                <div className="mb-4">
                  {/* Fixed: Use Simple instead of SmallLogo */}
                  <LogoVariations.Simple size="medium" />
                </div>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <FiAlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="font-dancing text-2xl font-bold text-red-600">
                  Invalid Reset Link
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  This password reset link is invalid or has expired.
                </p>
              </div>
            </div>
            <div className="px-6 py-6">
              <Link
                to="/forgot-password"
                className="w-full py-3.5 rounded-xl text-white text-sm font-semibold bg-[#0c2bfc] hover:bg-[#0a24d6] transition-all duration-300 flex items-center justify-center"
              >
                Request New Reset Link
              </Link>
              <div className="text-center mt-4">
                <Link
                  to="/"
                  className="text-sm text-gray-500 hover:text-[#0c2bfc] transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-gradient-to-br from-[#0c2bfc]/5 to-[#00af00]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-tl from-[#0c2bfc]/5 to-[#00af00]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="relative px-6 py-5 bg-gray-50 border-b border-gray-200">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0c2bfc] to-[#00af00]"></div>
            <div className="flex flex-col items-center">
              <div className="mb-4">
                {/* Fixed: Use Simple instead of SmallLogo */}
                <LogoVariations.Simple size="medium" />
              </div>
              <h1 className="font-dancing text-3xl font-bold text-[#0c2bfc]">
                Create New Password
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Please enter your new password
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            {error && (
              <div className="text-red-500 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <FiCheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="text-gray-700">
                  <p className="font-medium text-lg">
                    Password Reset Successful!
                  </p>
                  <p className="text-sm mt-2">
                    Your password has been changed successfully.
                  </p>
                  <p className="text-xs text-gray-500 mt-3">
                    Redirecting you to login page...
                  </p>
                </div>
                <Link
                  to="/"
                  className="w-full py-3.5 rounded-xl text-white text-sm font-semibold bg-[#0c2bfc] hover:bg-[#0a24d6] transition-all duration-300 inline-block text-center"
                >
                  Go to Login
                </Link>
              </div>
            ) : (
              <>
                {/* Password Requirements */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800 font-medium mb-2">
                    Password Requirements:
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li
                      className={`flex items-center gap-1 ${newPassword.length >= 8 && newPassword.length <= 16 ? "text-green-600" : ""}`}
                    >
                      • 8-16 characters
                    </li>
                    <li
                      className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? "text-green-600" : ""}`}
                    >
                      • At least 1 uppercase letter
                    </li>
                    <li
                      className={`flex items-center gap-1 ${/[a-z]/.test(newPassword) ? "text-green-600" : ""}`}
                    >
                      • At least 1 lowercase letter
                    </li>
                    <li
                      className={`flex items-center gap-1 ${/[0-9]/.test(newPassword) ? "text-green-600" : ""}`}
                    >
                      • At least 1 number
                    </li>
                    <li
                      className={`flex items-center gap-1 ${/[_!@#$%^&*]/.test(newPassword) ? "text-green-600" : ""}`}
                    >
                      • At least 1 special character (_!@#$%^&*)
                    </li>
                    <li
                      className={`flex items-center gap-1 ${!/\s/.test(newPassword) ? "text-green-600" : ""}`}
                    >
                      • No spaces
                    </li>
                  </ul>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#0c2bfc]/20 focus-within:border-[#0c2bfc] bg-white transition-all duration-300">
                    <FiLock className="text-gray-400 mr-2" size={20} />
                    <input
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      disabled={loading}
                      className="w-full text-sm outline-none bg-transparent"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="ml-2 text-gray-400 hover:text-[#0c2bfc] transition-colors"
                    >
                      {showPassword ? (
                        <FiEyeOff size={20} />
                      ) : (
                        <FiEye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#0c2bfc]/20 focus-within:border-[#0c2bfc] bg-white transition-all duration-300">
                    <FiLock className="text-gray-400 mr-2" size={20} />
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      disabled={loading}
                      className="w-full text-sm outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="ml-2 text-gray-400 hover:text-[#0c2bfc] transition-colors"
                    >
                      {showConfirm ? (
                        <FiEyeOff size={20} />
                      ) : (
                        <FiEye size={20} />
                      )}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">
                      Passwords do not match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl text-white text-sm font-semibold bg-[#0c2bfc] hover:bg-[#0a24d6] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader
                        size={18}
                        className="border-white/30 border-t-white"
                      />
                      Resetting Password...
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </button>

                <div className="text-center">
                  <Link
                    to="/"
                    className="text-sm text-gray-500 hover:text-[#0c2bfc] transition-colors inline-flex items-center gap-1"
                  >
                    ← Back to Login
                  </Link>
                </div>
              </>
            )}
          </form>

          {/* Footer */}
          <div className="px-6 py-4 text-center text-xs text-gray-600 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-center gap-1">
              <svg
                className="w-4 h-4 text-[#00af00]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z"
                  clipRule="evenodd"
                />
              </svg>
              <span>© {new Date().getFullYear()} Suva's Place Resort</span>
              <span className="text-[#0c2bfc]">•</span>
              <span>Est. 1971</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
