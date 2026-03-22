// pages/AmenityReservation.jsx
import { useEffect, useState, useMemo } from "react";
import {
  FiSearch,
  FiChevronLeft,
  FiCheck,
  FiMinus,
  FiPlus,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { useReservation } from "../context/ReservationContext";
import { useAmenityStore } from "../stores/amenityStore";
import {
  useReservationStore,
  reservationHelpers,
} from "../stores/reservationStore";
import toast, { Toaster } from "react-hot-toast";
import Loader from "../components/layout/Loader";
import Pagination from "../components/ui/Pagination";
import NotFound from "./NotFound";

export default function AmenityReservation() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get reservation ID from URL params
  const {
    reservation,
    loading: reservationLoading,
    error,
    refreshReservation,
  } = useReservation(); // This context should fetch the reservation by ID
  const { amenities: allAmenities, fetchAmenities } = useAmenityStore();
  const { updateReservationAmenities } = useReservationStore();

  const [loading, setLoading] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    // If reservation context doesn't handle loading, set loading state
    if (reservationLoading) {
      setLoading(true);
    } else {
      setLoading(false);
    }
  }, [reservationLoading]);

  useEffect(() => {
    const loadAmenities = async () => {
      try {
        setLoading(true);
        await fetchAmenities();
      } catch (error) {
        toast.error(error.message || "Failed to fetch amenities");
      } finally {
        setLoading(false);
      }
    };

    loadAmenities();
  }, [fetchAmenities]);

  // Initialize selected amenities from reservation OR start fresh
  useEffect(() => {
    if (reservation && !reservationLoading) {
      if (reservation?.amenities && reservation.amenities.length > 0) {
        // Initialize from existing reservation amenities
        const initialSelection = {};
        reservation.amenities.forEach((amenity) => {
          initialSelection[amenity.amenityId] = amenity.quantity;
        });
        setSelectedAmenities(initialSelection);
      } else {
        // No existing amenities, start with empty selection
        setSelectedAmenities({});
      }
    }
  }, [reservation, reservationLoading]);

  const handleQuantityChange = (amenityId, delta) => {
    setSelectedAmenities((prev) => {
      const currentQty = prev[amenityId] || 0;
      const newQty = Math.max(0, currentQty + delta);

      if (newQty === 0) {
        const { [amenityId]: removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [amenityId]: newQty,
      };
    });
  };

  const handleSetQuantity = (amenityId, quantity) => {
    const qty = parseInt(quantity) || 0;

    if (qty <= 0) {
      setSelectedAmenities((prev) => {
        const { [amenityId]: removed, ...rest } = prev;
        return rest;
      });
    } else {
      setSelectedAmenities((prev) => ({
        ...prev,
        [amenityId]: qty,
      }));
    }
  };

  const handleSaveChanges = async () => {
    if (!reservation) {
      toast.error("Reservation not found");
      return;
    }

    // Check if reservation can be modified
    if (!reservationHelpers.canModifyReservation(reservation)) {
      toast.error(`Cannot modify a ${reservation.status} reservation`);
      return;
    }

    try {
      setLoading(true);

      // Prepare data for the unified API
      const amenities = [];
      const removeAmenityIds = [];

      // Get current amenity IDs from reservation (if any)
      const currentAmenityIds =
        reservation.amenities?.map((a) => a.amenityId) || [];

      // Process selected amenities
      Object.entries(selectedAmenities).forEach(([amenityId, quantity]) => {
        if (quantity > 0) {
          amenities.push({
            amenityId,
            quantity,
          });
        }
      });

      // Find amenities to remove (were in reservation but now have quantity 0 or not in selected)
      currentAmenityIds.forEach((amenityId) => {
        if (
          !selectedAmenities[amenityId] ||
          selectedAmenities[amenityId] === 0
        ) {
          removeAmenityIds.push(amenityId);
        }
      });

      // Call the unified API
      await updateReservationAmenities({
        reservationId: reservation._id,
        amenities,
        removeAmenityIds,
      });

      toast.success("Amenities updated successfully");

      // Refresh reservation data
      if (refreshReservation) {
        await refreshReservation();
      }
    } catch (error) {
      toast.error(error.message || "Failed to update amenities");
    } finally {
      setLoading(false);
    }
  };

  const handleResetToCurrent = () => {
    if (reservation?.amenities && reservation.amenities.length > 0) {
      const initialSelection = {};
      reservation.amenities.forEach((amenity) => {
        initialSelection[amenity.amenityId] = amenity.quantity;
      });
      setSelectedAmenities(initialSelection);
      toast.success("Reset to current reservation amenities");
    } else {
      setSelectedAmenities({});
      toast.success("Cleared all selections");
    }
  };

  const handleClearAll = () => {
    setSelectedAmenities({});
    toast.success("All selections cleared");
  };

  // Filter amenities based on search and status
  const filteredAmenities = useMemo(() => {
    let filtered = allAmenities;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((amenity) =>
        amenity.name.toLowerCase().includes(searchLower),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((amenity) => amenity.status === statusFilter);
    }

    return filtered;
  }, [allAmenities, searchTerm, statusFilter]);

  const total = filteredAmenities.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedAmenities = filteredAmenities.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const selectedCount = Object.keys(selectedAmenities).filter(
    (id) => selectedAmenities[id] > 0,
  ).length;
  const totalSelectedQuantity = Object.values(selectedAmenities).reduce(
    (sum, qty) => sum + qty,
    0,
  );

  // Calculate changes from current reservation
  const currentAmenityMap = useMemo(() => {
    const map = {};
    if (reservation?.amenities && reservation.amenities.length > 0) {
      reservation.amenities.forEach((amenity) => {
        map[amenity.amenityId] = amenity.quantity;
      });
    }
    return map;
  }, [reservation]);

  const changes = useMemo(() => {
    const added = [];
    const updated = [];
    const removed = [];

    // Check for new additions (amenities with quantity > 0 that weren't in reservation)
    Object.entries(selectedAmenities).forEach(([amenityId, quantity]) => {
      const currentQty = currentAmenityMap[amenityId] || 0;
      if (currentQty === 0 && quantity > 0) {
        added.push({ amenityId, quantity });
      } else if (currentQty > 0 && quantity !== currentQty) {
        updated.push({ amenityId, from: currentQty, to: quantity });
      }
    });

    // Check for removals (amenities that were in reservation but now have 0 quantity)
    Object.keys(currentAmenityMap).forEach((amenityId) => {
      if (!selectedAmenities[amenityId] || selectedAmenities[amenityId] === 0) {
        removed.push(amenityId);
      }
    });

    return { added, updated, removed };
  }, [selectedAmenities, currentAmenityMap]);

  // Check if there are any changes
  const hasChanges =
    changes.added.length > 0 ||
    changes.updated.length > 0 ||
    changes.removed.length > 0;

  // Check if reservation has any amenities currently
  const hasExistingAmenities =
    reservation?.amenities && reservation.amenities.length > 0;

  // Show NotFound page if reservation doesn't exist and we're done loading
  if (!reservationLoading && !reservation) {
    return <NotFound />;
  }

  // Show loader while reservation is loading
  if (reservationLoading || loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader size={50} />
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col gap-4">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-semibold text-gray-900">
            Manage Amenities for Reservation
          </div>
          <div className="text-sm text-gray-500">
            {hasExistingAmenities
              ? "Add, update, or remove amenities for reservation"
              : "Add amenities to reservation"}{" "}
            # {reservation?.reservationNumber || reservation?._id?.slice(-6)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/reservations/${reservation?._id}`)}
            className="h-10 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium inline-flex items-center gap-2"
          >
            <FiChevronLeft /> Back to Reservation
          </button>

          <button
            onClick={handleClearAll}
            className="h-10 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium"
            title="Clear all selections"
          >
            Clear All
          </button>

          {hasExistingAmenities && (
            <button
              onClick={handleResetToCurrent}
              className="h-10 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium"
              title="Reset to current reservation amenities"
            >
              Reset
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={loading || !hasChanges}
            className="h-10 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiCheck /> {hasChanges ? "Save Changes" : "No Changes"}
          </button>
        </div>
      </div>

      {/* Reservation Info */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-500">Guest</div>
            <div className="text-sm font-medium text-gray-900">
              {reservation?.guestId?.firstName} {reservation?.guestId?.lastName}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Current Amenities</div>
            <div className="text-sm font-medium text-gray-900">
              {hasExistingAmenities ? (
                <>
                  {reservation.amenities.reduce(
                    (sum, amenity) => sum + amenity.quantity,
                    0,
                  )}{" "}
                  items
                  <div className="text-xs text-gray-500">
                    across {reservation.amenities.length} amenit
                    {reservation.amenities.length !== 1 ? "ies" : "y"}
                  </div>
                </>
              ) : (
                <span className="text-gray-500">No amenities added yet</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Changes</div>
            <div className="text-sm font-medium text-gray-900">
              {hasChanges ? (
                <>
                  <div>+{changes.added.length} to add</div>
                  <div>~{changes.updated.length} to update</div>
                  <div>-{changes.removed.length} to remove</div>
                </>
              ) : (
                <span className="text-gray-500">No changes made</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Changes Summary */}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <div className="text-sm font-medium text-yellow-900 mb-2">
            Pending Changes
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {changes.added.length > 0 && (
              <div className="text-sm text-yellow-800">
                <span className="font-medium">To Add:</span>{" "}
                {changes.added.length} amenit
                {changes.added.length !== 1 ? "ies" : "y"}
              </div>
            )}
            {changes.updated.length > 0 && (
              <div className="text-sm text-yellow-800">
                <span className="font-medium">To Update:</span>{" "}
                {changes.updated.length} amenit
                {changes.updated.length !== 1 ? "ies" : "y"}
              </div>
            )}
            {changes.removed.length > 0 && (
              <div className="text-sm text-yellow-800">
                <span className="font-medium">To Remove:</span>{" "}
                {changes.removed.length} amenit
                {changes.removed.length !== 1 ? "ies" : "y"}
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-yellow-700">
            Click "Save Changes" to apply these modifications to the
            reservation.
          </div>
        </div>
      )}

      {/* No Current Amenities Message */}
      {!hasExistingAmenities && !hasChanges && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="text-sm font-medium text-blue-900 mb-1">
            No amenities added yet
          </div>
          <div className="text-sm text-blue-700">
            This reservation currently has no amenities. Use the table below to
            add amenities. Select quantities and click "Save Changes" to add
            them to the reservation.
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search amenities by name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loader size={50} />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex-1 min-h-0 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-gray-700">
                Available Amenities ({filteredAmenities.length})
                {selectedCount > 0 && (
                  <span className="ml-2 text-blue-600">
                    • {selectedCount} selected ({totalSelectedQuantity} items)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              {filteredAmenities.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  No amenities found. Try adjusting your search filters.
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 sticky top-0 z-10">
                    <tr>
                      <th className="px-5 py-3 text-left">Amenity</th>
                      <th className="px-5 py-3 text-left">Rate</th>
                      <th className="px-5 py-3 text-left">Stock</th>
                      <th className="px-5 py-3 text-left">Status</th>
                      <th className="px-5 py-3 text-left">Current Qty</th>
                      <th className="px-5 py-3 text-left">New Qty</th>
                      <th className="px-5 py-3 text-left">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedAmenities.map((amenity) => {
                      const currentQty = currentAmenityMap[amenity._id] || 0;
                      const newQty = selectedAmenities[amenity._id] || 0;
                      const subtotal = newQty * amenity.rate;
                      const hasChanged = currentQty !== newQty;
                      const isNew = currentQty === 0 && newQty > 0;

                      return (
                        <tr
                          key={amenity._id}
                          className={
                            hasChanged
                              ? "bg-blue-50 hover:bg-blue-100"
                              : "hover:bg-gray-50"
                          }
                        >
                          <td className="px-5 py-3">
                            <div className="font-medium text-gray-900">
                              {amenity.name}
                              {hasChanged && (
                                <span className="ml-2 text-xs font-medium text-blue-600">
                                  {isNew
                                    ? "(New)"
                                    : currentQty > newQty
                                      ? "(Decrease)"
                                      : "(Increase)"}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-700">
                            {new Intl.NumberFormat("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            }).format(amenity.rate)}
                          </td>
                          <td className="px-5 py-3 text-gray-700">
                            <span
                              className={
                                newQty > amenity.stock
                                  ? "text-red-600 font-medium"
                                  : ""
                              }
                            >
                              {amenity.stock}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                amenity.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {amenity.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-500">
                            {currentQty > 0 ? currentQty : "—"}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleQuantityChange(amenity._id, -1)
                                }
                                disabled={newQty === 0}
                                className="h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                              >
                                <FiMinus className="text-gray-600" />
                              </button>
                              <input
                                type="number"
                                min="0"
                                max={amenity.stock}
                                value={newQty}
                                onChange={(e) =>
                                  handleSetQuantity(amenity._id, e.target.value)
                                }
                                className={`w-20 h-8 text-center rounded-lg border ${
                                  hasChanged
                                    ? "border-blue-300 bg-blue-50"
                                    : "border-gray-200 bg-white"
                                } focus:outline-none focus:ring-2 focus:ring-blue-200`}
                              />
                              <button
                                onClick={() =>
                                  handleQuantityChange(amenity._id, 1)
                                }
                                disabled={newQty >= amenity.stock}
                                className="h-8 w-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                              >
                                <FiPlus className="text-gray-600" />
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-3 font-medium text-gray-900">
                            {new Intl.NumberFormat("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            }).format(subtotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selected Summary */}
      {selectedCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-blue-900">
                Selected Amenities Summary
              </div>
              <div className="text-sm text-blue-700">
                {totalSelectedQuantity} items across {selectedCount} amenit
                {selectedCount !== 1 ? "ies" : "y"}
              </div>
            </div>
            <div className="text-lg font-semibold text-blue-900">
              Total:{" "}
              {new Intl.NumberFormat("en-PH", {
                style: "currency",
                currency: "PHP",
              }).format(
                Object.entries(selectedAmenities).reduce(
                  (total, [amenityId, quantity]) => {
                    const amenity = allAmenities.find(
                      (a) => a._id === amenityId,
                    );
                    return total + (amenity?.rate || 0) * quantity;
                  },
                  0,
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredAmenities.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          total={total}
          pageSize={pageSize}
        />
      )}
    </div>
  );
}
