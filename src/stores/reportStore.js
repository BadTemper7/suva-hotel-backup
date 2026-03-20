// stores/useReportStore.js
import { create } from "zustand";

const API = import.meta.env.VITE_SERVER_URI || "http://localhost:5000/api";

const buildQueryParams = (filters) => {
  const params = new URLSearchParams();

  if (filters.reportType) params.append("reportType", filters.reportType);
  if (filters.period) params.append("period", filters.period);

  if (filters.status && filters.status !== "all") {
    params.append("status", filters.status);
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
    revenue: null,
    payments: null,
    refunds: null,
    outstandingBalances: null,
  },
  loading: false,
  exportLoading: false,
  error: null,
  filters: {
    period: "daily",
    startDate: null,
    endDate: null,
    status: "all",
  },

  // Actions
  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),

  resetFilters: () =>
    set({
      filters: {
        period: "daily",
        startDate: null,
        endDate: null,
        status: "all",
      },
    }),

  // Reservation Reports
  fetchReservationsReport: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const currentFilters = { ...get().filters, ...filters };
      const queryParams = buildQueryParams(currentFilters);

      const res = await fetch(`${API}/reports/reservations?${queryParams}`);
      const data = await res.json();

      if (!res.ok)
        throw new Error(data?.message || "Failed to fetch reservations report");

      set((state) => ({
        reports: { ...state.reports, reservations: data },
        loading: false,
      }));

      return data;
    } catch (err) {
      set({ loading: false, error: err.message });
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
        revenue: null,
        payments: null,
        refunds: null,
        outstandingBalances: null,
      },
    }),
}));
