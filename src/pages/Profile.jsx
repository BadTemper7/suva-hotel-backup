// src/pages/Profile.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../stores/userStore.js";
import { toast } from "react-hot-toast";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiEye,
  FiEyeOff,
  FiSave,
  FiUserCheck,
  FiCalendar,
  FiShield,
  FiAlertCircle,
} from "react-icons/fi";

export default function Profile() {
  const navigate = useNavigate();
  const {
    currentUser,
    updateUser,
    changePassword,
    isLoading,
    isAuthenticated,
  } = useUserStore();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [updating, setUpdating] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated && !currentUser) {
      navigate("/login");
      return;
    }

    // Populate form with current user data
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        email: currentUser.email || "",
        contactNumber: currentUser.contactNumber || "",
      });
    }
  }, [currentUser, isAuthenticated, navigate]);

  // Validate profile form
  const validateProfile = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    } else if (formData.firstName.trim().length > 50) {
      newErrors.firstName = "First name cannot exceed 50 characters";
    } else if (!/^[A-Za-z\s]+$/.test(formData.firstName.trim())) {
      newErrors.firstName = "First name can only contain letters and spaces";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    } else if (formData.lastName.trim().length > 50) {
      newErrors.lastName = "Last name cannot exceed 50 characters";
    } else if (!/^[A-Za-z\s]+$/.test(formData.lastName.trim())) {
      newErrors.lastName = "Last name can only contain letters and spaces";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = "Contact number is required";
    } else if (!/^09\d{9}$/.test(formData.contactNumber.trim())) {
      newErrors.contactNumber =
        "Contact number must start with 09 and be 11 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate password
  const validatePassword = () => {
    const newErrors = {};

    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (passwordData.newPassword.length > 16) {
      newErrors.newPassword = "Password cannot exceed 16 characters";
    } else if (!/[A-Z]/.test(passwordData.newPassword)) {
      newErrors.newPassword = "Must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(passwordData.newPassword)) {
      newErrors.newPassword = "Must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(passwordData.newPassword)) {
      newErrors.newPassword = "Must contain at least one number";
    } else if (!/[_!@#$%^&*]/.test(passwordData.newPassword)) {
      newErrors.newPassword =
        "Must contain at least one special character (_!@#$%^&*)";
    } else if (/\s/.test(passwordData.newPassword)) {
      newErrors.newPassword = "Password cannot contain spaces";
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    if (!validateProfile()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setUpdating(true);
    try {
      const result = await updateUser(currentUser._id, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        contactNumber: formData.contactNumber.trim(),
      });

      if (result.success) {
        toast.success("Profile updated successfully");
        setIsEditing(false);
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
    } finally {
      setUpdating(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!validatePassword()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setUpdatingPassword(true);
    try {
      // Note: You'll need to add changePassword method to your userStore
      // For now, we'll use a direct API call or add the method
      const result = await changePassword(
        passwordData.newPassword,
        passwordData.confirmPassword,
      );

      if (result.success) {
        toast.success("Password changed successfully");
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(result.error || "Failed to change password");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0c2bfc] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage your account information and security settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-6 text-center border-b border-gray-200">
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-gradient-to-br from-[#0c2bfc] to-[#00af00] rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl font-bold text-white">
                    {currentUser.firstName?.charAt(0)}
                    {currentUser.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1 border-2 border-white">
                  <FiUserCheck className="w-3 h-3 text-white" />
                </div>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                {currentUser.firstName} {currentUser.lastName}
              </h2>
              <p className="text-sm text-gray-500">{currentUser.role}</p>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <FiShield className="w-3 h-3 mr-1" />
                {currentUser.role === "superadmin"
                  ? "Super Administrator"
                  : currentUser.role === "admin"
                    ? "Administrator"
                    : "Receptionist"}
              </div>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <FiMail className="w-4 h-4 mr-3 text-gray-400" />
                <span className="truncate">{currentUser.email}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FiPhone className="w-4 h-4 mr-3 text-gray-400" />
                <span>{currentUser.contactNumber}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FiCalendar className="w-4 h-4 mr-3 text-gray-400" />
                <span>
                  Joined {new Date(currentUser.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Profile Information
                </h3>
                <p className="text-sm text-gray-500">
                  Update your personal information
                </p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-[#0c2bfc] hover:text-[#0a24d6] transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200 ${
                      !isEditing
                        ? "bg-gray-50 border-gray-200 text-gray-500"
                        : "border-gray-300 focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20"
                    } ${errors.firstName ? "border-red-300 focus:border-red-300" : ""}`}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200 ${
                      !isEditing
                        ? "bg-gray-50 border-gray-200 text-gray-500"
                        : "border-gray-300 focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20"
                    } ${errors.lastName ? "border-red-300 focus:border-red-300" : ""}`}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.lastName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200 ${
                      !isEditing
                        ? "bg-gray-50 border-gray-200 text-gray-500"
                        : "border-gray-300 focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20"
                    } ${errors.email ? "border-red-300 focus:border-red-300" : ""}`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all duration-200 ${
                      !isEditing
                        ? "bg-gray-50 border-gray-200 text-gray-500"
                        : "border-gray-300 focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20"
                    } ${errors.contactNumber ? "border-red-300 focus:border-red-300" : ""}`}
                  />
                  {errors.contactNumber && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.contactNumber}
                    </p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        firstName: currentUser.firstName || "",
                        lastName: currentUser.lastName || "",
                        email: currentUser.email || "",
                        contactNumber: currentUser.contactNumber || "",
                      });
                      setErrors({});
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-2 bg-[#0c2bfc] hover:bg-[#0a24d6] text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    {updating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Change Password
                </h3>
                <p className="text-sm text-gray-500">
                  Update your password to keep your account secure
                </p>
              </div>
              {!isChangingPassword && (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="px-4 py-2 text-sm font-medium text-[#0c2bfc] hover:text-[#0a24d6] transition-colors"
                >
                  Change Password
                </button>
              )}
            </div>

            {isChangingPassword && (
              <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordInputChange}
                        className={`w-full rounded-xl border px-4 py-2.5 pr-10 text-sm outline-none transition-all duration-200 ${
                          passwordErrors.newPassword
                            ? "border-red-300 focus:border-red-300"
                            : "border-gray-300 focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20"
                        }`}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? (
                          <FiEyeOff size={18} />
                        ) : (
                          <FiEye size={18} />
                        )}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-xs text-red-500">
                        {passwordErrors.newPassword}
                      </p>
                    )}

                    {/* Password Requirements */}
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs font-medium text-blue-800 mb-2">
                        Password Requirements:
                      </p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li
                          className={
                            passwordData.newPassword.length >= 8 &&
                            passwordData.newPassword.length <= 16
                              ? "text-green-600"
                              : ""
                          }
                        >
                          • 8-16 characters
                        </li>
                        <li
                          className={
                            /[A-Z]/.test(passwordData.newPassword)
                              ? "text-green-600"
                              : ""
                          }
                        >
                          • At least 1 uppercase letter
                        </li>
                        <li
                          className={
                            /[a-z]/.test(passwordData.newPassword)
                              ? "text-green-600"
                              : ""
                          }
                        >
                          • At least 1 lowercase letter
                        </li>
                        <li
                          className={
                            /[0-9]/.test(passwordData.newPassword)
                              ? "text-green-600"
                              : ""
                          }
                        >
                          • At least 1 number
                        </li>
                        <li
                          className={
                            /[_!@#$%^&*]/.test(passwordData.newPassword)
                              ? "text-green-600"
                              : ""
                          }
                        >
                          • At least 1 special character (_!@#$%^&*)
                        </li>
                        <li
                          className={
                            !/\s/.test(passwordData.newPassword)
                              ? "text-green-600"
                              : ""
                          }
                        >
                          • No spaces
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordInputChange}
                        className={`w-full rounded-xl border px-4 py-2.5 pr-10 text-sm outline-none transition-all duration-200 ${
                          passwordErrors.confirmPassword
                            ? "border-red-300 focus:border-red-300"
                            : "border-gray-300 focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20"
                        }`}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? (
                          <FiEyeOff size={18} />
                        ) : (
                          <FiEye size={18} />
                        )}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-500">
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                      setPasswordErrors({});
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="px-6 py-2 bg-[#0c2bfc] hover:bg-[#0a24d6] text-white text-sm font-medium rounded-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    {updatingPassword ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <FiLock className="w-4 h-4" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {!isChangingPassword && (
              <div className="p-6 text-center">
                <FiLock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Keep your account secure by updating your password regularly.
                </p>
              </div>
            )}
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Account Information
              </h3>
              <p className="text-sm text-gray-500">
                Your account details and permissions
              </p>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Username</span>
                <span className="text-sm font-medium text-gray-900">
                  {currentUser.username}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Role</span>
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {currentUser.role}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Status</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {currentUser.status}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-500">Member Since</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(currentUser.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
