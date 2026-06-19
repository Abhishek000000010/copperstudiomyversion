import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    name: { type: String, required: true, trim: true, index: true },
    gstin: { type: String, trim: true, uppercase: true, index: true, default: "" },
    industry: { type: String, trim: true, default: "" },
    contact: { type: String, trim: true, default: "" },
    projects: { type: Number, default: 0 },
    status: { type: String, default: "Prospect", index: true },
    address: { type: String, default: "" },
    website: { type: String, default: "" },
    notes: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("Company", companySchema);
