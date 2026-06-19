import mongoose from "mongoose";

const stageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    status: { type: String, enum: ["pending", "in_progress", "completed"], default: "pending" },
    startDate: { type: Date },
    endDate: { type: Date },
    notes: { type: String, default: "" },
    completedAt: { type: Date }
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Contact" },
    packageName: { type: String, default: "" },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "on_hold", "completed", "cancelled"],
      default: "not_started"
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    currentPhase: { type: String, default: "" },
    startDate: { type: Date },
    expectedEndDate: { type: Date },
    actualEndDate: { type: Date },
    stages: [stageSchema],
    adminNotes: { type: String, default: "" },
    deliverables: [{ type: String }],
    meetingLink: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("Project", projectSchema);
