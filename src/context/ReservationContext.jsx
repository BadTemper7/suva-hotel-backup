// contexts/ReservationContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReservationStore } from "../stores/reservationStore";
import toast from "react-hot-toast";

const ReservationContext = createContext();

export function useReservation() {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error("useReservation must be used within ReservationProvider");
  }
  return context;
}

export function ReservationProvider({ children }) {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const { getReservationById } = useReservationStore();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadReservation = async () => {
      if (!reservationId) {
        setError("No reservation ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getReservationById(reservationId);
        if (!data) {
          setError("Reservation not found");
        } else {
          setReservation(data);
          setError(null);
        }
      } catch (err) {
        setError(err.message || "Failed to load reservation");
        toast.error(err.message || "Failed to load reservation");
      } finally {
        setLoading(false);
      }
    };

    loadReservation();
  }, [reservationId, getReservationById]);

  const refreshReservation = async () => {
    if (!reservationId) return;
    try {
      const data = await getReservationById(reservationId);
      setReservation(data);
    } catch (err) {
      toast.error(err.message || "Failed to refresh reservation");
    }
  };

  const value = {
    reservation,
    loading,
    error,
    refreshReservation,
    reservationId,
  };

  return (
    <ReservationContext.Provider value={value}>
      {children}
    </ReservationContext.Provider>
  );
}
