import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import { useUserStore } from "../../stores/userStore.js";
import { toast } from "react-hot-toast";
import Loader from "../layout/Loader";
import { DEFAULT_RECEPTIONIST_PERMISSIONS } from "../../utils/staffPermissions.js";

function mergeReceptionistPermsFromUser(u) {
  return {
    ...DEFAULT_RECEPTIONIST_PERMISSIONS,
    ...(u?.receptionistPermissions || {}),
  };
}

const ROLES = ["admin", "receptionist", "superadmin"]; // Added superadmin
const STATUS = ["active", "inactive"];

// Validation functions - UPDATED to match backend
const isValidUsername = (username) => /^[a-zA-Z0-9_]{8,16}$/.test(username);
const isValidPassword = (password) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[_!@#$%^&*])[A-Za-z\d_!@#$%^&*]{8,16}$/.test(
    password,
  );
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^09\d{9}$/.test(phone);
const isValidName = (name) => /^[A-Za-z\s]+$/.test(name);

export default function UserModal({ open, mode, user, onClose }) {
  const createUser = useUserStore((state) => state.createUser);
  const updateUser = useUserStore((state) => state.updateUser);
  const fetchUsers = useUserStore((state) => state.fetchUsers);
  const currentUser = useUserStore((state) => state.currentUser); // Get current logged-in user

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [role, setRole] = useState("receptionist");
  const [status, setStatus] = useState("active");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changePassword, setChangePassword] = useState(false); // For edit mode password change
  const [recPerms, setRecPerms] = useState(() => ({
    ...DEFAULT_RECEPTIONIST_PERMISSIONS,
  }));

  // Validation errors state
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    contactNumber: "",
    password: "",
    confirmPassword: "",
  });

  // Tracks if fields have been touched (interacted with)
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    username: false,
    email: false,
    contactNumber: false,
    password: false,
    confirmPassword: false,
  });

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setUsername(user.username || "");
      setEmail(user.email || "");
      setContactNumber(user.contactNumber || "");
      setRole(user.role || "receptionist");
      setStatus(user.status || "active");
      setRecPerms(mergeReceptionistPermsFromUser(user));
      setPassword("");
      setConfirmPassword("");
      setChangePassword(false); // Reset password change flag

      // Reset touched states
      setTouched({
        firstName: false,
        lastName: false,
        username: false,
        email: false,
        contactNumber: false,
        password: false,
        confirmPassword: false,
      });

      // Clear errors
      setErrors({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        contactNumber: "",
        password: "",
        confirmPassword: "",
      });
    } else if (mode === "add") {
      setFirstName("");
      setLastName("");
      setUsername("");
      setEmail("");
      setContactNumber("");
      setRole("receptionist");
      setStatus("active");
      setRecPerms({ ...DEFAULT_RECEPTIONIST_PERMISSIONS });
      setPassword("");
      setConfirmPassword("");
      setChangePassword(false);

      // Reset touched states
      setTouched({
        firstName: false,
        lastName: false,
        username: false,
        email: false,
        contactNumber: false,
        password: false,
        confirmPassword: false,
      });

      // Clear errors
      setErrors({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        contactNumber: "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [open, mode, user]);

  // Validation functions with length limits
  const validateFirstName = (value) => {
    if (!value.trim()) return "First name is required";
    if (!isValidName(value))
      return "First name can only contain letters and spaces";
    if (value.trim().length < 2)
      return "First name must be at least 2 characters";
    if (value.trim().length > 50)
      return "First name cannot exceed 50 characters";
    return "";
  };

  const validateLastName = (value) => {
    if (!value.trim()) return "Last name is required";
    if (!isValidName(value))
      return "Last name can only contain letters and spaces";
    if (value.trim().length < 2)
      return "Last name must be at least 2 characters";
    if (value.trim().length > 50)
      return "Last name cannot exceed 50 characters";
    return "";
  };

  const validateUsername = (value) => {
    if (!value.trim()) return "Username is required";
    if (!isValidUsername(value))
      return "Username must be 8-16 characters and can only contain letters, numbers, and underscores";
    return "";
  };

  const validateEmail = (value) => {
    if (!value.trim()) return "Email is required";
    if (!isValidEmail(value)) return "Please enter a valid email address";
    return "";
  };

  const validateContactNumber = (value) => {
    if (!value.trim()) return "Contact number is required";
    if (!isValidPhone(value)) return "Must start with 09 and be 11 digits";
    return "";
  };

  const validatePassword = (value) => {
    if (mode === "add" && !value) return "Password is required";
    if (mode === "add" && !isValidPassword(value))
      return "Password must be 8-16 characters, contain at least one uppercase letter, one lowercase letter, one number, and one special character (_!@#$%^&*)";

    // For edit mode with change password enabled
    if (mode === "edit" && changePassword) {
      if (!value) return "New password is required";
      if (!isValidPassword(value))
        return "Password must be 8-16 characters, contain at least one uppercase letter, one lowercase letter, one number, and one special character (_!@#$%^&*)";
    }
    return "";
  };

  const validateConfirmPassword = (value) => {
    if (mode === "add" && !value) return "Please confirm your password";
    if (mode === "add" && value !== password) return "Passwords do not match";

    // For edit mode with change password enabled
    if (mode === "edit" && changePassword) {
      if (!value) return "Please confirm your new password";
      if (value !== password) return "Passwords do not match";
    }
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
          firstName: validateFirstName(firstName),
        }));
        break;
      case "lastName":
        setErrors((prev) => ({
          ...prev,
          lastName: validateLastName(lastName),
        }));
        break;
      case "username":
        setErrors((prev) => ({
          ...prev,
          username: validateUsername(username),
        }));
        break;
      case "email":
        setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
        break;
      case "contactNumber":
        setErrors((prev) => ({
          ...prev,
          contactNumber: validateContactNumber(contactNumber),
        }));
        break;
      case "password":
        if (mode === "add" || (mode === "edit" && changePassword)) {
          setErrors((prev) => ({
            ...prev,
            password: validatePassword(password),
          }));
          // Also validate confirm password if it has a value
          if (confirmPassword) {
            setErrors((prev) => ({
              ...prev,
              confirmPassword: validateConfirmPassword(confirmPassword),
            }));
          }
        }
        break;
      case "confirmPassword":
        if (mode === "add" || (mode === "edit" && changePassword)) {
          setErrors((prev) => ({
            ...prev,
            confirmPassword: validateConfirmPassword(confirmPassword),
          }));
        }
        break;
    }
  };

  // Handle input changes with real-time validation and length limits
  const handleFirstNameChange = (e) => {
    const value = e.target.value;
    if (value.length <= 50) {
      setFirstName(value);
      if (touched.firstName) {
        setErrors((prev) => ({ ...prev, firstName: validateFirstName(value) }));
      }
    }
  };

  const handleLastNameChange = (e) => {
    const value = e.target.value;
    if (value.length <= 50) {
      setLastName(value);
      if (touched.lastName) {
        setErrors((prev) => ({ ...prev, lastName: validateLastName(value) }));
      }
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    if (touched.username) {
      setErrors((prev) => ({ ...prev, username: validateUsername(value) }));
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (touched.email) {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    }
  };

  const handleContactNumberChange = (e) => {
    const value = e.target.value;
    setContactNumber(value);
    if (touched.contactNumber) {
      setErrors((prev) => ({
        ...prev,
        contactNumber: validateContactNumber(value),
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (
      touched.password &&
      (mode === "add" || (mode === "edit" && changePassword))
    ) {
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
      // Also validate confirm password if it has a value
      if (confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: validateConfirmPassword(confirmPassword),
        }));
      }
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (
      touched.confirmPassword &&
      (mode === "add" || (mode === "edit" && changePassword))
    ) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: validateConfirmPassword(value),
      }));
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    const baseValid =
      !errors.firstName &&
      !errors.lastName &&
      !errors.username &&
      !errors.email &&
      !errors.contactNumber &&
      firstName.trim() &&
      lastName.trim() &&
      username.trim() &&
      email.trim() &&
      contactNumber.trim();

    if (mode === "add") {
      return (
        baseValid &&
        !errors.password &&
        !errors.confirmPassword &&
        password &&
        confirmPassword
      );
    } else if (mode === "edit" && changePassword) {
      return (
        baseValid &&
        !errors.password &&
        !errors.confirmPassword &&
        password &&
        confirmPassword
      );
    } else if (mode === "edit" && !changePassword) {
      return baseValid;
    }

    return baseValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      contactNumber: true,
      password: mode === "add" || (mode === "edit" && changePassword),
      confirmPassword: mode === "add" || (mode === "edit" && changePassword),
    });

    // Validate all fields
    const firstNameError = validateFirstName(firstName);
    const lastNameError = validateLastName(lastName);
    const usernameError = validateUsername(username);
    const emailError = validateEmail(email);
    const contactError = validateContactNumber(contactNumber);
    const passwordError =
      mode === "add" || (mode === "edit" && changePassword)
        ? validatePassword(password)
        : "";
    const confirmError =
      mode === "add" || (mode === "edit" && changePassword)
        ? validateConfirmPassword(confirmPassword)
        : "";

    setErrors({
      firstName: firstNameError,
      lastName: lastNameError,
      username: usernameError,
      email: emailError,
      contactNumber: contactError,
      password: passwordError,
      confirmPassword: confirmError,
    });

    // Check if there are any errors
    if (
      firstNameError ||
      lastNameError ||
      usernameError ||
      emailError ||
      contactError ||
      passwordError ||
      confirmError
    ) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    if (loading) return;

    const payload = {
      firstName,
      lastName,
      username,
      email,
      contactNumber,
      role,
      status,
    };

    if (role === "receptionist") {
      payload.receptionistPermissions = { ...recPerms };
    }

    // Only include password if it's being changed (add mode or edit with change password)
    if (mode === "add" || (mode === "edit" && changePassword)) {
      payload.password = password;
    }

    try {
      setLoading(true);
      if (mode === "add") {
        const result = await createUser(payload);
        if (result.success) {
          toast.success(result.message || "User added successfully");
        } else {
          throw new Error(result.error);
        }
      } else {
        const result = await updateUser(user._id, payload);
        if (result.success) {
          toast.success(result.message || "User updated successfully");
        } else {
          throw new Error(result.error);
        }
      }
      await fetchUsers();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50">
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-2xl">
            <Loader size={50} variant="primary" />
          </div>
        )}
        <motion.button
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={!loading ? onClose : undefined}
        />

        <div className="absolute inset-0 flex items-end sm:items-center justify-center p-3 sm:p-6">
          <motion.div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                {mode === "add" ? "Add Staff User" : "Edit Staff User"}
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="h-9 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm inline-flex items-center gap-2 text-gray-700 transition-all duration-200 disabled:opacity-50"
              >
                <FiX /> Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <input
                    value={firstName}
                    onChange={handleFirstNameChange}
                    onBlur={() => handleBlur("firstName")}
                    placeholder="First Name"
                    maxLength={50}
                    className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 transition-colors duration-200 ${
                      touched.firstName && errors.firstName
                        ? "border-red-300 focus:border-red-300"
                        : "border-gray-200 focus:border-[#0c2bfc]"
                    }`}
                    required
                  />
                  {touched.firstName && errors.firstName && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.firstName}
                    </p>
                  )}
                  {touched.firstName && !errors.firstName && firstName && (
                    <p className="mt-1 text-xs text-gray-400">
                      {firstName.length}/50 characters
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <input
                    value={lastName}
                    onChange={handleLastNameChange}
                    onBlur={() => handleBlur("lastName")}
                    placeholder="Last Name"
                    maxLength={50}
                    className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 transition-colors duration-200 ${
                      touched.lastName && errors.lastName
                        ? "border-red-300 focus:border-red-300"
                        : "border-gray-200 focus:border-[#0c2bfc]"
                    }`}
                    required
                  />
                  {touched.lastName && errors.lastName && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.lastName}
                    </p>
                  )}
                  {touched.lastName && !errors.lastName && lastName && (
                    <p className="mt-1 text-xs text-gray-400">
                      {lastName.length}/50 characters
                    </p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <input
                    value={username}
                    onChange={handleUsernameChange}
                    onBlur={() => handleBlur("username")}
                    placeholder="Username"
                    className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 transition-colors duration-200 ${
                      touched.username && errors.username
                        ? "border-red-300 focus:border-red-300"
                        : "border-gray-200 focus:border-[#0c2bfc]"
                    }`}
                    required
                  />
                  {touched.username && errors.username && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.username}
                    </p>
                  )}
                  {touched.username && !errors.username && username && (
                    <p className="mt-1 text-xs text-gray-400">
                      {username.length}/16 characters
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <input
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={() => handleBlur("email")}
                    placeholder="Email"
                    type="email"
                    className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 transition-colors duration-200 ${
                      touched.email && errors.email
                        ? "border-red-300 focus:border-red-300"
                        : "border-gray-200 focus:border-[#0c2bfc]"
                    }`}
                    required
                  />
                  {touched.email && errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                {/* Contact Number */}
                <div>
                  <input
                    value={contactNumber}
                    onChange={handleContactNumberChange}
                    onBlur={() => handleBlur("contactNumber")}
                    placeholder="Contact Number (09XXXXXXXXX)"
                    maxLength={11}
                    className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 transition-colors duration-200 ${
                      touched.contactNumber && errors.contactNumber
                        ? "border-red-300 focus:border-red-300"
                        : "border-gray-200 focus:border-[#0c2bfc]"
                    }`}
                  />
                  {touched.contactNumber && errors.contactNumber && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.contactNumber}
                    </p>
                  )}
                </div>

                {/* Role */}
                <select
                  value={role}
                  onChange={(e) => {
                    const r = e.target.value;
                    setRole(r);
                    if (r === "receptionist") {
                      if (mode === "edit" && user?.role === "receptionist") {
                        setRecPerms(mergeReceptionistPermsFromUser(user));
                      } else {
                        setRecPerms({ ...DEFAULT_RECEPTIONIST_PERMISSIONS });
                      }
                    }
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] transition-colors duration-200"
                >
                  {(currentUser?.role === "superadmin"
                    ? ROLES
                    : ROLES.filter((r) => r !== "superadmin")
                  ).map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>

                {/* Status */}
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] transition-colors duration-200"
                >
                  {STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {role === "receptionist" && (
                <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 space-y-4">
                  <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Receptionist access
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                      <input
                        type="checkbox"
                        checked
                        disabled
                        className="rounded border-gray-300"
                      />
                      Front desk
                      <span className="text-xs font-normal text-gray-500">
                        (always on)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 pl-6 text-sm">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="perm-frontDesk"
                          checked={recPerms.frontDesk === "view"}
                          onChange={() =>
                            setRecPerms((p) => ({ ...p, frontDesk: "view" }))
                          }
                        />
                        View only
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="perm-frontDesk"
                          checked={recPerms.frontDesk === "manage"}
                          onChange={() =>
                            setRecPerms((p) => ({ ...p, frontDesk: "manage" }))
                          }
                        />
                        View and manage
                      </label>
                    </div>
                  </div>

                  {[
                    { key: "reservations", label: "Reservations" },
                    { key: "rooms", label: "Rooms & cottages" },
                    { key: "guests", label: "Guest management" },
                    { key: "billing", label: "Billing records" },
                  ].map(({ key, label }) => {
                    const enabled = recPerms[key] !== "none";
                    const level = enabled ? recPerms[key] : "view";
                    return (
                      <div key={key} className="space-y-1 border-t border-gray-200 pt-3">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => {
                              const on = e.target.checked;
                              setRecPerms((p) => ({
                                ...p,
                                [key]: on ? "manage" : "none",
                              }));
                            }}
                            className="rounded border-gray-300"
                          />
                          {label}
                        </label>
                        <div className="flex flex-wrap gap-4 pl-6 text-sm text-gray-600">
                          <label
                            className={`inline-flex items-center gap-2 ${enabled ? "cursor-pointer" : "opacity-40 cursor-not-allowed"}`}
                          >
                            <input
                              type="radio"
                              name={`perm-${key}`}
                              disabled={!enabled}
                              checked={enabled && level === "view"}
                              onChange={() =>
                                setRecPerms((p) => ({ ...p, [key]: "view" }))
                              }
                            />
                            View only
                          </label>
                          <label
                            className={`inline-flex items-center gap-2 ${enabled ? "cursor-pointer" : "opacity-40 cursor-not-allowed"}`}
                          >
                            <input
                              type="radio"
                              name={`perm-${key}`}
                              disabled={!enabled}
                              checked={enabled && level === "manage"}
                              onChange={() =>
                                setRecPerms((p) => ({ ...p, [key]: "manage" }))
                              }
                            />
                            View and manage
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Password change section - for edit mode */}
              {mode === "edit" && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setChangePassword(!changePassword)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
                        changePassword
                          ? "bg-[#0c2bfc] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <FiLock size={14} />
                      {changePassword
                        ? "Cancel Password Change"
                        : "Change Password"}
                    </button>
                    {changePassword && (
                      <span className="text-xs text-gray-500">
                        Set a new password for this user
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Password fields - for add mode OR edit mode with changePassword enabled */}
              {(mode === "add" || (mode === "edit" && changePassword)) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Password */}
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordChange}
                      onBlur={() => handleBlur("password")}
                      placeholder={mode === "add" ? "Password" : "New Password"}
                      className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 transition-colors duration-200 pr-10 ${
                        touched.password && errors.password
                          ? "border-red-300 focus:border-red-300"
                          : "border-gray-200 focus:border-[#0c2bfc]"
                      }`}
                      required={mode === "add"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2 text-gray-500 hover:text-[#0c2bfc] transition-colors"
                    >
                      {showPassword ? (
                        <FiEyeOff size={18} />
                      ) : (
                        <FiEye size={18} />
                      )}
                    </button>
                    {touched.password && errors.password && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.password}
                      </p>
                    )}
                    {touched.password && !errors.password && password && (
                      <p className="mt-1 text-xs text-green-500">
                        ✓ Password meets requirements
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      onBlur={() => handleBlur("confirmPassword")}
                      placeholder="Confirm Password"
                      className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 transition-colors duration-200 pr-10 ${
                        touched.confirmPassword && errors.confirmPassword
                          ? "border-red-300 focus:border-red-300"
                          : "border-gray-200 focus:border-[#0c2bfc]"
                      }`}
                      required={mode === "add"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-2 text-gray-500 hover:text-[#0c2bfc] transition-colors"
                    >
                      {showConfirm ? (
                        <FiEyeOff size={18} />
                      ) : (
                        <FiEye size={18} />
                      )}
                    </button>
                    {touched.confirmPassword && errors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.confirmPassword}
                      </p>
                    )}
                    {touched.confirmPassword &&
                      !errors.confirmPassword &&
                      confirmPassword && (
                        <p className="mt-1 text-xs text-green-500">
                          ✓ Passwords match
                        </p>
                      )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="h-10 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !isFormValid()}
                  className={`h-10 px-6 rounded-xl text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow ${
                    loading || !isFormValid()
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#0c2bfc] hover:bg-[#0a24d6]"
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader size={20} variant="white" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>{mode === "add" ? "Add User" : "Save Changes"}</>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
