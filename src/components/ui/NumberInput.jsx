// components/ui/NumberInput.jsx
import { FiMinus, FiPlus } from "react-icons/fi";

/**
 * Reusable Number Input Component with increment/decrement buttons
 * @param {Object} props
 * @param {number} props.value - Current value
 * @param {function} props.onChange - Callback when value changes
 * @param {number} props.min - Minimum value
 * @param {number} props.max - Maximum value
 * @param {number} props.step - Increment/decrement step
 * @param {string} props.label - Label text
 * @param {string} props.description - Description text
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.compact - Compact style
 * @param {string} props.className - Additional CSS classes
 */
export default function NumberInput({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  label,
  description,
  disabled = false,
  compact = false,
  className = "",
  ...props
}) {
  const handleIncrement = () => {
    if (!disabled) {
      const newValue = Math.min(max, value + step);
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    if (!disabled) {
      const newValue = Math.max(min, value - step);
      onChange(newValue);
    }
  };

  const handleInputChange = (e) => {
    if (disabled) return;

    const newValue = parseInt(e.target.value) || min;
    const clampedValue = Math.min(max, Math.max(min, newValue));
    onChange(clampedValue);
  };

  const baseClasses = "flex items-center gap-1";
  const sizeClasses = compact ? "h-9" : "h-10";
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}

      <div className={`${baseClasses} ${disabledClasses}`}>
        {/* Decrement Button */}
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className={`${sizeClasses} w-9 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 grid place-items-center text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed`}
          aria-label="Decrease"
        >
          <FiMinus size={compact ? 14 : 16} />
        </button>

        {/* Input Field */}
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`${sizeClasses} w-full border border-gray-200 bg-white px-3 text-sm text-center outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
          aria-label={label || "Number input"}
          {...props}
        />

        {/* Increment Button */}
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className={`${sizeClasses} w-9 rounded-r-xl border border-l-0 border-gray-200 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 grid place-items-center text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed`}
          aria-label="Increase"
        >
          <FiPlus size={compact ? 14 : 16} />
        </button>
      </div>

      {description && (
        <div className="text-xs text-gray-500">{description}</div>
      )}
    </div>
  );
}

/**
 * Compact version for tables and small spaces
 */
export function CompactNumberInput({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  disabled = false,
  className = "",
}) {
  const handleIncrement = () => {
    if (!disabled) {
      const newValue = Math.min(max, value + step);
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    if (!disabled) {
      const newValue = Math.max(min, value - step);
      onChange(newValue);
    }
  };

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className="h-7 w-7 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 grid place-items-center text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Decrease"
      >
        <FiMinus size={12} />
      </button>

      <div className="min-w-[32px] text-center text-sm font-medium text-gray-900">
        {value}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className="h-7 w-7 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 grid place-items-center text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Increase"
      >
        <FiPlus size={12} />
      </button>
    </div>
  );
}

/**
 * Stepper component for quantity controls
 */
export function Stepper({
  value,
  onChange,
  min = 1,
  max = 99,
  step = 1,
  disabled = false,
  size = "medium",
}) {
  const sizes = {
    small: "h-7 w-7 text-xs",
    medium: "h-9 w-9 text-sm",
    large: "h-11 w-11 text-base",
  };

  const handleIncrement = () => {
    if (!disabled) {
      const newValue = Math.min(max, value + step);
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    if (!disabled) {
      const newValue = Math.max(min, value - step);
      onChange(newValue);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className={`${sizes[size]} rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 grid place-items-center text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed`}
        aria-label="Decrease"
      >
        <FiMinus />
      </button>

      <div className="min-w-[40px] text-center font-medium text-gray-900">
        {value}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className={`${sizes[size]} rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 grid place-items-center text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed`}
        aria-label="Increase"
      >
        <FiPlus />
      </button>
    </div>
  );
}
