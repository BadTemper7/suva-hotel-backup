// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMail, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import Loader from "../components/layout/Loader.jsx";
import { LogoVariations } from "../components/layout/Logo.jsx";
import { useUserStore } from "../stores/userStore.js";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");

  const requestPasswordReset = useUserStore(
    (state) => state.requestPasswordReset,
  );

  async function handleSubmit(e) {
    e.preventDefault();

    if (!resetEmail.trim()) {
      setResetError("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      setResetError("Please enter a valid email address");
      return;
    }

    setResetLoading(true);
    setResetError("");

    try {
      const result = await requestPasswordReset(resetEmail.trim());

      if (result.success) {
        setResetSent(true);
      } else {
        setResetError(
          result.error || "Failed to send reset email. Please try again.",
        );
      }
    } catch (err) {
      setResetError("An error occurred. Please try again later.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-gradient-to-br from-[#0c2bfc]/5 to-[#00af00]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-tl from-[#0c2bfc]/5 to-[#00af00]/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-gradient-to-r from-[#00af00]/10 to-transparent rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="relative px-6 py-5 bg-gray-50 border-b border-gray-200">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0c2bfc] to-[#00af00]"></div>
            <Link
              to="/"
              className="absolute top-5 left-6 text-gray-500 hover:text-[#0c2bfc] transition-colors"
            >
              <FiArrowLeft size={20} />
            </Link>
            <div className="flex flex-col items-center">
              <div className="mb-4">
                {/* Use Simple or Icon instead of SmallLogo */}
                <LogoVariations.Simple size="medium" />
              </div>
              <h1 className="font-dancing text-3xl font-bold text-[#0c2bfc]">
                Reset Password
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                We'll send you a link to reset your password
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            {resetError && (
              <div className="text-red-500 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
                {resetError}
              </div>
            )}

            {resetSent ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <FiCheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="text-gray-700">
                  <p className="font-medium text-lg">Check your email</p>
                  <p className="text-sm mt-2">
                    We've sent a password reset link to <br />
                    <span className="font-semibold text-[#0c2bfc]">
                      {resetEmail}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-3">
                    The link will expire in 1 hour.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    If you don't see the email, check your spam folder.
                  </p>
                </div>
                <div className="space-y-3 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="w-full py-2.5 rounded-xl text-[#0c2bfc] border border-[#0c2bfc] hover:bg-[#0c2bfc]/5 transition-all duration-200"
                  >
                    Back to Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetSent(false);
                      setResetEmail("");
                    }}
                    className="w-full py-2.5 rounded-xl text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Try another email
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#0c2bfc]/20 focus-within:border-[#0c2bfc] bg-white transition-all duration-300">
                    <FiMail className="text-gray-400 mr-2" size={20} />
                    <input
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      type="email"
                      placeholder="admin@suva.com"
                      disabled={resetLoading}
                      className="w-full text-sm outline-none bg-transparent"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the email address you used to register
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3.5 rounded-xl text-white text-sm font-semibold bg-[#0c2bfc] hover:bg-[#0a24d6] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {resetLoading ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Loader
                        size={18}
                        className="border-white/30 border-t-white"
                      />
                      Sending...
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>

                <div className="text-center">
                  <Link
                    to="/"
                    className="text-sm text-gray-500 hover:text-[#0c2bfc] transition-colors inline-flex items-center gap-1"
                  >
                    <FiArrowLeft size={14} />
                    Back to Login
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
