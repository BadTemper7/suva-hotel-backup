import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiEye, FiEyeOff } from "react-icons/fi";
import { useUserStore } from "../../stores/userStore.js";
import { toast } from "react-hot-toast";
import Loader from "../layout/Loader";

const ROLES = ["admin", "receptionist"];
const STATUS = ["active", "inactive"];

// Validation functions
const isValidUsername = (username) => /^[a-zA-Z0-9_]{8,16}$/.test(username);
const isValidPassword = (password) =>
  /^(?=.*[A-Z])(?=.*[_!@#$%^&*])[A-Za-z\d_!@#$%^&*]{8,16}$/.test(password);
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^09\d{9}$/.test(phone);
const isValidName = (name) => /^[A-Za-z\s]+$/.test(name);

export default function UserModal({ open, mode, user, onClose }) {
  const createUser = useUserStore((state) => state.createUser);
  const updateUser = useUserStore((state) => state.updateUser);
  const fetchUsers = useUserStore((state) => state.fetchUsers);

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
      setPassword("");
      setConfirmPassword("");
      
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
    } else {
      setFirstName("");
      setLastName("");
      setUsername("");
      setEmail("");
      setContactNumber("");
      setRole("receptionist");
      setStatus("active");
      setPassword("");
      setConfirmPassword("");
      
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

  // Validation functions
  const validateFirstName = (value) => {
    if (!value.trim()) return "First name is required";
    if (!isValidName(value)) return "First name can only contain letters and spaces";
    return "";
  };

  const validateLastName = (value) => {
    if (!value.trim()) return "Last name is required";
    if (!isValidName(value)) return "Last name can only contain letters and spaces";
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
    if (!value && mode === "add") return "Password is required";
    if (mode === "add" && !isValidPassword(value)) 
      return "Password must be 8-16 characters, contain at least one uppercase letter and one special character (_!@#$%^&*)";
    return "";
  };

  const validateConfirmPassword = (value) => {
    if (mode === "add" && !value) return "Please confirm your password";
    if (mode === "add" && value !== password) return "Passwords do not match";
    return "";
  };

  // Handle blur events to mark fields as touched
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Validate on blur
    switch(field) {
      case "firstName":
        setErrors(prev => ({ ...prev, firstName: validateFirstName(firstName) }));
        break;
      case "lastName":
        setErrors(prev => ({ ...prev, lastName: validateLastName(lastName) }));
        break;
      case "username":
        setErrors(prev => ({ ...prev, username: validateUsername(username) }));
        break;
      case "email":
        setErrors(prev => ({ ...prev, email: validateEmail(email) }));
        break;
      case "contactNumber":
        setErrors(prev => ({ ...prev, contactNumber: validateContactNumber(contactNumber) }));
        break;
      case "password":
        if (mode === "add") {
          setErrors(prev => ({ ...prev, password: validatePassword(password) }));
          // Also validate confirm password if it has a value
          if (confirmPassword) {
            setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword) }));
          }
        }
        break;
      case "confirmPassword":
        if (mode === "add") {
          setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword) }));
        }
        break;
    }
  };

  // Handle input changes with real-time validation
  const handleFirstNameChange = (e) => {
    const value = e.target.value;
    setFirstName(value);
    if (touched.firstName) {
      setErrors(prev => ({ ...prev, firstName: validateFirstName(value) }));
    }
  };

  const handleLastNameChange = (e) => {
    const value = e.target.value;
    setLastName(value);
    if (touched.lastName) {
      setErrors(prev => ({ ...prev, lastName: validateLastName(value) }));
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    if (touched.username) {
      setErrors(prev => ({ ...prev, username: validateUsername(value) }));
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (touched.email) {
      setErrors(prev => ({ ...prev, email: validateEmail(value) }));
    }
  };

  const handleContactNumberChange = (e) => {
    const value = e.target.value;
    setContactNumber(value);
    if (touched.contactNumber) {
      setErrors(prev => ({ ...prev, contactNumber: validateContactNumber(value) }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (touched.password && mode === "add") {
      setErrors(prev => ({ ...prev, password: validatePassword(value) }));
      // Also validate confirm password if it has a value
      if (confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(confirmPassword) }));
      }
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (touched.confirmPassword && mode === "add") {
      setErrors(prev => ({ ...prev, confirmPassword: validateConfirmPassword(value) }));
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    if (mode === "add") {
      return (
        !errors.firstName &&
        !errors.lastName &&
        !errors.username &&
        !errors.email &&
        !errors.contactNumber &&
        !errors.password &&
        !errors.confirmPassword &&
        firstName.trim() &&
        lastName.trim() &&
        username.trim() &&
        email.trim() &&
        contactNumber.trim() &&
        password &&
        confirmPassword
      );
    } else {
      return (
        !errors.firstName &&
        !errors.lastName &&
        !errors.username &&
        !errors.email &&
        !errors.contactNumber &&
        firstName.trim() &&
        lastName.trim() &&
        username.trim() &&
        email.trim() &&
        contactNumber.trim()
      );
    }
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
      password: mode === "add",
      confirmPassword: mode === "add",
    });

    // Validate all fields
    const firstNameError = validateFirstName(firstName);
    const lastNameError = validateLastName(lastName);
    const usernameError = validateUsername(username);
    const emailError = validateEmail(email);
    const contactError = validateContactNumber(contactNumber);
    
    setErrors({
      firstName: firstNameError,
      lastName: lastNameError,
      username: usernameError,
      email: emailError,
      contactNumber: contactError,
      password: mode === "add" ? validatePassword(password) : "",
      confirmPassword: mode === "add" ? validateConfirmPassword(confirmPassword) : "",
    });

    // Check if there are any errors
    if (
      firstNameError ||
      lastNameError ||
      usernameError ||
      emailError ||
      contactError ||
      (mode === "add" && (validatePassword(password) || validateConfirmPassword(confirmPassword)))
    ) {
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

    if (mode === "add") payload.password = password;

    try {
      setLoading(true);
      if (mode === "add") {
        await createUser(payload);
        toast.success("User added successfully");
      } else {
        await updateUser(user._id, payload);
        toast.success("User updated successfully");
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
                {mode === "add" ? "Add User" : "Edit User"}
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
                    className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 transition-colors duration-200 ${
                      touched.firstName && errors.firstName
                        ? "border-red-300 focus:border-red-300"
                        : "border-gray-200 focus:border-[#0c2bfc]"
                    }`}
                    required
                  />
                  {touched.firstName && errors.firstName && (
                    <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <input
                    value={lastName}
                    onChange={handleLastNameChange}
                    onBlur={() => handleBlur("lastName")}
                    placeholder="Last Name"
                    className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 transition-colors duration-200 ${
                      touched.lastName && errors.lastName
                        ? "border-red-300 focus:border-red-300"
                        : "border-gray-200 focus:border-[#0c2bfc]"
                    }`}
                    required
                  />
                  {touched.lastName && errors.lastName && (
                    <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
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
                    <p className="mt-1 text-xs text-red-500">{errors.username}</p>
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
                    placeholder="Contact Number"
                    className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 transition-colors duration-200 ${
                      touched.contactNumber && errors.contactNumber
                        ? "border-red-300 focus:border-red-300"
                        : "border-gray-200 focus:border-[#0c2bfc]"
                    }`}
                  />
                  {touched.contactNumber && errors.contactNumber && (
                    <p className="mt-1 text-xs text-red-500">{errors.contactNumber}</p>
                  )}
                </div>

                {/* Role */}
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc] transition-colors duration-200"
                >
                  {ROLES.map((r) => (
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

                {/* Password fields - only for add mode */}
                {mode === "add" && (
                  <>
                    {/* Password */}
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={handlePasswordChange}
                        onBlur={() => handleBlur("password")}
                        placeholder="Password"
                        className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#0c2bfc]/20 transition-colors duration-200 pr-10 ${
                          touched.password && errors.password
                            ? "border-red-300 focus:border-red-300"
                            : "border-gray-200 focus:border-[#0c2bfc]"
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2 text-gray-500 hover:text-[#0c2bfc] transition-colors"
                      >
                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                      {touched.password && errors.password && (
                        <p className="mt-1 text-xs text-red-500">{errors.password}</p>
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
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-2 text-gray-500 hover:text-[#0c2bfc] transition-colors"
                      >
                        {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                      {touched.confirmPassword && errors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </>
                )}
              </div>

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
                  {mode === "add" ? "Add User" : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}