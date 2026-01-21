import mongoose from "mongoose";

const DemoFieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["text", "select", "number", "email", "tel", "textarea"],
      default: "text",
    },
    placeholder: { type: String, trim: true },
    required: { type: Boolean, default: false },
    options: [{ type: String, trim: true }], // for select
  },
  { _id: false },
);

const DemoVariableSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true }, // Bolcho variable name
    source: { type: String, enum: ["static", "field"], default: "static" },
    value: { type: String, required: true, trim: true }, // static value OR form field key (when source=field)
  },
  { _id: false },
);

const DemoPageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, trim: true },
    title: { type: String, trim: true },

    bolchoTokenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BolchoToken",
      required: true,
    },
    assistantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assistant",
      required: true,
    },
    phoneNumberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhoneNumber",
      required: true,
    },

    fields: { type: [DemoFieldSchema], default: [] },
    callToFieldKey: { type: String, required: true, trim: true },

    // Variables passed to Bolcho as `variable_values`
    // - source=static => value is the literal value
    // - source=field  => value is a form field key to read from submitted form data
    variables: { type: [DemoVariableSchema], default: [] },

    // Deprecated (kept for backward compatibility with earlier builds):
    // Map of bolchoVarName -> formFieldKey
    variableValues: { type: Map, of: String, default: {} },

    passwordRequired: { type: Boolean, default: false },
    passwordHash: { type: String },

    maxCalls: { type: Number, default: null }, // null => unlimited
    callsMade: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

DemoPageSchema.index({ slug: 1 }, { unique: true });

export const DemoPage =
  mongoose.models.DemoPage || mongoose.model("DemoPage", DemoPageSchema);


