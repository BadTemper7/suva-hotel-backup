import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiX,
  FiUploadCloud,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiHome,
  FiSun,
} from "react-icons/fi";
import { useRoomTypeStore } from "../../stores/roomTypeStore";
import { useRoomStore } from "../../stores/roomStore";
import Loader from "../layout/Loader";
import toast from "react-hot-toast";

export default function RoomModal({ open, mode, room, onClose }) {
  const fileInputRef = useRef(null);
  const { roomTypes, fetchRoomTypes } = useRoomTypeStore();
  const { createRoom, updateRoom } = useRoomStore();

  const [uploading, setUploading] = useState(false);
  const [roomNumber, setRoomNumber] = useState("");
  const [roomType, setRoomType] = useState("");
  const [status, setStatus] = useState("active");
  const [rate, setRate] = useState("");
  const [capacity, setCapacity] = useState("");
  const [category, setCategory] = useState("room");

  const [previews, setPreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [deletedImageIds, setDeletedImageIds] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [description, setDescription] = useState("");
  // Category options
  const categoryOptions = [
    {
      value: "room",
      label: "Room",
      icon: FiHome,
      color: "text-[#0c2bfc]",
      bgColor: "bg-[#0c2bfc]/10",
      borderColor: "border-[#0c2bfc]",
    },
    {
      value: "cottage",
      label: "Cottage",
      icon: FiSun,
      color: "text-[#00af00]",
      bgColor: "bg-[#00af00]/10",
      borderColor: "border-[#00af00]",
    },
  ];

  // Room status options with border colors for ring effect
  const statusOptions = [
    {
      value: "active",
      label: "Active",
      icon: FiCheckCircle,
      color: "text-[#00af00]",
      bgColor: "bg-[#00af00]/10",
      borderColor: "border-[#00af00]",
      ringColor: "ring-[#00af00]/20",
    },
    {
      value: "inactive",
      label: "Inactive",
      icon: FiXCircle,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      borderColor: "border-gray-400",
      ringColor: "ring-gray-200",
    },
    {
      value: "maintenance",
      label: "Maintenance",
      icon: FiClock,
      color: "text-[#0c2bfc]",
      bgColor: "bg-[#0c2bfc]/10",
      borderColor: "border-[#0c2bfc]",
      ringColor: "ring-[#0c2bfc]/20",
    },
    {
      value: "cleaning",
      label: "Cleaning",
      icon: FiClock,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      borderColor: "border-blue-400",
      ringColor: "ring-blue-200",
    },
  ];

  useEffect(() => {
    fetchRoomTypes();
  }, [fetchRoomTypes]);

  /* -------------------- PREFILL -------------------- */
  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && room) {
      setRoomNumber(room.roomNumber ?? "");
      setRoomType(room.roomType?._id ?? room.roomType ?? "");
      setStatus(room.status ?? "active");
      setRate(room.rate ?? "");
      setCapacity(room.capacity ?? "");
      setCategory(room.category ?? "room");
      setDescription(room.description ?? ""); // Add this line

      setPreviews(
        room.images?.map((img) => ({
          type: "existing",
          url: img.url,
          publicId: img.publicId,
        })) || [],
      );

      setImageFiles([]);
      setDeletedImageIds([]);
    }

    if (mode === "add") {
      setRoomNumber("");
      setRoomType("");
      setStatus("active");
      setRate("");
      setCapacity("");
      setCategory("room");
      setDescription(""); // Add this line
      setPreviews([]);
      setImageFiles([]);
      setDeletedImageIds([]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open, mode, room]);

  /* -------------------- CLEANUP -------------------- */
  useEffect(() => {
    return () => {
      previews.forEach((img) => {
        if (img.type === "new" && img.url?.startsWith("blob:")) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [previews]);

  function handleClose() {
    previews.forEach((img) => {
      if (img.type === "new" && img.url?.startsWith("blob:")) {
        URL.revokeObjectURL(img.url);
      }
    });

    setPreviews([]);
    setImageFiles([]);
    setDeletedImageIds([]);
    onClose?.();
  }

  /* -------------------- IMAGE HANDLING -------------------- */
  function addFiles(files) {
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!valid.length) return;

    setImageFiles((prev) => [...prev, ...valid]);

    setPreviews((prev) => [
      ...prev,
      ...valid.map((file) => ({
        type: "new",
        url: URL.createObjectURL(file),
        file,
      })),
    ]);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImageAt(index) {
    const img = previews[index];

    if (img.type === "existing" && img.publicId) {
      setDeletedImageIds((prev) => [...prev, img.publicId]);
    }

    if (img.type === "new") {
      setImageFiles((prev) => prev.filter((file) => file !== img.file));
      URL.revokeObjectURL(img.url);
    }

    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function clearAllImages() {
    previews.forEach((img) => {
      if (img.type === "existing" && img.publicId) {
        setDeletedImageIds((prev) => [...prev, img.publicId]);
      }
      if (img.type === "new" && img.url?.startsWith("blob:")) {
        URL.revokeObjectURL(img.url);
      }
    });

    setPreviews([]);
    setImageFiles([]);
  }

  /* -------------------- SUBMIT -------------------- */
  const canSave = (() => {
    // Basic required fields
    if (
      !roomNumber ||
      rate === "" ||
      capacity === "" ||
      isNaN(rate) ||
      isNaN(capacity)
    ) {
      return false;
    }

    // Room type is only required for rooms
    if (category === "room" && !roomType) {
      return false;
    }

    return true;
  })();

  async function submit(e) {
    e.preventDefault();
    if (!canSave) return;

    try {
      setUploading(true);

      const payload = new FormData();
      payload.append("roomNumber", roomNumber.trim());
      payload.append("status", status);
      payload.append("rate", rate);
      payload.append("capacity", capacity);
      payload.append("category", category);
      payload.append("description", description);

      // Only append roomType if it's a room
      if (category === "room" && roomType) {
        payload.append("roomType", roomType);
      }

      imageFiles.forEach((file) => payload.append("images", file));
      deletedImageIds.forEach((id) => payload.append("deletedImages", id));

      console.log("Submitting room data:", {
        roomNumber: roomNumber.trim(),
        ...(category === "room" && { roomType }),
        status,
        rate,
        capacity,
        category,
        imageFiles: imageFiles.length,
        deletedImageIds: deletedImageIds.length,
      });

      if (mode === "add") {
        await createRoom(payload);
        toast.success(
          `${category === "cottage" ? "Cottage" : "Room"} created successfully`,
        );
      } else {
        await updateRoom(room._id, payload);
        toast.success(
          `${category === "cottage" ? "Cottage" : "Room"} updated successfully`,
        );
      }

      handleClose();
    } catch (err) {
      console.error("Error submitting:", err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  }

  const activeRoomTypes = roomTypes.filter((rt) => rt.status === "active");

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50">
          {/* Overlay */}
          <motion.button
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="absolute inset-0 flex items-end sm:items-center justify-center p-3 sm:p-6">
            <motion.div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden relative">
              {/* Loader */}
              {uploading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-2xl">
                  <Loader size={50} variant="primary" />
                </div>
              )}

              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">
                  {mode === "add" ? "Add" : "Edit"}{" "}
                  {category === "cottage" ? "Cottage" : "Room"}
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-9 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm inline-flex items-center gap-2 text-gray-700 transition-all duration-200"
                >
                  <FiX />
                  Close
                </button>
              </div>

              {/* Body */}
              <form onSubmit={submit} className="p-5 space-y-6">
                {/* IMAGE UPLOAD */}
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-1">
                    {category === "cottage" ? "Cottage" : "Room"} Images
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      addFiles(e.dataTransfer.files);
                    }}
                    className={`border-2 border-dashed rounded-2xl px-4 py-6 flex flex-col items-center justify-center text-center cursor-pointer transition
                      ${
                        previews.length > 0
                          ? "border-gray-200 bg-white"
                          : isDragging
                            ? "border-[#0c2bfc] bg-[#0c2bfc]/5"
                            : "border-gray-300 bg-white hover:border-[#0c2bfc] hover:bg-[#0c2bfc]/5"
                      }`}
                  >
                    {previews.length > 0 ? (
                      <div className="relative w-full">
                        <img
                          src={previews[0].url}
                          alt="Preview"
                          className="max-h-40 rounded-xl object-contain w-full bg-gray-50 border border-gray-200"
                        />

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeImageAt(0);
                          }}
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white p-2 rounded-full shadow border border-gray-200 text-gray-700 transition-all duration-200"
                        >
                          <FiX className="text-sm" />
                        </button>

                        <div className="mt-3 flex gap-2 overflow-auto pb-1">
                          {previews.map((img, i) => (
                            <div
                              key={`${img.url}-${i}`}
                              className="relative shrink-0 h-16 w-24 rounded-xl overflow-hidden border border-gray-200 bg-gray-50"
                            >
                              <img
                                src={img.url}
                                alt={`Thumb ${i + 1}`}
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeImageAt(i);
                                }}
                                className="absolute top-1 right-1 h-7 w-7 rounded-lg bg-white/90 border border-gray-200 hover:bg-white grid place-items-center text-gray-700 transition-all duration-200"
                              >
                                <FiX className="text-xs" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <FiUploadCloud className="text-4xl text-gray-400 mb-2" />
                        <p className="text-gray-600 text-sm">
                          Choose files or drag & drop here
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          PNG/JPG — multiple allowed
                        </p>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => addFiles(e.target.files)}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-3 block">
                    Category *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = category === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setCategory(option.value);
                            // Clear room type when switching to cottage
                            if (option.value === "cottage") {
                              setRoomType("");
                            }
                          }}
                          className={`
                            rounded-xl border px-3 py-3 flex items-center justify-center gap-2 
                            transition-all duration-200
                            ${isSelected ? "ring-2 ring-offset-2" : ""}
                            ${isSelected ? option.ringColor || "ring-[#0c2bfc]/20" : ""}
                            ${isSelected ? option.bgColor : "bg-white hover:bg-gray-50"}
                            ${isSelected ? option.borderColor : "border-gray-200"}
                          `}
                        >
                          <Icon
                            className={`${option.color} ${isSelected ? "scale-110" : ""}`}
                          />
                          <span
                            className={`text-sm font-medium ${isSelected ? option.color : "text-gray-700"}`}
                          >
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* FIELDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Room/Cottage Number */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      {category === "cottage"
                        ? "Cottage Number *"
                        : "Room Number *"}
                    </label>
                    <input
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] text-gray-700 transition-colors duration-200"
                      placeholder={
                        category === "cottage" ? "e.g., COT-001" : "e.g., 101"
                      }
                      required
                    />
                  </div>

                  {/* Room Type - Only show for rooms */}
                  {category === "room" && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">
                        Room Type *
                      </label>
                      <select
                        value={roomType}
                        onChange={(e) => setRoomType(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] text-gray-700 transition-colors duration-200"
                        required
                      >
                        <option value="" disabled>
                          Select room type
                        </option>
                        {activeRoomTypes.map((rt) => (
                          <option key={rt._id} value={rt._id}>
                            {rt.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Rate */}
                  <div
                    className={category === "cottage" ? "sm:col-span-2" : ""}
                  >
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Rate (PHP) *
                    </label>
                    <input
                      type="number"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] text-gray-700 transition-colors duration-200"
                      placeholder="e.g., 2500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  {/* Capacity */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Capacity *
                    </label>
                    <input
                      type="number"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] text-gray-700 transition-colors duration-200"
                      placeholder="e.g., 2"
                      min="1"
                      required
                    />
                  </div>
                </div>

                {/* Description Field - Full width */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Description
                    <span className="text-gray-400 ml-1">(Optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] text-gray-700 transition-colors duration-200 resize-none"
                    placeholder={
                      category === "cottage"
                        ? "Describe the cottage features, amenities, location, nearby attractions, etc..."
                        : "Describe the room features, view, amenities, size, bed type, etc..."
                    }
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Add details to help guests understand what this{" "}
                    {category === "cottage" ? "cottage" : "room"} offers.
                  </p>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-3 block">
                    Status *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {statusOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = status === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setStatus(option.value)}
                          className={`
                            rounded-xl border px-3 py-2.5 flex flex-col items-center justify-center gap-2 
                            transition-all duration-200 relative
                            ${isSelected ? "ring-2 ring-offset-2" : ""}
                            ${isSelected ? option.ringColor : ""}
                            ${isSelected ? option.bgColor : "bg-white hover:bg-gray-50"}
                            ${isSelected ? option.borderColor : "border-gray-200"}
                          `}
                        >
                          <Icon
                            className={`${option.color} ${isSelected ? "scale-110" : ""}`}
                          />
                          <span
                            className={`text-xs font-medium ${isSelected ? option.color : "text-gray-700"}`}
                          >
                            {option.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="h-10 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!canSave}
                    className={`h-10 px-4 rounded-xl text-white text-sm font-medium transition-all duration-200 ${
                      canSave
                        ? "bg-[#0c2bfc] hover:bg-[#0a24d6] shadow-sm hover:shadow"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {mode === "add" ? "Add" : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
