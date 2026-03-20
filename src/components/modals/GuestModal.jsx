import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";

// Validation functions
const isValidPHMobile = (v) => /^09\d{9}$/.test(String(v || "").trim());
const isValidName = (name) => /^[A-Za-z\s]+$/.test(String(name || "").trim());
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function GuestModal({ open, mode, guest, onClose, onSave }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    contactNumber: "",
    email: "",
  });

  // Validation errors state
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    contactNumber: "",
    email: "",
  });

  // Tracks if fields have been touched (interacted with)
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    contactNumber: false,
    email: false,
  });

  useEffect(() => {
    if (mode === "edit" && guest) {
      setForm({
        firstName: guest.firstName ?? "",
        lastName: guest.lastName ?? "",
        contactNumber: guest.contactNumber ?? "",
        email: guest.email ?? "",
      });
    } else {
      setForm({
        firstName: "",
        lastName: "",
        contactNumber: "",
        email: "",
      });
    }

    // Reset touched and errors when modal opens/closes
    setTouched({
      firstName: false,
      lastName: false,
      contactNumber: false,
      email: false,
    });
    setErrors({
      firstName: "",
      lastName: "",
      contactNumber: "",
      email: "",
    });
  }, [mode, guest, open]);

  if (!open) return null;

  // Validation functions
  const validateFirstName = (value) => {
    if (!value.trim()) return "First name is required";
    if (!isValidName(value))
      return "First name can only contain letters and spaces";
    return "";
  };

  const validateLastName = (value) => {
    if (!value.trim()) return "Last name is required";
    if (!isValidName(value))
      return "Last name can only contain letters and spaces";
    return "";
  };

  const validateContactNumber = (value) => {
    if (!value.trim()) return "Contact number is required";
    if (!isValidPHMobile(value)) return "Must start with 09 and be 11 digits";
    return "";
  };

  const validateEmail = (value) => {
    if (!value.trim()) return "Email is required";
    if (!isValidEmail(value)) return "Please enter a valid email address";
    return "";
  };

  // Handle blur events to mark fields as touched
  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    // Validate on blur
    switch (field) {
      case "firstName":
        setErrors((prev) => ({
          ...prev,
          firstName: validateFirstName(form.firstName),
        }));
        break;
      case "lastName":
        setErrors((prev) => ({
          ...prev,
          lastName: validateLastName(form.lastName),
        }));
        break;
      case "contactNumber":
        setErrors((prev) => ({
          ...prev,
          contactNumber: validateContactNumber(form.contactNumber),
        }));
        break;
      case "email":
        setErrors((prev) => ({ ...prev, email: validateEmail(form.email) }));
        break;
    }
  };

  // Handle input changes with real-time validation
  const handleFirstNameChange = (e) => {
    const value = e.target.value;
    setForm((p) => ({ ...p, firstName: value }));
    if (touched.firstName) {
      setErrors((prev) => ({ ...prev, firstName: validateFirstName(value) }));
    }
  };

  const handleLastNameChange = (e) => {
    const value = e.target.value;
    setForm((p) => ({ ...p, lastName: value }));
    if (touched.lastName) {
      setErrors((prev) => ({ ...prev, lastName: validateLastName(value) }));
    }
  };

  const handleContactNumberChange = (e) => {
    const value = e.target.value;
    setForm((p) => ({ ...p, contactNumber: value }));
    if (touched.contactNumber) {
      setErrors((prev) => ({
        ...prev,
        contactNumber: validateContactNumber(value),
      }));
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setForm((p) => ({ ...p, email: value }));
    if (touched.email) {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      !validateFirstName(form.firstName) &&
      !validateLastName(form.lastName) &&
      !validateContactNumber(form.contactNumber) &&
      !validateEmail(form.email) &&
      form.firstName.trim() &&
      form.lastName.trim() &&
      form.contactNumber.trim() &&
      form.email.trim()
    );
  };

  const submit = (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      firstName: true,
      lastName: true,
      contactNumber: true,
      email: true,
    });

    // Validate all fields
    const firstNameError = validateFirstName(form.firstName);
    const lastNameError = validateLastName(form.lastName);
    const contactError = validateContactNumber(form.contactNumber);
    const emailError = validateEmail(form.email);

    setErrors({
      firstName: firstNameError,
      lastName: lastNameError,
      contactNumber: contactError,
      email: emailError,
    });

    // Check if there are any errors
    if (firstNameError || lastNameError || contactError || emailError) {
      return;
    }

    onSave?.({ ...guest, ...form, email: form.email });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
      <div
        className="
        w-full max-w-lg rounded-2xl 
        bg-white
        shadow-2xl border border-gray-200
        overflow-hidden
      "
      >
        <div
          className="
          px-6 py-5 border-b border-gray-200 
          flex items-center justify-between
          bg-gray-50
        "
        >
          <div className="text-lg font-bold text-gray-900">
            {mode === "add" ? "Add Guest" : "Edit Guest"}
          </div>
          <button
            onClick={onClose}
            className="
              h-10 w-10 rounded-xl 
              border border-gray-200 
              bg-white
              hover:bg-gray-50
              grid place-items-center
              transition-all duration-200
              hover:shadow-md hover:-translate-y-0.5
              active:translate-y-0 text-gray-700 hover:text-[#0c2bfc]
            "
          >
            <FiX />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                First Name *
              </label>
              <input
                value={form.firstName}
                onChange={handleFirstNameChange}
                onBlur={() => handleBlur("firstName")}
                className={`
                  w-full h-11 rounded-xl 
                  border bg-white px-4
                  text-sm text-gray-800 outline-none
                  focus:ring-2 focus:ring-[#0c2bfc]/20
                  transition-all duration-200
                  placeholder:text-gray-400
                  ${
                    touched.firstName && errors.firstName
                      ? "border-red-300 focus:border-red-300"
                      : "border-gray-200 focus:border-[#0c2bfc]"
                  }
                `}
                placeholder="John"
                required
              />
              {touched.firstName && errors.firstName && (
                <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                value={form.lastName}
                onChange={handleLastNameChange}
                onBlur={() => handleBlur("lastName")}
                className={`
                  w-full h-11 rounded-xl 
                  border bg-white px-4
                  text-sm text-gray-800 outline-none
                  focus:ring-2 focus:ring-[#0c2bfc]/20
                  transition-all duration-200
                  placeholder:text-gray-400
                  ${
                    touched.lastName && errors.lastName
                      ? "border-red-300 focus:border-red-300"
                      : "border-gray-200 focus:border-[#0c2bfc]"
                  }
                `}
                placeholder="Doe"
                required
              />
              {touched.lastName && errors.lastName && (
                <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contact Number *
            </label>
            <input
              value={form.contactNumber}
              onChange={handleContactNumberChange}
              onBlur={() => handleBlur("contactNumber")}
              className={`
                w-full h-11 rounded-xl 
                border bg-white px-4
                text-sm text-gray-800 outline-none
                focus:ring-2 focus:ring-[#0c2bfc]/20
                transition-all duration-200
                placeholder:text-gray-400
                ${
                  touched.contactNumber && errors.contactNumber
                    ? "border-red-300 focus:border-red-300"
                    : "border-gray-200 focus:border-[#0c2bfc]"
                }
              `}
              placeholder="09123456789"
              required
            />
            {touched.contactNumber && errors.contactNumber ? (
              <p className="mt-1 text-xs text-red-500">
                {errors.contactNumber}
              </p>
            ) : (
              <div className="text-xs text-gray-500 mt-2">
                Must start with 09 and be 11 digits.
              </div>
            )}
          </div>

          {/* Email - Now Required */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={form.email || ""}
              onChange={handleEmailChange}
              onBlur={() => handleBlur("email")}
              className={`
                w-full h-11 rounded-xl 
                border bg-white px-4
                text-sm text-gray-800 outline-none
                focus:ring-2 focus:ring-[#0c2bfc]/20
                transition-all duration-200
                placeholder:text-gray-400
                ${
                  touched.email && errors.email
                    ? "border-red-300 focus:border-red-300"
                    : "border-gray-200 focus:border-[#0c2bfc]"
                }
              `}
              placeholder="guest@example.com"
              required
            />
            {touched.email && errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="
                h-11 px-5 rounded-xl 
                border border-gray-200 
                bg-white
                hover:bg-gray-50
                text-sm font-semibold text-gray-700
                transition-all duration-200
                hover:shadow-md hover:-translate-y-0.5
                active:translate-y-0
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid()}
              className={`
                h-11 px-5 rounded-xl 
                text-white text-sm font-semibold
                transition-all duration-200
                hover:shadow-lg hover:-translate-y-0.5
                active:translate-y-0
                ${
                  isFormValid()
                    ? "bg-[#0c2bfc] hover:bg-[#0a24d6]"
                    : "bg-gray-400 cursor-not-allowed"
                }
              `}
            >
              {mode === "add" ? "Create Guest" : "Update Guest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
