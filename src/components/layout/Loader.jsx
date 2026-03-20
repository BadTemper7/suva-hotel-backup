// src/components/layout/Loader.jsx
import React from "react";

export default function Loader({
  size = 40,
  className = "",
  variant = "primary",
  showText = false,
  text = "Loading...",
}) {
  const variants = {
    primary: "border-gray-200 border-t-[#0c2bfc]",
    secondary: "border-gray-200 border-t-[#00af00]",
    white: "border-white/30 border-t-white",
  };

  const selectedVariant = variants[variant] || variants.primary;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Loader with primary color accent */}
      <div className="relative">
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-full bg-[#0c2bfc]/10 blur-md animate-pulse"
          style={{
            width: size * 1.2,
            height: size * 1.2,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Main spinner */}
        <div
          className={`
            animate-spin rounded-full border-4
            ${selectedVariant}
            relative z-10
          `}
          style={{
            width: size,
            height: size,
          }}
        />

        {/* Decorative rays with primary color */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-4 bg-gradient-to-t from-[#0c2bfc]/30 to-transparent"
            style={{
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(${-size / 2 - 8}px)`,
              transformOrigin: "center",
              animation: `pulse 2s ease-in-out ${i * 0.1}s infinite`,
            }}
          />
        ))}

        {/* Inner decorative dot */}
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0c2bfc]"
          style={{
            width: size * 0.2,
            height: size * 0.2,
          }}
        />
      </div>

      {showText && (
        <div className="mt-4 text-center">
          <div className="text-sm font-medium text-gray-700 animate-pulse">
            {text}
          </div>
          <div className="flex justify-center gap-1 mt-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#0c2bfc] animate-bounce"
                style={{
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
