import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiFilter, FiHome, FiSun, FiList, FiArrowLeft } from "react-icons/fi";
import { Helmet } from "react-helmet";
import toast, { Toaster } from "react-hot-toast";

import Loader from "../components/layout/Loader.jsx";
import Pagination from "../components/ui/Pagination.jsx";
import { getToken } from "../app/auth.js";

const API = import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

const ACTION_LABELS = {
  cleaning: "Cleaning",
  maintenance: "Maintenance",
  check_in: "Check In",
  check_out: "Check Out",
};

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function actorName(actor) {
  if (!actor) return "System";
  const full = `${actor.firstName || ""} ${actor.lastName || ""}`.trim();
  return full || actor.username || "System";
}

export default function OperationsLogs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get("unitType") === "cottage" ? "cottage" : "room";
  const [unitType, setUnitType] = useState(initialTab);
  const [actionFilter, setActionFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("unitType", unitType);
      return p;
    });
  }, [unitType, setSearchParams]);

  useEffect(() => {
    setPage(1);
  }, [unitType, actionFilter, startDate, endDate, pageSize]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      toast.error("No token found, please login again.");
      return;
    }

    const controller = new AbortController();
    const load = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          unitType,
          action: actionFilter,
          page: String(page),
          pageSize: String(pageSize),
        });
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);

        const res = await fetch(`${API}/rooms/operations-logs?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || data.error || "Failed to load logs");
        }

        const list = Array.isArray(data.logs) ? data.logs : [];
        setLogs(list);
        setTotal(Number(data?.pagination?.total || 0));
        setTotalPages(Math.max(1, Number(data?.pagination?.totalPages || 1)));
      } catch (err) {
        if (err?.name !== "AbortError") {
          toast.error(err.message || "Failed to load operation logs");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [unitType, actionFilter, startDate, endDate, page, pageSize]);

  const pageData = useMemo(() => logs, [logs]);

  return (
    <>
      <Helmet>
        <title>Operations Logs - Resort Admin</title>
      </Helmet>
      <div className="min-h-full flex flex-col gap-6">
        <Toaster position="top-center" reverseOrder={false} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xl font-bold text-gray-900">Operations Logs</div>
            <div className="text-sm text-gray-600">
              Room and cottage status actions with timestamps
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                type="button"
                onClick={() => setUnitType("room")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  unitType === "room"
                    ? "bg-[#0c2bfc] text-white border-[#0c2bfc] shadow-md"
                    : "bg-white text-gray-700 border-gray-200 hover:border-[#0c2bfc]/40"
                }`}
              >
                <FiHome className="w-4 h-4" /> Rooms
              </button>
              <button
                type="button"
                onClick={() => setUnitType("cottage")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  unitType === "cottage"
                    ? "bg-[#00af00] text-white border-[#00af00] shadow-md"
                    : "bg-white text-gray-700 border-gray-200 hover:border-[#00af00]/40"
                }`}
              >
                <FiSun className="w-4 h-4" /> Cottages
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/rooms")}
            className="h-11 px-5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium inline-flex items-center gap-2 text-gray-700 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Rooms & Cottages
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs text-gray-500">Action</label>
                <div className="mt-1">
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]"
                  >
                    <option value="all">All actions</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="check_in">Check In</option>
                    <option value="check_out">Check Out</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500">From date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">To date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <span className="text-sm text-gray-600 font-medium">Filters applied</span>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900 inline-flex items-center gap-2">
              <FiList className="text-[#0c2bfc]" />
              {unitType === "room" ? "Room Logs" : "Cottage Logs"} ({total})
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Show</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]"
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Unit ID
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Action
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Reservation
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Performed By
                  </th>
                  <th className="text-left font-semibold text-gray-700 px-6 py-4">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((log) => {
                  const unitNo = log?.unitId?.roomNo || log?.unitId?.roomNumber || "—";
                  const action = ACTION_LABELS[log?.action] || log?.action || "—";
                  return (
                    <tr
                      key={log._id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {unitNo}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{action}</td>
                      <td className="px-6 py-4 text-gray-700">
                        {log?.reservationId?.reservationNumber || "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {actorName(log?.performedBy)}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatDateTime(log?.createdAt)}
                      </td>
                    </tr>
                  );
                })}

                {!loading && pageData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="text-gray-700 font-medium text-lg">No logs found</div>
                      <div className="text-sm text-gray-500 mt-2">
                        Try changing action/date filters.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination
          page={page}
          totalPages={Math.max(1, totalPages)}
          setPage={setPage}
          total={total}
          pageSize={pageSize}
          color="blue"
        />

        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <Loader
              size={60}
              variant="primary"
              showText={true}
              text="Loading operation logs..."
            />
          </div>
        )}
      </div>
    </>
  );
}
