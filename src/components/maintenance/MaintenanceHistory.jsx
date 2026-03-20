// components/maintenance/MaintenanceHistory.jsx
import React, { useState, useEffect } from "react";
import { FiCalendar, FiFilter, FiSearch, FiFileText } from "react-icons/fi";
import { format } from "date-fns";

export default function MaintenanceHistory({ roomId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    type: "all",
  });

  // Mock data - replace with API call
  const mockHistory = [
    {
      id: 1,
      date: "2024-01-15",
      type: "cleaning",
      description: "Routine cleaning",
      staff: "John Doe",
      status: "completed",
      duration: "2 hours",
    },
    {
      id: 2,
      date: "2024-01-10",
      type: "maintenance",
      description: "AC repair",
      staff: "Mike Johnson",
      status: "completed",
      duration: "4 hours",
    },
    {
      id: 3,
      date: "2024-01-05",
      type: "inspection",
      description: "Monthly inspection",
      staff: "Sarah Wilson",
      status: "completed",
      duration: "1 hour",
    },
  ];

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setHistory(mockHistory);
      setLoading(false);
    }, 500);
  }, [roomId]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Maintenance History
          </h3>
          <button
            type="button"
            className="text-xs text-[#0c2bfc] hover:text-[#0a24d6] font-medium transition-colors"
          >
            View All
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="h-8 px-3 rounded-lg border border-gray-200 text-xs outline-none focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20 bg-white transition-all"
          >
            <option value="all">All Types</option>
            <option value="cleaning">Cleaning</option>
            <option value="maintenance">Maintenance</option>
            <option value="inspection">Inspection</option>
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) =>
              setFilters({ ...filters, dateFrom: e.target.value })
            }
            className="h-8 px-3 rounded-lg border border-gray-200 text-xs outline-none focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20 bg-white transition-all"
            placeholder="From"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="h-8 px-3 rounded-lg border border-gray-200 text-xs outline-none focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20 bg-white transition-all"
            placeholder="To"
          />
        </div>

        {/* History List */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="flex justify-center mb-2">
                <div className="w-8 h-8 border-2 border-gray-200 border-t-[#0c2bfc] rounded-full animate-spin"></div>
              </div>
              Loading history...
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiFileText className="mx-auto text-3xl text-gray-300 mb-2" />
              No maintenance history found
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 p-3 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm hover:border-gray-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <FiCalendar className="text-gray-400" size={14} />
                        <span className="text-xs font-medium text-gray-900">
                          {format(new Date(item.date), "MMM dd, yyyy")}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.type === "cleaning"
                            ? "bg-[#00af00]/10 text-[#00af00]"
                            : item.type === "maintenance"
                              ? "bg-[#0c2bfc]/10 text-[#0c2bfc]"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 font-medium">
                      {item.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      By {item.staff} • {item.duration}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                      item.status === "completed"
                        ? "bg-[#00af00]/10 text-[#00af00]"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Summary footer */}
      {history.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">
              Total records:{" "}
              <span className="font-medium text-gray-900">
                {history.length}
              </span>
            </span>
            <button className="text-[#0c2bfc] hover:text-[#0a24d6] font-medium flex items-center gap-1 transition-colors">
              <FiFileText size={14} />
              Export Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
