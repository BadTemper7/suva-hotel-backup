// stores/useReportStore.js
import { create } from "zustand";
import { getToken } from "../app/auth.js";

/**
 * Prefer explicit env (`VITE_SERVER_URI` / `VITE_SERVER_LOCAL`) so a backend on a non-default
 * port still works. If unset in dev, use same-origin `/api` (Vite proxy → vite.config target).
 */
function resolveApiBase() {
  const fromEnv =
    import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;
  if (fromEnv) return String(fromEnv).replace(/\/+$/, "");
  if (import.meta.env.DEV) return "/api";
  return "http://localhost:5000/api";
}

const API = resolveApiBase();

async function parseJsonResponseLoose(res) {
  const text = await res.text();
  const trimmed = text.trimStart();
  const isHtml =
    trimmed.startsWith("<!") ||
    trimmed.toLowerCase().startsWith("<!doctype");
  if (isHtml) {
    return { res, isHtml: true, data: null, parseOk: false };
  }
  try {
    return { res, isHtml: false, data: JSON.parse(text), parseOk: true };
  } catch {
    return { res, isHtml: false, data: null, parseOk: false };
  }
}

const buildQueryParams = (filters) => {
  const params = new URLSearchParams();

  if (filters.reportType) params.append("reportType", filters.reportType);
  if (filters.period) params.append("period", filters.period);

  if (filters.status && filters.status !== "all") {
    params.append("status", filters.status);
  }
  if (filters.unitType && filters.unitType !== "all") {
    params.append("unitType", filters.unitType);
  }
  if (filters.action && filters.action !== "all") {
    params.append("action", filters.action);
  }

  if (filters.period === "custom") {
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
  }

  return params.toString();
};

