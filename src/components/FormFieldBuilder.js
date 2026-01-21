"use client";

import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";

function genUiId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `ui_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function FieldCard({
  field,
  index,
  onUpdate,
  onRemove,
  callToFieldKey,
  onSetCallToField,
  dragHandleProps,
  draggableProps,
  innerRef,
  isDragging,
}) {
  return (
    <div
      ref={innerRef}
      {...draggableProps}
      className={`rounded-lg border-2 p-4 bg-white ${
        isDragging ? "border-blue-400 shadow-lg" : "border-gray-200"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
            title="Drag to reorder"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </button>
          <span className="text-sm font-semibold text-gray-700">
            Field {index + 1}: {field.label || "Untitled"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-600 hover:text-red-800 font-medium text-sm"
        >
          Remove
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Field Key <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={field.key || ""}
            onChange={(e) => onUpdate(index, { key: e.target.value })}
            required
            placeholder="e.g., name, email"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Label <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={field.label || ""}
            onChange={(e) => onUpdate(index, { label: e.target.value })}
            required
            placeholder="Display label"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
          <select
            value={field.type || "text"}
            onChange={(e) => onUpdate(index, { type: e.target.value })}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="text">Text</option>
            <option value="email">Email</option>
            <option value="tel">Phone</option>
            <option value="number">Number</option>
            <option value="select">Select Dropdown</option>
            <option value="textarea">Textarea</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Placeholder</label>
          <input
            type="text"
            value={field.placeholder || ""}
            onChange={(e) => onUpdate(index, { placeholder: e.target.value })}
            placeholder="Optional placeholder"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {field.type === "select" && (
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Options (one per line)
            </label>
            <textarea
              value={field.optionsText ?? field.options?.join("\n") ?? ""}
              onChange={(e) =>
                onUpdate(index, {
                  // Keep raw text while editing so Enter/newline works naturally.
                  // We'll sanitize into `options[]` on save.
                  optionsText: e.target.value,
                })
              }
              placeholder="Option 1&#10;Option 2&#10;Option 3"
              rows={4}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter each option on a new line. Example: Residential, Commercial, Industrial
            </p>
          </div>
        )}
        <div className="md:col-span-2 flex items-center gap-4 pt-2 border-t border-gray-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={field.required || false}
              onChange={(e) => onUpdate(index, { required: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Required field</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="callToField"
              checked={callToFieldKey === field.key}
              onChange={() => onSetCallToField(field.key)}
              className="text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Use this field for phone number to call</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default function FormFieldBuilder({ fields, onFieldsChange, callToFieldKey, onCallToFieldChange }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.index === destination.index) return;

    const next = Array.from(fields);
    const [moved] = next.splice(source.index, 1);
    next.splice(destination.index, 0, moved);
    onFieldsChange(next);
  };

  const handleAddField = () => {
    const newField = {
      _uiId: genUiId(),
      key: `field_${Date.now()}`,
      label: "",
      type: "text",
      placeholder: "",
      required: false,
      options: [],
    };
    onFieldsChange([...fields, newField]);
  };

  const handleUpdateField = (index, updates) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onFieldsChange(newFields);
  };

  const handleRemoveField = (index) => {
    const newFields = fields.filter((_, i) => i !== index);
    // Clear callToFieldKey if the removed field was selected
    if (callToFieldKey === fields[index].key) {
      onCallToFieldChange("");
    }
    onFieldsChange(newFields);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-semibold text-gray-900">
            Form Fields Builder <span className="text-red-500">*</span>
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Build your form by adding fields. Drag to reorder them.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddField}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Field
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">No fields yet. Click "Add Field" to get started.</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="fields">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-3"
              >
                {fields.map((field, index) => (
                  <Draggable key={field._uiId} draggableId={field._uiId} index={index}>
                    {(dragProvided, snapshot) => (
                      <FieldCard
                        field={field}
                        index={index}
                        onUpdate={handleUpdateField}
                        onRemove={handleRemoveField}
                        callToFieldKey={callToFieldKey}
                        onSetCallToField={onCallToFieldChange}
                        innerRef={dragProvided.innerRef}
                        draggableProps={dragProvided.draggableProps}
                        dragHandleProps={dragProvided.dragHandleProps}
                        isDragging={snapshot.isDragging}
                      />
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}

