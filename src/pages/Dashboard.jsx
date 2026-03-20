// src/pages/Dashboard.jsx
import { useMemo, useState, useEffect } from "react";
import {
  FiCalendar,
  FiUserCheck,
  FiUsers,
  FiTrendingUp,
  FiTrendingDown,
  FiFileText,
  FiBarChart2,
  FiDownload,
  FiFilter,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiDollarSign,
  FiPercent,
  FiClock,
  FiActivity,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useBillingStore } from "../stores/billingStore";
import Loader from "../components/layout/Loader";

function StatCard({
  title,
  value,
  delta,
  icon: Icon,
  showDelta = true,
  loading = false,
}) {
  const raw = String(delta ?? "").trim();
  const isNegative = raw.startsWith("-");

  const DeltaIcon = isNegative ? FiTrendingDown : FiTrendingUp;
  const deltaStyles = isNegative
    ? "bg-[#0c2bfc]/10 text-[#0c2bfc]"
    : "bg-[#00af00]/10 text-[#00af00]";

  return (
    <div
      className="
      rounded-xl border border-gray-200 
      bg-white
      p-5 shadow-sm hover:shadow-md transition-all duration-300
      hover:-translate-y-0.5
    "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-600">{title}</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {loading ? (
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            ) : (
              value
            )}
          </div>

          {showDelta && !loading && raw && (
            <div className="mt-3 inline-flex items-center gap-1 text-xs">
              <span
                className={[
                  "inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-medium",
                  deltaStyles,
                ].join(" ")}
              >
                <DeltaIcon className="text-sm" />
                {raw || "0%"}
              </span>
            </div>
          )}
        </div>

        <div
          className="
          h-12 w-12 rounded-xl 
          border border-gray-200 
          bg-gray-50
          grid place-items-center text-[#0c2bfc]
          shadow-sm
        "
        >
          <Icon className="text-xl" />
        </div>
      </div>
    </div>
  );
}

function EnhancedChart({ data, height = 200, period = "daily" }) {
  const width = 640;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };

  const points = useMemo(() => {
    if (!data?.length) return [];
    const ys = data.map((d) => d.value);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const safeRange = Math.max(1, maxY - minY);
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    return data.map((d, i) => {
      const x = padding.left + (i / Math.max(1, data.length - 1)) * chartWidth;
      const y =
        padding.top +
        chartHeight -
        ((d.value - minY) / safeRange) * chartHeight;
      return { x, y, ...d };
    });
  }, [data, height, padding]);

  if (!points.length) {
    return (
      <div
        className="
        h-48 grid place-items-center text-sm text-gray-500 
        bg-white
        rounded-xl border border-gray-200
      "
      >
        <div className="text-center">
          <FiBarChart2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          No revenue data yet.
        </div>
      </div>
    );
  }

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${padding.left},${height - padding.bottom} ${line} ${width - padding.right},${height - padding.bottom}`;

  const yValues = useMemo(() => {
    const maxValue = Math.max(...points.map((p) => p.value));
    const steps = 4;
    const stepValue = Math.ceil(maxValue / steps);
    return Array.from({ length: steps + 1 }, (_, i) => i * stepValue);
  }, [points]);

  const formatLabel = (label, index) => {
    if (!label) return "";

    if (period === "daily") {
      if (index === 0) return "12AM";
      if (index === points.length - 1) return "11PM";
      if (index === Math.floor(points.length / 2)) return "12PM";
      return "";
    } else if (period === "weekly") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return days[index % days.length] || label;
    } else if (period === "monthly") {
      if (index === 0) return "Week 1";
      if (index === points.length - 1) return `Week ${points.length}`;
      if (index === Math.floor(points.length / 2))
        return `Week ${Math.floor(points.length / 2) + 1}`;
      return "";
    } else if (period === "yearly") {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return months[index] || label;
    }
    return label;
  };

  return (
    <div
      className="
      rounded-xl border border-gray-200 
      bg-white
      p-5
    "
    >
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48"
          role="img"
          aria-label={`Revenue chart for ${period}`}
        >
          {/* Y-axis grid lines and labels */}
          {yValues.map((value, index) => {
            const y =
              padding.top +
              (height - padding.top - padding.bottom) *
                (1 - index / (yValues.length - 1));
            return (
              <g key={index}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#6b7280"
                  fontFamily="Arial, sans-serif"
                >
                  ₱{value.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* X-axis */}
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={height - padding.bottom}
            y2={height - padding.bottom}
            stroke="#d1d5db"
            strokeWidth="1"
          />

          {/* Y-axis */}
          <line
            x1={padding.left}
            x2={padding.left}
            y1={padding.top}
            y2={height - padding.bottom}
            stroke="#d1d5db"
            strokeWidth="1"
          />

          {/* Area under line - gradient */}
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0c2bfc" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0c2bfc" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <polygon fill="url(#areaGradient)" points={area} />

          {/* Line - primary color */}
          <polyline
            fill="none"
            stroke="#0c2bfc"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={line}
          />

          {/* Data points */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r="5"
                fill="white"
                stroke="#0c2bfc"
                strokeWidth="2"
                className="hover:r-6 transition-all cursor-pointer"
              />
              <text
                x={p.x}
                y={p.y - 15}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#0c2bfc"
                className="opacity-0 hover:opacity-100 transition-opacity"
                fontFamily="Arial, sans-serif"
              >
                ₱{p.value.toLocaleString()}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {points.map((p, idx) => {
            const label = formatLabel(p.label, idx);
            if (!label) return null;

            return (
              <text
                key={idx}
                x={p.x}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
                fontFamily="Arial, sans-serif"
              >
                {label}
              </text>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-[#0c2bfc] rounded-full"></div>
            <span className="text-xs font-medium text-gray-700">
              {period === "daily"
                ? "Hourly Revenue"
                : period === "weekly"
                  ? "Daily Revenue"
                  : period === "monthly"
                    ? "Weekly Revenue"
                    : period === "yearly"
                      ? "Monthly Revenue"
                      : "Revenue Trend"}
            </span>
          </div>
          <div className="text-xs font-bold text-gray-700 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
            Total: ₱
            {points.reduce((sum, p) => sum + p.value, 0).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExportDropdown({ onExport, loading }) {
  const [isOpen, setIsOpen] = useState(false);

  const exportOptions = [
    { format: "pdf", label: "PDF Document", icon: FiFileText },
    { format: "csv", label: "CSV File", icon: FiFileText },
  ];

  const handleExport = async (format) => {
    setIsOpen(false);
    try {
      await onExport(format);
    } catch (error) {
      toast.error(`Failed to export: ${error.message}`);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="
          h-10 px-4 rounded-xl 
          border border-gray-300 
          bg-white
          hover:bg-gray-50
          text-sm font-medium inline-flex items-center gap-2 
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          hover:shadow-md hover:-translate-y-0.5
          active:translate-y-0
          text-gray-700 hover:text-[#0c2bfc]
        "
      >
        <FiDownload />
        Export
        {isOpen ? <FiChevronUp /> : <FiChevronDown />}
      </button>

      {isOpen && (
        <div
          className="
          absolute top-full left-0 mt-1 w-48 
          rounded-xl border border-gray-200 
          bg-white
          shadow-lg z-10 overflow-hidden
        "
        >
          {exportOptions.map((option) => (
            <button
              key={option.format}
              type="button"
              onClick={() => handleExport(option.format)}
              className="
                w-full text-left px-4 py-3 text-sm 
                text-gray-700 hover:text-[#0c2bfc]
                hover:bg-gray-50
                flex items-center gap-3 transition-colors
                border-b border-gray-100 last:border-b-0
              "
            >
              <option.icon className="text-gray-500" />
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ReportFilters({ onGenerate, onExport, loading, filters, setFilters }) {
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const periodButtons = [
    { period: "daily", label: "Today" },
    { period: "weekly", label: "This Week" },
    { period: "monthly", label: "This Month" },
    { period: "yearly", label: "This Year" },
  ];

  const handlePeriodChange = async (period) => {
    setFilters({ period });
    setShowCustom(false);
    try {
      await onGenerate({ period });
    } catch (error) {
      toast.error(`Failed to generate report: ${error.message}`);
    }
  };

  const handleCustomGenerate = async () => {
    if (!customStart || !customEnd) {
      toast.error("Please select both start and end dates");
      return;
    }

    const customFilters = {
      period: "custom",
      startDate: customStart,
      endDate: customEnd,
    };

    setFilters(customFilters);
    try {
      await onGenerate(customFilters);
    } catch (error) {
      toast.error(`Failed to generate report: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">
          Report Period
        </div>
        <div className="flex flex-wrap gap-2">
          {periodButtons.map((btn) => (
            <button
              key={btn.period}
              type="button"
              onClick={() => handlePeriodChange(btn.period)}
              disabled={loading}
              className={`
                h-9 px-3 rounded-lg border text-sm font-medium transition-all duration-200
                ${loading ? "opacity-50 cursor-not-allowed" : ""}
                ${
                  filters.period === btn.period && !showCustom
                    ? "border-[#0c2bfc] bg-[#0c2bfc] text-white shadow-md"
                    : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:border-gray-300 hover:shadow-sm"
                }
              `}
            >
              {btn.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowCustom(!showCustom)}
            disabled={loading}
            className={`
              h-9 px-3 rounded-lg border text-sm font-medium inline-flex items-center gap-1.5
              ${loading ? "opacity-50 cursor-not-allowed" : ""}
              ${
                showCustom
                  ? "border-[#0c2bfc] bg-[#0c2bfc]/5 text-[#0c2bfc]"
                  : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:border-gray-300"
              }
            `}
          >
            <FiFilter className="text-sm" />
            Custom
          </button>
        </div>
      </div>

      {showCustom && (
        <div
          className="
          p-4 bg-gray-50 
          rounded-xl border border-gray-200
        "
        >
          <div className="text-sm font-medium text-gray-700 mb-2">
            Custom Date Range
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="
                  w-full rounded-xl border border-gray-200 
                  bg-white px-3 py-2 text-sm text-gray-800
                  focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                  outline-none
                "
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="
                  w-full rounded-xl border border-gray-200 
                  bg-white px-3 py-2 text-sm text-gray-800
                  focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                  outline-none
                "
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleCustomGenerate}
            disabled={loading || !customStart || !customEnd}
            className={`
              h-9 px-4 rounded-lg text-sm font-medium inline-flex items-center gap-2 w-full justify-center
              transition-all duration-200
              ${
                !customStart || !customEnd || loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-[#0c2bfc] hover:bg-[#0a24d6] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
              }
            `}
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            {loading ? "Generating..." : "Generate Custom Report"}
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <ExportDropdown onExport={onExport} loading={loading} />
      </div>
    </div>
  );
}

function RevenueOverview() {
  const { generateReport, exportReport, reports, setReportFilters } =
    useBillingStore();

  const handleGenerateReport = async (filters) => {
    try {
      await generateReport(filters);
    } catch (error) {
      toast.error(error.message || "Failed to generate report");
    }
  };

  const handleExportReport = async (format) => {
    try {
      await exportReport({
        format,
        filters: reports.filters,
      });
      toast.success(`Report export started for ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Export failed: ${error.message}`);
    }
  };

  const chartData = useMemo(() => {
    const period = reports.filters?.period || "daily";

    if (
      reports.data?.breakdown?.revenue &&
      reports.data.breakdown.revenue.length > 0
    ) {
      return reports.data.breakdown.revenue.map((value, index) => ({
        label: reports.data.breakdown.labels[index] || "",
        value: value,
      }));
    }

    const generateMockData = (count, base = 1000) => {
      return Array.from({ length: count }, (_, i) => {
        const timeFactor = Math.sin((i / count) * Math.PI) * 0.5 + 0.5;
        const trendFactor = i * 0.1;
        const randomFactor = 0.8 + Math.random() * 0.4;
        const value = Math.round(
          base * timeFactor * randomFactor + base * trendFactor,
        );

        return {
          label: "",
          value: Math.max(100, value),
        };
      });
    };

    switch (period) {
      case "daily":
        return generateMockData(24, 500);
      case "weekly":
        return generateMockData(7, 1500);
      case "monthly":
        return generateMockData(4, 4000);
      case "yearly":
        return generateMockData(12, 10000);
      default:
        return generateMockData(7, 1500);
    }
  }, [reports.data, reports.filters]);

  const total = useMemo(
    () => chartData.reduce((sum, d) => sum + d.value, 0),
    [chartData],
  );
  const avg = useMemo(
    () => (chartData.length ? total / chartData.length : 0),
    [total, chartData.length],
  );

  const periodName =
    reports.filters?.period === "daily"
      ? "Today"
      : reports.filters?.period === "weekly"
        ? "This Week"
        : reports.filters?.period === "monthly"
          ? "This Month"
          : reports.filters?.period === "yearly"
            ? "This Year"
            : "Custom Period";

  return (
    <div
      className="lg:col-span-2 
      rounded-xl border border-gray-200 
      bg-white
      p-5
    "
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="text-lg font-bold text-gray-900">
            Resort Revenue Overview - {periodName}
          </div>
          <div className="text-sm text-gray-600 mt-0.5">
            {reports.filters?.period === "daily"
              ? "Hourly revenue breakdown for today"
              : reports.filters?.period === "weekly"
                ? "Daily revenue breakdown for this week"
                : reports.filters?.period === "monthly"
                  ? "Weekly revenue breakdown for this month"
                  : reports.filters?.period === "yearly"
                    ? "Monthly revenue breakdown for this year"
                    : "Revenue breakdown for selected period"}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <ReportFilters
          onGenerate={handleGenerateReport}
          onExport={handleExportReport}
          loading={reports.loading}
          filters={reports.filters}
          setFilters={setReportFilters}
        />
      </div>

      {reports.data && (
        <div
          className="
          mb-4 p-4 
          bg-gray-50
          rounded-xl border border-gray-200
        "
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">
              {reports.data.dateRange.display}
            </h3>
            <span
              className="
              text-xs text-gray-700 
              bg-white
              px-3 py-1.5 rounded-full border border-gray-200
              font-medium
            "
            >
              {reports.data.metadata.totalBillingCount} billings processed
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <div className="text-xs text-gray-600 font-medium">Revenue</div>
              <div className="text-sm font-bold text-gray-900">
                ₱{reports.data.summary.totalRevenue.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 font-medium">Paid</div>
              <div className="text-sm font-bold text-gray-900">
                ₱{reports.data.summary.totalAmountPaid.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 font-medium">Balance</div>
              <div className="text-sm font-bold text-gray-900">
                ₱{reports.data.summary.totalBalance.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 font-medium">
                Conversion
              </div>
              <div className="text-sm font-bold text-gray-900">
                {reports.data.summary.conversionRate.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <EnhancedChart
          data={chartData}
          period={reports.filters?.period || "daily"}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <div
            className="
            rounded-xl border border-gray-200 
            bg-white
            p-4
          "
          >
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <FiDollarSign className="text-[#0c2bfc]" />
              {reports.filters?.period === "daily"
                ? "Today's Total"
                : reports.filters?.period === "weekly"
                  ? "Week's Total"
                  : reports.filters?.period === "monthly"
                    ? "Month's Total"
                    : reports.filters?.period === "yearly"
                      ? "Year's Total"
                      : "Total Revenue"}
            </div>
            <div className="text-lg font-bold text-gray-900">
              {reports.data?.summary?.totalRevenue
                ? `₱${reports.data.summary.totalRevenue.toLocaleString()}`
                : `₱${Math.round(total).toLocaleString()}`}
            </div>
          </div>

          <div
            className="
            rounded-xl border border-gray-200 
            bg-white
            p-4
          "
          >
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <FiPercent className="text-[#0c2bfc]" />
              {reports.filters?.period === "daily"
                ? "Average per Hour"
                : reports.filters?.period === "weekly"
                  ? "Average per Day"
                  : reports.filters?.period === "monthly"
                    ? "Average per Week"
                    : reports.filters?.period === "yearly"
                      ? "Average per Month"
                      : "Average"}
            </div>
            <div className="text-lg font-bold text-gray-900">
              ₱{Math.round(avg).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {chartData.length}{" "}
              {reports.filters?.period === "daily"
                ? "hours"
                : reports.filters?.period === "weekly"
                  ? "days"
                  : reports.filters?.period === "monthly"
                    ? "weeks"
                    : reports.filters?.period === "yearly"
                      ? "months"
                      : "periods"}
            </div>
          </div>

          <div
            className="
            rounded-xl border border-gray-200 
            bg-white
            p-4
          "
          >
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <FiActivity className="text-[#0c2bfc]" />
              Peak Value
            </div>
            <div className="text-lg font-bold text-gray-900">
              ₱{Math.max(...chartData.map((d) => d.value)).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {reports.filters?.period === "daily"
                ? "Highest hourly revenue"
                : reports.filters?.period === "weekly"
                  ? "Highest daily revenue"
                  : reports.filters?.period === "monthly"
                    ? "Highest weekly revenue"
                    : reports.filters?.period === "yearly"
                      ? "Highest monthly revenue"
                      : "Peak period"}
            </div>
          </div>
        </div>

        <div
          className="
          text-sm text-gray-700 p-4 
          bg-gray-50
          rounded-xl border border-gray-200
        "
        >
          <div className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <FiBarChart2 className="text-[#0c2bfc]" />
            Chart Details
          </div>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Hover over any point to see exact revenue amount</li>
            <li>Y-axis shows revenue amounts in Philippine Peso (₱)</li>
            <li>
              X-axis shows{" "}
              {reports.filters?.period === "daily"
                ? "hours of the day"
                : reports.filters?.period === "weekly"
                  ? "days of the week"
                  : reports.filters?.period === "monthly"
                    ? "weeks of the month"
                    : reports.filters?.period === "yearly"
                      ? "months of the year"
                      : "period breakdown"}
            </li>
            <li>Blue line shows revenue trend over time</li>
            <li>Shaded area represents total revenue distribution</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function RecentActivity({ items }) {
  return (
    <div
      className="
      rounded-xl border border-gray-200 
      bg-white
      p-5
    "
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-lg font-bold text-gray-900">Recent Activity</div>
          <div className="text-sm text-gray-600">Latest resort updates</div>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((a, idx) => (
          <div
            key={idx}
            className="
              rounded-xl border border-gray-200 
              bg-white
              px-4 py-3.5
              hover:border-gray-300 hover:bg-gray-50
              transition-all duration-200
            "
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className="
                  h-10 w-10 rounded-xl 
                  border border-gray-200 
                  bg-gray-50
                  grid place-items-center text-[#0c2bfc] shrink-0
                "
                >
                  <FiFileText className="text-base" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {a.title}
                  </div>
                  {a.description && (
                    <div className="text-sm text-gray-600 mt-0.5 truncate">
                      {a.description}
                    </div>
                  )}
                </div>
              </div>

              <div
                className="
                text-xs font-medium text-gray-700 whitespace-nowrap
                bg-gray-100
                px-2.5 py-1 rounded-full border border-gray-200
              "
              >
                {a.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { generateReport, reports, setReportFilters } = useBillingStore();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const loadInitialReport = async () => {
      try {
        await generateReport({ period: "daily" });
        setInitialLoad(false);
      } catch (error) {
        console.error("Failed to load daily report:", error);
        setInitialLoad(false);
      }
    };

    loadInitialReport();
  }, []);

  const stats = [
    {
      title: "Total Bookings",
      value: reports.data?.summary?.totalBillings || "0",
      delta: reports.data?.summary?.conversionRate
        ? `+${reports.data.summary.conversionRate.toFixed(1)}%`
        : "+0%",
      icon: FiCalendar,
      showDelta: true,
      loading: reports.loading || initialLoad,
    },
    {
      title: "Total Revenue",
      value: reports.data?.summary?.totalRevenue
        ? `₱${reports.data.summary.totalRevenue.toLocaleString()}`
        : "₱0",
      delta: reports.data?.summary?.averageBillAmount
        ? `₱${Math.round(reports.data.summary.averageBillAmount).toLocaleString()} avg`
        : "+0%",
      icon: FiBarChart2,
      showDelta: true,
      loading: reports.loading || initialLoad,
    },
    {
      title: "Amount Paid",
      value: reports.data?.summary?.totalAmountPaid
        ? `₱${reports.data.summary.totalAmountPaid.toLocaleString()}`
        : "₱0",
      delta: "",
      icon: FiUserCheck,
      showDelta: false,
      loading: reports.loading || initialLoad,
    },
    {
      title: "Pending Balance",
      value: reports.data?.summary?.totalBalance
        ? `₱${reports.data.summary.totalBalance.toLocaleString()}`
        : "₱0",
      delta: "",
      icon: FiUsers,
      showDelta: false,
      loading: reports.loading || initialLoad,
    },
  ];

  const activity = [
    {
      module: "reports",
      title: `${
        reports.filters?.period === "daily"
          ? "Daily"
          : reports.filters?.period === "weekly"
            ? "Weekly"
            : reports.filters?.period === "monthly"
              ? "Monthly"
              : reports.filters?.period === "yearly"
                ? "Yearly"
                : "Custom"
      } Report Generated`,
      description:
        reports.data?.dateRange?.display || "Report is being generated...",
      time: reports.data ? "Updated" : "Loading...",
    },
    {
      module: "reports",
      title: "Revenue Summary",
      description: reports.data?.summary
        ? `${reports.data.summary.totalBillings} billings processed`
        : "No data yet",
      time: reports.data ? "Ready" : "Pending",
    },
    {
      module: "reports",
      title: "Export Available",
      description: "Download reports in PDF or CSV format",
      time: reports.data ? "Ready" : "Waiting for data",
    },
  ];

  // Check if we should show the full-screen loader
  const showFullScreenLoader = reports.loading || initialLoad;

  return (
    <div className="h-full min-h-0 flex flex-col gap-6 relative">
      {/* Full-screen loader overlay */}
      {showFullScreenLoader && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <Loader
            size={60}
            variant="primary"
            showText={true}
            text={initialLoad ? "Loading dashboard..." : "Generating report..."}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div>
          <div className="text-2xl font-bold text-gray-900">
            Resort Dashboard
          </div>
          <div className="text-sm text-gray-600">
            Overview of bookings, revenue, and resort management
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {reports.error && (
        <div
          className="
          rounded-xl border border-red-200 
          bg-red-50
          p-4
        "
        >
          <div className="flex items-center gap-2 text-sm font-medium text-red-800">
            <FiFileText />
            Report Error: {reports.error}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <RevenueOverview />
        <RecentActivity items={activity} />
      </div>

      <div
        className="
        text-xs text-gray-600 flex items-center justify-between 
        pt-3 border-t border-gray-200 pb-2
      "
      >
        <div className="flex items-center gap-2">
          <FiClock className="text-[#0c2bfc]" />
          {reports.data?.metadata?.generatedAt ? (
            <>
              Report generated:{" "}
              {new Date(reports.data.metadata.generatedAt).toLocaleTimeString()}
            </>
          ) : (
            "Report not generated yet"
          )}
        </div>
      </div>
    </div>
  );
}
