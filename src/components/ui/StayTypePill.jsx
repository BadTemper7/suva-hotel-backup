import { resolveStayType, stayTypeLabel } from "../../utils/stay.js";

export default function StayTypePill({ reservation, className = "" }) {
  if (!reservation || typeof reservation !== "object") return null;
  const type = resolveStayType(reservation);
  const hourly = type === "hourly";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        hourly
          ? "bg-violet-100 text-violet-800"
          : "bg-sky-100 text-sky-800"
      } ${className}`}
      title={stayTypeLabel(reservation)}
    >
      {stayTypeLabel(reservation)}
    </span>
  );
}
