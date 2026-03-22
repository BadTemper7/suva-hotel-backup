// src/components/modals/ReplyMessageModal.jsx
import { useEffect, useState } from "react";
import { FiX, FiSend } from "react-icons/fi";
import { format } from "date-fns";

export default function ReplyMessageModal({ open, message, onClose, onSend }) {
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (!open) {
      setReplyText("");
    }
  }, [open]);

  if (!open || !message) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onSend?.(replyText);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-2xl">
          <div className="text-lg font-bold text-gray-900">
            Reply to Message
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
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Message Preview */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="mb-3">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  From: {message.name}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Email: {message.email}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Received:{" "}
                  {format(
                    new Date(message.createdAt),
                    "MMMM dd, yyyy 'at' h:mm a",
                  )}
                </p>
              </div>
              <span
                className={`
                inline-flex items-center rounded-full px-3 py-1 text-xs font-medium
                ${
                  message.status === "unread"
                    ? "bg-red-100 text-red-700"
                    : message.status === "read"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-green-100 text-green-700"
                }
              `}
              >
                {message.status.charAt(0).toUpperCase() +
                  message.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-900 mb-2">
              Subject: {message.subject}
            </p>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {message.message}
              </p>
            </div>
          </div>
        </div>

        {/* Reply Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Reply *
            </label>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows="6"
              className="
                w-full rounded-xl 
                border border-gray-200 
                bg-white px-4 py-3
                text-sm text-gray-800 outline-none
                focus:border-[#0c2bfc] focus:ring-2 focus:ring-[#0c2bfc]/20
                transition-all duration-200
                resize-none
                placeholder:text-gray-400
              "
              placeholder="Type your reply here... This will be sent via email to the customer."
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              This reply will be sent to {message.email}
            </p>
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
              <FiSend className="w-4 h-4" />
              Send Reply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
