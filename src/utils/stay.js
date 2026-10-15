export const HOURLY_DURATIONS = [3, 6, 12];

const HOURLY_KEYS = { 3: "hours3", 6: "hours6", 12: "hours12" };

export function getHourlyRate(room, durationHours) {
  const key = HOURLY_KEYS[Number(durationHours)];
  if (!key || !room) return 0;
  return Math.max(0, Number(room.hourlyRates?.[key] || 0));
}

export function roomOffersHourlyPackage(room, durationHours) {
  return getHourlyRate(room, durationHours) > 0;
}

export function getRoomStayCharge(room, { stayType, hourlyDuration, nights } = {}) {
  if (!room) return 0;
  if (stayType === "hourly") return getHourlyRate(room, hourlyDuration);
  return (Number(room.rate) || 0) * Math.max(1, Number(nights) || 1);
}

export function stayRateLabel(stayType, hourlyDuration) {
  if (stayType === "hourly") return `/ ${hourlyDuration || 3} hrs`;
  return "/ night";
}

export function resolveStayType(entity) {
  const type = entity?.stayType || entity?.reservationId?.stayType;
  return type === "hourly" ? "hourly" : "overnight";
}

export function stayHourlyDuration(entity) {
  return entity?.hourlyDuration || entity?.reservationId?.hourlyDuration || null;
}

export function stayTypeLabel(entity) {
  if (resolveStayType(entity) === "hourly") {
    const hrs = stayHourlyDuration(entity);
    return hrs ? `Hourly · ${hrs} hrs` : "Hourly";
  }
  return "Overnight";
}

export function stayDurationLabel(reservation) {
  if (!reservation) return "";
  if (resolveStayType(reservation) === "hourly") {
    return `${stayHourlyDuration(reservation) || 0} hrs`;
  }
  return `${reservation.nights || 0} night(s)`;
}

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function formatElapsed(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

export function formatRemaining(ms) {
  if (ms <= 0) return "Overstay";
  return formatElapsed(ms);
}
