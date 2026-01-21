"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PhoneNumbersPage() {
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [selectedTokenId, setSelectedTokenId] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", phoneNumberId: "", phoneNumber: "" });
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPhoneNumbers();
    fetchTokens();
  }, []);

  const fetchPhoneNumbers = async () => {
    try {
      const res = await fetch("/api/admin/phone-numbers");
      const data = await res.json();
      setPhoneNumbers(data);
    } catch (err) {
      console.error("Error fetching phone numbers:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTokens = async () => {
    try {
      const res = await fetch("/api/admin/tokens");
      const data = await res.json();
      setTokens(data.filter((t) => t.isActive));
      if (data.length > 0 && !selectedTokenId) {
        setSelectedTokenId(data[0]._id);
      }
    } catch (err) {
      console.error("Error fetching tokens:", err);
    }
  };

  const handleSync = async () => {
    if (!selectedTokenId) {
      setMessage("Please select a token first");
      return;
    }

    setSyncing(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/phone-numbers/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: selectedTokenId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(`Error: ${data.error || "Failed to sync"}`);
        setSyncing(false);
        return;
      }

      setMessage(
        `Success! Created: ${data.results.created}, Updated: ${data.results.updated}`,
      );
      await fetchPhoneNumbers();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/admin/phone-numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create phone number");
        return;
      }

      setFormData({ name: "", phoneNumberId: "", phoneNumber: "" });
      setShowForm(false);
      await fetchPhoneNumbers();
    } catch (err) {
      setError(`Error: ${err.message}`);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await fetch(`/api/admin/phone-numbers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      await fetchPhoneNumbers();
    } catch (err) {
      console.error("Error updating phone number:", err);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/admin" className="text-xl font-bold text-gray-900">
              ← Admin Dashboard
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Phone Numbers</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {showForm ? "Cancel" : "Add Phone Number"}
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Sync Phone Numbers from Bolcho API
          </h2>
          <div className="flex gap-4">
            <select
              value={selectedTokenId}
              onChange={(e) => setSelectedTokenId(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">Select a token...</option>
              {tokens.map((token) => (
                <option key={token._id} value={token._id}>
                  {token.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleSync}
              disabled={syncing || !selectedTokenId}
              className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {syncing ? "Syncing..." : "Refetch from Bolcho API"}
            </button>
          </div>
          {message && (
            <div
              className={`mt-4 rounded-md p-3 text-sm ${
                message.startsWith("Error")
                  ? "bg-red-50 text-red-800"
                  : "bg-green-50 text-green-800"
              }`}
            >
              {message}
            </div>
          )}
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Add New Phone Number</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number ID</label>
                <input
                  type="text"
                  value={formData.phoneNumberId}
                  onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number (Display, Optional)
                </label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
              )}
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
              >
                Create Phone Number
              </button>
            </form>
          </div>
        )}

        <div className="rounded-lg bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              All Phone Numbers ({phoneNumbers.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Phone Number ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {phoneNumbers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No phone numbers found. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  phoneNumbers.map((phone) => (
                    <tr key={phone._id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {phone.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {phone.phoneNumberId}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {phone.phoneNumber || "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            phone.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {phone.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <button
                          onClick={() => toggleActive(phone._id, phone.isActive)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {phone.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

