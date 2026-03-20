import Loader from "./Loader.jsx";

export default function PageLoader({ label = "Loading..." }) {
  return (
    <div className="min-h-[50vh] grid place-items-center">
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <Loader size={22} />
        <span>{label}</span>
      </div>
    </div>
  );
}
