// components/UserLoginStats.jsx
import { useEffect, useState } from "react";
import { FiLock, FiUnlock, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import toast from "react-hot-toast";
import Loader from "./Loader";

const API_URL =
  import.meta.env.VITE_SERVER_URI || import.meta.env.VITE_SERVER_LOCAL;

export default function UserLoginStats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem("suva_admin_token");
      const res = await fetch(`${API_URL}/users/stats/login`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch login stats");

      const data = await res.json();
      setStats(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleUnlock = async (userId) => {
    if (!window.confirm("Are you sure you want to unlock this account?"))
      return;

    setLoading(true);
    try {
      const token = localStorage.getItem("suva_admin_token");
      const res = await fetch(`${API_URL}/users/${userId}/unlock`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to unlock account");

      toast.success("Account unlocked successfully");
      fetchStats();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const lockedUsers = stats.filter((user) => user.isLocked);
  const recentAttempts = stats.filter(
    (user) =>
      user.lastLoginAttempt &&
      new Date(user.lastLoginAttempt) >
        new Date(Date.now() - 24 * 60 * 60 * 1000),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Login Security</h3>
        <button
          onClick={fetchStats}
          disabled={refreshing}
          className="h-9 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm inline-flex items-center gap-2"
        >
          <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 text-red-600">
              <FiLock size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-900">
                {lockedUsers.length}
              </div>
              <div className="text-sm text-red-600">Locked Accounts</div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
              <FiAlertCircle size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-900">
                {recentAttempts.length}
              </div>
              <div className="text-sm text-amber-600">
                Recent Attempts (24h)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Locked Users Table */}
      {lockedUsers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-700">
              Locked Accounts
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Accounts locked due to failed login attempts
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-gray-600">
                    User
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-gray-600">
                    Login Attempts
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-gray-600">
                    Locked Until
                  </th>
                  <th className="px-5 py-3 text-left font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {lockedUsers.map((user) => {
                  const lockedUntil = user.lockUntil
                    ? new Date(user.lockUntil)
                    : null;
                  const timeRemaining = lockedUntil
                    ? Math.ceil((lockedUntil - Date.now()) / (60 * 1000))
                    : 0;

                  return (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <td className="px-5 py-3">
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.username}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-medium text-red-600">
                          {user.loginAttempts}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          attempts
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {lockedUntil ? (
                          <div>
                            <div className="text-gray-900">
                              {lockedUntil.toLocaleString()}
                            </div>
                            <div className="text-xs text-red-600">
                              {timeRemaining > 0
                                ? `${timeRemaining} minutes remaining`
                                : "Expired"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleUnlock(user._id)}
                          disabled={loading}
                          className="h-9 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm inline-flex items-center gap-2"
                        >
                          <FiUnlock size={14} />
                          Unlock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
