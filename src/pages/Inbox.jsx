// src/pages/admin/Inbox.jsx
import { useState, useEffect } from "react";
import {
  FiSearch,
  FiFilter,
  FiMail,
  FiMessageSquare,
  FiTrash2,
  FiEye,
  FiCornerUpLeft,
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";
import { format } from "date-fns";
import { useMessageStore } from "../stores/messageStore";
import Pagination from "../components/ui/Pagination.jsx";
import ReplyMessageModal from "../components/modals/ReplyMessageModal.jsx";
import ViewMessageModal from "../components/modals/ViewMessageModal.jsx";

const STATUS_STYLES = {
  unread: "bg-red-100 text-red-700",
  read: "bg-gray-100 text-gray-700",
  replied: "bg-green-100 text-green-700",
};

function StatusPill({ status }) {
  const labels = {
    unread: "Unread",
    read: "Read",
    replied: "Replied",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${
        STATUS_STYLES[status] || STATUS_STYLES.unread
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

function MessageCard({ message, onReply, onDelete, onView }) {
  const isUnread = message.status === "unread";

  return (
    <div
      className={`
        rounded-xl border 
        bg-white
        p-4 flex items-start gap-4
        shadow-sm hover:shadow-md transition-all duration-300
        hover:-translate-y-0.5
        ${isUnread ? "border-l-4 border-l-blue-600 border-gray-200" : "border-gray-200"}
      `}
    >
      <div className="flex-shrink-0">
        <div
          className={`
          w-10 h-10 rounded-full flex items-center justify-center
          ${isUnread ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}
        `}
        >
          <FiMail className="w-5 h-5" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <div className="text-sm font-semibold text-gray-900">
            {message.name}
          </div>
          <div className="text-xs text-gray-500">
            {format(new Date(message.createdAt), "MMM dd, yyyy h:mm a")}
          </div>
        </div>

        <div className="text-xs text-gray-600 mb-2">{message.email}</div>

        <div className="mb-3">
          <div className="text-sm font-medium text-gray-900 mb-1">
            {message.subject}
          </div>
          <div className="text-sm text-gray-600 line-clamp-2">
            {message.message}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <StatusPill status={message.status} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onView(message)}
              className="
                h-8 px-3 rounded-lg
                border border-gray-200
                bg-white
                hover:bg-gray-50
                text-sm font-medium inline-flex items-center gap-1
                transition-all duration-200
                hover:shadow-md hover:-translate-y-0.5
                active:translate-y-0
                text-gray-700 hover:text-blue-600
              "
              title="View Details"
            >
              <FiEye className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onReply(message)}
              className="
                h-8 px-3 rounded-lg
                border border-gray-200
                bg-white
                hover:bg-gray-50
                text-sm font-medium inline-flex items-center gap-1
                transition-all duration-200
                hover:shadow-md hover:-translate-y-0.5
                active:translate-y-0
                text-gray-700 hover:text-green-600
              "
              title="Reply"
            >
              <FiCornerUpLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(message._id)}
              className="
                h-8 px-3 rounded-lg
                border border-gray-200
                bg-white
                hover:bg-gray-50
                text-sm font-medium inline-flex items-center gap-1
                transition-all duration-200
                hover:shadow-md hover:-translate-y-0.5
                active:translate-y-0
                text-gray-700 hover:text-red-600
              "
              title="Delete"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminInbox() {
  const {
    messages,
    loading,
    stats,
    fetchMessages,
    fetchMessageStats,
    replyToMessage,
    updateMessageStatus,
    deleteMessage,
    deleteMultipleMessages,
  } = useMessageStore();

  const [selectedMessages, setSelectedMessages] = useState([]);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(null);
  const [filter, setFilter] = useState({ status: "", search: "", page: 1 });
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchMessages({ ...filter, limit: pageSize });
    fetchMessageStats();
  }, [filter, pageSize]);

  const handleReply = async (replyText) => {
    try {
      await replyToMessage(currentMessage._id, replyText);
      toast.success("Reply sent successfully!");
      setReplyModalOpen(false);
      setCurrentMessage(null);
      fetchMessages({ ...filter, limit: pageSize });
      fetchMessageStats();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleStatusChange = async (messageId, newStatus) => {
    try {
      await updateMessageStatus(messageId, newStatus);
      toast.success("Status updated");
      fetchMessages({ ...filter, limit: pageSize });
      fetchMessageStats();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteSingle = async (messageId) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteMessage(messageId);
        toast.success("Message deleted");
        setSelectedMessages(selectedMessages.filter((id) => id !== messageId));
        fetchMessages({ ...filter, limit: pageSize });
        fetchMessageStats();
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedMessages.length === 0) {
      toast.error("No messages selected");
      return;
    }

    if (
      window.confirm(
        `Delete ${selectedMessages.length} message(s)? This action cannot be undone.`,
      )
    ) {
      try {
        await deleteMultipleMessages(selectedMessages);
        toast.success(`${selectedMessages.length} message(s) deleted`);
        setSelectedMessages([]);
        fetchMessages({ ...filter, limit: pageSize });
        fetchMessageStats();
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const totalMessages = stats?.total || 0;
  const totalPages = Math.ceil(totalMessages / pageSize);

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
          <div className="text-xl font-bold text-gray-900">Inbox</div>
          <div className="text-sm text-gray-600">
            Manage customer messages and inquiries
          </div>
        </div>

        {selectedMessages.length > 0 && (
          <button
            onClick={handleDeleteMultiple}
            className="
              h-11 px-5 rounded-xl 
              bg-red-600 hover:bg-red-700
              text-white text-sm font-medium inline-flex items-center gap-2
              transition-all duration-200
              hover:shadow-lg hover:-translate-y-0.5
              active:translate-y-0
            "
          >
            <FiTrash2 className="w-4 h-4" />
            Delete Selected ({selectedMessages.length})
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all">
            <p className="text-sm text-gray-600">Total Messages</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all">
            <p className="text-sm text-gray-600">Unread</p>
            <p className="text-2xl font-bold text-red-600">{stats.unread}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all">
            <p className="text-sm text-gray-600">Read</p>
            <p className="text-2xl font-bold text-gray-600">{stats.read}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all">
            <p className="text-sm text-gray-600">Replied</p>
            <p className="text-2xl font-bold text-green-600">{stats.replied}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all">
            <p className="text-sm text-gray-600">Today</p>
            <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-blue-600/20 focus-within:border-blue-600 transition-all duration-200">
              <FiSearch className="text-gray-400 shrink-0" />
              <input
                value={filter.search}
                onChange={(e) => {
                  setFilter({ ...filter, search: e.target.value, page: 1 });
                }}
                className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
                placeholder="Search by name, email, subject..."
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <span className="text-sm text-gray-600 font-medium">Status</span>
            </div>
            <select
              value={filter.status}
              onChange={(e) => {
                setFilter({ ...filter, status: e.target.value, page: 1 });
              }}
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-gray-700 font-medium transition-all duration-200"
            >
              <option value="">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
            </select>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setFilter({ ...filter, page: 1 });
                }}
                className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 text-gray-700 font-medium"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Table - Desktop */}
      <div className="hidden lg:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedMessages.length === messages.length &&
                      messages.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMessages(messages.map((m) => m._id));
                      } else {
                        setSelectedMessages([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  From
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Subject
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-700">
                  Date
                </th>
                <th className="px-6 py-4 text-right font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-300 mb-3">
                      <FiMessageSquare className="w-12 h-12 mx-auto" />
                    </div>
                    <div className="text-gray-700 font-medium">
                      No messages found
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Try adjusting your search or filters
                    </div>
                  </td>
                </tr>
              ) : (
                messages.map((message) => (
                  <tr
                    key={message._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedMessages.includes(message._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMessages([
                              ...selectedMessages,
                              message._id,
                            ]);
                          } else {
                            setSelectedMessages(
                              selectedMessages.filter(
                                (id) => id !== message._id,
                              ),
                            );
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={message.status}
                        onChange={(e) =>
                          handleStatusChange(message._id, e.target.value)
                        }
                        className={`px-2 py-1 text-xs font-medium rounded-full border-0 focus:ring-0 cursor-pointer ${
                          STATUS_STYLES[message.status]
                        }`}
                      >
                        <option value="unread">Unread</option>
                        <option value="read">Read</option>
                        <option value="replied">Replied</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {message.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {message.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {message.subject}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {message.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {format(
                        new Date(message.createdAt),
                        "MMM dd, yyyy h:mm a",
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setCurrentMessage(message);
                            setViewModalOpen(true);
                          }}
                          className="h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-blue-600 transition-all"
                          title="View Details"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setCurrentMessage(message);
                            setReplyModalOpen(true);
                          }}
                          className="h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-green-600 transition-all"
                          title="Reply"
                        >
                          <FiCornerUpLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSingle(message._id)}
                          className="h-8 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-red-600 transition-all"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Messages Grid - Mobile */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center">
            <div className="text-gray-300 mb-3">
              <FiMessageSquare className="w-12 h-12 mx-auto" />
            </div>
            <div className="text-gray-700 font-medium">No messages found</div>
            <div className="text-sm text-gray-500 mt-1">
              Try adjusting your search or filters
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageCard
              key={message._id}
              message={message}
              onReply={() => {
                setCurrentMessage(message);
                setReplyModalOpen(true);
              }}
              onView={() => {
                setCurrentMessage(message);
                setViewModalOpen(true);
              }}
              onDelete={handleDeleteSingle}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalMessages > 0 && (
        <Pagination
          page={filter.page}
          totalPages={totalPages}
          setPage={(page) => setFilter({ ...filter, page })}
          total={totalMessages}
          pageSize={pageSize}
          color="blue"
        />
      )}

      {/* Modals */}
      <ReplyMessageModal
        open={replyModalOpen}
        message={currentMessage}
        onClose={() => {
          setReplyModalOpen(false);
          setCurrentMessage(null);
        }}
        onSend={handleReply}
      />

      <ViewMessageModal
        open={viewModalOpen}
        message={currentMessage}
        onClose={() => {
          setViewModalOpen(false);
          setCurrentMessage(null);
        }}
        onReply={() => {
          setViewModalOpen(false);
          setReplyModalOpen(true);
        }}
        onDelete={handleDeleteSingle}
      />
    </div>
  );
}
