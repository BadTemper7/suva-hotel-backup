import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiTrash2,
  FiUploadCloud,
  FiX,
  FiRefreshCw,
  FiCheckCircle,
  FiPercent,
  FiUser,
  FiCalendar,
  FiHome,
  FiCreditCard,
  FiUsers,
  FiPackage,
  FiFilter,
  FiClock,
  FiSun,
} from "react-icons/fi";
import { Helmet } from "react-helmet";

import Loader from "../components/layout/Loader.jsx";
import { useReservationStore } from "../stores/reservationStore.js";
import { useAmenityStore } from "../stores/amenityStore.js";
import { usePaymentStore } from "../stores/paymentStore.js";
import { useGuestStore } from "../stores/guestStore.js";
import NumberInput from "../components/ui/NumberInput.jsx";
import Stepper from "../components/ui/NumberInput.jsx";

// Get admin info from localStorage
const admin_info = JSON.parse(localStorage.getItem("suva_admin_user") || "{}");
const EXAMPLE_USER_ID = admin_info._id || "";
const isAdmin = admin_info.role === "admin" || admin_info.role === "superadmin";

// Utility functions
const formatMoney = (n) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    Number(n || 0),
  );

const toISODateTime = (d) => {
  if (!d) return "";

  const date = new Date(d);
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - timezoneOffset);

  return localDate.toISOString().slice(0, 16);
};

const setTimeTo = (date, hours, minutes = 0) => {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

const getDefaultCheckIn = () => {
  const now = new Date();
  const checkIn = setTimeTo(now, 14, 0); // 2:00 PM

  if (checkIn < now) {
    checkIn.setDate(checkIn.getDate() + 1);
  }

  return toISODateTime(checkIn);
};

const getDefaultCheckOut = (checkInDate) => {
  if (!checkInDate) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toISODateTime(setTimeTo(tomorrow, 12, 0)); // 12:00 PM next day
  }
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 1);
  return toISODateTime(setTimeTo(checkOut, 12, 0));
};

const toISODate = (d) => {
  if (!d) return "";
  const x = new Date(d);
  const yyyy = x.getFullYear();
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

// Changed from hoursBetween to nightsBetween
const nightsBetween = (checkIn, checkOut) => {
  const a = new Date(checkIn);
  const b = new Date(checkOut);

  // Set both to start of day for night calculation
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);

  const diff = b - a;
  const nights = Math.ceil(diff / (1000 * 60 * 60 * 24)); // Convert to days
  return Math.max(1, nights); // At least 1 night
};

const validatePhone = (v) => /^09\d{9}$/.test(String(v || ""));
const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");
const validateName = (v) => {
  if (!v || !v.trim()) return false;
  return /^[A-Za-z\s]+$/.test(v.trim());
};

// Calculate maximum rooms based on adults
const calculateMaxRooms = (adults) => {
  return Math.max(1, Math.ceil(adults)); // At least 1 room
};

// Components
function FieldError({ text, className = "" }) {
  if (!text) return null;
  return <div className={`mb-1 text-xs text-red-600 ${className}`}>{text}</div>;
}

