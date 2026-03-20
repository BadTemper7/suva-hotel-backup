import { useState } from "react";
import smallLogo from "../../assets/small-logo.png";

export default function Logo({
  collapsed = false,
  showFullBrand = true,
  compactMode = false,
  className = "",
}) {
  const [isHovered, setIsHovered] = useState(false);

  if (compactMode) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="relative">
          <img
            src={smallLogo}
            alt="Suva's Place Resort"
            className={[
              "w-auto object-contain select-none transition-transform duration-300",
              collapsed ? "h-10 w-10" : "h-12 w-12",
              isHovered && !collapsed ? "scale-105" : "",
            ].join(" ")}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          />

          {/* Sun burst effect on hover */}
          {isHovered && !collapsed && (
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-200/20 to-rose-200/20 rounded-full blur-sm"></div>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <h1 className="font-dancing text-xl font-bold text-amber-900 truncate">
              Suva's Place
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-serif text-[10px] text-amber-700 truncate">
                Resort Antipolo
              </span>
              <span className="text-[8px] text-amber-500">•</span>
              <span className="font-serif text-[9px] text-amber-800">
                Est. 1971
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div className="relative">
          <img
            src={smallLogo}
            alt="Suva's Place Resort"
            className="h-10 w-10 object-contain select-none transition-transform duration-300 hover:scale-105"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          />

          {/* Tooltip for collapsed state */}
          {isHovered && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50">
              <div className="bg-white rounded-lg shadow-lg p-3 min-w-[160px] border border-amber-100">
                <h3 className="font-dancing text-lg font-bold text-amber-900">
                  Suva's Place
                </h3>
                <p className="font-serif text-xs text-amber-700 mt-1">
                  Resort Antipolo
                </p>
                <div className="mt-2 pt-2 border-t border-amber-100">
                  <p className="font-dancing text-xs text-rose-600">
                    Have Fun Under The Sun
                  </p>
                  <p className="font-serif text-[10px] text-amber-800 mt-1">
                    Est. 1971
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Logo and Name */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <img
            src={smallLogo}
            alt="Suva's Place Resort"
            className="h-12 w-12 object-contain select-none transition-transform duration-300 hover:scale-105"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          />

          {/* Sun rays effect */}
          {isHovered && (
            <div className="absolute inset-0 -z-10 animate-pulse">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-200/30 to-rose-200/30 rounded-full blur-md"></div>
            </div>
          )}
        </div>

        {showFullBrand && (
          <div className="text-center">
            <h1 className="font-dancing text-2xl font-bold text-amber-900 leading-none">
              Suva's Place
            </h1>
            <p className="font-serif text-xs text-amber-700 mt-1">
              Resort Antipolo
            </p>
          </div>
        )}
      </div>

      {/* Tagline - Only show when expanded and showFullBrand is true */}
      {showFullBrand && (
        <div className="mt-4 text-center">
          <p className="font-dancing text-sm font-medium text-rose-600">
            Have Fun Under The Sun
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-px w-6 bg-gradient-to-r from-transparent to-amber-300"></div>
            <span className="font-serif text-[10px] tracking-widest text-amber-800 uppercase">
              Est. 1971
            </span>
            <div className="h-px w-6 bg-gradient-to-l from-transparent to-amber-300"></div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Alternative logo variations for different use cases
 */
export const LogoVariations = {
  /**
   * Simple logo with name only
   */
  Simple: ({ size = "medium" }) => {
    const sizes = {
      small: "h-8 w-8",
      medium: "h-10 w-10",
      large: "h-12 w-12",
    };

    return (
      <div className="flex items-center gap-2">
        <img
          src={smallLogo}
          alt="Suva's Place"
          className={`${sizes[size]} object-contain`}
        />
        <h1 className="font-dancing text-lg font-bold text-amber-900">
          Suva's Place
        </h1>
      </div>
    );
  },

  /**
   * Full branding logo for headers/marketing
   */
  FullBrand: () => (
    <div className="text-center space-y-3">
      <div className="flex justify-center">
        <img
          src={smallLogo}
          alt="Suva's Place"
          className="h-16 w-16 object-contain"
        />
      </div>
      <div>
        <h1 className="font-dancing text-4xl font-bold text-amber-900">
          Suva's Place
        </h1>
        <p className="font-serif text-sm text-amber-700 mt-1">
          Resort Antipolo
        </p>
      </div>
      <div className="pt-2">
        <p className="font-dancing text-lg font-medium text-rose-600">
          Have Fun Under The Sun
        </p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-300"></div>
          <span className="font-serif text-xs tracking-widest text-amber-800 uppercase">
            Est. 1971
          </span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-300"></div>
        </div>
      </div>
    </div>
  ),

  /**
   * Icon-only logo
   */
  Icon: ({ size = "medium", withTooltip = true }) => {
    const sizes = {
      small: "h-6 w-6",
      medium: "h-8 w-8",
      large: "h-10 w-10",
      xlarge: "h-12 w-12",
    };

    const [isHovered, setIsHovered] = useState(false);

    return (
      <div className="relative">
        <img
          src={smallLogo}
          alt="Suva's Place"
          className={`${sizes[size]} object-contain transition-transform duration-200 hover:scale-110`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />

        {withTooltip && isHovered && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50">
            <div className="bg-white rounded-lg shadow-lg p-2 border border-amber-100 whitespace-nowrap">
              <span className="font-dancing text-sm text-amber-900">
                Suva's Place Resort
              </span>
            </div>
          </div>
        )}
      </div>
    );
  },

  /**
   * Logo with decorative border
   */
  Decorative: ({ collapsed = false }) => (
    <div className={`relative ${collapsed ? "p-2" : "p-4"}`}>
      {/* Decorative border */}
      <div className="absolute inset-0 border-2 border-amber-200 rounded-2xl"></div>
      <div className="absolute inset-2 border border-amber-100 rounded-xl"></div>

      <div className="relative z-10 flex flex-col items-center">
        <img
          src={smallLogo}
          alt="Suva's Place"
          className={collapsed ? "h-8 w-8" : "h-12 w-12"}
        />

        {!collapsed && (
          <div className="mt-3 text-center">
            <h2 className="font-dancing text-lg font-bold text-amber-900">
              Suva's Place
            </h2>
            <div className="mt-1">
              <span className="font-serif text-[10px] text-amber-700">
                Resort Antipolo
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  ),
};
