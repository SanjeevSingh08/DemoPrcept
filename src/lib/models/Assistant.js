import mongoose from "mongoose";

const AssistantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    assistantId: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

AssistantSchema.index({ assistantId: 1 }, { unique: true });

export const Assistant =
  mongoose.models.Assistant || mongoose.model("Assistant", AssistantSchema);


