export default function Loader({ size = 20, className = "" }) {
  return (
    <span
      className={[
        "inline-block rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin",
        className,
      ].join(" ")}
      style={{ width: size, height: size }}
      aria-label="Loading"
      role="status"
    />
  );
}
