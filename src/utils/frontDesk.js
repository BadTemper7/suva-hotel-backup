export function startOfLocalDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isSameCalendarDay(a, b) {
  if (!a || !b) return false;
  return startOfLocalDay(a).getTime() === startOfLocalDay(b).getTime();
}

export function selectArrivalsToday(reservations, today = new Date()) {
  return (reservations || []).filter((r) => {
    if (!r || String(r.status) !== "confirmed") return false;
    return isSameCalendarDay(r.checkIn, today);
  });
}

export function selectInHouse(reservations) {
  const list = (reservations || []).filter(
    (r) => r && String(r.status) === "checked_in",
  );
  return [...list].sort((a, b) => {
    const out = new Date(a.checkOut) - new Date(b.checkOut);
    if (out !== 0) return out;
    return new Date(a.checkIn) - new Date(b.checkIn);
  });
}

export function selectDeparturesToday(reservations, today = new Date()) {
  return (reservations || []).filter((r) => {
    if (!r || String(r.status) !== "checked_in") return false;
    return isSameCalendarDay(r.checkOut, today);
  });
}

export function selectCheckedOutToday(reservations, today = new Date()) {
  return (reservations || []).filter((r) => {
    if (!r || String(r.status) !== "checked_out") return false;
    const at = r.actualCheckOutAt;
    if (!at) return false;
    return isSameCalendarDay(at, today);
  });
}