export const useReportStore = create((set, get) => ({
  // State
  reports: {
    reservations: null,
    reservationStatus: null,
    occupancy: null,
    operationsLogs: null,
    revenue: null,
    payments: null,
    refunds: null,
    outstandingBalances: null,
  },
  loading: false,
  exportLoading: false,
  error: null,
  filters: {
    period: "weekly",
    startDate: null,
    endDate: null,
    status: "all",
    unitType: "all",
    action: "all",
  },

  // Actions
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),

  resetFilters: () =>
    set({
      filters: {
        period: "weekly",
        startDate: null,
        endDate: null,
        status: "all",
        unitType: "all",
        action: "all",
      },
    }),

  // Reservation Reports
  fetchReservationsReport: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const currentFilters = { ...get().filters, ...filters };
      const params = new URLSearchParams();
      if (currentFilters.period) params.append("period", currentFilters.period);
      if (currentFilters.startDate) {
        params.append("startDate", currentFilters.startDate);
      }
      if (currentFilters.endDate) params.append("endDate", currentFilters.endDate);
      if (currentFilters.status) params.append("status", currentFilters.status);

      const res = await fetch(
        `${API}/reports/reservations?${params.toString()}`,
      );
      const data = await res.json();

      if (!res.ok)
        throw new Error(data.message || "Failed to fetch reservations report");

      // Ensure all fields exist with default values
      const reportData = {
        ...data,
        newReservations: data.newReservations ?? 0,
        averageNights: data.averageNights ?? 0,
        cancellationRate: data.cancellationRate ?? 0,
        reservations: data.reservations ?? [],
      };

      set((state) => ({
        reports: {
          ...state.reports,
          reservations: reportData,
        },
        loading: false,
      }));

      return reportData;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  fetchReservationStatusReport: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const currentFilters = { ...get().filters, ...filters };
      const { status, ...otherFilters } = currentFilters;
      const queryParams = new URLSearchParams(otherFilters).toString();

      const res = await fetch(
        `${API}/reports/reservation-status?${queryParams}`,
      );
      const data = await res.json();

      if (!res.ok)
        throw new Error(data?.message || "Failed to fetch status report");

      set((state) => ({
        reports: { ...state.reports, reservationStatus: data },
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  fetchOccupancyReport: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const currentFilters = { ...get().filters, ...filters };
      const { status, ...otherFilters } = currentFilters;
      const queryParams = new URLSearchParams(otherFilters).toString();

      const res = await fetch(`${API}/reports/occupancy?${queryParams}`);
      const data = await res.json();

      if (!res.ok)
        throw new Error(data?.message || "Failed to fetch occupancy report");

      set((state) => ({
        reports: { ...state.reports, occupancy: data },
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  fetchOperationsLogsReport: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const currentFilters = { ...get().filters, ...filters };
      const params = new URLSearchParams();
      if (currentFilters.period) params.append("period", currentFilters.period);
      if (currentFilters.startDate) {
        params.append("startDate", currentFilters.startDate);
      }
      if (currentFilters.endDate) params.append("endDate", currentFilters.endDate);
      if (currentFilters.unitType) params.append("unitType", currentFilters.unitType);
      if (currentFilters.action) params.append("action", currentFilters.action);
      if (currentFilters.page) params.append("page", String(currentFilters.page));
      if (currentFilters.pageSize) {
        params.append("pageSize", String(currentFilters.pageSize));
      }

      const qs = params.toString();
      let parsed = await parseJsonResponseLoose(
        await fetch(`${API}/reports/operations-logs?${qs}`),
      );

      const shouldFallback =
        parsed.isHtml ||
        !parsed.parseOk ||
        parsed.res.status === 404 ||
        parsed.res.status === 502 ||
        parsed.res.status === 504;

      if (shouldFallback) {
        const token = getToken();
        if (!token) {
          throw new Error(
            parsed.isHtml
              ? "Reports URL returned a web page instead of JSON. Development uses /api via Vite proxy—ensure the API is running. For production, set VITE_SERVER_URI to your backend (e.g. https://your-server.com/api). You can also sign in and we will retry using /rooms/operations-logs."
              : parsed.data?.message ||
                  "Failed to fetch operations logs report (no session for fallback).",
          );
        }
        parsed = await parseJsonResponseLoose(
          await fetch(`${API}/rooms/operations-logs?format=report&${qs}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        );
      }

      if (parsed.isHtml || !parsed.parseOk) {
        throw new Error(
          "Operations report did not return JSON. Confirm the backend is running, routes are deployed, and your admin token is valid.",
        );
      }

      if (!parsed.res.ok) {
        throw new Error(
          parsed.data?.message || "Failed to fetch operations logs report",
        );
      }

      const data = parsed.data;

      set((state) => ({
        reports: { ...state.reports, operationsLogs: data },
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Billing Reports
  fetchRevenueReport: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const currentFilters = { ...get().filters, ...filters };
      const queryParams = buildQueryParams(currentFilters);

      const res = await fetch(`${API}/reports/revenue?${queryParams}`);
      const data = await res.json();

      if (!res.ok)
        throw new Error(data?.message || "Failed to fetch revenue report");

      set((state) => ({
        reports: { ...state.reports, revenue: data },
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  fetchPaymentReport: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const currentFilters = { ...get().filters, ...filters };
      const queryParams = buildQueryParams(currentFilters);

      const res = await fetch(`${API}/reports/payments?${queryParams}`);
      const data = await res.json();

      if (!res.ok)
        throw new Error(data?.message || "Failed to fetch payment report");

      set((state) => ({
        reports: { ...state.reports, payments: data },
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  fetchRefundReport: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const currentFilters = { ...get().filters, ...filters };
      const queryParams = buildQueryParams(currentFilters);

      const res = await fetch(`${API}/reports/refunds?${queryParams}`);
      const data = await res.json();

      if (!res.ok)
        throw new Error(data?.message || "Failed to fetch refund report");

      set((state) => ({
        reports: { ...state.reports, refunds: data },
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  fetchOutstandingBalanceReport: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/reports/outstanding-balances`);
      const data = await res.json();

      if (!res.ok)
        throw new Error(
          data?.message || "Failed to fetch outstanding balance report",
        );

      set((state) => ({
        reports: { ...state.reports, outstandingBalances: data },
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
      throw err;
    }
  },

  // Export Functions
  exportToExcel: async (reportType, filters = {}) => {
    set({ exportLoading: true });
    try {
      const currentFilters = { ...get().filters, ...filters, reportType };
      const queryParams = buildQueryParams(currentFilters);

      const res = await fetch(`${API}/reports/export/excel?${queryParams}`);
      if (!res.ok) throw new Error("Failed to export to Excel");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}_report_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      set({ exportLoading: false });
      return true;
    } catch (err) {
      set({ exportLoading: false, error: err.message });
      throw err;
    }
  },

  exportToPDF: async (reportType, filters = {}) => {
    set({ exportLoading: true });
    try {
      const currentFilters = { ...get().filters, ...filters, reportType };
      const queryParams = buildQueryParams(currentFilters);

      const res = await fetch(`${API}/reports/export/pdf?${queryParams}`);
      if (!res.ok) throw new Error("Failed to export to PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}_report_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      set({ exportLoading: false });
      return true;
    } catch (err) {
      set({ exportLoading: false, error: err.message });
      throw err;
    }
  },

  // Clear reports
  clearReports: () =>
    set({
      reports: {
        reservations: null,
        reservationStatus: null,
        occupancy: null,
        operationsLogs: null,
        revenue: null,
        payments: null,
        refunds: null,
        outstandingBalances: null,
      },
    }),
}));
