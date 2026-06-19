import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    fileType: { type: String, default: "pdf" },
    fileSize: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending_review", "approved", "final_delivery", "internal"],
      default: "pending_review"
    },
    scope: {
      type: String,
      enum: ["client_shared", "internal"],
      default: "client_shared"
    },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    uploadedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    uploadedByName: { type: String, default: "The Copper Studio" },
    version: { type: String, default: "1.0" },
    notes: { type: String, default: "" },
    feedback: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: { type: String },
        comment: { type: String },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
