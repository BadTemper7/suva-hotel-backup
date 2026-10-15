import { useEffect, useState } from "react";
import { formatElapsed, formatRemaining } from "../utils/stay.js";

export default function StayTimer({
  checkInAt,
  checkOutAt,
  active = true,
  compact = false,
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active || !checkInAt) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active, checkInAt]);

  if (!checkInAt || !active) return null;

  const start = new Date(checkInAt).getTime();
  if (Number.isNaN(start)) return null;
  const elapsed = now - start;
  const end = checkOutAt ? new Date(checkOutAt).getTime() : NaN;
  const remaining = Number.isNaN(end) ? null : end - now;

  if (compact) {
    return (
      <div className="font-mono text-xs text-gray-800">
        <div>
          Elapsed <span className="font-semibold">{formatElapsed(elapsed)}</span>
        </div>
        {remaining != null && (
          <div className={remaining <= 0 ? "text-red-600 font-semibold" : "text-gray-500"}>
            {remaining <= 0
              ? "Overstay"
              : `Left ${formatRemaining(remaining)}`}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
      <div className="text-xs font-medium text-blue-800 uppercase tracking-wide">
        Stay time
      </div>
      <div className="mt-1 font-mono text-lg font-semibold text-gray-900">
        {formatElapsed(elapsed)}
      </div>
      {remaining != null && (
        <div
          className={`text-sm mt-0.5 ${remaining <= 0 ? "text-red-600 font-semibold" : "text-gray-600"}`}
        >
          {remaining <= 0
            ? "Past scheduled checkout"
            : `Remaining ${formatRemaining(remaining)}`}
        </div>
      )}
    </div>
  );
}
