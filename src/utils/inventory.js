export const LOW_STOCK_THRESHOLD = 5;

export function normalizeInventoryStatus(value) {
  const raw = String(value ?? "")
    .toLowerCase()
    .trim();
  return raw === "inactive" ? "inactive" : "active";
}

export function isInventoryActive(item) {
  return normalizeInventoryStatus(item?.status) === "active";
}

export function getCatalogStock(item) {
  const stock = Number(item?.stock);
  return Number.isFinite(stock) ? Math.max(0, stock) : 0;
}

export function isInventorySelectable(item) {
  return isInventoryActive(item) && getCatalogStock(item) > 0;
}

export function getStockLevel(stock) {
  const n = Number(stock);
  if (!Number.isFinite(n) || n <= 0) return "out";
  if (n <= LOW_STOCK_THRESHOLD) return "low";
  return "ok";
}

export function stockLevelClasses(level) {
  if (level === "out") return "bg-red-50 text-red-700 border-red-200";
  if (level === "low") return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

export function stockLabel(stock, { includeUnits = true } = {}) {
  const n = Number(stock) || 0;
  if (n <= 0) return "Out of stock";
  if (n <= LOW_STOCK_THRESHOLD) {
    return includeUnits ? `Low stock: ${n} available` : `Low stock: ${n}`;
  }
  return includeUnits ? `${n} available` : String(n);
}

export function stockWarningMessage(item, available = getCatalogStock(item)) {
  const name = item?.name || "This item";
  if (!isInventoryActive(item)) {
    return `${name} is inactive and cannot be reserved.`;
  }
  if (available <= 0) {
    return `${name} is out of stock.`;
  }
  if (available <= LOW_STOCK_THRESHOLD) {
    return `Only ${available} ${name} left in stock.`;
  }
  return null;
}
