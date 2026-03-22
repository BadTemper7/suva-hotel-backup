import { useEffect, useState } from "react";
import {
  FiSave,
  FiUpload,
  FiRefreshCw,
  FiGlobe,
  FiLock,
  FiImage,
  FiInfo,
  FiClock,
  FiFilter,
  FiTrash2,
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import Loader from "../components/layout/Loader.jsx";
import { useSettingsStore } from "../stores/settingsStore.js";
import { getUserRole } from "../app/auth.js";

export default function Settings() {
  const {
    settings,
    flatSettings,
    categories,
    loading,
    uploading,
    fetchSettings,
    updateSettings,
    uploadLogo,
    uploadFavicon,
    resetToDefaults,
    getSetting,
  } = useSettingsStore();

  const [activeCategory, setActiveCategory] = useState("general");
  const [formData, setFormData] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [faviconPreview, setFaviconPreview] = useState("");

  const role = getUserRole();
  const isAdmin = role === "admin" || role === "superadmin";

  useEffect(() => {
    fetchSettings().catch((err) =>
      toast.error(err.message || "Failed to fetch settings"),
    );
  }, [fetchSettings]);

  useEffect(() => {
    if (Object.keys(flatSettings).length > 0) {
      setFormData(flatSettings);

      if (flatSettings.systemLogo) {
        setLogoPreview(flatSettings.systemLogo);
      }
      if (flatSettings.systemFavicon) {
        setFaviconPreview(flatSettings.systemFavicon);
      }
    }
  }, [flatSettings]);

  const handleInputChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === "logo") {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else if (type === "favicon") {
      setFaviconFile(file);
      setFaviconPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) {
      toast.error("Please select a logo file first");
      return;
    }

    try {
      await uploadLogo(logoFile);
      toast.success("Logo uploaded successfully");
      setLogoFile(null);
    } catch (err) {
      toast.error(err.message || "Failed to upload logo");
    }
  };

  const handleUploadFavicon = async () => {
    if (!faviconFile) {
      toast.error("Please select a favicon file first");
      return;
    }

    try {
      await uploadFavicon(faviconFile);
      toast.success("Favicon uploaded successfully");
      setFaviconFile(null);
    } catch (err) {
      toast.error(err.message || "Failed to upload favicon");
    }
  };

  const handleSaveSettings = async () => {
    if (!isAdmin) {
      toast.error("You don't have permission to update settings");
      return;
    }

    try {
      await updateSettings(formData);
      toast.success("Settings updated successfully");
    } catch (err) {
      toast.error(err.message || "Failed to update settings");
    }
  };

  const handleResetDefaults = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset all settings to defaults?",
      )
    ) {
      return;
    }

    try {
      await resetToDefaults();
      toast.success("Settings reset to defaults");
    } catch (err) {
      toast.error(err.message || "Failed to reset settings");
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "general":
        return <FiGlobe className="text-[#0c2bfc]" />;
      case "appearance":
        return <FiImage className="text-[#0c2bfc]" />;
      case "security":
        return <FiLock className="text-[#0c2bfc]" />;
      default:
        return <FiInfo className="text-[#0c2bfc]" />;
    }
  };

  const getSessionWarningTimeOptions = () => {
    return ["1", "2", "5"];
  };

  const formatSessionWarningOption = (option) => {
    return `${option} minute${option !== "1" ? "s" : ""}`;
  };

  const getSessionTimeoutOptions = () => {
    return ["15", "30", "60", "120", "480"];
  };

  const formatSessionTimeoutOption = (option) => {
    const num = parseInt(option);
    if (num < 60) return `${num} minutes`;
    if (num === 60) return "1 hour";
    if (num === 120) return "2 hours";
    if (num === 480) return "8 hours";
    return `${Math.floor(num / 60)} hours`;
  };

  if (loading && Object.keys(settings).length === 0) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
        <Loader
          size={60}
          variant="primary"
          showText={true}
          text="Loading settings..."
        />
      </div>
    );
  }

  return (
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
          <div className="text-xl font-bold text-gray-900">System Settings</div>
          <div className="text-sm text-gray-600">
            Configure system preferences, appearance, and security settings
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={loading || !isAdmin}
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
              disabled:opacity-70 disabled:cursor-not-allowed
            "
          >
            <FiRefreshCw className="w-4 h-4" /> Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={loading || !isAdmin}
            className="
              h-11 px-5 rounded-xl 
              bg-[#0c2bfc] 
              hover:bg-[#0a24d6]
              text-white text-sm font-medium inline-flex items-center gap-2
              transition-all duration-200
              hover:shadow-lg hover:-translate-y-0.5
              active:translate-y-0
              disabled:opacity-70 disabled:cursor-not-allowed
            "
          >
            <FiSave className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
        {/* Sidebar - Categories */}
        <div className="lg:w-64 shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div
              className="
                px-6 py-4 border-b border-gray-200 
                bg-gray-50
              "
            >
              <div className="text-sm font-semibold text-gray-900">
                Settings Categories
              </div>
            </div>
            <div className="p-3">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm mb-2
                    transition-all duration-200 hover:-translate-y-0.5
                    ${
                      activeCategory === category
                        ? "bg-[#0c2bfc]/5 border border-[#0c2bfc]/20 text-[#0c2bfc] shadow-sm"
                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md"
                    }
                  `}
                >
                  {getCategoryIcon(category)}
                  <span className="capitalize font-medium">{category}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Settings Form */}
        <div className="flex-1 min-h-0">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div
              className="
                px-6 py-4 border-b border-gray-200 
                flex items-center justify-between
                bg-gray-50
              "
            >
              <div>
                <div className="text-lg font-semibold text-gray-900 capitalize">
                  {activeCategory} Settings
                </div>
                <div className="text-sm text-gray-600">
                  Configure {activeCategory} preferences
                </div>
              </div>
              <div className="text-xs text-gray-500">Admin access required</div>
            </div>
            <div className="p-6 space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto">
              {settings[activeCategory]?.map((setting) => (
                <div key={setting.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-gray-900">
                      {setting.label}
                    </label>
                    {setting.required && (
                      <span className="text-xs text-red-500 font-medium">
                        Required
                      </span>
                    )}
                  </div>

                  {setting.description && (
                    <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                      {setting.description}
                    </div>
                  )}

                  {setting.dataType === "file" ? (
                    <div className="space-y-4">
                      {setting.key === "systemLogo" ? (
                        <>
                          {logoPreview && (
                            <div className="mb-3">
                              <div className="text-xs text-gray-600 font-medium mb-2">
                                Current Logo:
                              </div>
                              <div className="inline-flex items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                <img
                                  src={logoPreview}
                                  alt="System Logo"
                                  className="h-12 object-contain"
                                />
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, "logo")}
                                className="
                                  block w-full text-sm text-gray-600
                                  file:mr-4 file:py-3 file:px-4 file:rounded-xl 
                                  file:border-0 file:text-sm file:font-medium 
                                  file:bg-gray-100
                                  file:text-gray-700 file:border file:border-gray-200
                                  hover:file:bg-gray-200
                                  cursor-pointer
                                "
                                disabled={!isAdmin}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleUploadLogo}
                              disabled={!logoFile || uploading || !isAdmin}
                              className="
                                h-11 px-5 rounded-xl 
                                bg-[#0c2bfc] 
                                hover:bg-[#0a24d6]
                                text-white text-sm font-medium inline-flex items-center gap-2
                                transition-all duration-200
                                hover:shadow-lg hover:-translate-y-0.5
                                active:translate-y-0
                                disabled:opacity-70 disabled:cursor-not-allowed
                              "
                            >
                              <FiUpload className="w-4 h-4" /> Upload
                            </button>
                          </div>
                        </>
                      ) : setting.key === "systemFavicon" ? (
                        <>
                          {faviconPreview && (
                            <div className="mb-3">
                              <div className="text-xs text-gray-600 font-medium mb-2">
                                Current Favicon:
                              </div>
                              <div className="inline-flex items-center justify-center p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                <img
                                  src={faviconPreview}
                                  alt="Favicon"
                                  className="h-8 w-8 object-contain"
                                />
                              </div>
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <input
                                type="file"
                                accept="image/x-icon,image/png,image/svg+xml"
                                onChange={(e) => handleFileChange(e, "favicon")}
                                className="
                                  block w-full text-sm text-gray-600
                                  file:mr-4 file:py-3 file:px-4 file:rounded-xl 
                                  file:border-0 file:text-sm file:font-medium 
                                  file:bg-gray-100
                                  file:text-gray-700 file:border file:border-gray-200
                                  hover:file:bg-gray-200
                                  cursor-pointer
                                "
                                disabled={!isAdmin}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleUploadFavicon}
                              disabled={!faviconFile || uploading || !isAdmin}
                              className="
                                h-11 px-5 rounded-xl 
                                bg-[#0c2bfc] 
                                hover:bg-[#0a24d6]
                                text-white text-sm font-medium inline-flex items-center gap-2
                                transition-all duration-200
                                hover:shadow-lg hover:-translate-y-0.5
                                active:translate-y-0
                                disabled:opacity-70 disabled:cursor-not-allowed
                              "
                            >
                              <FiUpload className="w-4 h-4" /> Upload
                            </button>
                          </div>
                        </>
                      ) : null}
                    </div>
                  ) : setting.key === "sessionTimeout" ? (
                    <div className="space-y-3">
                      <select
                        value={formData[setting.key] || "15"}
                        onChange={(e) =>
                          handleInputChange(setting.key, e.target.value)
                        }
                        disabled={!isAdmin}
                        className="
                          w-full h-11 rounded-xl border border-gray-200 
                          bg-white
                          px-4 text-sm outline-none 
                          focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
                          text-gray-700 font-medium
                          transition-all duration-200
                          disabled:opacity-70 disabled:cursor-not-allowed
                        "
                      >
                        {getSessionTimeoutOptions().map((option) => (
                          <option key={option} value={option}>
                            {formatSessionTimeoutOption(option)}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <FiClock className="w-3.5 h-3.5 text-[#0c2bfc]" />
                        Session will expire after {formData[setting.key] ||
                          15}{" "}
                        minutes of inactivity
                      </div>
                    </div>
                  ) : setting.key === "sessionWarningTime" ? (
                    <div className="space-y-3">
                      <select
                        value={formData[setting.key] || "1"}
                        onChange={(e) =>
                          handleInputChange(setting.key, e.target.value)
                        }
                        disabled={!isAdmin}
                        className="
                          w-full h-11 rounded-xl border border-gray-200 
                          bg-white
                          px-4 text-sm outline-none 
                          focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
                          text-gray-700 font-medium
                          transition-all duration-200
                          disabled:opacity-70 disabled:cursor-not-allowed
                        "
                      >
                        {getSessionWarningTimeOptions().map((option) => (
                          <option key={option} value={option}>
                            {formatSessionWarningOption(option)}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <FiClock className="w-3.5 h-3.5 text-[#0c2bfc]" />
                        Warning will show {formData[setting.key] || 1} minute
                        {formData[setting.key] !== "1" ? "s" : ""} before logout
                      </div>
                    </div>
                  ) : setting.options && setting.options.length > 0 ? (
                    <select
                      value={formData[setting.key] || ""}
                      onChange={(e) =>
                        handleInputChange(setting.key, e.target.value)
                      }
                      disabled={!isAdmin}
                      className="
                        w-full h-11 rounded-xl border border-gray-200 
                        bg-white
                        px-4 text-sm outline-none 
                        focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
                        text-gray-700 font-medium
                        transition-all duration-200
                        disabled:opacity-70 disabled:cursor-not-allowed
                      "
                    >
                      {setting.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : setting.dataType === "boolean" ? (
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData[setting.key] || false}
                        onChange={(e) =>
                          handleInputChange(setting.key, e.target.checked)
                        }
                        disabled={!isAdmin}
                        className="
                          h-5 w-5 rounded border-gray-300 
                          text-[#0c2bfc] focus:ring-[#0c2bfc]/20
                          disabled:opacity-70 disabled:cursor-not-allowed
                        "
                      />
                      <span className="text-sm text-gray-600">
                        {formData[setting.key] ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  ) : (
                    <input
                      type={setting.dataType === "number" ? "number" : "text"}
                      value={formData[setting.key] || ""}
                      onChange={(e) =>
                        handleInputChange(
                          setting.key,
                          setting.dataType === "number"
                            ? parseInt(e.target.value)
                            : e.target.value,
                        )
                      }
                      disabled={!isAdmin}
                      className="
                        w-full h-11 rounded-xl border border-gray-200 
                        bg-white
                        px-4 text-sm outline-none 
                        focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
                        text-gray-700 font-medium
                        transition-all duration-200
                        disabled:opacity-70 disabled:cursor-not-allowed
                      "
                      min={setting.dataType === "number" ? "1" : undefined}
                    />
                  )}

                  {setting.lastModifiedBy && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#0c2bfc]"></div>
                      Last modified by:{" "}
                      {setting.lastModifiedBy.username ||
                        setting.lastModifiedBy.email}
                      {setting.updatedAt &&
                        ` on ${new Date(setting.updatedAt).toLocaleDateString()}`}
                    </div>
                  )}
                </div>
              ))}

              {/* Session settings summary */}
              {activeCategory === "security" && (
                <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-gray-200 border border-gray-300">
                      <FiLock className="text-[#0c2bfc] w-5 h-5" />
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      Security Settings Summary
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Session timeout:</span>
                      <span className="font-medium">
                        {formatSessionTimeoutOption(
                          formData.sessionTimeout || "15",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Warning before logout:</span>
                      <span className="font-medium">
                        {formatSessionWarningOption(
                          formData.sessionWarningTime || "1",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Maximum login attempts:</span>
                      <span className="font-medium">
                        {formData.maxLoginAttempts || 5}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Account lockout duration:</span>
                      <span className="font-medium">
                        {formData.lockoutDuration || 15} minutes
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {(loading || uploading) && (
        <div
          className="
          absolute inset-0 z-50 flex items-center justify-center 
          bg-white/90 backdrop-blur-sm
          rounded-xl
        "
        >
          <Loader
            size={60}
            variant="primary"
            showText={true}
            text="Saving settings..."
          />
        </div>
      )}
    </div>
  );
}
