import mongoose from "mongoose";

const BolchoTokenSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    value: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

BolchoTokenSchema.index({ name: 1 }, { unique: true });

export const BolchoToken =
  mongoose.models.BolchoToken || mongoose.model("BolchoToken", BolchoTokenSchema);


