import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["discovery_session", "design_review", "technical_sync", "strategy_review", "delivery_review", "support_call"],
      default: "discovery_session"
    },
    status: {
      type: String,
      enum: ["requested", "confirmed", "completed", "cancelled"],
      default: "requested"
    },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    preferredDate: { type: Date },
    preferredTime: { type: String, default: "" },
    scheduledAt: { type: Date },
    duration: { type: Number, default: 45 },
    meetingLink: { type: String, default: "" },
    agenda: { type: String, default: "" },
    notes: { type: String, default: "" },
    participants: [
      {
        name: { type: String },
        email: { type: String },
        initials: { type: String }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Meeting", meetingSchema);
