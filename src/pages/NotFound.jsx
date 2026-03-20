import { Link } from "react-router-dom";
import { LogoVariations } from "../components/layout/Logo";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      {/* Background decorative elements - using primary and secondary colors subtly */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-gradient-to-br from-[#0c2bfc]/5 to-[#00af00]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-tl from-[#0c2bfc]/5 to-[#00af00]/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-gradient-to-r from-[#00af00]/5 to-transparent rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <LogoVariations.FullBrand />
        </div>

        {/* Main content */}
        <div className="space-y-6">
          {/* 404 Number with decorative elements */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-[180px] font-bold text-gray-100 leading-none">
                404
              </div>
            </div>
            <h1 className="relative text-8xl font-bold text-[#0c2bfc] leading-none">
              404
            </h1>
          </div>

          {/* Message */}
          <div className="space-y-3">
            <h2 className="font-dancing text-3xl font-bold text-[#00af00]">
              Oh no! You're lost.
            </h2>
            <p className="text-lg text-gray-600">
              The page you're looking for seems to have taken a vacation.
            </p>
            <p className="text-sm text-gray-500">
              Don't worry, our resort is still here and waiting for you!
            </p>
          </div>

          {/* Decorative element - using primary and secondary colors */}
          <div className="py-4">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute w-24 h-24 bg-gradient-to-br from-[#0c2bfc]/20 to-[#00af00]/20 rounded-full blur-md opacity-60 animate-pulse"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-[#0c2bfc] to-[#00af00] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-semibold">?</span>
              </div>

              {/* Decorative rings */}
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full border-2"
                  style={{
                    width: `${80 + i * 30}px`,
                    height: `${80 + i * 30}px`,
                    borderColor:
                      i === 0 ? "#0c2bfc" : i === 1 ? "#00af00" : "#0c2bfc",
                    opacity: 0.2 - i * 0.05,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Action buttons */}
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link
              to="/"
              className="px-8 py-3 bg-[#0c2bfc] text-white rounded-full font-semibold hover:bg-[#0a24d6] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group"
            >
              <svg
                className="w-5 h-5 group-hover:animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Go Home
            </Link>

            <button
              onClick={() => window.history.back()}
              className="px-8 py-3 bg-white text-[#0c2bfc] border-2 border-[#0c2bfc] rounded-full font-semibold hover:bg-[#0c2bfc]/5 hover:border-[#0a24d6] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Go Back
            </button>
          </div>

          {/* Help text */}
          <div className="pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Still having trouble?{" "}
              <a
                href="mailto:contact@suvasplace.com"
                className="text-[#00af00] font-semibold hover:text-[#009500] underline"
              >
                Contact our team
              </a>{" "}
              for assistance.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <span className="font-serif">Suva's Place Resort Antipolo</span>
          <span className="text-[#00af00]">•</span>
          <span>Est. 1971</span>
        </div>
      </div>
    </div>
  );
}
