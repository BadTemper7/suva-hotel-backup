// src/stores/billingStore.js
import { create } from "zustand";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

const API =
  import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

async function safeJson(res) {
  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const msg =
      (isJson && data && (data.message || data.error)) ||
      (!isJson && typeof data === "string" && data.trim()) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

export const useBillingStore = create((set, get) => ({
  billings: [],
  reports: {
    data: null,
    loading: false,
    error: null,
    filters: {
      period: "daily",
      startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
      endDate: format(new Date(), "yyyy-MM-dd"),
      date: format(new Date(), "yyyy-MM-dd"),
      month: format(new Date(), "yyyy-MM"),
      year: new Date().getFullYear().toString(),
      week: null,
    },
  },
  loading: false,
  error: "",

  processRefund: async (billingId, data = {}) => {
    set({ loading: true, error: "" });
    try {
      const res = await fetch(`${API}/billings/${billingId}/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await safeJson(res);

      set({ loading: false });
      return result;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to process refund",
      });
      throw err;
    }
  },
  fetchBillings: async (query = {}) => {
    set({ loading: true, error: "" });
    try {
      const qs = new URLSearchParams();
      if (query.status) qs.set("status", query.status);

      const res = await fetch(
        `${API}/billings${qs.toString() ? `?${qs.toString()}` : ""}`,
      );
      const data = await safeJson(res);

      set({ billings: data, loading: false });
      return data;
    } catch (err) {
      set({
        loading: false,
        error: err?.message || "Failed to fetch billings",
      });
      throw err;
    }
  },

  fetchBillingByReservationId: async (reservationId) => {
    if (!reservationId) return null;
    const res = await fetch(`${API}/billings/${reservationId}`);
    if (res.status === 404) return null;
    const data = await safeJson(res);
    return data.billing ?? null;
  },
  // src/stores/billingStore.js - Add this inside the useBillingStore create function

  /**
   * Print receipt for a billing
   * @param {string} billingId - The billing ID to print receipt for
   */
  printReceipt: async (billingId) => {
    try {
      if (!billingId) {
        throw new Error("Billing ID is required");
      }

      const url = `${API}/billings/${billingId}/print-receipt`;
      console.log("Printing receipt from URL:", url);

      // Open in new tab for PDF
      window.open(url, "_blank");
      return { success: true, message: "Receipt PDF opened" };
    } catch (err) {
      console.error("Error printing receipt:", err);
      throw new Error(err?.message || "Failed to print receipt");
    }
  },
  /**
   * Generate billing reports
   * @param {Object} filters - Report filters
   * @param {string} filters.period - 'daily', 'weekly', 'monthly', 'yearly', 'custom'
   * @param {string} filters.startDate - Start date for custom period (YYYY-MM-DD)
   * @param {string} filters.endDate - End date for custom period (YYYY-MM-DD)
   * @param {string} filters.date - Specific date for daily (YYYY-MM-DD)
   * @param {string} filters.month - Month for monthly (YYYY-MM)
   * @param {string} filters.year - Year for yearly (YYYY)
   * @param {string} filters.week - Week number for weekly (1-52)
   */
  generateReport: async (filters = {}) => {
    set((state) => ({
      reports: {
        ...state.reports,
        loading: true,
        error: null,
      },
    }));

    try {
      const qs = new URLSearchParams();

      // Merge with current filters
      const currentFilters = get().reports.filters;
      const mergedFilters = { ...currentFilters, ...filters };

      // Set the merged filters
      set((state) => ({
        reports: {
          ...state.reports,
          filters: mergedFilters,
        },
      }));

      // Add all filter parameters
      const { period, startDate, endDate, date, month, year, week } =
        mergedFilters;

      // Always include period
      qs.set("period", period);

      // Add parameters based on period
      switch (period) {
        case "daily":
          if (date) {
            qs.set("date", date);
          } else {
            // Default to today
            const today = format(new Date(), "yyyy-MM-dd");
            qs.set("date", today);
          }
          break;
        case "weekly":
          if (week) qs.set("week", week);
          if (year) qs.set("year", year);
          break;
        case "monthly":
          if (month) qs.set("month", month);
          break;
        case "yearly":
          if (year) qs.set("year", year);
          break;
        case "custom":
          if (startDate) qs.set("startDate", startDate);
          if (endDate) qs.set("endDate", endDate);
          break;
      }

      console.log(
        "Fetching billing report with params:",
        Object.fromEntries(qs),
      );

      const res = await fetch(`${API}/billings/reports?${qs.toString()}`);
      const data = await safeJson(res);

      set((state) => ({
        reports: {
          ...state.reports,
          data: data.report || data,
          loading: false,
          error: null,
        },
      }));

      return data;
    } catch (err) {
      console.error("Error generating report:", err);
      set((state) => ({
        reports: {
          ...state.reports,
          loading: false,
          error: err?.message || "Failed to generate report",
        },
      }));
      throw err;
    }
  },

  /**
   * Export report in various formats
   * @param {Object} options - Export options
   * @param {string} options.format - 'json', 'pdf', 'excel', 'csv'
   * @param {Object} options.filters - Report filters (optional, uses current if not provided)
   */
  exportReport: async (options = {}) => {
    const { format = "pdf", filters = {} } = options;

    try {
      const qs = new URLSearchParams();
      qs.set("format", format);

      // Use provided filters or current filters
      const currentFilters = get().reports.filters;
      const reportFilters =
        Object.keys(filters).length > 0 ? filters : currentFilters;

      const { period, startDate, endDate, date, month, year, week } =
        reportFilters;

      // Always include period
      qs.set("period", period);

      // Add parameters based on period
      switch (period) {
        case "daily":
          if (date) qs.set("date", date);
          else {
            // Default to today
            const today = format(new Date(), "yyyy-MM-dd");
            qs.set("date", today);
          }
          break;
        case "weekly":
          if (week) qs.set("week", week);
          if (year) qs.set("year", year);
          else qs.set("year", new Date().getFullYear().toString());
          break;
        case "monthly":
          if (month) qs.set("month", month);
          else qs.set("month", format(new Date(), "yyyy-MM"));
          break;
        case "yearly":
          if (year) qs.set("year", year);
          else qs.set("year", new Date().getFullYear().toString());
          break;
        case "custom":
          if (startDate) qs.set("startDate", startDate);
          if (endDate) qs.set("endDate", endDate);
          else {
            // Default to last 30 days if custom but no dates
            const today = format(new Date(), "yyyy-MM-dd");
            const last30Days = format(subDays(new Date(), 30), "yyyy-MM-dd");
            qs.set("startDate", last30Days);
            qs.set("endDate", today);
          }
          break;
      }

      const url = `${API}/billings/reports/export?${qs.toString()}`;
      console.log("Exporting report to URL:", url);

      // Open in new tab for download (for PDF and CSV)
      window.open(url, "_blank");
      return { success: true, message: "Download started" };
    } catch (err) {
      console.error("Error exporting report:", err);
      throw new Error(err?.message || "Failed to export report");
    }
  },

  /**
   * Clear current report data
   */
  clearReport: () => {
    set((state) => ({
      reports: {
        ...state.reports,
        data: null,
        error: null,
      },
    }));
  },

  /**
   * Set report filters without fetching
   */
  setReportFilters: (filters) => {
    set((state) => ({
      reports: {
        ...state.reports,
        filters: { ...state.reports.filters, ...filters },
      },
    }));
  },

  /**
   * Reset report filters to default
   */
  resetReportFilters: () => {
    set((state) => ({
      reports: {
        ...state.reports,
        filters: {
          period: "daily",
          startDate: format(subDays(new Date(), 30), "yyyy-MM-dd"),
          endDate: format(new Date(), "yyyy-MM-dd"),
          date: format(new Date(), "yyyy-MM-dd"),
          month: format(new Date(), "yyyy-MM"),
          year: new Date().getFullYear().toString(),
          week: null,
        },
      },
    }));
  },

  /**
   * Quick report generators for common periods
   */
  generateDailyReport: async (date = format(new Date(), "yyyy-MM-dd")) => {
    return get().generateReport({
      period: "daily",
      date,
    });
  },

  generateWeeklyReport: async (week, year = new Date().getFullYear()) => {
    return get().generateReport({
      period: "weekly",
      week: week || Math.ceil((new Date().getDate() + new Date().getDay()) / 7),
      year: year.toString(),
    });
  },

  generateMonthlyReport: async (month = format(new Date(), "yyyy-MM")) => {
    return get().generateReport({
      period: "monthly",
      month,
    });
  },

  generateYearlyReport: async (year = new Date().getFullYear()) => {
    return get().generateReport({
      period: "yearly",
      year: year.toString(),
    });
  },

  generateCustomReport: async (startDate, endDate) => {
    return get().generateReport({
      period: "custom",
      startDate,
      endDate,
    });
  },

  /**
   * Helper: Get default date ranges
   */
  getQuickDateRanges: () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const last7Days = format(subDays(new Date(), 7), "yyyy-MM-dd");
    const last30Days = format(subDays(new Date(), 30), "yyyy-MM-dd");
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
    const lastMonthStart = format(
      startOfMonth(subDays(new Date(), 30)),
      "yyyy-MM-dd",
    );
    const lastMonthEnd = format(
      endOfMonth(subDays(new Date(), 30)),
      "yyyy-MM-dd",
    );

    return [
      { label: "Today", period: "daily", date: today },
      {
        label: "Last 7 Days",
        period: "custom",
        startDate: last7Days,
        endDate: today,
      },
      {
        label: "Last 30 Days",
        period: "custom",
        startDate: last30Days,
        endDate: today,
      },
      {
        label: "This Month",
        period: "custom",
        startDate: monthStart,
        endDate: monthEnd,
      },
      {
        label: "Last Month",
        period: "custom",
        startDate: lastMonthStart,
        endDate: lastMonthEnd,
      },
    ];
  },

  /**
   * Helper: Apply quick date range
   */
  applyQuickDateRange: (range) => {
    const filters = { period: range.period };

    if (range.period === "daily" && range.date) {
      filters.date = range.date;
    } else if (range.period === "custom" && range.startDate && range.endDate) {
      filters.startDate = range.startDate;
      filters.endDate = range.endDate;
    }

    get().setReportFilters(filters);
    return filters;
  },

  /**
   * Helper: Format currency
   */
  formatCurrency: (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  },

  /**
   * Helper: Calculate percentage
   */
  calculatePercentage: (part, total) => {
    if (total === 0) return "0%";
    return `${((part / total) * 100).toFixed(1)}%`;
  },

  /**
   * Helper: Get billing status color
   */
  getStatusColor: (status) => {
    const colors = {
      paid: "bg-green-50 border-green-100 text-green-700",
      unpaid: "bg-red-50 border-red-100 text-red-700",
      partial: "bg-yellow-50 border-yellow-100 text-yellow-700",
      refunded: "bg-blue-50 border-blue-100 text-blue-700",
      voided: "bg-gray-50 border-gray-100 text-gray-700",
    };
    return colors[status] || "bg-gray-50 border-gray-100 text-gray-700";
  },

  clearError: () => set({ error: "" }),
}));

// Export helpers separately
export const billingHelpers = {
  formatCurrency: (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  },

  getStatusColor: (status) => {
    const colors = {
      paid: "bg-green-50 border-green-100 text-green-700",
      unpaid: "bg-red-50 border-red-100 text-red-700",
      partial: "bg-yellow-50 border-yellow-100 text-yellow-700",
      refunded: "bg-blue-50 border-blue-100 text-blue-700",
      voided: "bg-gray-50 border-gray-100 text-gray-700",
    };
    return colors[status] || "bg-gray-50 border-gray-100 text-gray-700";
  },

  calculatePercentage: (part, total) => {
    if (total === 0) return "0%";
    return `${((part / total) * 100).toFixed(1)}%`;
  },

  formatDate: (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      return "Invalid Date";
    }
  },

  formatDateTime: (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch (error) {
      return "Invalid Date";
    }
  },
};

export const reservationHelpers = {
  getReportSummary: (reservations) => {
    if (!reservations || !Array.isArray(reservations)) {
      return {
        total: 0,
        confirmed: 0,
        pending: 0,
        checkedIn: 0,
        checkedOut: 0,
        cancelled: 0,
        totalNights: 0,
        totalAdults: 0,
        totalChildren: 0,
      };
    }

    return {
      total: reservations.length,
      confirmed: reservations.filter((r) => r && r.status === "confirmed")
        .length,
      pending: reservations.filter((r) => r && r.status === "pending").length,
      checkedIn: reservations.filter((r) => r && r.status === "checked_in")
        .length,
      checkedOut: reservations.filter((r) => r && r.status === "checked_out")
        .length,
      cancelled: reservations.filter((r) => r && r.status === "cancelled")
        .length,
      totalNights: reservations.reduce((sum, r) => sum + (r?.nights || 0), 0),
      totalAdults: reservations.reduce((sum, r) => sum + (r?.adults || 0), 0),
      totalChildren: reservations.reduce(
        (sum, r) => sum + (r?.children || 0),
        0,
      ),
    };
  },

  getStatusColor: (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "checked_in":
        return "bg-blue-100 text-blue-800";
      case "checked_out":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  },

  formatReservation: (reservation) => {
    if (!reservation) return null;

    return {
      ...reservation,
      guestName: reservation.guestId
        ? `${reservation.guestId.firstName || ""} ${reservation.guestId.lastName || ""}`.trim()
        : "Unknown Guest",
      paymentOptionName: reservation.paymentOption?.name || "Unknown",
      discountName: reservation.discountId?.name || null,
      userName:
        reservation.userId?.username || reservation.userId?.name || "System",
    };
  },
};
