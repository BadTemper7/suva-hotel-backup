// pages/Reports.jsx
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { useReportStore } from "../stores/reportStore.js";
import Loader from "../components/layout/Loader.jsx";
import toast, { Toaster } from "react-hot-toast";
import {
  FiDownload,
  FiFileText,
  FiBarChart2,
  FiTrendingUp,
  FiCreditCard,
  FiRefreshCw,
  FiCalendar,
  FiFilter,
  FiEye,
  FiChevronRight,
  FiPieChart,
  FiActivity,
  FiUsers,
  FiHome,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiMoreVertical,
  FiPlus,
} from "react-icons/fi";
import Pagination from "../components/ui/Pagination.jsx";

// Peso Icon Component
const PesoIcon = ({ className = "w-5 h-5", ...props }) => (
  <span
    className={`inline-flex items-center justify-center font-bold ${className}`}
    style={{ fontFamily: "system-ui" }}
    {...props}
  >
    ₱
  </span>
);

const Reports = () => {
  const {
    reports,
    loading,
    exportLoading,
    error,
    filters,
    setFilters,
    resetFilters,
    fetchReservationsReport,
    fetchReservationStatusReport,
    fetchOccupancyReport,
    fetchRevenueReport,
    fetchPaymentReport,
    fetchRefundReport,
    fetchOutstandingBalanceReport,
    exportToExcel,
    exportToPDF,
  } = useReportStore();

  const [activeTab, setActiveTab] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const reportTypes = [
    {
      label: "Reservations",
      value: "reservations",
      icon: <FiFileText />,
      color: "text-[#0c2bfc]",
      bgColor: "bg-[#0c2bfc]/10",
    },
    {
      label: "Status",
      value: "status",
      icon: <FiBarChart2 />,
      color: "text-[#0c2bfc]",
      bgColor: "bg-[#0c2bfc]/10",
    },
    {
      label: "Occupancy",
      value: "occupancy",
      icon: <FiHome />,
      color: "text-[#0c2bfc]",
      bgColor: "bg-[#0c2bfc]/10",
    },
    {
      label: "Revenue",
      value: "revenue",
      icon: <PesoIcon />,
      color: "text-[#00af00]",
      bgColor: "bg-[#00af00]/10",
    },
    {
      label: "Payments",
      value: "payments",
      icon: <FiCreditCard />,
      color: "text-[#0c2bfc]",
      bgColor: "bg-[#0c2bfc]/10",
    },
    {
      label: "Refunds",
      value: "refunds",
      icon: <FiRefreshCw />,
      color: "text-[#0c2bfc]",
      bgColor: "bg-[#0c2bfc]/10",
    },
    {
      label: "Outstanding",
      value: "outstanding",
      icon: <FiEye />,
      color: "text-[#0c2bfc]",
      bgColor: "bg-[#0c2bfc]/10",
    },
  ];

  const periods = [
    { label: "Today", value: "daily", icon: <FiActivity /> },
    { label: "This Week", value: "weekly", icon: <FiTrendingUp /> },
    { label: "This Month", value: "monthly", icon: <FiCalendar /> },
    { label: "Custom Range", value: "custom", icon: <FiFilter /> },
  ];

  const statusOptions = [
    { label: "All Status", value: "all", color: "text-gray-600" },
    { label: "Pending", value: "pending", color: "text-[#0c2bfc]" },
    { label: "Confirmed", value: "confirmed", color: "text-[#00af00]" },
    { label: "Checked In", value: "checked_in", color: "text-blue-600" },
    { label: "Checked Out", value: "checked_out", color: "text-emerald-600" },
    { label: "Cancelled", value: "cancelled", color: "text-red-600" },
    { label: "Expired", value: "expired", color: "text-gray-600" },
    { label: "No Show", value: "no_show", color: "text-orange-600" },
  ];

  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);

    setDateRange({
      startDate: lastWeek,
      endDate: today,
    });
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    fetchReservationsReport();
    fetchReservationStatusReport();
    fetchOccupancyReport();
    fetchRevenueReport();
    fetchPaymentReport();
    fetchRefundReport();
    fetchOutstandingBalanceReport();
  }, []);

  const handleTabChange = (index) => {
    setActiveTab(index);
  };

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value });
  };

  const handleDateChange = (key, date) => {
    setDateRange((prev) => ({ ...prev, [key]: date }));
    if (key === "startDate") {
      setFilters({ startDate: date.toISOString() });
    } else {
      setFilters({ endDate: date.toISOString() });
    }
  };

  const loadReport = async () => {
    const reportType = reportTypes[activeTab].value;
    const currentFilters = {
      ...filters,
      period: filters.period === "custom" ? "custom" : filters.period,
      startDate:
        filters.period === "custom"
          ? dateRange.startDate.toISOString()
          : undefined,
      endDate:
        filters.period === "custom"
          ? dateRange.endDate.toISOString()
          : undefined,
    };

    try {
      switch (reportType) {
        case "reservations":
          await fetchReservationsReport(currentFilters);
          break;
        case "status":
          await fetchReservationStatusReport(currentFilters);
          break;
        case "occupancy":
          await fetchOccupancyReport(currentFilters);
          break;
        case "revenue":
          await fetchRevenueReport(currentFilters);
          break;
        case "payments":
          await fetchPaymentReport(currentFilters);
          break;
        case "refunds":
          await fetchRefundReport(currentFilters);
          break;
        case "outstanding":
          await fetchOutstandingBalanceReport();
          break;
      }
      toast.success(`Report generated successfully!`);
    } catch (error) {
      toast.error(`Failed to generate report: ${error.message}`);
    }
  };

  const handleExport = async (format) => {
    const reportType = reportTypes[activeTab].value;
    const currentFilters = {
      ...filters,
      period: filters.period === "custom" ? "custom" : filters.period,
      startDate:
        filters.period === "custom"
          ? dateRange.startDate.toISOString()
          : undefined,
      endDate:
        filters.period === "custom"
          ? dateRange.endDate.toISOString()
          : undefined,
    };

    try {
      if (format === "excel") {
        await exportToExcel(reportType, currentFilters);
        toast.success("Excel report downloaded successfully!");
      } else {
        await exportToPDF(reportType, currentFilters);
        toast.success("PDF report downloaded successfully!");
      }
    } catch (error) {
      toast.error(`Failed to export report: ${error.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
      case "checked_out":
      case "paid":
        return "bg-[#00af00]/10 text-[#00af00]";
      case "pending":
      case "partial":
        return "bg-[#0c2bfc]/10 text-[#0c2bfc]";
      case "cancelled":
      case "expired":
      case "no_show":
      case "unpaid":
        return "bg-red-100 text-red-700";
      case "checked_in":
        return "bg-blue-100 text-blue-700";
      case "available":
      case "active":
        return "bg-green-100 text-green-700";
      case "occupied":
        return "bg-purple-100 text-purple-700";
      case "refunded":
        return "bg-indigo-100 text-indigo-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const StatusBadge = ({ status }) => {
    const formattedStatus = status
      ?.replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
    return (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${getStatusColor(status)}`}
      >
        {formattedStatus || status}
      </span>
    );
  };

  const MetricCard = ({ title, value, icon, color, trend }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`mt-2 text-2xl font-bold text-gray-900`}>{value}</p>
        </div>
        <div className={`p-3 rounded-xl bg-gray-100`}>
          <span className={`text-2xl text-[#0c2bfc]`}>{icon}</span>
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span
            className={`${trend.value > 0 ? "text-[#00af00] font-medium" : "text-red-600 font-medium"}`}
          >
            {trend.value > 0 ? "+" : ""}
            {trend.value}%
          </span>
          <span className="text-gray-500 ml-2">vs last period</span>
        </div>
      )}
    </div>
  );

  const renderReservationsReport = () => {
    const data = reports.reservations;
    if (!data) return null;

    // Helper to format numbers
    const formatNumber = (num) => {
      if (num === undefined || num === null) return "0";
      return Number(num).toLocaleString();
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Reservations"
            value={formatNumber(data.totalReservations || 0)}
            icon={<FiUsers />}
          />
          <MetricCard
            title="New Reservations"
            value={formatNumber(data.newReservations || 0)}
            icon={<FiActivity />}
            trend={data.newReservations > 0 ? { value: 0 } : null}
          />
          <MetricCard
            title="Avg. Stay Duration"
            value={`${data.averageNights || 0} night${data.averageNights !== 1 ? "s" : ""}`}
            icon={<FiClock />}
          />
          <MetricCard
            title="Cancellation Rate"
            value={`${data.cancellationRate || 0}%`}
            icon={<FiXCircle />}
            trend={
              data.cancellationRate > 0
                ? { value: -data.cancellationRate }
                : null
            }
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Reservation Details
              </h3>
              {data.dateRange && (
                <span className="text-sm text-gray-600">
                  {format(new Date(data.dateRange.start), "MMM dd, yyyy")} -{" "}
                  {format(new Date(data.dateRange.end), "MMM dd, yyyy")}
                </span>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Reservation #
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Guest
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Dates
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Rooms
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Nights
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Status
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.reservations?.map((reservation) => (
                  <tr
                    key={reservation._id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-xl flex items-center justify-center mr-3 border border-gray-200">
                          <FiFileText className="text-[#0c2bfc]" />
                        </div>
                        <span className="font-semibold">
                          {reservation.reservationNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {reservation.guestId
                            ? `${reservation.guestId.firstName || ""} ${reservation.guestId.lastName || ""}`.trim()
                            : "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {reservation.guestId?.email || ""}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <FiCalendar
                            className="mr-2 text-gray-400"
                            size={14}
                          />
                          <span className="text-gray-700">
                            {reservation.checkIn
                              ? format(new Date(reservation.checkIn), "MMM dd")
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <FiChevronRight
                            className="mr-2 text-gray-400"
                            size={14}
                          />
                          <span className="text-gray-700">
                            {reservation.checkOut
                              ? format(new Date(reservation.checkOut), "MMM dd")
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {reservation.rooms?.map((room, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md border border-gray-200"
                          >
                            {room.roomNumber || "N/A"}
                          </span>
                        ))}
                        {(!reservation.rooms ||
                          reservation.rooms.length === 0) && (
                          <span className="text-gray-400 italic">No rooms</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {reservation.nights || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={reservation.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {reservation.createdAt
                        ? format(
                            new Date(reservation.createdAt),
                            "MMM dd, yyyy",
                          )
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(!data.reservations || data.reservations.length === 0) && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <FiFileText className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-500">
                No reservations found for this period
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReservationStatusReport = () => {
    const data = reports.reservationStatus;
    if (!data) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Status Distribution
              </h3>
              <div className="space-y-4">
                {data.summary?.map((item) => (
                  <div key={item.status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${getStatusColor(item.status)}`}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {item.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-semibold text-gray-900">
                          {item.count}
                        </span>
                        <span className="text-sm text-gray-600">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor:
                            item.status === "confirmed"
                              ? "#00af00"
                              : item.status === "pending"
                                ? "#0c2bfc"
                                : "#ef4444",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">
                Quick Stats
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Total Reservations
                  </span>
                  <span className="font-semibold text-gray-900">
                    {data.total}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Now</span>
                  <span className="font-semibold text-[#00af00]">
                    {data.active}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="font-semibold text-blue-600">
                    {data.completed}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4 border border-gray-200">
                  <FiPieChart className="text-3xl text-[#0c2bfc]" />
                </div>
                <p className="text-sm text-gray-600 mb-2">Report Period</p>
                <p className="text-lg font-semibold text-gray-900">
                  {format(new Date(data.dateRange?.start), "MMM dd")} -{" "}
                  {format(new Date(data.dateRange?.end), "MMM dd, yyyy")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRevenueReport = () => {
    const data = reports.revenue;
    if (!data) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(data.totals?.totalRevenue)}
            icon={<PesoIcon />}
          />
          <MetricCard
            title="Amount Collected"
            value={formatCurrency(data.totals?.totalPaid)}
            icon={<FiCheckCircle />}
          />
          <MetricCard
            title="Outstanding"
            value={formatCurrency(data.totals?.totalBalance)}
            icon={<FiClock />}
          />
          <MetricCard
            title="Avg. Transaction"
            value={formatCurrency(data.averageTransaction || 0)}
            icon={<FiTrendingUp />}
          />
        </div>

        {data.paymentMethodSummary && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Payment Methods
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(data.paymentMethodSummary).map(
                ([method, stats]) => (
                  <div
                    key={method}
                    className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {method}
                      </span>
                      <span className="text-xs font-semibold px-2 py-1 bg-gray-200 text-gray-700 rounded-full border border-gray-300">
                        {stats.count}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(stats.amount)}
                    </p>
                    <div className="mt-3 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0c2bfc] rounded-full"
                        style={{
                          width: `${(stats.amount / data.totals?.totalPaid) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOccupancyReport = () => {
    const data = reports.occupancy;
    if (!data) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Rooms"
            value={data.totalRooms}
            icon={<FiHome />}
          />
          <MetricCard
            title="Occupied Rooms"
            value={data.occupiedRooms}
            icon={<FiUsers />}
          />
          <MetricCard
            title="Available Rooms"
            value={data.availableRooms}
            icon={<FiCheckCircle />}
          />
          <MetricCard
            title="Occupancy Rate"
            value={`${data.overallOccupancyRate?.toFixed(1)}%`}
            icon={<FiTrendingUp />}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Room Occupancy Details
              </h3>
              <span className="text-sm text-gray-600">
                {format(new Date(data.dateRange?.start), "MMM dd, yyyy")} -{" "}
                {format(new Date(data.dateRange?.end), "MMM dd, yyyy")}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Room
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Type
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Capacity
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Status
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Occupied Days
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Occupancy Rate
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Current Reservations
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.rooms?.map((item) => (
                  <tr
                    key={item.room._id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-xl flex items-center justify-center mr-3 border border-gray-200">
                          <FiHome className="text-[#0c2bfc]" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.room.roomNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            Floor: {item.room.floor || "N/A"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                        {item.room.roomType?.name || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FiUsers className="mr-2 text-gray-400" />
                        <span className="font-medium text-gray-700">
                          {item.room.capacity}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.room.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">
                          {item.occupiedDays}
                        </p>
                        <p className="text-xs text-gray-500">
                          out of {item.totalDays}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <p className="text-lg font-bold text-[#0c2bfc]">
                          {item.occupancyRate?.toFixed(2)}%
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-[#0c2bfc]"
                            style={{
                              width: `${Math.min(item.occupancyRate, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.currentReservations?.length > 0 ? (
                        <div className="space-y-2">
                          {item.currentReservations.map((reservation) => (
                            <div
                              key={reservation.reservationId}
                              className="text-sm"
                            >
                              <p className="font-medium text-gray-900">
                                {reservation.reservationNumber}
                              </p>
                              <p className="text-xs text-gray-500">
                                {reservation.guest?.firstName}{" "}
                                {reservation.guest?.lastName}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">
                          No active reservations
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderPaymentReport = () => {
    const data = reports.payments;
    if (!data) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Payments"
            value={formatCurrency(data.totals?.totalAmountPaid)}
            icon={<FiCreditCard />}
          />
          <MetricCard
            title="Total Received"
            value={formatCurrency(data.totals?.totalAmountReceived)}
            icon={<PesoIcon />}
          />
          <MetricCard
            title="Total Change"
            value={formatCurrency(data.totals?.totalChange)}
            icon={<FiRefreshCw />}
          />
          <MetricCard
            title="Transactions"
            value={data.totals?.count}
            icon={<FiActivity />}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Payment Transactions
              </h3>
              <span className="text-sm text-gray-600">
                {format(new Date(data.dateRange?.start), "MMM dd, yyyy")} -{" "}
                {format(new Date(data.dateRange?.end), "MMM dd, yyyy")}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Receipt ID
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Billing #
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Guest
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Payment Method
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Amount Paid
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Amount Received
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Change
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Status
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.receipts?.map((receipt) => (
                  <tr
                    key={receipt._id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-xl flex items-center justify-center mr-3 border border-gray-200">
                          <FiCreditCard className="text-[#0c2bfc]" />
                        </div>
                        <span className="font-mono">
                          {receipt._id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {receipt.billingId?.billingNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {receipt.billingId?.reservationId?.guestId?.firstName}{" "}
                          {receipt.billingId?.reservationId?.guestId?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {receipt.billingId?.reservationId?.guestId?.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                        {receipt.paymentType?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-[#00af00]">
                        {formatCurrency(receipt.amountPaid)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(receipt.amountReceived)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p
                        className={
                          receipt.change > 0
                            ? "text-[#0c2bfc] font-medium"
                            : "text-gray-500"
                        }
                      >
                        {formatCurrency(receipt.change)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={receipt.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(
                        new Date(receipt.createdAt),
                        "MMM dd, yyyy HH:mm",
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderRefundReport = () => {
    const data = reports.refunds;
    if (!data) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCard
            title="Total Refunded"
            value={formatCurrency(data.totals?.totalRefunded)}
            icon={<FiRefreshCw />}
          />
          <MetricCard
            title="Refund Transactions"
            value={data.totals?.count}
            icon={<FiActivity />}
          />
        </div>

        {data.refunds?.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Refund Details
                </h3>
                <span className="text-sm text-gray-600">
                  {format(new Date(data.dateRange?.start), "MMM dd, yyyy")} -{" "}
                  {format(new Date(data.dateRange?.end), "MMM dd, yyyy")}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left font-semibold text-gray-700 px-6 py-4">
                      Billing #
                    </th>
                    <th className="text-left font-semibold text-gray-700 px-6 py-4">
                      Reservation #
                    </th>
                    <th className="text-left font-semibold text-gray-700 px-6 py-4">
                      Guest
                    </th>
                    <th className="text-left font-semibold text-gray-700 px-6 py-4">
                      Original Amount
                    </th>
                    <th className="text-left font-semibold text-gray-700 px-6 py-4">
                      Refund Amount
                    </th>
                    <th className="text-left font-semibold text-gray-700 px-6 py-4">
                      Refunded At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.refunds?.map((refund) => (
                    <tr
                      key={refund.billingNumber}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {refund.billingNumber}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">
                          {refund.reservationNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {refund.guest?.firstName} {refund.guest?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {refund.guest?.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700">
                          {formatCurrency(refund.originalAmount)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-red-600">
                          {formatCurrency(refund.refundAmount)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {format(
                          new Date(refund.refundedAt),
                          "MMM dd, yyyy HH:mm",
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
              <FiRefreshCw className="text-gray-400 text-3xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Refunds Found
            </h3>
            <p className="text-gray-500">
              There are no refunds for the selected period.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderOutstandingBalanceReport = () => {
    const data = reports.outstandingBalances;
    if (!data) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Total Outstanding"
            value={formatCurrency(data.totals?.totalOutstanding)}
            icon={<FiEye />}
          />
          <MetricCard
            title="Overdue Amount"
            value={formatCurrency(data.overdue?.amount)}
            icon={<FiClock />}
          />
          <MetricCard
            title="Outstanding Reservations"
            value={data.totals?.count}
            icon={<FiUsers />}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Outstanding Balances
              </h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Billing #
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Reservation #
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Guest
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Check-In / Check-Out
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Total Amount
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Amount Paid
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Balance
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.allOutstanding?.map((billing) => {
                  // Safely format dates with validation
                  const formatDateSafely = (dateString) => {
                    if (!dateString) return "N/A";
                    try {
                      const date = new Date(dateString);
                      if (isNaN(date.getTime())) return "Invalid Date";
                      return format(date, "MMM dd, yyyy");
                    } catch (error) {
                      return "Invalid Date";
                    }
                  };

                  return (
                    <tr
                      key={billing._id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {billing.billingNumber}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">
                          {billing.reservationId?.reservationNumber || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {billing.reservationId?.guestId?.firstName || ""}{" "}
                            {billing.reservationId?.guestId?.lastName || ""}
                          </p>
                          <p className="text-sm text-gray-600">
                            {billing.reservationId?.guestId?.email || "N/A"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <FiCalendar
                              className="mr-2 text-gray-400"
                              size={14}
                            />
                            <span className="text-gray-700">
                              {formatDateSafely(billing.reservationId?.checkIn)}
                            </span>
                          </div>
                          <div className="flex items-center text-sm">
                            <FiChevronRight
                              className="mr-2 text-gray-400"
                              size={14}
                            />
                            <span className="text-gray-700">
                              {formatDateSafely(
                                billing.reservationId?.checkOut,
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700">
                          {formatCurrency(billing.totalAmount)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[#00af00] font-medium">
                          {formatCurrency(billing.amountPaid)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          {formatCurrency(billing.balance)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={billing.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderReportContent = () => {
    const reportType = reportTypes[activeTab].value;

    switch (reportType) {
      case "reservations":
        return renderReservationsReport();
      case "status":
        return renderReservationStatusReport();
      case "occupancy":
        return renderOccupancyReport();
      case "revenue":
        return renderRevenueReport();
      case "payments":
        return renderPaymentReport();
      case "refunds":
        return renderRefundReport();
      case "outstanding":
        return renderOutstandingBalanceReport();
      default:
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 border border-gray-200">
              <FiBarChart2 className="text-4xl text-[#0c2bfc]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Report Generated
            </h3>
            <p className="text-gray-500 text-center max-w-md">
              Select a report type, configure your filters, and click "Generate
              Report" to view detailed analytics for your hotel operations.
            </p>
            <button
              onClick={loadReport}
              className="
                mt-6 px-6 py-3 
                bg-[#0c2bfc] hover:bg-[#0a24d6]
                text-white rounded-xl font-medium 
                hover:shadow-lg hover:-translate-y-0.5
                transition-all duration-200
                active:translate-y-0
              "
            >
              Generate Your First Report
            </button>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
        <div className="w-16 h-16 mb-4">
          <Loader
            size={60}
            variant="primary"
            showText={true}
            text="Generating report..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col gap-6">
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: "#ffffff",
            color: "#1f2937",
            border: "1px solid #e5e7eb",
          },
        }}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xl font-bold text-gray-900">
            Analytics Dashboard
          </div>
          <div className="text-sm text-gray-600">
            Generate insights and make data-driven decisions
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="
              h-11 px-5 rounded-xl 
              border border-gray-200 
              bg-white
              hover:bg-gray-50
              text-sm font-medium inline-flex items-center gap-2
              transition-all duration-200
              hover:shadow-md hover:-translate-y-0.5
              active:translate-y-0
              text-gray-700 hover:text-[#0c2bfc]
            "
          >
            <FiFilter className="w-4 h-4" /> Filters
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => handleExport("excel")}
              disabled={exportLoading}
              className="
                h-11 px-5 rounded-xl 
                bg-[#00af00] hover:bg-[#009500]
                text-white text-sm font-medium inline-flex items-center gap-2
                transition-all duration-200
                hover:shadow-lg hover:-translate-y-0.5
                active:translate-y-0
                disabled:opacity-70 disabled:cursor-not-allowed
              "
            >
              <FiDownload className="w-4 h-4" /> Excel
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={exportLoading}
              className="
                h-11 px-5 rounded-xl 
                bg-[#0c2bfc] hover:bg-[#0a24d6]
                text-white text-sm font-medium inline-flex items-center gap-2
                transition-all duration-200
                hover:shadow-lg hover:-translate-y-0.5
                active:translate-y-0
                disabled:opacity-70 disabled:cursor-not-allowed
              "
            >
              <FiDownload className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Report Type Cards */}
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
          {reportTypes.map((type, index) => (
            <button
              key={type.value}
              onClick={() => handleTabChange(index)}
              className={`
                p-4 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-3
                hover:-translate-y-0.5
                ${
                  activeTab === index
                    ? `border-2 border-[#0c2bfc] bg-white shadow-lg scale-[1.02]`
                    : "border-gray-200 bg-white hover:shadow-md"
                }
              `}
            >
              <div
                className={`p-3 rounded-xl ${type.bgColor} border border-gray-200`}
              >
                <span className={`text-2xl ${type.color}`}>{type.icon}</span>
              </div>
              <span
                className={`text-sm font-medium ${activeTab === index ? "text-[#0c2bfc]" : "text-gray-700"}`}
              >
                {type.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Filter Settings
            </h3>
            <button
              onClick={() => setShowFilters(false)}
              className="
                p-2 rounded-xl hover:bg-gray-50
                transition-all duration-200
              "
            >
              <FiXCircle className="text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Time Period
              </label>
              <div className="grid grid-cols-2 gap-2">
                {periods.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => handleFilterChange("period", period.value)}
                    className={`
                      p-3 rounded-xl border text-sm font-medium transition-all duration-200
                      hover:shadow-md hover:-translate-y-0.5
                      ${
                        filters.period === period.value
                          ? "border-[#0c2bfc] bg-[#0c2bfc]/5 text-[#0c2bfc] shadow-sm"
                          : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                      }
                    `}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {filters.period === "custom" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate.toISOString().split("T")[0]}
                    onChange={(e) =>
                      handleDateChange("startDate", new Date(e.target.value))
                    }
                    className="
                      w-full p-3 rounded-xl border border-gray-200 
                      bg-white
                      focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                      outline-none transition-all duration-200
                    "
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate.toISOString().split("T")[0]}
                    onChange={(e) =>
                      handleDateChange("endDate", new Date(e.target.value))
                    }
                    className="
                      w-full p-3 rounded-xl border border-gray-200 
                      bg-white
                      focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                      outline-none transition-all duration-200
                    "
                  />
                </div>
              </>
            )}

            {activeTab === 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Status Filter
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="
                    w-full p-3 rounded-xl border border-gray-200 
                    bg-white
                    focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                    outline-none transition-all duration-200
                    appearance-none
                  "
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={resetFilters}
              className="
                px-5 py-2.5 rounded-xl 
                border border-gray-200 
                bg-white
                hover:bg-gray-50
                text-gray-700 font-medium
                transition-all duration-200
                hover:shadow-md hover:-translate-y-0.5
                active:translate-y-0
              "
            >
              Reset All
            </button>
            <button
              onClick={loadReport}
              disabled={loading}
              className="
                px-5 py-2.5 rounded-xl 
                bg-[#0c2bfc] hover:bg-[#0a24d6]
                text-white font-medium
                transition-all duration-200
                hover:shadow-lg hover:-translate-y-0.5
                active:translate-y-0
                disabled:opacity-70 disabled:cursor-not-allowed
              "
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader size="small" /> Generating...
                </span>
              ) : (
                "Apply Filters & Generate"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className="flex-1 min-h-0 flex flex-col 
        bg-white
        border border-gray-200 rounded-xl 
        overflow-hidden shadow-sm"
      >
        <div
          className="
          px-6 py-4 border-b border-gray-200 
          flex items-center justify-between gap-3
          bg-gray-50
        "
        >
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {reportTypes[activeTab].label} Report
            </h2>
            {reports[reportTypes[activeTab].value]?.dateRange && (
              <p className="text-sm text-gray-600 mt-1">
                {format(
                  new Date(
                    reports[reportTypes[activeTab].value].dateRange.start,
                  ),
                  "MMM dd, yyyy",
                )}
                {" - "}
                {format(
                  new Date(reports[reportTypes[activeTab].value].dateRange.end),
                  "MMM dd, yyyy",
                )}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="
                p-2 rounded-xl hover:bg-gray-50
                transition-all duration-200
              "
            >
              <FiMoreVertical className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 min-h-0 overflow-auto">
          {renderReportContent()}
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Last updated: {format(new Date(), "MMM dd, yyyy HH:mm")}
        </p>
      </div>
    </div>
  );
};

export default Reports;
