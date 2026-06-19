import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    title: { type: String, required: true, trim: true, index: true },
    project: { type: String, trim: true, index: true, default: "" },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true },
    status: { type: String, default: "pending", index: true },
    priority: { type: String, default: "Medium", index: true },
    assignee: { type: String, default: "A" },
    deadline: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    description: { type: String, default: "" },
    clientVisible: { type: Boolean, default: false, index: true },
    internalNotes: { type: String, default: "" },
    subtasks: { type: Number, default: 0 },
    comments: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
