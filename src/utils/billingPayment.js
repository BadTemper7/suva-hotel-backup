export function formatMoneyPhp(n) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(n || 0));
}

export function isBillingFullyPaid(billing) {
  if (!billing) return false;
  const st = String(billing.status || "").toLowerCase();
  if (st === "paid") return true;
  const total = Number(billing.totalAmount || 0);
  if (total <= 0) return true;
  const bal = Number(billing.balance);
  if (!Number.isNaN(bal) && bal <= 0) return true;
  const paid = Number(billing.amountPaid || 0);
  return paid >= total;
}
