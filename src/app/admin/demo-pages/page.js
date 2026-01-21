"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FormFieldBuilder from "@/components/FormFieldBuilder";
import { normalizeSlug } from "@/lib/slug";

export default function DemoPagesPage() {
  const [demoPages, setDemoPages] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [assistants, setAssistants] = useState([]);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    bolchoTokenId: "",
    assistantId: "",
    phoneNumberId: "",
    fields: [],
    callToFieldKey: "",
    variables: [], // [{ key, source: 'static'|'field', value }]
    passwordRequired: false,
    password: "",
    maxCalls: "",
    isActive: true,
  });
  const [error, setError] = useState("");

  const ensureUiIds = (fields) => {
    return (fields || []).map((f) => ({
      _uiId: f._uiId || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `ui_${Date.now()}_${Math.random().toString(16).slice(2)}`),
      ...f,
    }));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [pagesRes, tokensRes, assistantsRes, phoneRes] = await Promise.all([
        fetch("/api/admin/demo-pages"),
        fetch("/api/admin/tokens"),
        fetch("/api/admin/assistants"),
        fetch("/api/admin/phone-numbers"),
      ]);

      setDemoPages(await pagesRes.json());
      setTokens((await tokensRes.json()).filter((t) => t.isActive));
      setAssistants((await assistantsRes.json()).filter((a) => a.isActive));
      setPhoneNumbers((await phoneRes.json()).filter((p) => p.isActive));
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.slug || !formData.bolchoTokenId || !formData.assistantId || !formData.phoneNumberId) {
      setError("Please fill in all required fields");
      return;
    }

    if (formData.fields.length === 0) {
      setError("Please add at least one field");
      return;
    }

    if (!formData.callToFieldKey) {
      setError("Please select which field contains the phone number to call");
      return;
    }

    try {
      const url = editingId
        ? `/api/admin/demo-pages/${editingId}`
        : "/api/admin/demo-pages";
      const method = editingId ? "PUT" : "POST";

      const cleanedFields = (formData.fields || []).map((f) => {
        const base = {
          key: String(f.key || "").trim(),
          label: String(f.label || "").trim(),
          type: f.type || "text",
          placeholder: f.placeholder || "",
          required: !!f.required,
        };

        if (base.type === "select") {
          const optionsText =
            typeof f.optionsText === "string"
              ? f.optionsText
              : Array.isArray(f.options)
                ? f.options.join("\n")
                : "";
          const options = optionsText
            .split("\n")
            .map((o) => o.trim())
            .filter(Boolean);
          return { ...base, options };
        }

        return { ...base, options: [] };
      });

      const cleanedVariables = (formData.variables || [])
        .filter((v) => v && v.key && v.value)
        .map((v) => ({
          key: String(v.key).trim(),
          source: v.source === "field" ? "field" : "static",
          value: String(v.value).trim(),
        }))
        .filter((v) => v.key && v.value);

      const payload = {
        ...formData,
        fields: cleanedFields,
        variables: cleanedVariables,
        maxCalls: formData.maxCalls ? parseInt(formData.maxCalls) : null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save demo page");
        return;
      }

      resetForm();
      await fetchAll();
    } catch (err) {
      setError(`Error: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      slug: "",
      title: "",
      bolchoTokenId: "",
      assistantId: "",
      phoneNumberId: "",
      fields: [],
      callToFieldKey: "",
      variables: [],
      passwordRequired: false,
      password: "",
      maxCalls: "",
      isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (page) => {
    // Prefer new variables array; fall back to deprecated variableValues map
    let variables = Array.isArray(page.variables) ? page.variables : [];
    if ((!variables || variables.length === 0) && page.variableValues) {
      let legacy = {};
      if (page.variableValues instanceof Map) {
        legacy = Object.fromEntries(page.variableValues);
      } else if (typeof page.variableValues === "object") {
        legacy = page.variableValues;
      }
      variables = Object.entries(legacy).map(([k, fieldKey]) => ({
        key: k,
        source: "field",
        value: fieldKey,
      }));
    }

    setFormData({
      slug: page.slug,
      title: page.title || "",
      bolchoTokenId: page.bolchoTokenId._id || page.bolchoTokenId,
      assistantId: page.assistantId._id || page.assistantId,
      phoneNumberId: page.phoneNumberId._id || page.phoneNumberId,
      fields: ensureUiIds(page.fields || []),
      callToFieldKey: page.callToFieldKey || "",
      variables: variables || [],
      passwordRequired: page.passwordRequired || false,
      password: "", // Don't pre-fill password
      maxCalls: page.maxCalls || "",
      isActive: page.isActive !== undefined ? !!page.isActive : true,
    });
    setEditingId(page._id);
    setShowForm(true);
  };

  const handleAddVariable = () => {
    setFormData({
      ...formData,
      variables: [
        ...(formData.variables || []),
        { key: "", source: "static", value: "" },
      ],
    });
  };

  const handleRemoveVariable = (index) => {
    const next = (formData.variables || []).filter((_, i) => i !== index);
    setFormData({ ...formData, variables: next });
  };

  const handleVariableChange = (index, patch) => {
    const next = [...(formData.variables || [])];
    next[index] = { ...next[index], ...patch };
    // If switching to field source, clear value so user selects a field
    if (patch.source === "field") next[index].value = "";
    setFormData({ ...formData, variables: next });
  };

  const toggleActive = async (page) => {
    try {
      const res = await fetch(`/api/admin/demo-pages/${page._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !page.isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to update status");
        return;
      }
      await fetchAll();
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  const deleteDemoPage = async (page) => {
    const ok = confirm(
      `Delete demo page \"${page.slug}\"?\\n\\nThis cannot be undone.`,
    );
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/demo-pages/${page._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete demo page");
        return;
      }
      await fetchAll();
    } catch (err) {
      alert(err.message || "Failed to delete demo page");
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
            <h1 className="text-xl font-bold text-gray-900">Demo Pages</h1>
            <button
              onClick={() => {
                resetForm();
                setShowForm(!showForm);
              }}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {showForm ? "Cancel" : "Create Demo Page"}
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {showForm && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {editingId ? "Edit Demo Page" : "Create New Demo Page"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: normalizeSlug(e.target.value) })
                    }
                    required
                    placeholder="e.g., shinexperts"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    URL: /d/{formData.slug || "slug"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Demo Page Title"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bolcho Token <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.bolchoTokenId}
                    onChange={(e) => setFormData({ ...formData, bolchoTokenId: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  >
                    <option value="">Select token...</option>
                    {tokens.map((token) => (
                      <option key={token._id} value={token._id}>
                        {token.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Assistant <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.assistantId}
                    onChange={(e) => setFormData({ ...formData, assistantId: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  >
                    <option value="">Select assistant...</option>
                    {assistants.map((assistant) => (
                      <option key={assistant._id} value={assistant._id}>
                        {assistant.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.phoneNumberId}
                    onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  >
                    <option value="">Select phone number...</option>
                    {phoneNumbers.map((phone) => (
                      <option key={phone._id} value={phone._id}>
                        {phone.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <FormFieldBuilder
                fields={formData.fields}
                onFieldsChange={(newFields) =>
                  setFormData({ ...formData, fields: ensureUiIds(newFields) })
                }
                callToFieldKey={formData.callToFieldKey}
                onCallToFieldChange={(key) => setFormData({ ...formData, callToFieldKey: key })}
              />

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Variables (for call payload)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddVariable}
                    className="rounded-md bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-700"
                  >
                    + Add Variable
                  </button>
                </div>
                <p className="mb-4 text-xs text-gray-500">
                  These are sent to Bolcho as <code className="font-mono">variable_values</code>.
                  Each variable can be a fixed value, or it can use a value from a form field.
                </p>
                <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                  {(formData.variables || []).length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No variables yet. Click &quot;Add Variable&quot; to configure.
                    </p>
                  ) : (
                    (formData.variables || []).map((v, idx) => (
                      <div key={idx} className="grid gap-3 md:grid-cols-12 items-end">
                        <div className="md:col-span-4">
                          <label className="block text-xs font-medium text-gray-700">
                            Key (Bolcho variable name)
                          </label>
                          <input
                            type="text"
                            value={v.key || ""}
                            onChange={(e) =>
                              handleVariableChange(idx, { key: e.target.value })
                            }
                            placeholder="e.g., name, time"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-xs font-medium text-gray-700">
                            Value type
                          </label>
                          <select
                            value={v.source || "static"}
                            onChange={(e) =>
                              handleVariableChange(idx, { source: e.target.value })
                            }
                            className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm"
                          >
                            <option value="static">Static</option>
                            <option value="field">From form field</option>
                          </select>
                        </div>

                        <div className="md:col-span-4">
                          <label className="block text-xs font-medium text-gray-700">
                            Value
                          </label>
                          {v.source === "field" ? (
                            <select
                              value={v.value || ""}
                              onChange={(e) =>
                                handleVariableChange(idx, { value: e.target.value })
                              }
                              className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm"
                            >
                              <option value="">Select field...</option>
                              {formData.fields.map((field) => (
                                <option key={field.key} value={field.key}>
                                  {field.label} ({field.key})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={v.value || ""}
                              onChange={(e) =>
                                handleVariableChange(idx, { value: e.target.value })
                              }
                              placeholder="e.g., Good morning"
                              className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm"
                            />
                          )}
                        </div>

                        <div className="md:col-span-1">
                          <button
                            type="button"
                            onClick={() => handleRemoveVariable(idx)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.passwordRequired}
                      onChange={(e) =>
                        setFormData({ ...formData, passwordRequired: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Password Protect This Page
                    </span>
                  </label>
                  {formData.passwordRequired && (
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                      className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Max Calls (leave empty for unlimited)
                  </label>
                  <input
                    type="number"
                    value={formData.maxCalls}
                    onChange={(e) => setFormData({ ...formData, maxCalls: e.target.value })}
                    min="1"
                    placeholder="Unlimited"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={!!formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Active (clients can access this demo page)
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  If turned off, the client link will stop working immediately.
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                >
                  {editingId ? "Update Demo Page" : "Create Demo Page"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="rounded-lg bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              All Demo Pages ({demoPages.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Calls
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
                {demoPages.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No demo pages found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  demoPages.map((page) => (
                    <tr key={page._id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        <a
                          href={`/d/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`hover:text-blue-800 ${
                            page.isActive ? "text-blue-600" : "text-gray-400 line-through"
                          }`}
                        >
                          /d/{page.slug}
                        </a>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {page.title || "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {page.callsMade || 0}
                        {page.maxCalls ? ` / ${page.maxCalls}` : " / ∞"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            page.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {page.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <button
                          onClick={() => handleEdit(page)}
                          className="text-blue-600 hover:text-blue-800 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleActive(page)}
                          className="text-gray-700 hover:text-gray-900 mr-4"
                        >
                          {page.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => deleteDemoPage(page)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
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

