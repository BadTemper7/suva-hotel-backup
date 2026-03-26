// src/pages/Login.jsx
import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { setAuthed, setToken, isAuthed, setUser } from "../app/auth.js";
import Loader from "../components/layout/Loader.jsx";
import { FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import { LogoVariations } from "../components/layout/Logo.jsx";

const API_URL =
  import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = useMemo(
    () => location.state?.from || "/dashboard",
    [location.state],
  );

  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthed()) return <Navigate to={from} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const acc = account.trim();
      const pw = password;

      if (!acc || !pw) {
        setError("Please enter your username/email and password.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: acc, password: pw }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          setError(
            data.message || "Account is locked. Please try again later.",
          );
        } else if (res.status === 401) {
          setError(data.message || "Invalid credentials");
        } else {
          setError(data.message || "Failed to login");
        }
        setLoading(false);
        return;
      }

      if (!data.token) throw new Error("No token received from server");

      setToken(data.token);
      setAuthed(true);
      setUser(data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-gradient-to-br from-[#0c2bfc]/5 to-[#00af00]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-tl from-[#0c2bfc]/5 to-[#00af00]/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-gradient-to-r from-[#00af00]/10 to-transparent rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="relative px-6 py-5 bg-gray-50 border-b border-gray-200">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0c2bfc] to-[#00af00]"></div>
            <div className="flex flex-col items-center mb-4">
              <div className="mb-4">
                <LogoVariations.FullBrand />
              </div>
              <h1 className="font-dancing text-3xl font-bold text-[#0c2bfc]">
                Welcome Back
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Sign in to manage Suva&apos;s Place Resort
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="px-6 py-6 space-y-5">
            {error && (
              <div className="text-red-500 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Decorative element */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute w-16 h-16 bg-gradient-to-br from-[#0c2bfc]/20 to-[#00af00]/20 rounded-full blur-md opacity-60"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-[#0c2bfc] to-[#00af00] rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username or Email
              </label>
              <input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                type="text"
                autoComplete="username"
                placeholder="admin or admin@suva.com"
                disabled={loading}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20 bg-white transition-all duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="flex items-center border border-gray-300 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-[#0c2bfc]/20 focus-within:border-[#0c2bfc] bg-white transition-all duration-300">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full text-sm outline-none bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  disabled={loading}
                  className="ml-2 text-[#0c2bfc] hover:text-[#00af00] focus:outline-none transition-colors"
                >
                  {showPw ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-[#0c2bfc] hover:text-[#00af00] transition-colors flex items-center gap-1"
              >
                <FiLock size={14} />
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white text-sm font-semibold bg-[#0c2bfc] hover:bg-[#0a24d6] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader
                    size={18}
                    className="border-white/30 border-t-white"
                  />
                  Signing in...
                </span>
              ) : (
                "Sign in to Dashboard"
              )}
            </button>

            {/* Decorative separator */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  Resort Management Access
                </span>
              </div>
            </div>
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

        {/* Decorative element */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-600">
            <svg
              className="w-5 h-5 text-[#00af00] animate-pulse"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414l4.293 4.293A1 1 0 0016 14h-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Antipolo's Premier Resort Destination</span>
          </div>
        </div>
      </div>
    </div>
  );
}
