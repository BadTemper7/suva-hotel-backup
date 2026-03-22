import { useEffect, useState, useMemo } from "react";
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiHome,
  FiCalendar,
  FiUsers,
  FiDollarSign,
  FiSun,
  FiFilter,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useReservationStore } from "../stores/reservationStore.js";
import toast, { Toaster } from "react-hot-toast";
import Loader from "../components/layout/Loader.jsx";
import { Helmet } from "react-helmet";
import Pagination from "../components/ui/Pagination.jsx";

function startOfDayISO(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function addDaysISO(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function RoomCard({ item }) {
  const money = (n) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(n || 0);

  const isCottage = item.category === "cottage";

  return (
    <div
      className="
      rounded-xl border border-gray-200 
      bg-white
      p-4
      shadow-sm hover:shadow-md transition-all duration-300
      hover:-translate-y-0.5
    "
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-gray-900">
              {isCottage ? "Cottage" : "Room"} {item.roomNumber}
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                isCottage
                  ? "bg-[#00af00]/10 text-[#00af00]"
                  : "bg-[#0c2bfc]/10 text-[#0c2bfc]"
              }`}
            >
              {isCottage ? "Cottage" : "Room"}
            </span>
          </div>
          <div className="text-xs text-gray-600 font-medium mt-1">
            {isCottage ? item.description || "—" : item.roomType?.name || "—"}
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-[#00af00]/10 border border-[#00af00]/20">
          <span className="text-xs font-medium text-[#00af00]">Available</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gray-100">
            <FiUsers className="w-4 h-4 text-[#0c2bfc]" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Capacity</div>
            <div className="text-sm font-semibold text-gray-900">
              {item.capacity}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gray-100">
            <FiDollarSign className="w-4 h-4 text-[#00af00]" />
          </div>
          <div>
            <div className="text-xs text-gray-500">Rate</div>
            <div className="text-sm font-semibold text-gray-900">
              {money(item.rate)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <FiCalendar className="w-3 h-3 text-[#0c2bfc]" />
          Available for today's check-in
        </div>
      </div>
    </div>
  );
}

export default function AvailableToday() {
  const [loading, setLoading] = useState(false);
  const [availableItems, setAvailableItems] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all"); // "all", "room", "cottage"
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { fetchAvailableRooms } = useReservationStore();
  const navigate = useNavigate();

  const checkInISO = startOfDayISO();
  const checkOutISO = addDaysISO(checkInISO, 1);

  useEffect(() => {
    const loadAvailableItems = async () => {
      try {
        setLoading(true);
        const data = await fetchAvailableRooms({
          checkIn: checkInISO,
          checkOut: checkOutISO,
        });

        setAvailableItems(data);
      } catch (error) {
        toast.error(error.message || "Failed to fetch available items");
      } finally {
        setLoading(false);
      }
    };
    loadAvailableItems();
  }, [fetchAvailableRooms]);

  // Filter items based on category
  const filteredItems = useMemo(() => {
    if (categoryFilter === "all") return availableItems;
    return availableItems.filter((item) => item.category === categoryFilter);
  }, [availableItems, categoryFilter]);

  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedItems = filteredItems.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [categoryFilter]);

  const money = (n) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(n || 0);

  // Calculate counts
  const roomCount = availableItems.filter(
    (item) => item.category === "room",
  ).length;
  const cottageCount = availableItems.filter(
    (item) => item.category === "cottage",
  ).length;

  return (
    <>
      <Helmet>
        <title>Available Rooms & Cottages Today - Resort Admin</title>
      </Helmet>
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
              Available Rooms & Cottages Today
            </div>
            <div className="text-sm text-gray-600">
              View rooms and cottages available for today's check-in. Create new
              reservations for available items.
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <FiCalendar className="w-3 h-3 text-[#0c2bfc]" />
                Check-in date:{" "}
                {new Date(checkInISO).toLocaleDateString("en-PH", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#0c2bfc]"></span>
                  Rooms: {roomCount}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#00af00]"></span>
                  Cottages: {cottageCount}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/rooms")}
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
              title="Go to Rooms & Cottages"
            >
              <FiHome className="w-4 h-4" />
              All Items
            </button>

            <button
              type="button"
              onClick={() => navigate("/reservation-process")}
              className="
                h-11 px-5 rounded-xl 
                bg-[#0c2bfc] 
                hover:bg-[#0a24d6]
                text-white text-sm font-medium inline-flex items-center gap-2
                transition-all duration-200
                hover:shadow-lg hover:-translate-y-0.5
                active:translate-y-0
              "
            >
              <FiPlus className="w-4 h-4" /> Create Reservation
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400" />
            <span className="text-sm text-gray-600 font-medium">Show:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                categoryFilter === "all"
                  ? "bg-[#0c2bfc] text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              All ({availableItems.length})
            </button>
            <button
              onClick={() => setCategoryFilter("room")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                categoryFilter === "room"
                  ? "bg-[#0c2bfc] text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Rooms ({roomCount})
            </button>
            <button
              onClick={() => setCategoryFilter("cottage")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                categoryFilter === "cottage"
                  ? "bg-[#0c2bfc] text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Cottages ({cottageCount})
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader
                size={60}
                variant="primary"
                showText={true}
                text="Loading available items..."
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <div
            className="
            flex-1 flex flex-col items-center justify-center
            rounded-xl border border-gray-200 
            bg-white
            px-6 py-16 text-center
          "
          >
            <div className="text-gray-300 mb-3">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </div>
            <div className="text-gray-700 font-medium text-lg">
              {categoryFilter === "room"
                ? "No rooms available for today"
                : categoryFilter === "cottage"
                  ? "No cottages available for today"
                  : "No items available for today"}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {categoryFilter === "room"
                ? "All rooms are currently booked or unavailable"
                : categoryFilter === "cottage"
                  ? "All cottages are currently booked or unavailable"
                  : "All rooms and cottages are currently booked or unavailable"}
            </div>
            <button
              type="button"
              onClick={() => navigate("/rooms")}
              className="
                mt-4 h-10 px-4 rounded-xl 
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
              <FiHome className="w-4 h-4" />
              View All Items
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && filteredItems.length > 0 && (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {pagedItems.map((item) => (
                <RoomCard key={item._id} item={item} />
              ))}
            </div>

            {/* Desktop Table */}
            <div
              className="
              flex-1 min-h-0 hidden md:flex flex-col 
              bg-white
              border border-gray-200 rounded-xl 
              overflow-hidden shadow-sm
            "
            >
              <div
                className="
                px-6 py-4 border-b border-gray-200 
                flex items-center justify-between gap-3
                bg-gray-50
              "
              >
                <div className="text-sm font-semibold text-gray-900">
                  {categoryFilter === "room"
                    ? `Available Rooms (${total})`
                    : categoryFilter === "cottage"
                      ? `Available Cottages (${total})`
                      : `Available Items (${total})`}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">
                      Show
                    </span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                      className="
                        h-10 rounded-xl border border-gray-200 
                        bg-white px-3 text-sm outline-none 
                        focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
                        text-gray-700 font-medium
                      "
                    >
                      {[5, 10, 20, 50].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="text-left font-semibold text-gray-700 px-6 py-4">
                        #
                      </th>
                      <th className="text-left font-semibold text-gray-700 px-6 py-4">
                        Category
                      </th>
                      <th className="text-left font-semibold text-gray-700 px-6 py-4">
                        Type
                      </th>
                      <th className="text-left font-semibold text-gray-700 px-6 py-4">
                        Capacity
                      </th>
                      <th className="text-left font-semibold text-gray-700 px-6 py-4">
                        Rate
                      </th>
                      <th className="text-left font-semibold text-gray-700 px-6 py-4">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {pagedItems.map((item) => (
                      <tr
                        key={item._id}
                        className="
                          border-b border-gray-100 last:border-b-0
                          hover:bg-gray-50
                          transition-colors duration-150
                        "
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">
                            {item.roomNumber}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.category === "cottage"
                                ? "bg-[#00af00]/10 text-[#00af00]"
                                : "bg-[#0c2bfc]/10 text-[#0c2bfc]"
                            }`}
                          >
                            {item.category === "cottage" ? "Cottage" : "Room"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-gray-700 font-medium">
                            {item.category === "cottage"
                              ? item.description || "—"
                              : item.roomType?.name || "—"}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-gray-700 font-medium">
                            {item.capacity}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="text-gray-700 font-medium">
                            {money(item.rate)}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="px-3 py-1.5 rounded-full bg-[#00af00]/10 border border-[#00af00]/20 inline-block">
                            <span className="text-xs font-medium text-[#00af00]">
                              Available
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {pagedItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <div className="text-gray-300 mb-3">
                            <svg
                              className="w-16 h-16 mx-auto"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                              />
                            </svg>
                          </div>
                          <div className="text-gray-700 font-medium text-lg">
                            No available items
                          </div>
                          <div className="text-sm text-gray-500 mt-2">
                            All items are currently booked or unavailable
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <Pagination
              page={page}
              totalPages={totalPages}
              setPage={setPage}
              total={total}
              pageSize={pageSize}
              color="blue"
            />
          </>
        )}
      </div>
    </>
  );
}
