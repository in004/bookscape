import { useState } from "react";

export default function StaffDialog({ open, onClose }) {
  const [email, setEmail] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!email) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users?email=${email}`);
      if (!res.ok) throw new Error("User(s) not found.");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userToUpdate) => {
    const role = userToUpdate.role;
    if (!userToUpdate || !role) return;
    setIsUpdating(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userToUpdate.email, role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update role.");
      }

      onClose();
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-serif font-semibold text-bookscape-dark mb-4">
          Manage Staff Role
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search User by Email
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Start typing an email..."
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (e.target.value.length >= 1) {
                    handleSearch();
                  }
                }}
                className="w-full px-4 py-2 border rounded-md text-black"
              />
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-4 py-2 bg-bookscape-gold text-black rounded-md hover:bg-amber-400 transition-colors"
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {users.length > 0 && (
            <div className="mt-4 space-y-4 max-h-80 overflow-y-auto">
              {users.map((user) => (
                <div key={user.email} className="p-3 border rounded-md bg-gray-50">
                  <p className="text-sm text-black mb-2">
                    <strong>Name:</strong> {user.name || "N/A"}<br />
                    <strong>Email:</strong> {user.email}
                  </p>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Change Role
                  </label>
                  <select
                    value={user.role || "client"}
                    onChange={(e) => {
                      const updatedUsers = users.map((u) =>
                        u.email === user.email ? { ...u, role: e.target.value } : u
                      );
                      setUsers(updatedUsers);
                    }}
                    className="w-full px-4 py-2 border rounded-md text-black"
                  >
                    <option value="client">Client</option>
                    <option value="admin">Admin</option>
                    <option value="courier">Courier</option>
                  </select>
                  <button
                    onClick={() => handleRoleChange(user)}
                    className="mt-2 w-full py-2 bg-bookscape-gold text-bookscape-dark rounded-md hover:bg-amber-400 transition-colors"
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Updating..." : "Update Role"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-amber-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
