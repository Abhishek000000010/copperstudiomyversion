import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    company: { type: String, trim: true, default: "" },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    jobTitle: { type: String, trim: true, default: "" },
    role: { type: String, enum: ["user", "superadmin"], default: "user" },
    passwordHash: { type: String, default: "" },
    status: {
      type: String,
      enum: ["invited", "active", "disabled"],
      default: "invited"
    },
    preferences: {
      language: { type: String, default: "en" },
      timezone: { type: String, default: "Asia/Kolkata" },
      notifications: {
        email: { type: Boolean, default: true },
        browser: { type: Boolean, default: false },
        weeklyReports: { type: Boolean, default: true },
        meetingReminders: { type: Boolean, default: true },
        billingAlerts: { type: Boolean, default: false }
      }
    },
    invite: {
      tokenHash: { type: String, default: "" },
      expiresAt: { type: Date },
      sentAt: { type: Date }
    },
    resetPassword: {
      otpHash: { type: String, default: "" },
      expiresAt: { type: Date },
      verifiedAt: { type: Date }
    },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
