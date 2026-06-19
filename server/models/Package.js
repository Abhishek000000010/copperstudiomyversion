import mongoose from "mongoose";

const packageSchema = new mongoose.Schema(
  {
    customId: {
      type: String,
      required: true,
      unique: true,
      description: "String ID like 'starter', 'growth', 'enterprise' for backwards compatibility"
    },
    name: {
      type: String,
      required: true
    },
    label: {
      type: String,
      default: ""
    },
    price: {
      type: Number,
      required: true
    },
    duration: {
      type: String,
      default: ""
    },
    includes: {
      type: [String],
      default: []
    },
    addons: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Package", packageSchema);
