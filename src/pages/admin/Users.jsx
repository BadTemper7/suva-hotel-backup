// src/pages/admin/Users.jsx
import { useEffect, useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiSearch, FiTrash2, FiFilter } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

import Loader from "../../components/layout/Loader.jsx";
import UserModal from "../../components/modals/UserModal.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import { useUserStore } from "../../stores/userStore.js";
import { getUserRole } from "../../app/auth.js";

const ROLES = ["admin", "receptionist"];

const STATUS_STYLES = {
  active: "bg-[#00af00]/10 text-[#00af00]",
  inactive: "bg-gray-100 text-gray-700",
};

function normalizeStatus(value) {
  const raw = String(value ?? "")
    .toLowerCase()
    .trim();
  if (raw === "inactive") return "inactive";
  return "active";
}

function StatusPill({ value }) {
  const v = normalizeStatus(value);
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${STATUS_STYLES[v]}`}
    >
      {v === "inactive" ? "Inactive" : "Active"}
    </span>
  );
}

function UserCard({ user, onEdit, selected, onSelect }) {
  return (
    <div
      className="
      rounded-xl border border-gray-200 
      bg-white
      p-4 flex items-start gap-4
      shadow-sm hover:shadow-md transition-all duration-300
      hover:-translate-y-0.5
    "
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onSelect(user._id)}
        className="
          mt-1 h-5 w-5 rounded border-gray-300 
          text-[#0c2bfc] focus:ring-[#0c2bfc]/20
        "
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="text-sm font-semibold text-gray-900 truncate">
            {user.firstName} {user.lastName}
          </div>
          <span
            className="
            px-2.5 py-0.5 rounded-full text-xs font-medium
            bg-[#0c2bfc]/10 text-[#0c2bfc]
          "
          >
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
        </div>
        <div className="mt-2 text-sm text-gray-600">{user.email}</div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-gray-600">
            <svg
              className="w-4 h-4 text-[#0c2bfc]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="font-medium">{user.username}</span>
          </div>
        </div>
        <div className="mt-3">
          <StatusPill value={user.status} />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onEdit(user)}
        className="
          h-10 px-4 rounded-xl 
          border border-gray-200 
          bg-white
          hover:bg-gray-50
          text-sm font-medium inline-flex items-center gap-2
          transition-all duration-200
          hover:shadow-md hover:-translate-y-0.5
          active:translate-y-0
          text-gray-700 hover:text-[#0c2bfc]
        "
      >
        <FiEdit2 className="w-4 h-4" /> Edit
      </button>
    </div>
  );
}

export default function Users() {
  const users = useUserStore((state) => state.users);
  const fetchUsers = useUserStore((state) => state.fetchUsers);
  const createUser = useUserStore((state) => state.createUser);
  const updateUser = useUserStore((state) => state.updateUser);
  const deleteManyUsers = useUserStore((state) => state.deleteManyUsers);
  const loading = useUserStore((state) => state.loading);

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState({ open: false, mode: "add", user: null });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedUsers, setSelectedUsers] = useState([]);

  const role = getUserRole();
  const isAdmin = role === "admin" || role === "superadmin";

  useEffect(() => {
    fetchUsers().catch((err) =>
      toast.error(err.message || "Failed to fetch users"),
    );
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;

      const status = normalizeStatus(u.status);
      if (statusFilter !== "all" && status !== statusFilter) return false;

      if (!s) return true;
      const name = `${u.firstName} ${u.lastName}`.toLowerCase();
      return (
        name.includes(s) ||
        u.username.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        u.role.toLowerCase().includes(s)
      );
    });
  }, [users, q, roleFilter, statusFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openAdd = () => setModal({ open: true, mode: "add", user: null });
  const openEdit = (user) => setModal({ open: true, mode: "edit", user });
  const closeModal = () => setModal({ open: false, mode: "add", user: null });

  const saveUser = async (payload) => {
    const normalizedStatus = normalizeStatus(payload.status);
    try {
      if (modal.mode === "add") {
        await createUser({ ...payload, status: normalizedStatus });
        toast.success("User created successfully");
      } else {
        await updateUser(payload._id, {
          ...payload,
          status: normalizedStatus,
        });
        toast.success("User updated successfully");
      }
      closeModal();
    } catch (err) {
      toast.error(err.message || "Failed to save user");
    }
  };

  const toggleSelectUser = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === paged.length) setSelectedUsers([]);
    else setSelectedUsers(paged.map((u) => u._id));
  };

  const handleDeleteSelected = async () => {
    if (selectedUsers.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedUsers.length} user(s)?`,
      )
    )
      return;

    try {
      await deleteManyUsers(selectedUsers);
      toast.success(`${selectedUsers.length} user(s) deleted successfully`);
      setSelectedUsers([]);
    } catch (err) {
      toast.error(err.message || "Failed to delete selected users");
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-6">
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
          <div className="text-xl font-bold text-gray-900">User Management</div>
          <div className="text-sm text-gray-600">
            Manage user accounts, roles, and permissions
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && selectedUsers.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={loading}
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
              <FiTrash2 className="w-4 h-4" />
              Delete ({selectedUsers.length})
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={openAdd}
              className="
                h-11 px-5 rounded-xl 
                bg-[#0c2bfc] 
                hover:bg-[#0a24d6]
                text-white text-sm font-medium inline-flex items-center gap-2
                transition-all duration-200
                hover:shadow-lg hover:-translate-y-0.5
                active:translate-y-0
              "
            >
              <FiPlus className="w-4 h-4" /> Add User
            </button>
          )}
        </div>
      </div>

      {/* Search + Filter */}
      <div
        className="
        rounded-xl border border-gray-200 
        bg-white
        p-4 shadow-sm
      "
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <form onSubmit={(e) => e.preventDefault()}>
              <div
                className="
                flex items-center gap-2 rounded-xl 
                border border-gray-200 
                bg-white px-4 py-3
                focus-within:ring-2 focus-within:ring-[#0c2bfc]/20
                focus-within:border-[#0c2bfc] transition-all duration-200
              "
              >
                <FiSearch className="text-gray-400 shrink-0" />
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  className="
                    w-full bg-transparent outline-none 
                    text-sm text-gray-800 placeholder-gray-400
                  "
                  placeholder="Search name, username, email, role…"
                />
              </div>
            </form>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <span className="text-sm text-gray-600 font-medium">Filters</span>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="
                h-11 rounded-xl border border-gray-200 
                bg-white px-4 text-sm outline-none 
                focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
                text-gray-700 font-medium
                transition-all duration-200
              "
            >
              <option value="all">All Roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="
                h-11 rounded-xl border border-gray-200 
                bg-white px-4 text-sm outline-none 
                focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
                text-gray-700 font-medium
                transition-all duration-200
              "
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile list */}
      <div className="md:hidden space-y-3">
        {paged.map((u) => (
          <UserCard
            key={u._id}
            user={u}
            onEdit={openEdit}
            selected={selectedUsers.includes(u._id)}
            onSelect={toggleSelectUser}
          />
        ))}
        {paged.length === 0 && (
          <div
            className="
            rounded-xl border border-gray-200 
            bg-white
            px-6 py-12 text-center
          "
          >
            <div className="text-gray-300 mb-3">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 7.5a2.5 2.5 0 01-2.5 2.5H7A2.5 2.5 0 014.5 18v-1A2.5 2.5 0 017 14.5h9a2.5 2.5 0 012.5 2.5v1z"
                />
              </svg>
            </div>
            <div className="text-gray-700 font-medium">No users found</div>
            <div className="text-sm text-gray-500 mt-1">
              Try adjusting your search or filters
            </div>
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div
        className="
        flex-1 min-h-0 hidden md:flex flex-col 
        bg-white
        border border-gray-200 rounded-xl 
        overflow-hidden shadow-sm
      "
      >
        <div
          className="
          px-6 py-4 border-b border-gray-200 
          flex items-center justify-between gap-3
          bg-gray-50
        "
        >
          <div className="flex items-center gap-3">
            {isAdmin && (
              <input
                type="checkbox"
                checked={
                  selectedUsers.length === paged.length && paged.length > 0
                }
                onChange={toggleSelectAll}
                className="
                  h-5 w-5 rounded border-gray-300 
                  text-[#0c2bfc] focus:ring-[#0c2bfc]/20
                "
              />
            )}
            <div className="text-sm font-semibold text-gray-900">
              User Accounts ({total})
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="
                  h-10 rounded-xl border border-gray-200 
                  bg-white px-3 text-sm outline-none 
                  focus:ring-2 focus:ring-[#0c2bfc]/20 focus:border-[#0c2bfc]
                  text-gray-700 font-medium
                "
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

        <div className="flex-1 min-h-0 overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {isAdmin && (
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedUsers.length === paged.length &&
                        paged.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="h-5 w-5 rounded border-gray-300 text-[#0c2bfc] focus:ring-[#0c2bfc]/20"
                    />
                  </th>
                )}
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Name
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Username
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Email
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Role
                </th>
                <th className="text-left font-semibold text-gray-700 px-6 py-4">
                  Status
                </th>
                {isAdmin && (
                  <th className="text-right font-semibold text-gray-700 px-6 py-4">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody>
              {paged.map((u) => (
                <tr
                  key={u._id}
                  className="
                    border-b border-gray-100 last:border-b-0
                    hover:bg-gray-50
                    transition-colors duration-150
                  "
                >
                  {isAdmin && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(u._id)}
                        onChange={() => toggleSelectUser(u._id)}
                        className="
                          h-5 w-5 rounded border-gray-300 
                          text-[#0c2bfc] focus:ring-[#0c2bfc]/20
                        "
                      />
                    </td>
                  )}

                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">
                      {u.firstName} {u.lastName}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700 font-medium">
                        {u.username}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="text-gray-600">{u.email}</div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="
                        px-3 py-1.5 rounded-full 
                        bg-[#0c2bfc]/10
                        text-[#0c2bfc] text-xs font-medium
                      "
                      >
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <StatusPill value={u.status} />
                  </td>

                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="
                          h-10 px-4 rounded-xl 
                          border border-gray-200 
                          bg-white
                          hover:bg-gray-50
                          text-sm font-medium inline-flex items-center gap-2
                          transition-all duration-200
                          hover:shadow-md hover:-translate-y-0.5
                          active:translate-y-0
                          text-gray-700 hover:text-[#0c2bfc]
                        "
                      >
                        <FiEdit2 className="w-4 h-4" /> Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {paged.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 7 : 6}
                    className="px-6 py-16 text-center"
                  >
                    <div className="text-gray-300 mb-3">
                      <svg
                        className="w-16 h-16 mx-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 7.5a2.5 2.5 0 01-2.5 2.5H7A2.5 2.5 0 014.5 18v-1A2.5 2.5 0 017 14.5h9a2.5 2.5 0 012.5 2.5v1z"
                        />
                      </svg>
                    </div>
                    <div className="text-gray-700 font-medium text-lg">
                      No users found
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Try adjusting your search criteria or add a new user
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination using the enhanced component */}
      <Pagination
        page={page}
        totalPages={totalPages}
        setPage={setPage}
        total={total}
        pageSize={pageSize}
        color="blue"
      />

      {/* Modal */}
      {modal.open && (
        <UserModal
          open={modal.open}
          mode={modal.mode}
          user={modal.user}
          onClose={closeModal}
          onSave={saveUser}
        />
      )}

      {/* Loader overlay */}
      {loading && (
        <div
          className="
          absolute inset-0 z-50 flex items-center justify-center 
          bg-white/90 backdrop-blur-sm
        "
        >
          <Loader
            size={60}
            variant="primary"
            showText={true}
            text="Loading users..."
          />
        </div>
      )}
    </div>
  );
}
