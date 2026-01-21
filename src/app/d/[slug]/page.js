"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function DemoPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug;

  const [demoPage, setDemoPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(null); // "success" | "error" | null

  useEffect(() => {
    fetchDemoPage();
  }, [slug]);

  const fetchDemoPage = async () => {
    try {
      const res = await fetch(`/api/demo/${slug}`, {
        credentials: "include", // Ensure cookies are sent
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setShowPasswordForm(true);
          setLoading(false);
          return;
        }
        setMessageType("error");
        setMessage(data.error || "Demo page not found");
        setLoading(false);
        return;
      }

      setDemoPage(data);
      // Initialize form data with empty values
      const initialData = {};
      data.fields.forEach((field) => {
        initialData[field.key] = "";
      });
      setFormData(initialData);
      setLoading(false);
    } catch (err) {
      setMessageType("error");
      setMessage(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType(null);
    try {
      const res = await fetch(`/api/demo/${slug}/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include", // Ensure cookies are sent
      });

      const data = await res.json();

      if (!res.ok) {
        setMessageType("error");
        setMessage(data.error || "Invalid password");
        return;
      }

      // Password verified, clear password and fetch the demo page
      setPassword("");
      setMessage("");
      setShowPasswordForm(false);
      await fetchDemoPage();
    } catch (err) {
      setMessageType("error");
      setMessage(`Error: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setMessageType(null);

    try {
      const res = await fetch(`/api/demo/${slug}/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessageType("error");
        setMessage(data.error || "Failed to initiate call");
        setSubmitting(false);
        return;
      }

      setMessageType("success");
      setMessage("Call initiated successfully! You should receive a call shortly.");
      // Auto-dismiss success immediately (short delay so user can notice)
      setTimeout(() => {
        setMessage("");
        setMessageType(null);
      }, 1200);
      // Reset form
      const resetData = {};
      demoPage.fields.forEach((field) => {
        resetData[field.key] = "";
      });
      setFormData(resetData);
      setSubmitting(false);
    } catch (err) {
      setMessageType("error");
      setMessage(`Error: ${err.message}`);
      setSubmitting(false);
    }
  };

  const handleFieldChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
    // Remove success banner instantly when user interacts again
    if (messageType === "success") {
      setMessage("");
      setMessageType(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-400 border-r-transparent"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (showPasswordForm) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <svg
                className="h-8 w-8 text-slate-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {demoPage?.title || "Demo Page"}
            </h1>
            <p className="mt-2 text-sm text-gray-600">This page is password protected.</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                    className="block w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 shadow-sm transition-all focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                  placeholder="Enter your password"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            {message && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {message}
              </div>
            )}
            <button
              type="submit"
                className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:bg-slate-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!demoPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold text-red-600">{message || "Demo page not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header Card */}
        <div className="mb-8 rounded-2xl bg-white p-8 text-slate-900 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-bold tracking-tight">
            {demoPage.title || "ShineXperts Calling Agent"}
          </h1>
          <p className="mt-2 text-slate-600">
            Fill out the form below to get started with your demo call
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {demoPage.fields.map((field) => (
                <div
                  key={field.key}
                  className={field.type === "textarea" ? "md:col-span-2" : ""}
                >
                  <label
                    htmlFor={field.key}
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    {field.label}
                    {field.required && <span className="ml-1 text-red-500">*</span>}
                  </label>
                  {field.type === "select" ? (
                    <div className="relative">
                      <select
                        id={field.key}
                        value={formData[field.key] || ""}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        required={field.required}
                        className="block w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 py-3 pr-10 shadow-sm transition-all focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                      >
                        <option value="">Select {field.label}</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                  ) : field.type === "textarea" ? (
                    <textarea
                      id={field.key}
                      value={formData[field.key] || ""}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      required={field.required}
                      placeholder={field.placeholder}
                      rows={4}
                      className="block w-full rounded-lg border border-slate-300 px-4 py-3 shadow-sm transition-all focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                    />
                  ) : (
                    <input
                      id={field.key}
                      type={field.type}
                      value={formData[field.key] || ""}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      required={field.required}
                      placeholder={field.placeholder}
                      className="block w-full rounded-lg border border-slate-300 px-4 py-3 shadow-sm transition-all focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                    />
                  )}
                </div>
              ))}
            </div>

            {message && (
              <div
                className={`rounded-lg border p-4 text-sm ${
                  messageType === "error"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-emerald-200 bg-emerald-50 text-emerald-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  {messageType === "error" ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                  <span>{message}</span>
                </div>
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-slate-900 px-6 py-4 font-semibold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-5 w-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

