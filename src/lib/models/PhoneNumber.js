import mongoose from "mongoose";

const PhoneNumberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phoneNumberId: { type: String, required: true, trim: true },
    phoneNumber: { type: String, trim: true }, // optional display
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

PhoneNumberSchema.index({ phoneNumberId: 1 }, { unique: true });

export const PhoneNumber =
  mongoose.models.PhoneNumber || mongoose.model("PhoneNumber", PhoneNumberSchema);


