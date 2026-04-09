import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiMinus, // Add this
  FiImage, // Add this
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
import { useAddOnStore } from "../stores/addOnStore.js";
import { usePaymentStore } from "../stores/paymentStore.js";
import { useGuestStore } from "../stores/guestStore.js";
import NumberInput from "../components/ui/NumberInput.jsx";
import Stepper from "../components/ui/NumberInput.jsx";
import ImagePreviewModal from "../components/modals/ImagePreviewModal.jsx";

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

const isDateBeforeToday = (dateValue) => {
  if (!dateValue) return false;
  const selected = new Date(dateValue);
  const today = new Date();
  selected.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return selected < today;
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
  const [fitCapacityOnly, setFitCapacityOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // State for guest email search
  const [emailInput, setEmailInput] = useState("");
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [guestExists, setGuestExists] = useState(false);
  const [originalGuestData, setOriginalGuestData] = useState(null);
  const [isCreatingNewGuest, setIsCreatingNewGuest] = useState(false);
  const [isComplimentaryReservation, setIsComplimentaryReservation] =
    useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImageTitle, setSelectedImageTitle] = useState("");

  const openImagePreview = (images, title) => {
    setSelectedImages(images);
    setSelectedImageTitle(title);
    setImagePreviewOpen(true);
  };
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

  const [selectedDiscountImages, setSelectedDiscountImages] = useState([]);
  const [discountImagePreviews, setDiscountImagePreviews] = useState([]);

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
  const addOns = useAddOnStore((s) => s.addOns);
  const fetchAddOns = useAddOnStore((s) => s.fetchAddOns);

  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [errors, setErrors] = useState({});

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

  // Filter available items by category/capacity
  const filteredAvailableItems = useMemo(() => {
    const requiredGuests =
      Number(reservationFormData.adults || 0) +
      Number(reservationFormData.children || 0);

    return availableRooms.filter((item) => {
      const matchesCategory =
        categoryFilter === "all" ? true : item.category === categoryFilter;
      if (!matchesCategory) return false;
      if (!fitCapacityOnly) return true;
      return Number(item?.capacity || 0) >= requiredGuests;
    });
  }, [
    availableRooms,
    categoryFilter,
    fitCapacityOnly,
    reservationFormData.adults,
    reservationFormData.children,
  ]);

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
          fetchAddOns?.(),
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
    fetchAddOns,
    fetchPaymentOptions,
    fetchPaymentTypes,
    fetchDiscounts,
    fetchGuests,
  ]);

  // Auto-detect new guest creation when user starts filling fields
  useEffect(() => {
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
      discountImagePreviews.forEach((url) => URL.revokeObjectURL(url));
      if (receiptImagePreview) URL.revokeObjectURL(receiptImagePreview);
    };
  }, [discountImagePreviews, receiptImagePreview]);

  // Check if guest is valid
  const isGuestValid = useMemo(() => {
    if (reservationFormData.guestId && guestExists && originalGuestData) {
      const hasValidGuestData =
        originalGuestData.firstName === guest.firstName &&
        originalGuestData.lastName === guest.lastName &&
        originalGuestData.contactNumber === guest.contactNumber &&
        originalGuestData.email === guest.email;
      return hasValidGuestData;
    }

    if (isCreatingNewGuest) {
      const hasFirstName = guest.firstName?.trim();
      const hasLastName = guest.lastName?.trim();
      const hasContactNumber = guest.contactNumber?.trim();
      const isValidFirstName = validateName(guest.firstName);
      const isValidLastName = validateName(guest.lastName);
      const isValidPhone = validatePhone(guest.contactNumber);
      const isValidEmail = !guest.email || validateEmail(guest.email);

      return (
        hasFirstName &&
        hasLastName &&
        hasContactNumber &&
        isValidFirstName &&
        isValidLastName &&
        isValidPhone &&
        isValidEmail
      );
    }

    return false;
  }, [
    reservationFormData.guestId,
    guestExists,
    originalGuestData,
    isCreatingNewGuest,
    guest,
  ]);

  const searchGuestByEmail = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === "") {
      setEmailSuggestions([]);
      setShowEmailDropdown(false);
      return;
    }

    setSearchLoading(true);
    try {
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
    setFieldError("email", "");

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
      guestId: "",
    }));
    setEmailSuggestions([]);
    setShowEmailDropdown(false);
  };

  // Calculations
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

      let addOnsSubtotal = 0;
      if (!isCottage) {
        addOnsSubtotal = roomRes.addOns.reduce((sum, addOn) => {
          const addOnData = addOns.find((a) => a._id === addOn.addOnId);
          return sum + (addOnData?.rate || 0) * addOn.quantity;
        }, 0);
      }

      return {
        roomId: roomRes.roomId,
        total: roomSubtotal + addOnsSubtotal,
        roomSubtotal,
        addOnsSubtotal,
        roomRate,
        category: room?.category,
        isCottage,
      };
    });
  }, [roomReservations, availableRooms, nights, addOns]);

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
      if (payment.paymentOption) return;
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
  }, [step, finalTotal, payment.paymentOption, paymentOptions]);

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
  const { roomCapacity, cottageCapacity, totalCapacity } = useMemo(() => {
    return roomReservations.reduce(
      (acc, roomRes) => {
        const capacity = Number(roomRes?.capacity || 0);
        if (roomRes?.category === "cottage") {
          acc.cottageCapacity += capacity;
        } else {
          acc.roomCapacity += capacity;
        }
        acc.totalCapacity += capacity;
        return acc;
      },
      { roomCapacity: 0, cottageCapacity: 0, totalCapacity: 0 },
    );
  }, [roomReservations]);
  const requiredCapacity =
    Number(reservationFormData.adults || 0) +
    Number(reservationFormData.children || 0);
  const hasRoomsSelected = roomReservations.some(
    (roomRes) => roomRes?.category !== "cottage",
  );
  const hasCottagesSelected = roomReservations.some(
    (roomRes) => roomRes?.category === "cottage",
  );
  const roomsSatisfyCapacity = roomCapacity >= requiredCapacity;
  const cottagesSatisfyCapacity = cottageCapacity >= requiredCapacity;
  const capacityMet =
    roomReservations.length > 0 &&
    (hasRoomsSelected ? roomsSatisfyCapacity : true) &&
    (hasCottagesSelected ? cottagesSatisfyCapacity : true);
  const capacityMetBy =
    roomsSatisfyCapacity && cottagesSatisfyCapacity
      ? "rooms and cottages"
      : roomsSatisfyCapacity
        ? "rooms"
        : cottagesSatisfyCapacity
          ? "cottages"
          : "";
  const remainingRoomCapacityNeeded = hasRoomsSelected
    ? Math.max(requiredCapacity - roomCapacity, 0)
    : 0;
  const remainingCottageCapacityNeeded = hasCottagesSelected
    ? Math.max(requiredCapacity - cottageCapacity, 0)
    : 0;

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
  const complimentaryPaymentOption = useMemo(
    () =>
      paymentOptions.find((po) => po.isActive && po.paymentType === "full") ||
      paymentOptions.find((po) => po.isActive) ||
      null,
    [paymentOptions],
  );
  const complimentaryPaymentType = useMemo(
    () =>
      paymentTypes.find((pt) => pt.isActive && !pt.isReceipt) ||
      paymentTypes.find((pt) => pt.isActive) ||
      null,
    [paymentTypes],
  );

  // Validation
  const setFieldError = (key, message) =>
    setErrors((prev) => ({ ...prev, [key]: message }));

  const validateStep1 = () => {
    const errors = {};

    if (!reservationFormData.checkIn) {
      errors.checkIn = "Check-in is required.";
    } else if (isDateBeforeToday(reservationFormData.checkIn)) {
      errors.checkIn = "Check-in date cannot be in the past.";
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

    if (roomReservations.length > 0 && !capacityMet) {
      const requirements = [];
      if (hasRoomsSelected && !roomsSatisfyCapacity) {
        requirements.push(
          `add ${remainingRoomCapacityNeeded} more room capacity`,
        );
      }
      if (hasCottagesSelected && !cottagesSatisfyCapacity) {
        requirements.push(
          `add ${remainingCottageCapacityNeeded} more cottage capacity`,
        );
      }

      errors.capacity = `Capacity requirement not met for ${requiredCapacity} guests. Please ${requirements.join(" and ")}.`;
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

    // if (!emailInput || emailInput.trim() === "") {
    //   errors.email = "Email is required. Please enter an email address.";
    // }

    if (guestExists && reservationFormData.guestId) {
      if (originalGuestData && originalGuestData.email !== emailInput) {
        errors.email = "Email mismatch. Please select the correct guest.";
      }
    } else if (emailInput && emailInput.trim() !== "" && !guestExists) {
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

    if (requiresReceipt) {
      if (!selectedReceiptImage) {
        errors.receipt = "Receipt image is required for this payment type.";
      }
    }

    if (payment.discountId && selectedDiscountImages.length === 0) {
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
    if (isComplimentaryReservation) {
      submitComplimentaryReservation();
      return;
    }
    goNext();
  };

  const goNext = () => setStep((prev) => Math.min(4, prev + 1));
  const goBack = () => setStep((prev) => Math.max(1, prev - 1));

  const addRoom = (item) => {
    setRoomReservations((prev) => [
      ...prev,
      {
        roomId: item._id,
        roomNumber: item.roomNumber,
        rate: item.rate,
        capacity: item.capacity,
        roomTypeName: item.roomType?.name ?? "",
        category: item.category,
        addOns: [],
        images: item.images || [], // Add this line
      },
    ]);
  };

  const removeRoom = (roomId) => {
    setRoomReservations((prev) => prev.filter((r) => r.roomId !== roomId));
  };

  const addAddOnToRoom = (roomIndex) => {
    const selectedItem = roomReservations[roomIndex];
    const item = availableRooms.find((r) => r._id === selectedItem.roomId);

    if (item?.category === "cottage") {
      toast.error(
        "Add-ons are not available for cottages. They can only be added to rooms.",
      );
      return;
    }

    if (!addOns?.length) {
      toast.error("No add-ons available.");
      return;
    }

    setRoomReservations((prev) => {
      const updated = [...prev];
      updated[roomIndex].addOns.push({
        addOnId: addOns[0]._id,
        quantity: 1,
      });
      return updated;
    });
  };

  const updateAddOnInRoom = (roomIndex, addOnIndex, updates) => {
    setRoomReservations((prev) => {
      const updated = [...prev];
      updated[roomIndex].addOns[addOnIndex] = {
        ...updated[roomIndex].addOns[addOnIndex],
        ...updates,
      };
      return updated;
    });
  };

  const removeAddOnFromRoom = (roomIndex, addOnIndex) => {
    setRoomReservations((prev) => {
      const updated = [...prev];
      updated[roomIndex].addOns.splice(addOnIndex, 1);
      return updated;
    });
  };

  // Image handlers
  const handleDiscountImageUpload = (files) => {
    const incoming = Array.from(files || []).filter(Boolean);
    if (incoming.length === 0) return;

    const incomingPreviews = incoming.map((file) => URL.createObjectURL(file));
    setSelectedDiscountImages((prev) => [...prev, ...incoming]);
    setDiscountImagePreviews((prev) => [...prev, ...incomingPreviews]);
  };

  const handleReceiptImageUpload = (file) => {
    if (receiptImagePreview) URL.revokeObjectURL(receiptImagePreview);
    const preview = URL.createObjectURL(file);
    setSelectedReceiptImage(file);
    setReceiptImagePreview(preview);
  };

  const clearDiscountImages = () => {
    discountImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setSelectedDiscountImages([]);
    setDiscountImagePreviews([]);
  };

  const removeDiscountImageAt = (index) => {
    setSelectedDiscountImages((prev) => prev.filter((_, i) => i !== index));
    setDiscountImagePreviews((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed);
      return next;
    });
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
    setIsComplimentaryReservation(false);
    clearDiscountImages();
    removeReceiptImage();
    setReferenceNumber("");
    setAvailableRooms([]);
    setErrors({});
    clearCurrentGuest();
  };

  // Submit reservation
  const submitComplimentaryReservation = async () => {
    if (!complimentaryPaymentOption || !complimentaryPaymentType) {
      toast.error(
        "Please configure at least one active payment option and payment type for complimentary reservations.",
      );
      return;
    }

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
          notes: [
            reservationFormData.notes || "",
            "Complimentary reservation (no payment required).",
          ]
            .filter(Boolean)
            .join(" "),
          paymentOption: complimentaryPaymentOption._id,
          discountId: null,
        },
        rooms: roomReservations.map((roomRes) => ({
          roomId: roomRes.roomId,
          addOns: roomRes.addOns.map((addOn) => ({
            addOnId: addOn.addOnId,
            quantity: addOn.quantity,
          })),
        })),
        payment: {
          paymentType: complimentaryPaymentType._id,
          amountPaid: 0,
          amountReceived: 0,
        },
        discountImageFile: null,
        receiptData: null,
        guestId: reservationFormData.guestId || null,
      };

      await createFullReservation(payload);
      toast.success("Complimentary reservation created successfully!");
      navigate(`/billing/`);
    } catch (err) {
      console.error("Complimentary reservation creation error:", err);
      toast.error(
        err.message || "Failed to create complimentary reservation. Please try again.",
      );
    }
  };

  const submitReservation = async () => {
    if (!validateStep4()) return;

    const selectedPaymentTypeData = paymentTypes.find(
      (pt) => pt._id === payment.paymentType,
    );
    const requiresReceiptForSelected =
      selectedPaymentTypeData?.isReceipt === true;

    if (payment.discountId && selectedDiscountImages.length === 0) {
      setFieldError(
        "discountImage",
        "At least one discount image is required when applying discount.",
      );
      toast.error("Please upload at least one discount image.");
      return;
    }

    if (requiresReceiptForSelected && !selectedReceiptImage) {
      setFieldError("receipt", "Receipt image is required for this payment type.");
      toast.error("Please upload a receipt image.");
      return;
    }

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
          addOns: roomRes.addOns.map((addOn) => ({
            addOnId: addOn.addOnId,
            quantity: addOn.quantity,
          })),
        })),
        payment: {
          paymentType: payment.paymentType,
          amountPaid: payment.amountPaid,
          amountReceived: payment.amountReceived,
        },
        discountImageFiles: selectedDiscountImages,
        receiptData: {
          imageFile: selectedReceiptImage,
          referenceNumber: referenceNumber || null,
          isAdminInitiated: true,
        },
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
        toast.error("Some add-ons are out of stock. Please adjust quantities.");
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
                subtitle="Select your stay dates and number of guests."
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
                  {/* Check In Date - Fixed time 2:00 PM */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Check In Date *
                    </label>
                    <div>
                      <input
                        type="date"
                        min={(() => {
                          // Get today's date in YYYY-MM-DD format
                          const today = new Date();
                          const year = today.getFullYear();
                          const month = String(today.getMonth() + 1).padStart(
                            2,
                            "0",
                          );
                          const day = String(today.getDate()).padStart(2, "0");
                          return `${year}-${month}-${day}`;
                        })()}
                        value={reservationFormData.checkIn.split("T")[0]}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          if (newDate) {
                            const selectedDate = new Date(newDate);
                            selectedDate.setHours(0, 0, 0, 0);
                            // Check if selected date is today or future
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            if (selectedDate >= today) {
                              // Always set time to 14:00 (2:00 PM)
                              const newDateTime = `${newDate}T14:00`;
                              setReservationFormData({
                                ...reservationFormData,
                                checkIn: newDateTime,
                              });
                            }
                          }
                        }}
                        className={`mt-1 w-full h-11 rounded-lg border px-4 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] transition-all duration-200 bg-white ${errors.checkIn ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0c2bfc]/10 text-[#0c2bfc]">
                        <FiClock className="mr-1" size={12} />
                        Check-in: 2:00 PM
                      </span>
                      <span className="text-xs text-gray-500">
                        (Time is fixed)
                      </span>
                    </div>
                    <FieldError text={errors.checkIn} />
                  </div>

                  {/* Check Out Date - Fixed time 12:00 NN */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Check Out Date *
                    </label>
                    <div>
                      <input
                        type="date"
                        min={(() => {
                          // Minimum check-out date is check-in date + 1 day
                          const checkInDate =
                            reservationFormData.checkIn.split("T")[0];
                          if (checkInDate) {
                            const nextDay = new Date(checkInDate);
                            nextDay.setDate(nextDay.getDate() + 1);
                            const year = nextDay.getFullYear();
                            const month = String(
                              nextDay.getMonth() + 1,
                            ).padStart(2, "0");
                            const day = String(nextDay.getDate()).padStart(
                              2,
                              "0",
                            );
                            return `${year}-${month}-${day}`;
                          }
                          // Default: tomorrow
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          const year = tomorrow.getFullYear();
                          const month = String(
                            tomorrow.getMonth() + 1,
                          ).padStart(2, "0");
                          const day = String(tomorrow.getDate()).padStart(
                            2,
                            "0",
                          );
                          return `${year}-${month}-${day}`;
                        })()}
                        value={reservationFormData.checkOut.split("T")[0]}
                        onChange={(e) => {
                          const newDate = e.target.value;
                          if (newDate) {
                            // Always set time to 12:00 (12:00 PM)
                            const newDateTime = `${newDate}T12:00`;
                            setReservationFormData({
                              ...reservationFormData,
                              checkOut: newDateTime,
                            });
                          }
                        }}
                        className={`mt-1 w-full h-11 rounded-lg border px-4 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] transition-all duration-200 bg-white ${errors.checkOut ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0c2bfc]/10 text-[#0c2bfc]">
                        <FiClock className="mr-1" size={12} />
                        Check-out: 12:00 PM
                      </span>
                      <span className="text-xs text-gray-500">
                        (Time is fixed)
                      </span>
                    </div>
                    <FieldError text={errors.checkOut} />
                  </div>

                  {/* Adults */}
                  <div>
                    <NumberInput
                      label="Adults *"
                      value={reservationFormData.adults}
                      onChange={(newValue) =>
                        setReservationFormData({
                          ...reservationFormData,
                          adults: newValue,
                        })
                      }
                      min={1}
                      max={99}
                      step={1}
                      error={errors.adults}
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      You can select multiple rooms/cottages.
                    </div>
                  </div>

                  {/* Children */}
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
                    />
                  </div>
                </div>

                {/* Notes */}
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
                    className="mt-1 w-full min-h-[80px] rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] transition-all duration-200"
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
                      Guests:{" "}
                      <b className="text-gray-900">
                        {requiredCapacity}
                      </b>
                    </span>
                    <span className="text-gray-300">•</span>
                    <span>
                      Selected:{" "}
                      <b className="text-gray-900">{roomReservations.length}</b>
                    </span>
                    <span className="text-gray-300">•</span>
                    <span>
                      Room Cap: <b className="text-gray-900">{roomCapacity}</b>
                    </span>
                    <span className="text-gray-300">•</span>
                    <span>
                      Cottage Cap:{" "}
                      <b className="text-gray-900">{cottageCapacity}</b>
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
                    <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={fitCapacityOnly}
                        onChange={(e) => setFitCapacityOnly(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-[#0c2bfc] focus:ring-[#0c2bfc]/20"
                      />
                      Fit all guests only
                    </label>
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
                          <span className="text-gray-400 ml-1">selected</span>
                        </div>
                      </div>
                      <div className="mb-2 text-xs text-gray-600">
                        {capacityMet ? (
                          <span className="font-medium text-[#00af00]">
                            Capacity requirement met by {capacityMetBy}.
                          </span>
                        ) : (
                          <span>
                            Remaining needed - Rooms:{" "}
                            <b className="text-gray-900">
                              {hasRoomsSelected ? remainingRoomCapacityNeeded : 0}
                            </b>
                            , Cottages:{" "}
                            <b className="text-gray-900">
                              {hasCottagesSelected
                                ? remainingCottageCapacityNeeded
                                : 0}
                            </b>
                          </span>
                        )}
                      </div>

                      <FieldError text={errors.rooms} />
                      <FieldError text={errors.capacity} />

                      <div className="grid gap-3 md:grid-cols-2">
                        {filteredAvailableItems.map((item) => {
                          const isSelected = roomReservations.some(
                            (r) => r.roomId === item._id,
                          );
                          const isCottage = item.category === "cottage";
                          const hasImages =
                            item.images && item.images.length > 0;
                          const firstImage = hasImages
                            ? item.images[0].url
                            : null;
                          const selectedRoom = roomReservations.find(
                            (r) => r.roomId === item._id,
                          );

                          return (
                            <div
                              key={item._id}
                              className={`
                    rounded-xl border overflow-hidden transition-all duration-200 bg-white
                    ${
                      isSelected
                        ? "border-[#0c2bfc] ring-2 ring-[#0c2bfc]/20"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-lg"
                    }
                  `}
                            >
                              {/* Image Section */}
                              {firstImage && (
                                <div className="relative h-48 bg-gray-100">
                                  <img
                                    src={firstImage}
                                    alt={`${isCottage ? "Cottage" : "Room"} ${item.roomNumber}`}
                                    className="w-full h-full object-cover"
                                  />
                                  {hasImages && item.images.length > 1 && (
                                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
                                      +{item.images.length - 1} more
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Content Section */}
                              <div className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-sm font-semibold text-gray-900">
                                        {isCottage ? "Cottage" : "Room"}{" "}
                                        {item.roomNumber}
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
                                    <div className="text-xs text-gray-600 mt-2">
                                      Capacity: {item.capacity} • Rate:{" "}
                                      {formatMoney(item.rate)} / night
                                    </div>

                                    {/* Image Gallery Button */}
                                    {hasImages && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          openImagePreview(
                                            item.images,
                                            `${isCottage ? "Cottage" : "Room"} ${item.roomNumber} - ${item.roomType?.name || ""}`,
                                          )
                                        }
                                        className="mt-2 inline-flex items-center gap-1 text-xs text-[#0c2bfc] hover:text-[#0a24d6] transition-colors"
                                      >
                                        <FiImage size={12} />
                                        View all {item.images.length} image
                                        {item.images.length !== 1 ? "s" : ""}
                                      </button>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      isSelected
                                        ? removeRoom(item._id)
                                        : addRoom(item)
                                    }
                                    className={`
                          text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 whitespace-nowrap
                          ${
                            isSelected
                              ? "bg-red-500 hover:bg-red-600 text-white"
                              : "bg-[#0c2bfc] hover:bg-[#0a24d6] text-white"
                          }
                        `}
                                  >
                                    {isSelected ? "Remove" : "Select"}
                                  </button>
                                </div>

                                {/* Add-Ons Section - ONLY for selected rooms */}
                                {isSelected && !isCottage && (
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="text-sm font-semibold text-gray-900 mb-3">
                                      Add Amenities
                                    </div>
                                    <div className="space-y-3">
                                      {addOns.map((amenity) => {
                                        const existingAmenity =
                                          selectedRoom?.addOns?.find(
                                            (a) => a.addOnId === amenity._id,
                                          );
                                        const quantity =
                                          existingAmenity?.quantity || 0;

                                        return (
                                          <div
                                            key={amenity._id}
                                            className="flex items-center justify-between"
                                          >
                                            <div>
                                              <div className="text-sm font-medium text-gray-900">
                                                {amenity.name}
                                              </div>
                                              <div className="text-xs text-gray-500">
                                                {formatMoney(amenity.rate)} per
                                                item
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (quantity > 0) {
                                                    if (quantity === 1) {
                                                      // Remove the amenity completely
                                                      setRoomReservations(
                                                        (prev) => {
                                                          const updated = [
                                                            ...prev,
                                                          ];
                                                          const roomIndex =
                                                            updated.findIndex(
                                                              (r) =>
                                                                r.roomId ===
                                                                item._id,
                                                            );
                                                          updated[
                                                            roomIndex
                                                          ].addOns = updated[
                                                            roomIndex
                                                          ].addOns.filter(
                                                            (a) =>
                                                              a.addOnId !==
                                                              amenity._id,
                                                          );
                                                          return updated;
                                                        },
                                                      );
                                                    } else {
                                                      // Decrement quantity
                                                      setRoomReservations(
                                                        (prev) => {
                                                          const updated = [
                                                            ...prev,
                                                          ];
                                                          const roomIndex =
                                                            updated.findIndex(
                                                              (r) =>
                                                                r.roomId ===
                                                                item._id,
                                                            );
                                                          const amenityIndex =
                                                            updated[
                                                              roomIndex
                                                            ].addOns.findIndex(
                                                              (a) =>
                                                                a.addOnId ===
                                                                amenity._id,
                                                            );
                                                          updated[
                                                            roomIndex
                                                          ].addOns[
                                                            amenityIndex
                                                          ].quantity =
                                                            quantity - 1;
                                                          return updated;
                                                        },
                                                      );
                                                    }
                                                  }
                                                }}
                                                disabled={quantity === 0}
                                                className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all duration-200 ${
                                                  quantity === 0
                                                    ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                                                    : "border-gray-300 hover:border-[#0c2bfc] hover:bg-[#0c2bfc]/5 text-gray-700 hover:text-[#0c2bfc]"
                                                }`}
                                              >
                                                <FiMinus size={14} />
                                              </button>
                                              <span className="w-8 text-center text-sm font-medium text-gray-900">
                                                {quantity}
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (quantity === 0) {
                                                    // Add new amenity
                                                    setRoomReservations(
                                                      (prev) => {
                                                        const updated = [
                                                          ...prev,
                                                        ];
                                                        const roomIndex =
                                                          updated.findIndex(
                                                            (r) =>
                                                              r.roomId ===
                                                              item._id,
                                                          );
                                                        updated[
                                                          roomIndex
                                                        ].addOns.push({
                                                          addOnId: amenity._id,
                                                          quantity: 1,
                                                        });
                                                        return updated;
                                                      },
                                                    );
                                                  } else {
                                                    // Increment quantity
                                                    setRoomReservations(
                                                      (prev) => {
                                                        const updated = [
                                                          ...prev,
                                                        ];
                                                        const roomIndex =
                                                          updated.findIndex(
                                                            (r) =>
                                                              r.roomId ===
                                                              item._id,
                                                          );
                                                        const amenityIndex =
                                                          updated[
                                                            roomIndex
                                                          ].addOns.findIndex(
                                                            (a) =>
                                                              a.addOnId ===
                                                              amenity._id,
                                                          );
                                                        updated[
                                                          roomIndex
                                                        ].addOns[
                                                          amenityIndex
                                                        ].quantity =
                                                          quantity + 1;
                                                        return updated;
                                                      },
                                                    );
                                                  }
                                                }}
                                                className="h-8 w-8 rounded-lg border border-gray-300 hover:border-[#0c2bfc] hover:bg-[#0c2bfc]/5 flex items-center justify-center transition-all duration-200 text-gray-700 hover:text-[#0c2bfc]"
                                              >
                                                <FiPlus size={14} />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Cottages note */}
                                {isSelected && isCottage && (
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="text-xs text-gray-500 italic text-center py-3 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                                      <span className="text-[#00af00] font-medium">
                                        ℹ️ Note:
                                      </span>{" "}
                                      Add-ons are only available for rooms, not
                                      for cottages.
                                    </div>
                                  </div>
                                )}
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
                      Email
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

                          if (!value || value.trim() === "") {
                            setGuestExists(false);
                            setIsCreatingNewGuest(false);
                            setOriginalGuestData(null);
                            setEmailSuggestions([]);
                            setShowEmailDropdown(false);
                            setReservationFormData((prev) => ({
                              ...prev,
                              guestId: "",
                            }));
                            setGuest({
                              firstName: "",
                              lastName: "",
                              contactNumber: "",
                              email: "",
                            });
                            setFieldError("email", "");
                          } else {
                            setGuest((g) => ({ ...g, email: value }));
                            setFieldError("email", "");

                            if (guestExists || originalGuestData) {
                              setGuestExists(false);
                              setOriginalGuestData(null);
                              setReservationFormData((prev) => ({
                                ...prev,
                                guestId: "",
                              }));
                              setGuest({
                                firstName: "",
                                lastName: "",
                                contactNumber: "",
                                email: value,
                              });
                            }

                            if (!guestExists && !originalGuestData) {
                              setIsCreatingNewGuest(true);
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
                            !guestExists
                          ) {
                            searchGuestByEmail(emailInput);
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setShowEmailDropdown(false);
                          }, 300);
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
                      {showEmailDropdown &&
                        emailInput &&
                        emailInput.trim() !== "" &&
                        emailSuggestions.length > 0 && (
                          <div className="absolute z-20 w-full mt-1 rounded-xl border border-gray-200 bg-white shadow-lg max-h-64 overflow-y-auto">
                            <div className="p-3 border-b border-gray-100 bg-gray-50">
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
                                onClick={() => {
                                  handleEmailSelect(guestItem);
                                  setFieldError("email", "");
                                }}
                                className="
                                  w-full text-left p-3 hover:bg-gray-50 
                                  border-b border-gray-100 last:border-b-0 transition-colors
                                "
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                      {guestItem.firstName} {guestItem.lastName}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-0.5 truncate">
                                      {guestItem.email}
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
                          </div>
                        )}
                    </div>
                    <FieldError text={errors.email} />
                  </div>

                  {/* Show message when no email entered */}
                  {/* {!emailInput && (
                    <div className="sm:col-span-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                      ⚠️ Please enter an email to get started
                    </div>
                  )} */}

                  {/* Show creating new guest message */}
                  {emailInput && emailInput.trim() !== "" && !guestExists && (
                    <div className="sm:col-span-2 text-xs text-[#0c2bfc] bg-[#0c2bfc]/5 p-2 rounded-lg">
                      ✚ Creating new guest. Please fill in all required fields
                      below.
                    </div>
                  )}

                  {/* Complimentary toggle */}
                  <div className="sm:col-span-2">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={isComplimentaryReservation}
                        onChange={(e) =>
                          setIsComplimentaryReservation(e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-[#0c2bfc] focus:ring-[#0c2bfc]/20"
                      />
                      Complimentary booking (skip payment step)
                    </label>
                    {isComplimentaryReservation && (
                      <div className="mt-2 rounded-lg border border-purple-200 bg-purple-50 p-2 text-xs text-purple-800">
                        Step 4 (Payment) will be skipped and reservation will be
                        created with zero payment.
                      </div>
                    )}
                  </div>

                  {/* First Name */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      First Name *
                    </label>
                    <input
                      value={guest.firstName}
                      onChange={(e) => {
                        if (!guestExists) {
                          const value = e.target.value;
                          if (/^[A-Za-z\s]*$/.test(value)) {
                            setGuest((g) => ({ ...g, firstName: value }));
                            setFieldError("firstName", "");
                          }
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

                  {/* Last Name */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Last Name *
                    </label>
                    <input
                      value={guest.lastName}
                      onChange={(e) => {
                        if (!guestExists) {
                          const value = e.target.value;
                          if (/^[A-Za-z\s]*$/.test(value)) {
                            setGuest((g) => ({ ...g, lastName: value }));
                            setFieldError("lastName", "");
                          }
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

                  {/* Contact Number - Numbers Only */}
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-gray-700">
                      Contact Number *
                    </label>
                    <input
                      value={guest.contactNumber}
                      onChange={(e) => {
                        if (!guestExists) {
                          const value = e.target.value;
                          if (/^\d*$/.test(value)) {
                            setGuest((g) => ({
                              ...g,
                              contactNumber: value,
                            }));
                            setFieldError("contactNumber", "");
                          }
                        }
                      }}
                      onBlur={() => {
                        if (
                          guest.contactNumber &&
                          !validatePhone(guest.contactNumber)
                        ) {
                          setFieldError(
                            "contactNumber",
                            "Must start with 09 and be 11 digits (numbers only)",
                          );
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
                      placeholder="09123456789 (numbers only)"
                      maxLength={11}
                    />
                    <FieldError text={errors.contactNumber} />
                    <div className="mt-1 text-xs text-gray-500">
                      Must start with 09 and be 11 digits (numbers only)
                    </div>
                  </div>

                  {/* Guest Found Message */}
                  {guestExists && originalGuestData && (
                    <div className="sm:col-span-2 mt-4">
                      <div className="rounded-xl border border-[#00af00]/20 bg-[#00af00]/5 p-4">
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
                        const nextDiscountId = e.target.value;
                        setPayment((p) => ({
                          ...p,
                          discountId: nextDiscountId,
                        }));
                        clearDiscountImages();
                        if (nextDiscountId) {
                          setFieldError(
                            "discountImage",
                            "At least one discount image is required when applying discount.",
                          );
                        } else {
                          setFieldError("discountImage", "");
                        }
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
                      disabled={true}
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
      transition-all duration-200 bg-gray-100 cursor-not-allowed
      ${errors.amountPaid ? "border-red-300 bg-red-50" : "border-gray-200"}
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
                      disabled={true}
                      className={`
                        mt-1 w-full h-11 rounded-xl border px-4 text-sm outline-none 
                        transition-all duration-200 bg-gray-100 text-gray-700 cursor-not-allowed
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
                          bg-[#0c2bfc] hover:bg-[#0a24d6]
                          text-white text-xs font-medium inline-flex items-center gap-2
                          transition-all duration-200
                          hover:shadow-md hover:-translate-y-0.5
                        "
                      >
                        <FiUploadCloud size={12} /> Upload
                      </button>
                      <input
                        ref={discountFileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.length) {
                            handleDiscountImageUpload(e.target.files);
                            setFieldError("discountImage", "");
                            e.target.value = "";
                          }
                        }}
                      />
                    </div>

                    {discountImagePreviews.length > 0 ? (
                      <div className="rounded-xl border border-gray-200 bg-white p-3">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {discountImagePreviews.map((img, idx) => (
                            <div
                              key={`${img}-${idx}`}
                              className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                            >
                              <img
                                src={img}
                                alt={`Discount ID ${idx + 1}`}
                                className="h-28 w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeDiscountImageAt(idx)}
                                className="absolute top-1.5 right-1.5 h-7 w-7 rounded-md border border-gray-200 bg-white hover:bg-gray-50 grid place-items-center text-[#0c2bfc] transition-all duration-200"
                                title="Remove"
                              >
                                <FiTrash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {discountImagePreviews.length} image
                          {discountImagePreviews.length > 1 ? "s" : ""} uploaded
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
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

                {/* Receipt Section */}
                {requiresReceipt && (
                  <div className="mt-6">
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        Receipt Information *
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        Upload receipt image (required).
                      </div>
                    </div>

                    {/* Receipt Image Upload */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-gray-700">
                          Receipt Image
                          <span className="text-xs text-gray-500 ml-2">
                            (Required)
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
                              bg-[#0c2bfc] hover:bg-[#0a24d6]
                              text-white text-xs font-medium inline-flex items-center gap-2
                              transition-all duration-200
                              hover:shadow-md hover:-translate-y-0.5
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
                        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
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
                                border border-gray-200 bg-white hover:bg-gray-50
                                grid place-items-center text-[#0c2bfc]
                                transition-all duration-200
                                hover:shadow-md hover:-translate-y-0.5
                              "
                              title="Remove"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                          <FiUploadCloud
                            className="mx-auto mb-3 text-gray-400"
                            size={28}
                          />
                          <div>Upload receipt image (required)</div>
                        </div>
                      )}
                    </div>

                    {/* Status indicator */}
                    <div className="mt-3 text-xs">
                      {receiptImagePreview ? (
                        <div className="text-[#00af00] flex items-center gap-1">
                          <FiCheckCircle size={12} />
                          Receipt image uploaded
                        </div>
                      ) : (
                        <div className="text-amber-600">
                          Please upload a receipt image
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
                      {roomReservations.length}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4"></div>

                {/* Room Breakdown with Add-Ons */}
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
                        {roomRes?.addOns.map((addOn, aIndex) => {
                          const addOnData = addOns.find(
                            (a) => a._id === addOn.addOnId,
                          );
                          return (
                            <div
                              key={`${addOn.addOnId}-${aIndex}`}
                              className="flex justify-between text-xs"
                            >
                              <span className="text-gray-500 pl-2">
                                • {addOnData?.name} (×{addOn.quantity})
                                {addOnData?.category &&
                                  ` - ${addOnData.category}`}
                              </span>
                              <span>
                                {formatMoney(
                                  (addOnData?.rate || 0) * addOn.quantity,
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
                      <div className="mb-3 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Non-VAT: All billing amounts are VAT-exempt.
                      </div>
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
                        <div className="flex justify-between text-red-600">
                          <span>Remaining Balance</span>
                          <span className="font-medium">
                            {formatMoney(Math.max(finalTotal - payment.amountPaid, 0))}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Warning messages */}
              {step === 2 && !capacityMet && (
                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-800">
                  <div className="font-medium">Capacity Warning</div>
                  <div className="mt-1">
                    Rooms and cottages are checked separately for {requiredCapacity}{" "}
                    guests. Rooms capacity: {roomCapacity}, cottages capacity:{" "}
                    {cottageCapacity}.{" "}
                    {hasRoomsSelected && !roomsSatisfyCapacity
                      ? `Add ${remainingRoomCapacityNeeded} more room capacity. `
                      : ""}
                    {hasCottagesSelected && !cottagesSatisfyCapacity
                      ? `Add ${remainingCottageCapacityNeeded} more cottage capacity.`
                      : ""}
                  </div>
                </div>
              )}
            </SummaryCard>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200 bg-white p-4 rounded-xl">
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
              disabled={roomReservations.length === 0}
              className={`
                h-11 px-5 rounded-xl text-white text-sm font-medium 
                inline-flex items-center gap-2 transition-all duration-200
                ${
                  roomReservations.length === 0
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
              {isComplimentaryReservation
                ? "Complete Complimentary Reservation"
                : "Next"}
              {!isComplimentaryReservation && <FiChevronRight />}
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
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
            <Loader
              size={60}
              variant="primary"
              showText={true}
              text={loading ? "Creating reservation..." : "Loading items..."}
            />
          </div>
        )}
      </div>
      <ImagePreviewModal
        open={imagePreviewOpen}
        images={selectedImages}
        startIndex={0}
        title={selectedImageTitle}
        onClose={() => setImagePreviewOpen(false)}
      />
    </>
  );
}
