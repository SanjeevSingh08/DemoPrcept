"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Demo by Prcept</h1>
            <button
              onClick={handleLogout}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/tokens"
            className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-gray-900">Bolcho Tokens</h2>
            <p className="mt-2 text-sm text-gray-600">Manage API tokens</p>
          </Link>

          <Link
            href="/admin/assistants"
            className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-gray-900">Assistants</h2>
            <p className="mt-2 text-sm text-gray-600">Manage voice assistants</p>
          </Link>

          <Link
            href="/admin/phone-numbers"
            className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-gray-900">Phone Numbers</h2>
            <p className="mt-2 text-sm text-gray-600">Manage phone numbers</p>
          </Link>

          <Link
            href="/admin/demo-pages"
            className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-gray-900">Demo Pages</h2>
            <p className="mt-2 text-sm text-gray-600">Create and manage demo pages</p>
          </Link>
        </div>
      </main>
    </div>
  );
}

