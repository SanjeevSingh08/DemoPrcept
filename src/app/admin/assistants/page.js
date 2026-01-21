"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AssistantsPage() {
  const [assistants, setAssistants] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [selectedTokenId, setSelectedTokenId] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAssistants();
    fetchTokens();
  }, []);

  const fetchAssistants = async () => {
    try {
      const res = await fetch("/api/admin/assistants");
      const data = await res.json();
      setAssistants(data);
    } catch (err) {
      console.error("Error fetching assistants:", err);
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
      const res = await fetch("/api/admin/assistants/sync", {
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
      await fetchAssistants();
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSyncing(false);
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
            <h1 className="text-xl font-bold text-gray-900">Assistants</h1>
            <div></div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Sync Assistants from Bolcho API
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

        <div className="rounded-lg bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              All Assistants ({assistants.length})
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
                    Assistant ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {assistants.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      No assistants found. Sync from Bolcho API to get started.
                    </td>
                  </tr>
                ) : (
                  assistants.map((assistant) => (
                    <tr key={assistant._id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {assistant.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {assistant.assistantId}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            assistant.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {assistant.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {new Date(assistant.createdAt).toLocaleDateString()}
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

