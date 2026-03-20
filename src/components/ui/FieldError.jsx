// components/ui/FieldError.jsx
export default function FieldError({ text, className = "" }) {
  if (!text) return null;
  return <div className={`mt-1 text-xs text-red-600 ${className}`}>{text}</div>;
}
