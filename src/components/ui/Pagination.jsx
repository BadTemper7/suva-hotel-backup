// src/components/ui/Pagination.jsx
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useMemo } from "react";

export default function Pagination({
  page,
  totalPages,
  setPage,
  total,
  pageSize,
  color = "blue", // "blue", "amber", "emerald", etc.
}) {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages = useMemo(() => {
    const w = 2; // Show 2 pages on each side of current
    const start = Math.max(1, page - w);
    const end = Math.min(totalPages, page + w);
    const arr = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [page, totalPages]);

  const colorClasses = {
    blue: {
      border: "border-gray-200",
      bg: "bg-white",
      text: "text-gray-600",
      textDark: "text-gray-900",
      textLight: "text-gray-300",
      hover: "hover:bg-gray-50 hover:border-gray-300",
      active: "bg-[#0c2bfc] text-white",
      ring: "focus:ring-[#0c2bfc]/20",
    },
    amber: {
      border: "border-amber-200",
      bg: "bg-white",
      text: "text-amber-600",
      textDark: "text-amber-900",
      textLight: "text-amber-300",
      hover: "hover:bg-amber-50 hover:border-amber-300",
      active: "bg-amber-600 text-white",
      ring: "focus:ring-amber-200",
    },
    emerald: {
      border: "border-emerald-200",
      bg: "bg-white",
      text: "text-emerald-600",
      textDark: "text-emerald-900",
      textLight: "text-emerald-300",
      hover: "hover:bg-emerald-50 hover:border-emerald-300",
      active: "bg-emerald-600 text-white",
      ring: "focus:ring-emerald-200",
    },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className="mt-6">
      <div
        className={`rounded-xl border ${colors.border} ${colors.bg} shadow-sm px-6 py-4`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className={`text-sm ${colors.text}`}>
            Showing{" "}
            <span className={`font-semibold ${colors.textDark}`}>{from}</span>–
            <span className={`font-semibold ${colors.textDark}`}>{to}</span> of{" "}
            <span className={`font-semibold ${colors.textDark}`}>{total}</span>
          </div>

          <div className="flex items-center justify-between sm:justify-start gap-2">
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={!canPrev}
              className={`h-10 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                canPrev
                  ? `${colors.border} bg-white ${colors.hover} hover:shadow-md hover:-translate-y-0.5`
                  : `${colors.border} ${colors.textLight} cursor-not-allowed`
              }`}
            >
              First
            </button>

            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev}
              className={`h-10 w-10 rounded-xl border grid place-items-center transition-all duration-200 ${
                canPrev
                  ? `${colors.border} bg-white ${colors.hover} hover:shadow-md hover:-translate-y-0.5`
                  : `${colors.border} ${colors.textLight} cursor-not-allowed`
              }`}
              aria-label="Previous page"
              title="Previous"
            >
              <FiChevronLeft />
            </button>

            <div className="flex items-center gap-1">
              {pages[0] > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setPage(1)}
                    className={`h-10 w-10 rounded-xl border ${colors.border} bg-white ${colors.hover} text-sm font-medium hover:shadow-md transition-all duration-200`}
                  >
                    1
                  </button>
                  {pages[0] > 2 && (
                    <span className={`px-1 ${colors.textLight}`}>…</span>
                  )}
                </>
              )}

              {pages.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`h-10 w-10 rounded-xl text-sm font-medium transition-all duration-200 ${
                    p === page
                      ? `${colors.active} shadow-lg`
                      : `border ${colors.border} bg-white ${colors.hover} hover:shadow-md hover:-translate-y-0.5`
                  }`}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </button>
              ))}

              {pages[pages.length - 1] < totalPages && (
                <>
                  {pages[pages.length - 1] < totalPages - 1 && (
                    <span className={`px-1 ${colors.textLight}`}>…</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPage(totalPages)}
                    className={`h-10 w-10 rounded-xl border ${colors.border} bg-white ${colors.hover} text-sm font-medium hover:shadow-md transition-all duration-200`}
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={!canNext}
              className={`h-10 w-10 rounded-xl border grid place-items-center transition-all duration-200 ${
                canNext
                  ? `${colors.border} bg-white ${colors.hover} hover:shadow-md hover:-translate-y-0.5`
                  : `${colors.border} ${colors.textLight} cursor-not-allowed`
              }`}
              aria-label="Next page"
              title="Next"
            >
              <FiChevronRight />
            </button>

            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={!canNext}
              className={`h-10 px-4 rounded-xl border text-sm font-medium transition-all duration-200 ${
                canNext
                  ? `${colors.border} bg-white ${colors.hover} hover:shadow-md hover:-translate-y-0.5`
                  : `${colors.border} ${colors.textLight} cursor-not-allowed`
              }`}
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
