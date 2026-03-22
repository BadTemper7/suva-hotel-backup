// src/components/modals/ViewMessageModal.jsx
import { FiX, FiCornerUpLeft, FiTrash2 } from "react-icons/fi";
import { format } from "date-fns";

export default function ViewMessageModal({
  open,
  message,
  onClose,
  onReply,
  onDelete,
}) {
  if (!open || !message) return null;

  const getStatusBadge = () => {
    const styles = {
      unread: "bg-red-100 text-red-700",
      read: "bg-gray-100 text-gray-700",
      replied: "bg-green-100 text-green-700",
    };
    return styles[message.status] || styles.unread;
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-2xl">
          <div className="text-lg font-bold text-gray-900">Message Details</div>
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
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Sender Info */}
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {message.name}
                </h3>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge()}`}
                >
                  {message.status.charAt(0).toUpperCase() +
                    message.status.slice(1)}
                </span>
              </div>
              <p className="text-sm text-gray-600">{message.email}</p>
              <p className="text-xs text-gray-500 mt-1">
                {format(
                  new Date(message.createdAt),
                  "MMMM dd, yyyy 'at' h:mm a",
                )}
              </p>
            </div>
          </div>

          {/* Subject */}
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Subject
            </label>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-900 font-medium">
                {message.subject}
              </p>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Message
            </label>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {message.message}
              </p>
            </div>
          </div>

          {/* Reply (if exists) */}
          {message.reply && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FiCornerUpLeft className="w-4 h-4" />
                Reply
              </label>
              <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                <p className="text-sm text-gray-600 mb-2">
                  Replied by: {message.reply.repliedBy?.name || "Admin"}
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  {format(
                    new Date(message.reply.repliedAt),
                    "MMMM dd, yyyy 'at' h:mm a",
                  )}
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {message.reply.message}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 bg-white rounded-b-2xl">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onReply?.(message)}
              className="
                h-11 px-5 rounded-xl 
                bg-[#0c2bfc] 
                hover:bg-[#0a24d6]
                text-white text-sm font-semibold
                transition-all duration-200
                hover:shadow-lg hover:-translate-y-0.5
                active:translate-y-0
                flex items-center gap-2
              "
            >
              <FiCornerUpLeft className="w-4 h-4" />
              Reply
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(message._id)}
              className="
                h-11 px-5 rounded-xl 
                border border-red-200 
                bg-white
                hover:bg-red-50
                text-sm font-semibold text-red-600
                transition-all duration-200
                hover:shadow-md hover:-translate-y-0.5
                active:translate-y-0
                flex items-center gap-2
              "
            >
              <FiTrash2 className="w-4 h-4" />
              Delete
            </button>
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
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