function Section({ title, subtitle, right, children, icon }) {
  return (
    <div
      className="
        rounded-xl border border-gray-200 
        bg-white
        p-5 shadow-sm
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {icon && (
            <div
              className="
                mt-1 p-2 rounded-lg 
                bg-gray-50
                border border-gray-200
              "
            >
              {React.cloneElement(icon, { className: "text-[#0c2bfc]" })}
            </div>
          )}
          <div>
            <div className="text-sm font-semibold text-gray-900">{title}</div>
            {subtitle && (
              <div className="text-xs text-gray-600 mt-1">{subtitle}</div>
            )}
          </div>
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Pill({ active, done, children, onClick, stepCount, stepLabel }) {
  const IconComponent =
    {
      1: FiCalendar,
      2: FiHome,
      3: FiUser,
      4: FiCreditCard,
    }[stepCount] || FiCheckCircle;

  const baseCls =
    "flex items-center flex-col md:flex-row gap-3 transition-all w-full px-4 py-3 rounded-xl";
  const textCls = done
    ? "text-[#00af00] font-bold"
    : active
      ? "text-[#0c2bfc] font-bold"
      : "text-gray-400 font-semibold";

  const circleCls = done
    ? "bg-[#00af00] text-white"
    : active
      ? "border-2 border-[#0c2bfc] bg-white text-[#0c2bfc]"
      : "border-2 border-gray-200 bg-white text-gray-400";

  return (
    <button
      className={`${baseCls} ${
        !active && !done
          ? "cursor-not-allowed"
          : "cursor-pointer hover:shadow-md hover:-translate-y-0.5"
      }`}
      type="button"
      onClick={done || active ? onClick : null}
      aria-label={`Step ${stepCount}: ${stepLabel}`}
    >
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-full shadow-sm transition-all ${circleCls}`}
      >
        {done ? (
          <FiCheckCircle className="w-5 h-5" />
        ) : (
          <IconComponent className="w-5 h-5" />
        )}
      </div>
      <div className="flex flex-col justify-center items-center md:items-start">
        <span className="text-xs text-gray-500">Step {stepCount}</span>
        <span className={`text-sm font-medium ${textCls}`}>{stepLabel}</span>
      </div>
    </button>
  );
}

function SummaryCard({ title, children, className = "" }) {
  return (
    <div
      className={`
        rounded-xl border border-gray-200 
        bg-white
        p-5 ${className}
      `}
    >
      <div className="text-sm font-semibold text-gray-900 mb-3">{title}</div>
      {children}
    </div>
  );
}

export default function ReservationProcess() {
  const navigate = useNavigate();
  const { fetchGuests, clearCurrentGuest, guests } = useGuestStore();
  const [step, setStep] = useState(1);

  // Category filter for rooms/cottages
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState(null);

  // State for guest email search
  const [emailInput, setEmailInput] = useState("");
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [guestExists, setGuestExists] = useState(false);
  const [originalGuestData, setOriginalGuestData] = useState(null);
  const [isCreatingNewGuest, setIsCreatingNewGuest] = useState(false);

  // Step 1 data with time (default check-in 2pm, check-out 12pm)
  const [reservationFormData, setReservationFormData] = useState({
    checkIn: getDefaultCheckIn(),
    checkOut: getDefaultCheckOut(),
    adults: 1,
    children: 0,
    guestId: "", // Will be set when guest is selected/created
    notes: "",
    paymentOption: "",
    userId: EXAMPLE_USER_ID,
    discountId: "",
  });

  // Step 2 data
  const [roomReservations, setRoomReservations] = useState([]);

  // Step 3 data
  const [guest, setGuest] = useState({
    firstName: "",
    lastName: "",
    contactNumber: "",
    email: "",
  });

  // Step 4 data
  const [payment, setPayment] = useState({
    paymentOption: "",
    paymentType: "",
    discountId: "",
    amountPaid: 0,
    amountReceived: 0,
  });

  // New state for receipt and reference number based on admin status
  const [selectedReceiptImage, setSelectedReceiptImage] = useState(null);
  const [receiptImagePreview, setReceiptImagePreview] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [useReferenceOnly, setUseReferenceOnly] = useState(false);

  const [selectedDiscountImage, setSelectedDiscountImage] = useState(null);
  const [discountImagePreview, setDiscountImagePreview] = useState("");

  const discountFileInputRef = useRef(null);
  const receiptFileInputRef = useRef(null);

  // Store hooks
  const { fetchAvailableRooms, createFullReservation, loading } =
    useReservationStore();
  const {
    paymentOptions,
    paymentTypes,
    discounts,
    fetchPaymentOptions,
    fetchPaymentTypes,
    fetchDiscounts,
  } = usePaymentStore();
  const amenities = useAmenityStore((s) => s.amenities);
  const fetchAmenities = useAmenityStore((s) => s.fetchAmenities);

  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [errors, setErrors] = useState({});

  // Track maximum rooms based on adults
  const [maxRooms, setMaxRooms] = useState(1);

  const todayISO = useMemo(() => toISODate(new Date()), []);
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Update check-out when check-in changes
  useEffect(() => {
    if (reservationFormData.checkIn) {
      const checkIn = new Date(reservationFormData.checkIn);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkOut.getDate() + 1);
      setReservationFormData((prev) => ({
        ...prev,
        checkOut: toISODateTime(setTimeTo(checkOut, 12, 0)),
      }));
    }
  }, [reservationFormData.checkIn]);

  // Filter available items by category
  const filteredAvailableItems = useMemo(() => {
    if (categoryFilter === "all") return availableRooms;
    return availableRooms.filter((item) => item.category === categoryFilter);
  }, [availableRooms, categoryFilter]);

  // Calculate counts
  const roomCount = availableRooms.filter(
    (item) => item.category === "room",
  ).length;
  const cottageCount = availableRooms.filter(
    (item) => item.category === "cottage",
  ).length;

  // Calculate payment amount based on payment option
  const calculatePaymentAmount = (
    paymentOptionId,
    finalTotal,
    paymentOptions,
  ) => {
    if (!paymentOptionId || finalTotal <= 0) return 0;

    const paymentOption = paymentOptions.find(
      (po) => po._id === paymentOptionId,
    );
    if (!paymentOption) return 0;

    if (paymentOption.paymentType === "full") {
      return finalTotal;
    } else if (paymentOption.paymentType === "partial") {
      return (finalTotal * paymentOption.amount) / 100;
    }

    return 0;
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchAmenities?.(),
          fetchPaymentOptions(),
          fetchPaymentTypes(),
          fetchDiscounts(),
          fetchGuests(),
        ]);
      } catch (error) {
        console.error("Failed to load initial data:", error);
        toast.error("Failed to load required data");
      }
    };
    loadData();
  }, [
    fetchAmenities,
    fetchPaymentOptions,
    fetchPaymentTypes,
    fetchDiscounts,
    fetchGuests,
  ]);

  // Auto-detect new guest creation when user starts filling fields
  useEffect(() => {
    // If user starts filling guest fields and no existing guest is selected,
    // automatically switch to new guest mode
    if (
      !guestExists &&
      !reservationFormData.guestId &&
      (guest.firstName || guest.lastName || guest.contactNumber)
    ) {
      setIsCreatingNewGuest(true);
    }
  }, [
    guest.firstName,
    guest.lastName,
    guest.contactNumber,
    guestExists,
    reservationFormData.guestId,
  ]);

  // Cleanup image previews
  useEffect(() => {
    return () => {
      if (discountImagePreview) URL.revokeObjectURL(discountImagePreview);
      if (receiptImagePreview) URL.revokeObjectURL(receiptImagePreview);
    };
  }, [discountImagePreview, receiptImagePreview]);

  // Check if guest is valid (either existing or new with all fields)
  const isGuestValid = useMemo(() => {
    // Case 1: Existing guest selected
    if (reservationFormData.guestId && guestExists) {
      return true;
    }

    // Case 2: Creating new guest with all fields valid
    if (isCreatingNewGuest) {
      return (
        guest.firstName?.trim() &&
        guest.lastName?.trim() &&
        guest.contactNumber?.trim() &&
        validateName(guest.firstName) &&
        validateName(guest.lastName) &&
        validatePhone(guest.contactNumber) &&
        (!guest.email || validateEmail(guest.email))
      );
    }

    return false;
  }, [reservationFormData.guestId, guestExists, isCreatingNewGuest, guest]);

  const searchGuestByEmail = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === "") {
      setEmailSuggestions([]);
      setShowEmailDropdown(false);
      return;
    }

    setSearchLoading(true);
    try {
      // Use guests from store instead of fetching again
      const filtered = guests
        .filter(
          (g) =>
            g.email && g.email.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        .slice(0, 8);

      setEmailSuggestions(filtered);
      setShowEmailDropdown(filtered.length > 0 || searchTerm.trim() !== "");
    } catch (err) {
      console.error("Error searching guests:", err);
      setEmailSuggestions([]);
      setShowEmailDropdown(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleEmailSelect = (selectedGuest) => {
    setGuest({
      firstName: selectedGuest.firstName || "",
      lastName: selectedGuest.lastName || "",
      contactNumber: selectedGuest.contactNumber || "",
      email: selectedGuest.email || "",
    });

    setOriginalGuestData(selectedGuest);
    setGuestExists(true);
    setIsCreatingNewGuest(false);
    setReservationFormData((prev) => ({
      ...prev,
      guestId: selectedGuest._id,
    }));

    setEmailInput(selectedGuest.email);
    setEmailSuggestions([]);
    setShowEmailDropdown(false);

    toast.success(
      `Guest found: ${selectedGuest.firstName} ${selectedGuest.lastName}`,
    );
  };

  const handleCreateNewGuest = () => {
    setIsCreatingNewGuest(true);
    setGuestExists(false);
    setOriginalGuestData(null);
    setReservationFormData((prev) => ({
      ...prev,
      guestId: "", // Clear guest ID for new guest
    }));
    setEmailSuggestions([]);
    setShowEmailDropdown(false);
    toast.success("Now fill in the guest details");
  };

  // Calculations - using nights instead of hours
  const nights = useMemo(() => {
    if (!reservationFormData.checkIn || !reservationFormData.checkOut) return 0;
    const n = nightsBetween(
      reservationFormData.checkIn,
      reservationFormData.checkOut,
    );
    return Number.isFinite(n) ? n : 0;
  }, [reservationFormData.checkIn, reservationFormData.checkOut]);

  const roomTotals = useMemo(() => {
    return roomReservations.map((roomRes) => {
      const room = availableRooms.find((r) => r._id === roomRes.roomId);
      const roomRate = room?.rate || 0;
      const roomSubtotal = roomRate * nights;
      const isCottage = room?.category === "cottage";

      // Only calculate amenities for rooms (not cottages)
      let amenitiesSubtotal = 0;
      if (!isCottage) {
        amenitiesSubtotal = roomRes.amenities.reduce((sum, amenity) => {
          const amenityData = amenities.find(
            (a) => a._id === amenity.amenityId,
          );
          return sum + (amenityData?.rate || 0) * amenity.quantity;
        }, 0);
      }

      return {
        roomId: roomRes.roomId,
        total: roomSubtotal + amenitiesSubtotal,
        roomSubtotal,
        amenitiesSubtotal,
        roomRate,
        category: room?.category,
        isCottage,
      };
    });
  }, [roomReservations, availableRooms, nights, amenities]);

  const totalAmount = useMemo(() => {
    return roomTotals.reduce((sum, room) => sum + room.total, 0);
  }, [roomTotals]);

  const discount = useMemo(() => {
    if (!payment.discountId) return { amount: 0, percent: 0, name: "" };

    const discountData = discounts.find((d) => d._id === payment.discountId);
    if (!discountData) return { amount: 0, percent: 0, name: "" };

    if (discountData.appliesToAllRooms) {
      const discountAmount = (totalAmount * discountData.discountPercent) / 100;
      return {
        amount: discountAmount,
        percent: discountData.discountPercent,
        name: discountData.name,
      };
    } else {
      if (roomTotals.length === 0) return { amount: 0, percent: 0, name: "" };

      let targetRoom;
      if (discountData.discountPriority === "highest") {
        targetRoom = roomTotals.reduce((max, room) =>
          room.total > max.total ? room : max,
        );
      } else {
        targetRoom = roomTotals.reduce((min, room) =>
          room.total < min.total ? room : min,
        );
      }

      const discountAmount =
        (targetRoom.total * discountData.discountPercent) / 100;
      return {
        amount: discountAmount,
        percent: discountData.discountPercent,
        name: discountData.name,
        roomId: targetRoom.roomId,
      };
    }
  }, [payment.discountId, discounts, totalAmount, roomTotals]);

  const finalTotal = useMemo(() => {
    return totalAmount - discount.amount;
  }, [totalAmount, discount.amount]);

  const amountDue = useMemo(() => {
    if (!payment.paymentOption) return finalTotal;

    const paymentOption = paymentOptions.find(
      (po) => po._id === payment.paymentOption,
    );
    if (!paymentOption) return finalTotal;

    if (paymentOption.paymentType === "full") {
      return finalTotal;
    } else if (paymentOption.paymentType === "partial") {
      return (finalTotal * paymentOption.amount) / 100;
    }
    return finalTotal;
  }, [payment.paymentOption, paymentOptions, finalTotal]);

  // Set default payment amount when step changes to 4
  useEffect(() => {
    if (step === 4 && finalTotal > 0) {
      const fullPaymentOption = paymentOptions.find(
        (po) => po.paymentType === "full" && po.isActive,
      );

      if (fullPaymentOption) {
        setPayment((prev) => ({
          ...prev,
          paymentOption: fullPaymentOption._id,
          amountPaid: finalTotal,
          amountReceived: finalTotal,
        }));
      }
    }
  }, [step, finalTotal, paymentOptions]);

  useEffect(() => {
    if (step === 4 && finalTotal > 0) {
      const selectedPaymentOption = paymentOptions.find(
        (po) => po._id === payment.paymentOption,
      );

      let calculatedAmount = finalTotal;
      if (selectedPaymentOption) {
        if (selectedPaymentOption.paymentType === "partial") {
          calculatedAmount = (finalTotal * selectedPaymentOption.amount) / 100;
        }
      } else {
        const fullPaymentOption = paymentOptions.find(
          (po) => po.paymentType === "full" && po.isActive,
        );
        if (fullPaymentOption) {
          setPayment((prev) => ({
            ...prev,
            paymentOption: fullPaymentOption._id,
          }));
        }
      }

      setPayment((prev) => ({
        ...prev,
        amountPaid: calculatedAmount,
        amountReceived: calculatedAmount,
      }));
    }
  }, [step, finalTotal, payment.paymentOption, paymentOptions]);

  const progressPct = useMemo(() => Math.round((step / 4) * 100), [step]);
  const totalCapacity = useMemo(() => {
    return roomReservations.reduce((sum, roomRes) => {
      const room = availableRooms.find((r) => r._id === roomRes.roomId);
      return sum + (room?.capacity || 0);
    }, 0);
  }, [roomReservations, availableRooms]);

  const checkOutMin = useMemo(() => {
    if (!reservationFormData.checkIn)
      return toISODateTime(setTimeTo(addDays(new Date(), 1), 12, 0));
    const min = addDays(new Date(reservationFormData.checkIn), 1);
    return toISODateTime(setTimeTo(min, 12, 0));
  }, [reservationFormData.checkIn]);

  const selectedPaymentType = paymentTypes.find(
    (pt) => pt._id === payment.paymentType,
  );
  const requiresReceipt = selectedPaymentType?.isReceipt;

  // Validation
  const setFieldError = (key, message) =>
    setErrors((prev) => ({ ...prev, [key]: message }));

  const validateStep1 = () => {
    const errors = {};

    if (!reservationFormData.checkIn) {
      errors.checkIn = "Check-in is required.";
    } else {
      const checkInDate = new Date(reservationFormData.checkIn);
      const now = new Date();

      if (checkInDate < now) {
        errors.checkIn = "Check-in cannot be in the past.";
      }
    }

    if (!reservationFormData.checkOut) {
      errors.checkOut = "Check-out is required.";
    } else if (
      reservationFormData.checkIn &&
      reservationFormData.checkOut &&
      nights <= 0
    ) {
      errors.checkOut = "Check-out must be after check-in.";
    }

    if (reservationFormData.adults < 1) {
      errors.adults = "Adults must be at least 1.";
    }

    if (reservationFormData.children < 0) {
      errors.children = "Children cannot be negative.";
    }

    setErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    const errors = {};

    if (roomReservations.length === 0) {
      errors.rooms = "Select at least one room or cottage.";
    }

    if (roomReservations.length > maxRooms) {
      errors.rooms = `You can only select maximum ${maxRooms} item(s) for ${reservationFormData.adults} adult(s).`;
    }

    if (reservationFormData.adults > totalCapacity) {
      errors.capacity = `Capacity (${totalCapacity}) is not enough for adults (${reservationFormData.adults}).`;
    }

    const hasRooms = roomReservations.some((item) => item.category === "room");
    const hasCottages = roomReservations.some(
      (item) => item.category === "cottage",
    );

    if (hasRooms && hasCottages) {
      errors.category =
        "You cannot mix rooms and cottages in the same reservation. Please select either rooms OR cottages only.";
    }

    setErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return false;
    }

    return true;
  };

  const validateStep3 = () => {
    const errors = {};

    // For existing guest: just need guestId
    if (guestExists && reservationFormData.guestId) {
      setErrors({});
      return true;
    }

    // For new guest (either explicitly creating or just filling fields)
    if (!reservationFormData.guestId) {
      if (!guest.firstName.trim()) {
        errors.firstName = "First name is required.";
      } else if (!validateName(guest.firstName)) {
        errors.firstName = "First name can only contain letters and spaces.";
      }

      if (!guest.lastName.trim()) {
        errors.lastName = "Last name is required.";
      } else if (!validateName(guest.lastName)) {
        errors.lastName = "Last name can only contain letters and spaces.";
      }

      if (!guest.contactNumber.trim()) {
        errors.contactNumber = "Contact number is required.";
      } else if (!validatePhone(guest.contactNumber)) {
        errors.contactNumber = "Must start with 09 and be 11 digits.";
      }

      if (guest.email && !validateEmail(guest.email)) {
        errors.email = "Please enter a valid email address.";
      }
    }

    setErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return false;
    }

    return true;
  };

  const validateStep4 = () => {
    const errors = {};

    if (!payment.paymentOption) {
      errors.paymentOption = "Please select a payment option.";
    }

    if (!payment.paymentType) {
      errors.paymentType = "Please select a payment type.";
    }

    if (payment.amountPaid < 0) {
      errors.amountPaid = "Amount paid cannot be negative.";
    }

    if (payment.amountReceived < 0) {
      errors.amountReceived = "Amount received cannot be negative.";
    }

    if (payment.amountPaid > payment.amountReceived) {
      errors.amountReceived = "Amount received must be at least amount paid.";
    }

    // UPDATED: Receipt validation - either reference number OR image is required
    if (requiresReceipt) {
      if (!referenceNumber && !selectedReceiptImage) {
        errors.receipt =
          "Either reference number OR receipt image is required.";
      }
    }

    if (payment.discountId && !selectedDiscountImage) {
      errors.discountImage =
        "Discount image is required when applying discount.";
    }

    setErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return false;
    }

    return true;
  };

  // Step handlers
  const handleStep1Next = async () => {
    if (!validateStep1()) return;

    const newMaxRooms = calculateMaxRooms(reservationFormData.adults);
    if (roomReservations.length > newMaxRooms) {
      toast.error(
        `Selected items (${roomReservations.length}) exceed new limit of ${newMaxRooms} for ${reservationFormData.adults} adult(s). Please adjust selection.`,
      );
      setMaxRooms(newMaxRooms);
      setStep(2);
      return;
    }

    setMaxRooms(newMaxRooms);
    setLoadingRooms(true);
    try {
      const data = await fetchAvailableRooms({
        checkIn: reservationFormData.checkIn,
        checkOut: reservationFormData.checkOut,
      });
      setAvailableRooms(data || []);
      goNext();
    } catch (err) {
      toast.error(err?.message || "Failed to load available rooms.");
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleStep2Next = () => {
    if (!validateStep2()) return;
    goNext();
  };

  const handleStep3Next = () => {
    if (!validateStep3()) return;
    goNext();
  };

  const goNext = () => setStep((prev) => Math.min(4, prev + 1));
  const goBack = () => setStep((prev) => Math.max(1, prev - 1));

  // Room and amenity handlers
  const addRoom = (item) => {
    if (roomReservations.length > 0) {
      const existingCategory = roomReservations[0].category;
      if (existingCategory !== item.category) {
        toast.error(
          `You cannot mix rooms and cottages. You already have ${existingCategory === "room" ? "rooms" : "cottages"} selected. Please remove them first or select only ${existingCategory === "room" ? "rooms" : "cottages"}.`,
        );
        return;
      }
    }

    if (roomReservations.length >= maxRooms) {
      toast.error(
        `Maximum ${maxRooms} item(s) allowed for ${reservationFormData.adults} adult(s).`,
      );
      return;
    }

    setRoomReservations((prev) => [
      ...prev,
      {
        roomId: item._id,
        roomNumber: item.roomNumber,
        rate: item.rate,
        capacity: item.capacity,
        roomTypeName: item.roomType?.name ?? "",
        category: item.category,
        amenities: [],
      },
    ]);
  };

  const removeRoom = (roomId) => {
    setRoomReservations((prev) => prev.filter((r) => r.roomId !== roomId));
  };

  const addAmenityToRoom = (roomIndex) => {
    // Check if the selected item is a cottage
    const selectedItem = roomReservations[roomIndex];
    const item = availableRooms.find((r) => r._id === selectedItem.roomId);

    console.log("Adding amenity to:", item?.category);

    // Explicitly check if it's a cottage
    if (item?.category === "cottage") {
      toast.error(
        "Amenities are not available for cottages. They can only be added to rooms.",
      );
      return;
    }

    if (!amenities?.length) {
      toast.error("No amenities available.");
      return;
    }

    setRoomReservations((prev) => {
      const updated = [...prev];
      updated[roomIndex].amenities.push({
        amenityId: amenities[0]._id,
        quantity: 1,
      });
      return updated;
    });
  };

  const updateAmenityInRoom = (roomIndex, amenityIndex, updates) => {
    setRoomReservations((prev) => {
      const updated = [...prev];
      updated[roomIndex].amenities[amenityIndex] = {
        ...updated[roomIndex].amenities[amenityIndex],
        ...updates,
      };
      return updated;
    });
  };

  const removeAmenityFromRoom = (roomIndex, amenityIndex) => {
    setRoomReservations((prev) => {
      const updated = [...prev];
      updated[roomIndex].amenities.splice(amenityIndex, 1);
      return updated;
    });
  };

  // Image handlers
  const handleDiscountImageUpload = (file) => {
    if (discountImagePreview) URL.revokeObjectURL(discountImagePreview);
    const preview = URL.createObjectURL(file);
    setSelectedDiscountImage(file);
    setDiscountImagePreview(preview);
  };

  const handleReceiptImageUpload = (file) => {
    if (receiptImagePreview) URL.revokeObjectURL(receiptImagePreview);
    const preview = URL.createObjectURL(file);
    setSelectedReceiptImage(file);
    setReceiptImagePreview(preview);
    if (isAdmin && referenceNumber) {
      setReferenceNumber("");
    }
  };

  const removeDiscountImage = () => {
    if (discountImagePreview) URL.revokeObjectURL(discountImagePreview);
    setSelectedDiscountImage(null);
    setDiscountImagePreview("");
  };

  const removeReceiptImage = () => {
    if (receiptImagePreview) URL.revokeObjectURL(receiptImagePreview);
    setSelectedReceiptImage(null);
    setReceiptImagePreview("");
  };

  // Reset form
  const resetAll = () => {
    setStep(1);
    setReservationFormData({
      checkIn: getDefaultCheckIn(),
      checkOut: getDefaultCheckOut(),
      adults: 1,
      children: 0,
      guestId: "",
      notes: "",
      paymentOption: "",
      userId: EXAMPLE_USER_ID,
      discountId: "",
    });
    setRoomReservations([]);
    setGuest({
      firstName: "",
      lastName: "",
      contactNumber: "",
      email: "",
    });
    setPayment({
      paymentOption: "",
      paymentType: "",
      discountId: "",
      amountPaid: 0,
      amountReceived: 0,
    });
    setEmailInput("");
    setEmailSuggestions([]);
    setShowEmailDropdown(false);
    setSearchLoading(false);
    setGuestExists(false);
    setIsCreatingNewGuest(false);
    setOriginalGuestData(null);
    removeDiscountImage();
    removeReceiptImage();
    setReferenceNumber("");
    setAvailableRooms([]);
    setErrors({});
    setMaxRooms(1);
    clearCurrentGuest();
  };

  // Submit reservation
  const submitReservation = async () => {
    if (!validateStep4()) return;

    try {
      const payload = {
        guest: {
          firstName: guest.firstName.trim(),
          lastName: guest.lastName.trim(),
          contactNumber: guest.contactNumber.trim(),
          email: guest.email?.trim() || "",
        },
        reservationData: {
          checkIn: reservationFormData.checkIn,
          checkOut: reservationFormData.checkOut,
          adults: reservationFormData.adults,
          children: reservationFormData.children,
          notes: reservationFormData.notes || "",
          paymentOption: payment.paymentOption,
          discountId: payment.discountId || null,
        },
        rooms: roomReservations.map((roomRes) => ({
          roomId: roomRes.roomId,
          amenities: roomRes.amenities.map((amenity) => ({
            amenityId: amenity.amenityId,
            quantity: amenity.quantity,
          })),
        })),
        payment: {
          paymentType: payment.paymentType,
          amountPaid: payment.amountPaid,
          amountReceived: payment.amountReceived,
        },
        discountImageFile: selectedDiscountImage,
        receiptData: {
          imageFile: selectedReceiptImage,
          referenceNumber: referenceNumber || null,
          isAdminInitiated: true,
        },
        // Include guestId if existing guest, otherwise null for new guest
        guestId: reservationFormData.guestId || null,
      };

      const result = await createFullReservation(payload);
      toast.success("Reservation created successfully!");

      navigate(`/billing/`);
    } catch (err) {
      console.error("Reservation creation error:", err);

      if (err.message.includes("duplicate") || err.message.includes("11000")) {
        toast.error("Duplicate reservation detected. Please try again.");
      } else if (
        err.message.includes("overlap") ||
        err.message.includes("available")
      ) {
        toast.error("Selected items are not available for the chosen dates.");
        setStep(2);
        setFieldError("rooms", "Please select different items or dates.");
      } else if (
        err.message.includes("stock") ||
        err.message.includes("availability")
      ) {
        toast.error(
          "Some amenities are out of stock. Please adjust quantities.",
        );
        setStep(2);
      } else if (err.message.includes("Receipt image is required")) {
        toast.error("Receipt image is required for this payment type.");
        setStep(4);
        setFieldError("receipt", "Please upload a receipt image.");
      } else if (err.message.includes("reference number")) {
        toast.error("Reference number is required for this payment type.");
        setStep(4);
        setFieldError("receipt", "Please enter a reference number.");
      } else if (err.message.includes("Invalid") || err.status === 400) {
        toast.error("Invalid data provided. Please check your inputs.");
      } else {
        toast.error(
          err.message || "Failed to create reservation. Please try again.",
        );
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Create Reservation - Resort Admin</title>
      </Helmet>
      <div className="min-h-full flex flex-col gap-6 relative">
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
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="text-xl font-bold text-gray-900">
                Create Reservation
              </div>
              <div className="text-sm text-gray-600">
                Step {step} of 4 •{" "}
                {
                  {
                    1: "Dates & Guests",
                    2: "Room/Cottage Selection",
                    3: "Guest Information",
                    4: "Payment",
                  }[step]
                }
              </div>
            </div>

            <button
              type="button"
              onClick={resetAll}
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
              title="Reset form"
            >
              <FiRefreshCw /> Reset Form
            </button>
          </div>

          {/* Progress bar and steps */}
          <div
            className="
            rounded-xl border border-gray-200 
            bg-white
            p-4
          "
          >
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Progress</span>
              <span className="font-medium text-gray-900">{progressPct}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-[#0c2bfc] rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="grid grid-cols-4 gap-2 mt-4">
              <Pill
                active={step === 1}
                done={step > 1}
                onClick={() => setStep(1)}
                stepCount={1}
                stepLabel="Dates & Guests"
              />
              <Pill
                active={step === 2}
                done={step > 2}
                onClick={() => step >= 2 && setStep(2)}
                stepCount={2}
                stepLabel="Room/Cottage"
              />
              <Pill
                active={step === 3}
                done={step > 3}
                onClick={() => step >= 3 && setStep(3)}
                stepCount={3}
                stepLabel="Guest Info"
              />
              <Pill
                active={step === 4}
                done={false}
                onClick={() => step >= 4 && setStep(4)}
                stepCount={4}
                stepLabel="Payment"
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 grid gap-6 lg:grid-cols-12 overflow-auto">
          {/* Left Content */}
          <div className="lg:col-span-8 space-y-6">
            {/* STEP 1 */}
            {step === 1 && (
              <Section
                title="Step 1: Dates and Guests"
                subtitle="Select check-in/check-out date and time, and number of guests."
                icon={<FiCalendar />}
                right={
                  nights > 0 && (
                    <div className="text-sm text-gray-600">
                      Nights:{" "}
                      <span className="font-semibold text-gray-900">
                        {nights}
                      </span>
                    </div>
                  )
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Check In Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      min={toISODateTime(new Date())}
                      value={reservationFormData.checkIn}
                      onChange={(e) =>
                        setReservationFormData({
                          ...reservationFormData,
                          checkIn: e.target.value,
                        })
                      }
                      className={`
    mt-1 w-full h-11 rounded-xl border px-4 text-sm outline-none 
    focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
    transition-all duration-200 bg-white
    ${errors.checkIn ? "border-red-300 bg-red-50" : "border-gray-200"}
  `}
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      Default check-in time: 2:00 PM
                    </div>
                    <FieldError text={errors.checkIn} />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Check Out Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      min={checkOutMin}
                      value={reservationFormData.checkOut}
                      onChange={(e) =>
                        setReservationFormData({
                          ...reservationFormData,
                          checkOut: e.target.value,
                        })
                      }
                      className={`
                        mt-1 w-full h-11 rounded-xl border px-4 text-sm outline-none 
                        focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
                        transition-all duration-200 bg-white
                        ${
                          errors.checkOut
                            ? "border-red-300 bg-red-50"
                            : "border-gray-200"
                        }
                      `}
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      Default check-out time: 12:00 PM
                    </div>
                    <FieldError text={errors.checkOut} />
                  </div>

                  <div>
                    <NumberInput
                      label="Adults *"
                      value={reservationFormData.adults}
                      onChange={(newValue) => {
                        setReservationFormData({
                          ...reservationFormData,
                          adults: newValue,
                        });
                        setMaxRooms(calculateMaxRooms(newValue));
                      }}
                      min={1}
                      max={99}
                      step={1}
                      description="Maximum items allowed based on adults:"
                      error={errors.adults}
                      className={`${errors.adults ? "border-red-300" : ""}`}
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      Maximum items allowed:{" "}
                      {calculateMaxRooms(reservationFormData.adults)}
                    </div>
                  </div>

                  <div>
                    <NumberInput
                      label="Children"
                      value={reservationFormData.children}
                      onChange={(newValue) =>
                        setReservationFormData({
                          ...reservationFormData,
                          children: newValue,
                        })
                      }
                      min={0}
                      max={20}
                      step={1}
                      description="Ages 2-12 years"
                      error={errors.children}
                      className={`${errors.children ? "border-red-300" : ""}`}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={reservationFormData.notes}
                    onChange={(e) =>
                      setReservationFormData({
                        ...reservationFormData,
                        notes: e.target.value,
                      })
                    }
                    className="
                      mt-1 w-full min-h-[80px] rounded-xl border border-gray-200 
                      bg-white px-4 py-3 text-sm 
                      outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
                      transition-all duration-200
                    "
                    placeholder="Any special requests or notes..."
                  />
                </div>
              </Section>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <Section
                title="Step 2: Select Rooms & Cottages"
                subtitle="Select rooms or cottages and add amenities."
                icon={<FiHome />}
                right={
                  <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                    <span>
                      Adults:{" "}
                      <b className="text-gray-900">
                        {reservationFormData.adults}
                      </b>
                    </span>
                    <span className="text-gray-300">•</span>
                    <span>
                      Selected:{" "}
                      <b className="text-gray-900">{roomReservations.length}</b>
                      <span className="text-gray-400">/</span>
                      <b className="text-gray-600">{maxRooms}</b>
                    </span>
                    <span className="text-gray-300">•</span>
                    <span>
                      Capacity: <b className="text-gray-900">{totalCapacity}</b>
                    </span>
                    <span className="text-gray-300">•</span>
                    <span>
                      Nights: <b className="text-gray-900">{nights}</b>
                    </span>
                  </div>
                }
              >
                {/* Category filter and error message */}
                <div className="mb-4">
                  {errors.category && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                      {errors.category}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <FiFilter className="text-gray-400" />
                      <span className="text-sm text-gray-600 font-medium">
                        Show:
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCategoryFilter("all")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                          categoryFilter === "all"
                            ? "bg-[#0c2bfc] text-white"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        All ({availableRooms.length})
                      </button>
                      <button
                        onClick={() => setCategoryFilter("room")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                          categoryFilter === "room"
                            ? "bg-[#0c2bfc] text-white"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <FiHome className="inline mr-1" size={12} />
                        Rooms ({roomCount})
                      </button>
                      <button
                        onClick={() => setCategoryFilter("cottage")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                          categoryFilter === "cottage"
                            ? "bg-[#0c2bfc] text-white"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <FiSun className="inline mr-1" size={12} />
                        Cottages ({cottageCount})
                      </button>
                    </div>
                  </div>
                </div>

                {loadingRooms ? (
                  <div className="py-12 flex items-center justify-center">
                    <Loader size={40} variant="primary" />
                  </div>
                ) : (
                  <>
                    {/* Available Items */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Available{" "}
                          {categoryFilter === "cottage"
                            ? "Cottages"
                            : categoryFilter === "room"
                              ? "Rooms"
                              : "Items"}
                        </h3>
                        <div className="text-xs text-gray-600">
                          <span className="font-medium text-gray-900">
                            {roomReservations.length}
                          </span>
                          <span className="text-gray-400"> / </span>
                          <span className="font-medium text-gray-600">
                            {maxRooms}
                          </span>
                          <span className="text-gray-400 ml-1">selected</span>
                        </div>
                      </div>

                      {roomReservations.length === maxRooms && maxRooms > 0 && (
                        <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-800">
                          <div className="font-medium">
                            Maximum Items Reached
                          </div>
                          <div className="mt-1">
                            You've reached the maximum of {maxRooms} item(s) for{" "}
                            {reservationFormData.adults} adult(s).
                            {reservationFormData.adults > totalCapacity && (
                              <span className="ml-1">
                                Consider items with higher capacity.
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <FieldError text={errors.rooms} />
                      <FieldError text={errors.capacity} />

                      <div className="grid gap-3 md:grid-cols-2">
                        {filteredAvailableItems.map((item) => {
                          const isSelected = roomReservations.some(
                            (r) => r.roomId === item._id,
                          );
                          const isCottage = item.category === "cottage";

                          return (
                            <div
                              key={item._id}
                              className={`
                                rounded-xl border p-4 transition-all duration-200 bg-white
                                ${
                                  isSelected
                                    ? "border-[#0c2bfc] ring-2 ring-[#0c2bfc]/20 hover:-translate-y-0.5 hover:shadow-md"
                                    : "border-gray-200 hover:border-gray-300 hover:-translate-y-0.5 hover:shadow-md"
                                }
                              `}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-semibold text-gray-900">
                                      {isCottage ? "Cottage" : "Room"}{" "}
                                      {item.roomNumber}
                                      {item.category}
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
                                  <div className="text-xs text-gray-600 mt-0.5">
                                    {isCottage
                                      ? item.description || "—"
                                      : (item.roomType?.name ?? "—")}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    isSelected
                                      ? removeRoom(item._id)
                                      : addRoom(item)
                                  }
                                  disabled={
                                    !isSelected &&
                                    roomReservations.length >= maxRooms
                                  }
                                  className={`
                                    text-xs font-medium px-3 py-1.5 rounded-xl transition-all duration-200
                                    ${
                                      isSelected
                                        ? "bg-[#0c2bfc] text-white hover:bg-[#0a24d6] hover:shadow-md hover:-translate-y-0.5"
                                        : roomReservations.length >= maxRooms
                                          ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                          : "bg-[#0c2bfc] text-white hover:bg-[#0a24d6] hover:shadow-md hover:-translate-y-0.5"
                                    }
                                  `}
                                >
                                  {isSelected ? "Remove" : "Select"}
                                  {!isSelected &&
                                    roomReservations.length >= maxRooms &&
                                    " (Max)"}
                                </button>
                              </div>
                              <div className="text-xs text-gray-600 mt-2">
                                Capacity: {item.capacity} • Rate:{" "}
                                {formatMoney(item.rate)} / night
                              </div>
                            </div>
                          );
                        })}

                        {filteredAvailableItems.length === 0 && (
                          <div
                            className="
                            rounded-xl border border-gray-200 
                            bg-white
                            px-4 py-10 text-center text-gray-500 md:col-span-2
                          "
                          >
                            <FiHome className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            No available{" "}
                            {categoryFilter === "cottage"
                              ? "cottages"
                              : categoryFilter === "room"
                                ? "rooms"
                                : "items"}{" "}
                            for selected dates.
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Selected Items with Amenities */}
                    {roomReservations.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Selected Items
                        </h3>
                        {roomReservations.map((roomRes, roomIndex) => {
                          // Find the actual room/cottage data to get its category
                          const item = availableRooms.find(
                            (r) => r._id === roomRes.roomId,
                          );
                          const isCottage = item?.category === "cottage";
                          const isRoom = item?.category === "room";

                          // Log for debugging
                          console.log(
                            "Item category:",
                            item?.category,
                            "isCottage:",
                            isCottage,
                            "isRoom:",
                            isRoom,
                          );

                          return (
                            <div
                              key={roomRes.roomId}
                              className="
            rounded-xl border border-gray-200 
            bg-white
            p-4
          "
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm font-semibold text-gray-900">
                                      {isCottage ? "Cottage" : "Room"}{" "}
                                      {roomRes.roomNumber}
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
                                  <div className="text-xs text-gray-600">
                                    Rate: {formatMoney(roomRes.rate)}/night
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeRoom(roomRes.roomId)}
                                  className="
                h-9 w-9 rounded-xl border border-gray-200 
                bg-white
                hover:bg-gray-50
                grid place-items-center text-[#0c2bfc]
                transition-all duration-200
                hover:shadow-md hover:-translate-y-0.5
                active:translate-y-0
              "
                                  title="Remove item"
                                >
                                  <FiTrash2 />
                                </button>
                              </div>

                              {/* Amenities Section - ONLY show for rooms, NOT for cottages */}
                              {!isCottage && isRoom && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs font-medium text-gray-700">
                                      Amenities
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        addAmenityToRoom(roomIndex)
                                      }
                                      className="
                    h-8 px-3 rounded-xl 
                    bg-[#0c2bfc] 
                    hover:bg-[#0a24d6]
                    text-white text-xs font-medium inline-flex items-center gap-1
                    transition-all duration-200
                    hover:shadow-md hover:-translate-y-0.5
                    active:translate-y-0
                  "
                                    >
                                      <FiPlus size={12} /> Add Amenity
                                    </button>
                                  </div>

                                  {roomRes.amenities.map(
                                    (amenity, amenityIndex) => {
                                      const amenityData = amenities.find(
                                        (a) => a._id === amenity.amenityId,
                                      );

                                      return (
                                        <div
                                          key={`${amenity.amenityId}-${amenityIndex}`}
                                          className="
                      grid gap-3 sm:grid-cols-12 items-center 
                      rounded-xl border border-gray-200 
                      bg-white
                      p-3
                    "
                                        >
                                          <div className="sm:col-span-7">
                                            <label className="text-xs text-gray-500">
                                              Amenity
                                            </label>
                                            <select
                                              value={amenity.amenityId}
                                              onChange={(e) =>
                                                updateAmenityInRoom(
                                                  roomIndex,
                                                  amenityIndex,
                                                  {
                                                    amenityId: e.target.value,
                                                  },
                                                )
                                              }
                                              className="
                          mt-1 w-full h-10 rounded-xl border border-gray-200 
                          bg-white px-3 text-sm 
                          outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
                          text-gray-700
                        "
                                            >
                                              {amenities.map((a) => (
                                                <option
                                                  key={a._id}
                                                  value={a._id}
                                                >
                                                  {a.name} (
                                                  {formatMoney(a.rate)})
                                                </option>
                                              ))}
                                            </select>
                                          </div>

                                          <div className="sm:col-span-3">
                                            <label className="text-xs text-gray-500">
                                              Quantity
                                            </label>
                                            <div className="mt-1">
                                              <Stepper
                                                value={amenity.quantity}
                                                onChange={(newQuantity) =>
                                                  updateAmenityInRoom(
                                                    roomIndex,
                                                    amenityIndex,
                                                    {
                                                      quantity: newQuantity,
                                                    },
                                                  )
                                                }
                                                min={1}
                                                max={99}
                                                step={1}
                                                size="small"
                                              />
                                            </div>
                                          </div>

                                          <div className="sm:col-span-2 flex justify-end">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                removeAmenityFromRoom(
                                                  roomIndex,
                                                  amenityIndex,
                                                )
                                              }
                                              className="
                          h-10 w-10 rounded-xl border border-gray-200 
                          bg-white
                          hover:bg-gray-50
                          grid place-items-center text-[#0c2bfc]
                          transition-all duration-200
                          hover:shadow-md hover:-translate-y-0.5
                          active:translate-y-0
                        "
                                              title="Remove amenity"
                                            >
                                              <FiTrash2 />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    },
                                  )}

                                  {roomRes.amenities.length === 0 && (
                                    <div
                                      className="
                    text-xs text-gray-500 italic text-center py-3
                    border border-dashed border-gray-200 rounded-xl
                    bg-gray-50
                  "
                                    >
                                      No amenities added to this room.
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* For cottages, show a message that amenities are not available */}
                              {isCottage && (
                                <div
                                  className="
                mt-2 text-xs text-gray-500 italic text-center py-3
                border border-dashed border-gray-200 rounded-xl
                bg-gray-50
              "
                                >
                                  <span className="text-[#00af00] font-medium">
                                    ℹ️ Note:
                                  </span>{" "}
                                  Amenities are only available for rooms, not
                                  for cottages.
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </Section>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <Section
                title="Step 3: Guest Information"
                subtitle="Search existing guest by email or create new guest."
                icon={<FiUser />}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Email Field with Search */}
                  <div className="sm:col-span-2 relative">
                    <label className="text-sm font-medium text-gray-700">
                      Email *
                      {guestExists && (
                        <span className="ml-2 text-xs text-[#00af00]">
                          ✓ Existing guest
                        </span>
                      )}
                      {isCreatingNewGuest && (
                        <span className="ml-2 text-xs text-[#0c2bfc]">
                          ✚ Creating new guest
                        </span>
                      )}
                    </label>

                    <div className="relative">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          setEmailInput(value);
                          setGuest((g) => ({ ...g, email: value }));
                          setFieldError("email", "");

                          if (!value) {
                            setGuestExists(false);
                            setIsCreatingNewGuest(false);
                            setOriginalGuestData(null);
                            setEmailSuggestions([]);
                            setShowEmailDropdown(false);
                            setReservationFormData((prev) => ({
                              ...prev,
                              guestId: "",
                            }));
                          } else {
                            // If email changes and we had a selected guest, clear it
                            if (guestExists) {
                              setGuestExists(false);
                              setOriginalGuestData(null);
                              setReservationFormData((prev) => ({
                                ...prev,
                                guestId: "",
                              }));
                            }

                            // Don't automatically set isCreatingNewGuest, let user click the button
                            // But if they start typing after clearing, reset creating state
                            if (isCreatingNewGuest) {
                              setIsCreatingNewGuest(false);
                            }

                            const timer = setTimeout(() => {
                              searchGuestByEmail(value);
                            }, 150);
                            return () => clearTimeout(timer);
                          }
                        }}
                        onFocus={() => {
                          if (
                            emailInput &&
                            emailInput.trim() &&
                            !showEmailDropdown &&
                            !guestExists &&
                            !isCreatingNewGuest
                          ) {
                            searchGuestByEmail(emailInput);
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowEmailDropdown(false), 300);
                        }}
                        className={`
                          mt-1 w-full h-11 rounded-xl border px-4 text-sm outline-none 
                          focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
                          transition-all duration-200 bg-white
                          ${
                            errors.email
                              ? "border-red-300 bg-red-50"
                              : guestExists
                                ? "border-[#00af00] bg-[#00af00]/5"
                                : "border-gray-200"
                          }
                        `}
                        placeholder="Type email to search existing guests..."
                      />

                      {/* Email Suggestions Dropdown */}
                      {showEmailDropdown && (
                        <div className="absolute z-20 w-full mt-1 rounded-xl border border-gray-200 bg-white shadow-lg max-h-64 overflow-y-auto">
                          {emailSuggestions.length > 0 && (
                            <>
                              <div className="p-3 border-b border-gray-100">
                                <div className="text-xs font-medium text-gray-700">
                                  Select existing guest:
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {emailSuggestions.length} suggestion(s) found
                                </div>
                              </div>

                              {emailSuggestions.map((guestItem) => (
                                <button
                                  key={guestItem._id}
                                  type="button"
                                  onClick={() => handleEmailSelect(guestItem)}
                                  className="
                                    w-full text-left p-3 hover:bg-gray-50 
                                    border-b border-gray-100 last:border-b-0 transition-colors
                                  "
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-900 truncate">
                                        {guestItem.email}
                                      </div>
                                      <div className="text-xs text-gray-600 mt-0.5 truncate">
                                        {guestItem.firstName}{" "}
                                        {guestItem.lastName}
                                        {guestItem.contactNumber && (
                                          <span className="ml-2">
                                            • {guestItem.contactNumber}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <FiCheckCircle className="text-[#00af00] ml-2 flex-shrink-0" />
                                  </div>
                                </button>
                              ))}
                            </>
                          )}

                          {/* Always show create new guest option when email is entered */}
                          {emailInput && emailInput.trim() !== "" && (
                            <div
                              className={`p-3 ${emailSuggestions.length > 0 ? "border-t border-gray-100" : ""} bg-gray-50`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  handleCreateNewGuest();
                                  setGuest((prev) => ({
                                    ...prev,
                                    email: emailInput,
                                  }));
                                  setEmailSuggestions([]);
                                  setShowEmailDropdown(false);
                                }}
                                className="w-full text-left text-sm font-medium text-[#0c2bfc] hover:text-[#0a24d6]"
                              >
                                <div className="flex items-center">
                                  <FiPlus className="mr-2" />
                                  Create new guest with "{emailInput}"
                                </div>
                              </button>
                            </div>
                          )}

                          {/* Show message if no results and email is entered */}
                          {emailSuggestions.length === 0 && emailInput && (
                            <div className="p-3 text-sm text-gray-500">
                              No existing guests found with this email.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <FieldError text={errors.email} />
                  </div>

                  {/* Show appropriate message based on guest selection state */}
                  {!guestExists && !isCreatingNewGuest && !emailInput && (
                    <div className="sm:col-span-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                      Please enter an email to search for existing guests or
                      create a new one.
                    </div>
                  )}

                  {isCreatingNewGuest && (
                    <div className="sm:col-span-2 text-xs text-[#0c2bfc] bg-[#0c2bfc]/5 p-2 rounded-lg">
                      Creating new guest. Please fill in all required fields
                      below.
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      First Name *
                    </label>
                    <input
                      value={guest.firstName}
                      onChange={(e) => {
                        if (!guestExists) {
                          const value = e.target.value;
                          setGuest((g) => ({ ...g, firstName: value }));
                          setFieldError("firstName", "");
                        }
                      }}
                      onBlur={() => {
                        if (guest.firstName && !validateName(guest.firstName)) {
                          setFieldError(
                            "firstName",
                            "First name can only contain letters and spaces.",
                          );
                        }
                      }}
                      readOnly={guestExists}
                      className={`
      mt-1 w-full h-11 rounded-xl border px-4 text-sm outline-none 
      focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
      transition-all duration-200 bg-white
      ${
        errors.firstName
          ? "border-red-300 bg-red-50"
          : guestExists
            ? "border-gray-200 bg-gray-100 text-gray-700 cursor-not-allowed"
            : "border-gray-200"
      }
    `}
                      placeholder="John (letters and spaces only)"
                    />
                    <FieldError text={errors.firstName} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Last Name *
                    </label>
                    <input
                      value={guest.lastName}
                      onChange={(e) => {
                        if (!guestExists) {
                          const value = e.target.value;
                          setGuest((g) => ({ ...g, lastName: value }));
                          setFieldError("lastName", "");
                        }
                      }}
                      onBlur={() => {
                        if (guest.lastName && !validateName(guest.lastName)) {
                          setFieldError(
                            "lastName",
                            "Last name can only contain letters and spaces.",
                          );
                        }
                      }}
                      readOnly={guestExists}
                      className={`
      mt-1 w-full h-11 rounded-xl border px-4 text-sm outline-none 
      focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
      transition-all duration-200 bg-white
      ${
        errors.lastName
          ? "border-red-300 bg-red-50"
          : guestExists
            ? "border-gray-200 bg-gray-100 text-gray-700 cursor-not-allowed"
            : "border-gray-200"
      }
    `}
                      placeholder="Doe (letters and spaces only)"
                    />
                    <FieldError text={errors.lastName} />
                  </div>
                  {/* Contact Number */}
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-gray-700">
                      Contact Number *
                    </label>
                    <input
                      value={guest.contactNumber}
                      onChange={(e) => {
                        if (!guestExists) {
                          setGuest((g) => ({
                            ...g,
                            contactNumber: e.target.value,
                          }));
                          setFieldError("contactNumber", "");
                        }
                      }}
                      readOnly={guestExists}
                      className={`
                        mt-1 w-full h-11 rounded-xl border px-4 text-sm outline-none 
                        focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
                        transition-all duration-200 bg-white
                        ${
                          errors.contactNumber
                            ? "border-red-300 bg-red-50"
                            : guestExists
                              ? "border-gray-200 bg-gray-100 text-gray-700 cursor-not-allowed"
                              : "border-gray-200"
                        }
                      `}
                      placeholder="09123456789"
                    />
                    <FieldError text={errors.contactNumber} />
                    <div className="mt-1 text-xs text-gray-500">
                      Must start with 09 and be 11 digits.
                    </div>
                  </div>
                  {/* Guest Status Display */}
                  {guestExists && originalGuestData && (
                    <div className="sm:col-span-2 mt-4">
                      <div
                        className="
                        rounded-xl border border-[#00af00]/20 
                        bg-[#00af00]/5
                        p-4
                      "
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <FiCheckCircle className="text-[#00af00]" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-[#00af00]">
                              Guest Found ✓
                            </div>
                            <div className="text-sm text-gray-700 mt-1">
                              {originalGuestData.firstName}{" "}
                              {originalGuestData.lastName}
                              {originalGuestData.contactNumber && (
                                <span className="ml-3">
                                  • {originalGuestData.contactNumber}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 mt-2">
                              Guest details are pre-filled from our records.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {isCreatingNewGuest && (
                    <div className="sm:col-span-2 mt-4">
                      <div
                        className="
                        rounded-xl border border-gray-200 
                        bg-gray-50
                        p-4
                      "
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <FiPlus className="text-[#0c2bfc]" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              New Guest
                            </div>
                            <div className="text-sm text-gray-700 mt-1">
                              Please fill in the guest details below.
                            </div>
                            <div className="text-xs text-gray-600 mt-2">
                              All fields are required for new guests.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <Section
                title="Step 4: Payment Details"
                subtitle="Complete payment information and upload required documents."
                icon={<FiCreditCard />}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Payment Option */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Payment Option *
                    </label>
                    <select
                      value={payment.paymentOption}
                      onChange={(e) => {
                        const newPaymentOptionId = e.target.value;

                        const calculatedAmount = calculatePaymentAmount(
                          newPaymentOptionId,
                          finalTotal,
                          paymentOptions,
                        );

                        setPayment((p) => ({
                          ...p,
                          paymentOption: newPaymentOptionId,
                          amountPaid: calculatedAmount,
                          amountReceived: calculatedAmount,
                        }));
                        setFieldError("paymentOption", "");
                      }}
                      className={`
mt-1 w-full h-11 rounded-xl border px-4 text-sm outline-none 
focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
transition-all duration-200 bg-white
${errors.paymentOption ? "border-red-300 bg-red-50" : "border-gray-200"}
`}
                    >
                      <option value="">Select payment option</option>
                      {paymentOptions
                        .filter((po) => po.isActive)
                        .map((po) => (
                          <option key={po._id} value={po._id}>
                            {po.name}
                            {po.paymentType === "partial"
                              ? ` (${po.amount}% - ${formatMoney((finalTotal * po.amount) / 100)})`
                              : ` (Full - ${formatMoney(finalTotal)})`}
                          </option>
                        ))}
                    </select>
                    <FieldError text={errors.paymentOption} />
                    {payment.paymentOption && (
                      <div className="mt-1 text-xs text-gray-500">
                        Amount: {formatMoney(payment.amountPaid)}
                      </div>
                    )}
                  </div>

                  {/* Payment Type */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Payment Type *
                    </label>
                    <select
                      value={payment.paymentType}
                      onChange={(e) => {
                        setPayment((p) => ({
                          ...p,
                          paymentType: e.target.value,
                        }));
                        // Clear receipt fields when payment type changes
                        setSelectedReceiptImage(null);
                        setReceiptImagePreview("");
                        setReferenceNumber("");
                        setFieldError("paymentType", "");
                        setFieldError("receipt", "");
                      }}
                      className={`
            mt-1 w-full h-11 rounded-xl border px-4 text-sm outline-none 
            focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
            transition-all duration-200 bg-white
            ${
              errors.paymentType
                ? "border-red-300 bg-red-50"
                : "border-gray-200"
            }
          `}
                    >
                      <option value="">Select payment type</option>
                      {paymentTypes
                        .filter((pt) => pt.isActive)
                        .map((pt) => (
                          <option key={pt._id} value={pt._id}>
                            {pt.name} {pt.isReceipt && "(Requires Receipt)"}
                          </option>
                        ))}
                    </select>
                    <FieldError text={errors.paymentType} />
                  </div>

                  {/* Discount */}
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-gray-700">
                      Discount (Optional)
                    </label>
                    <select
                      value={payment.discountId}
                      onChange={(e) => {
                        setPayment((p) => ({
                          ...p,
                          discountId: e.target.value,
                        }));
                        if (!e.target.value) {
                          removeDiscountImage();
                        }
                        setFieldError("discountImage", "");
                      }}
                      className="
            mt-1 w-full h-11 rounded-xl border border-gray-200 
            bg-white px-4 text-sm 
            outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
            text-gray-700
          "
                    >
                      <option value="">No discount</option>
                      {discounts
                        .filter((d) => d.isActive)
                        .map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name} ({d.discountPercent}%
                            {d.appliesToAllRooms
                              ? ", All rooms"
                              : `, ${d.discountPriority} room`}
                            )
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Amount Paid */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Amount Paid *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={payment.amountPaid}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setPayment((p) => ({
                          ...p,
                          amountPaid: value,
                          amountReceived:
                            p.amountReceived < value ? value : p.amountReceived,
                        }));
                        setFieldError("amountPaid", "");
                      }}
                      className={`
            mt-1 w-full h-11 rounded-xl border px-4 text-sm outline-none 
            focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
            transition-all duration-200 bg-white
            ${
              errors.amountPaid ? "border-red-300 bg-red-50" : "border-gray-200"
            }
          `}
                    />
                    <FieldError text={errors.amountPaid} />
                  </div>

                  {/* Amount Received */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Amount Received *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={payment.amountReceived}
                      onChange={(e) => {
                        setPayment((p) => ({
                          ...p,
                          amountReceived: Number(e.target.value),
                        }));
                        setFieldError("amountReceived", "");
                      }}
                      className={`
            mt-1 w-full h-11 rounded-xl border px-4 text-sm outline-none 
            focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
            transition-all duration-200 bg-white
            ${
              errors.amountReceived
                ? "border-red-300 bg-red-50"
                : "border-gray-200"
            }
          `}
                    />
                    <FieldError text={errors.amountReceived} />
                  </div>
                </div>

                {/* Discount Image Upload */}
                {payment.discountId && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">
                        Discount ID Image *
                      </label>
                      <button
                        type="button"
                        onClick={() => discountFileInputRef.current?.click()}
                        className="
              h-9 px-4 rounded-xl 
              bg-[#0c2bfc] 
              hover:bg-[#0a24d6]
              text-white text-xs font-medium inline-flex items-center gap-2
              transition-all duration-200
              hover:shadow-md hover:-translate-y-0.5
              active:translate-y-0
            "
                      >
                        <FiUploadCloud size={12} /> Upload
                      </button>
                      <input
                        ref={discountFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleDiscountImageUpload(e.target.files[0]);
                            setFieldError("discountImage", "");
                          }
                        }}
                      />
                    </div>

                    {discountImagePreview ? (
                      <div
                        className="
            rounded-xl border border-gray-200 overflow-hidden 
            bg-white
          "
                      >
                        <div className="relative">
                          <img
                            src={discountImagePreview}
                            alt="Discount ID"
                            className="h-48 w-full object-contain bg-gray-50"
                          />
                          <button
                            type="button"
                            onClick={removeDiscountImage}
                            className="
                  absolute top-2 right-2 h-9 w-9 rounded-xl 
                  border border-gray-200 
                  bg-white
                  hover:bg-gray-50
                  grid place-items-center text-[#0c2bfc]
                  transition-all duration-200
                  hover:shadow-md hover:-translate-y-0.5
                  active:translate-y-0
                "
                            title="Remove"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="
            rounded-xl border border-dashed border-gray-200 
            bg-gray-50
            p-8 text-center text-sm text-gray-500
          "
                      >
                        <FiUploadCloud
                          className="mx-auto mb-3 text-gray-400"
                          size={28}
                        />
                        <div>Upload discount ID image</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Supports JPG, PNG, PDF
                        </div>
                      </div>
                    )}
                    <FieldError text={errors.discountImage} />
                  </div>
                )}

                {/* Receipt Section - UPDATED to make image optional with reference number */}
                {requiresReceipt && (
                  <div className="mt-6">
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        Receipt Information *
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        Please provide either a reference number OR upload a
                        receipt image.
                      </div>
                    </div>

                    {/* Reference Number Field */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reference Number
                        <span className="text-xs text-gray-500 ml-2">
                          (Optional if image uploaded)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={referenceNumber}
                        onChange={(e) => {
                          setReferenceNumber(e.target.value);
                          setFieldError("receipt", "");
                        }}
                        placeholder="e.g., GCash Ref #, Bank Transfer Ref #"
                        className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] transition-all duration-200"
                        disabled={selectedReceiptImage !== null}
                      />
                      {selectedReceiptImage && (
                        <p className="text-xs text-amber-600 mt-1">
                          Reference number disabled because image is uploaded.
                          Clear image to use reference number.
                        </p>
                      )}
                    </div>

                    {/* OR Divider */}
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-white text-gray-500">OR</span>
                      </div>
                    </div>

                    {/* Receipt Image Upload */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-gray-700">
                          Receipt Image
                          <span className="text-xs text-gray-500 ml-2">
                            (Optional if ref# provided)
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          {selectedReceiptImage && (
                            <button
                              type="button"
                              onClick={() => {
                                removeReceiptImage();
                                setFieldError("receipt", "");
                              }}
                              className="h-9 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 transition-all duration-200"
                            >
                              Clear Image
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => receiptFileInputRef.current?.click()}
                            className="
                  h-9 px-4 rounded-xl 
                  bg-[#0c2bfc] 
                  hover:bg-[#0a24d6]
                  text-white text-xs font-medium inline-flex items-center gap-2
                  transition-all duration-200
                  hover:shadow-md hover:-translate-y-0.5
                  active:translate-y-0
                "
                          >
                            <FiUploadCloud size={12} />
                            {selectedReceiptImage ? "Change Image" : "Upload"}
                          </button>
                          <input
                            ref={receiptFileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleReceiptImageUpload(e.target.files[0]);
                                setFieldError("receipt", "");
                              }
                            }}
                          />
                        </div>
                      </div>

                      {receiptImagePreview ? (
                        <div
                          className="
              rounded-xl border border-gray-200 overflow-hidden 
              bg-white
            "
                        >
                          <div className="relative">
                            <img
                              src={receiptImagePreview}
                              alt="Payment Receipt"
                              className="h-48 w-full object-contain bg-gray-50"
                            />
                            <button
                              type="button"
                              onClick={removeReceiptImage}
                              className="
                    absolute top-2 right-2 h-9 w-9 rounded-xl 
                    border border-gray-200 
                    bg-white
                    hover:bg-gray-50
                    grid place-items-center text-[#0c2bfc]
                    transition-all duration-200
                    hover:shadow-md hover:-translate-y-0.5
                    active:translate-y-0
                  "
                              title="Remove"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="
              rounded-xl border border-dashed border-gray-200 
              bg-gray-50
              p-8 text-center text-sm text-gray-500
            "
                        >
                          <FiUploadCloud
                            className="mx-auto mb-3 text-gray-400"
                            size={28}
                          />
                          <div>Upload receipt image (optional)</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {referenceNumber
                              ? "Reference number provided, image is optional"
                              : "Upload image or provide reference number"}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status indicator */}
                    <div className="mt-3 text-xs">
                      {referenceNumber || receiptImagePreview ? (
                        <div className="text-[#00af00] flex items-center gap-1">
                          <FiCheckCircle size={12} />
                          {referenceNumber && receiptImagePreview
                            ? "Both reference number and image provided"
                            : referenceNumber
                              ? "Reference number provided"
                              : "Receipt image uploaded"}
                        </div>
                      ) : (
                        <div className="text-amber-600">
                          Please provide either a reference number or upload a
                          receipt image
                        </div>
                      )}
                    </div>

                    <FieldError text={errors.receipt} />
                  </div>
                )}
              </Section>
            )}
          </div>

          {/* Right Summary Panel */}
          <div className="lg:col-span-4 space-y-6">
            <SummaryCard title="Booking Summary" className="sticky top-6">
              <div className="space-y-4 text-sm">
                {/* Basic Info */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Check In</span>
                    <span className="font-medium text-gray-900">
                      {reservationFormData.checkIn
                        ? new Date(reservationFormData.checkIn).toLocaleString(
                            "en-PH",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Check Out</span>
                    <span className="font-medium text-gray-900">
                      {reservationFormData.checkOut
                        ? new Date(reservationFormData.checkOut).toLocaleString(
                            "en-PH",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Nights</span>
                    <span className="font-medium text-gray-900">
                      {nights || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Guests</span>
                    <span className="font-medium text-gray-900">
                      {reservationFormData.adults} adults,{" "}
                      {reservationFormData.children} children
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Items</span>
                    <span className="font-medium text-gray-900">
                      {roomReservations.length} / {maxRooms}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4"></div>

                {/* Room Breakdown */}
                {roomTotals.map((roomTotal, index) => {
                  const roomRes = roomReservations[index];
                  const item = availableRooms.find(
                    (r) => r._id === roomRes?.roomId,
                  );
                  const isCottage = item?.category === "cottage";

                  return (
                    <div key={roomTotal.roomId} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="text-xs font-medium text-gray-900">
                          {isCottage ? "Cottage" : "Room"} {roomRes?.roomNumber}
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
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">
                            {nights} × {formatMoney(roomTotal.roomRate)}
                          </span>
                          <span>{formatMoney(roomTotal.roomSubtotal)}</span>
                        </div>
                        {roomRes?.amenities.map((amenity, aIndex) => {
                          const amenityData = amenities.find(
                            (a) => a._id === amenity.amenityId,
                          );
                          return (
                            <div
                              key={`${amenity.amenityId}-${aIndex}`}
                              className="flex justify-between text-xs"
                            >
                              <span className="text-gray-500 pl-2">
                                • {amenityData?.name} (×{amenity.quantity})
                              </span>
                              <span>
                                {formatMoney(
                                  (amenityData?.rate || 0) * amenity.quantity,
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-xs font-medium pt-1 border-t border-gray-100">
                        <span className="text-gray-700">Total</span>
                        <span>{formatMoney(roomTotal.total)}</span>
                      </div>
                    </div>
                  );
                })}

                <div className="border-t border-gray-200 pt-4"></div>

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-gray-900">
                      {formatMoney(totalAmount)}
                    </span>
                  </div>

                  {discount.amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Discount ({discount.name})
                      </span>
                      <span className="font-medium text-[#00af00]">
                        -{formatMoney(discount.amount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-base pt-2 border-t border-gray-200">
                    <span className="text-gray-700 font-semibold">Total</span>
                    <span className="text-gray-900 font-semibold">
                      {formatMoney(finalTotal)}
                    </span>
                  </div>

                  {/* Payment Details (Step 4 only) */}
                  {step === 4 && (
                    <>
                      <div className="border-t border-gray-200 pt-4"></div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Total Amount</span>
                          <span className="font-medium text-gray-900">
                            {formatMoney(finalTotal)}
                          </span>
                        </div>

                        {payment.paymentOption && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              {(() => {
                                const po = paymentOptions.find(
                                  (p) => p._id === payment.paymentOption,
                                );
                                if (!po) return "Amount Due";
                                return po.paymentType === "partial"
                                  ? `Partial Payment (${po.amount}%)`
                                  : "Full Payment";
                              })()}
                            </span>
                            <span className="font-medium text-gray-900">
                              {formatMoney(amountDue)}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between">
                          <span className="text-gray-500">Amount Paid</span>
                          <span className="font-medium text-gray-900">
                            {formatMoney(payment.amountPaid)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Amount Received</span>
                          <span className="font-medium text-gray-900">
                            {formatMoney(payment.amountReceived)}
                          </span>
                        </div>

                        {payment.amountReceived > payment.amountPaid && (
                          <div className="flex justify-between text-[#00af00]">
                            <span>Change</span>
                            <span className="font-medium">
                              {formatMoney(
                                payment.amountReceived - payment.amountPaid,
                              )}
                            </span>
                          </div>
                        )}

                        {payment.amountPaid < amountDue && (
                          <div className="flex justify-between text-red-600">
                            <span>Balance Due</span>
                            <span className="font-medium">
                              {formatMoney(amountDue - payment.amountPaid)}
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Warning messages */}
              {step === 2 && reservationFormData.adults > totalCapacity && (
                <div
                  className="
                  mt-4 rounded-xl border border-gray-200 
                  bg-gray-50
                  px-4 py-3 text-xs text-gray-800
                "
                >
                  <div className="font-medium">Capacity Warning</div>
                  <div className="mt-1">
                    Selected capacity ({totalCapacity}) is not enough for{" "}
                    {reservationFormData.adults} adults. Add another item.
                  </div>
                </div>
              )}
            </SummaryCard>
          </div>
        </div>

        {/* Footer Navigation */}
        <div
          className="
          flex items-center justify-between gap-3 pt-4 border-t border-gray-200
          bg-white p-4 rounded-xl
        "
        >
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className={`
              h-11 px-5 rounded-xl border text-sm font-medium 
              inline-flex items-center gap-2 transition-all duration-200
              ${
                step === 1
                  ? "border-gray-200 text-gray-400 cursor-not-allowed bg-white"
                  : "border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-[#0c2bfc] hover:shadow-md hover:-translate-y-0.5"
              }
            `}
          >
            <FiChevronLeft /> Back
          </button>

          {/* Step-specific next buttons */}
          {step === 1 && (
            <button
              type="button"
              onClick={handleStep1Next}
              disabled={loadingRooms}
              className={`
                h-11 px-5 rounded-xl text-white text-sm font-medium 
                inline-flex items-center gap-2 transition-all duration-200
                ${
                  loadingRooms
                    ? "bg-[#0c2bfc]/50 cursor-not-allowed"
                    : "bg-[#0c2bfc] hover:bg-[#0a24d6] hover:shadow-lg hover:-translate-y-0.5"
                }
              `}
            >
              {loadingRooms ? "Loading Items..." : "Next"}
              <FiChevronRight />
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={handleStep2Next}
              disabled={
                roomReservations.length === 0 ||
                roomReservations.length > maxRooms ||
                errors.category
              }
              className={`
                h-11 px-5 rounded-xl text-white text-sm font-medium 
                inline-flex items-center gap-2 transition-all duration-200
                ${
                  roomReservations.length === 0 ||
                  roomReservations.length > maxRooms ||
                  errors.category
                    ? "bg-[#0c2bfc]/50 cursor-not-allowed"
                    : "bg-[#0c2bfc] hover:bg-[#0a24d6] hover:shadow-lg hover:-translate-y-0.5"
                }
              `}
            >
              Next
              <FiChevronRight />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleStep3Next}
              disabled={searchLoading || !isGuestValid}
              className={`
                h-11 px-5 rounded-xl text-white text-sm font-medium 
                inline-flex items-center gap-2 transition-all duration-200
                ${
                  searchLoading || !isGuestValid
                    ? "bg-[#0c2bfc]/50 cursor-not-allowed"
                    : "bg-[#0c2bfc] hover:bg-[#0a24d6] hover:shadow-lg hover:-translate-y-0.5"
                }
              `}
            >
              Next
              <FiChevronRight />
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={submitReservation}
              disabled={loading || loadingRooms}
              className={`
                h-11 px-5 rounded-xl text-white text-sm font-medium 
                inline-flex items-center gap-2 transition-all duration-200
                ${
                  loading || loadingRooms
                    ? "bg-[#00af00]/50 cursor-not-allowed"
                    : "bg-[#00af00] hover:bg-[#009500] hover:shadow-lg hover:-translate-y-0.5"
                }
              `}
            >
              {loading ? "Creating..." : "Complete Reservation"}
            </button>
          )}
        </div>

        {/* Loader overlay */}
        {(loading || loadingRooms) && (
          <div
            className="
            absolute inset-0 z-50 flex items-center justify-center 
            bg-white/90 backdrop-blur-sm
          "
          >
            <Loader
              size={60}
              variant="primary"
              showText={true}
              text={loading ? "Creating reservation..." : "Loading items..."}
            />
          </div>
        )}
      </div>
    </>
  );
}
