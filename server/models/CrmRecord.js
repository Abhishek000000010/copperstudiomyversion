import mongoose from "mongoose";

const crmRecordSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["deals", "contacts", "companies", "tasks", "leads", "coupons"],
      required: true,
      index: true
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("CrmRecord", crmRecordSchema);
