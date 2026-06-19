import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    name: { type: String, required: true, trim: true, index: true },
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    company: { type: String, trim: true, index: true, default: "" },
    projectName: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, index: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    designation: { type: String, trim: true, default: "" },
    department: { type: String, default: "" },
    linkedinUrl: { type: String, trim: true, default: "" },
    companyWebsite: { type: String, trim: true, default: "" },
    gstin: { type: String, trim: true, default: "" },
    billingAddress: {
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
      state: { type: String, default: "" },
      city: { type: String, default: "" },
      pincode: { type: String, default: "" }
    },
    notes: { type: String, default: "" },
    payment: {
      status: { type: String, enum: ["pending", "paid", "failed"], default: "pending", index: true },
      provider: { type: String, default: "razorpay" },
      invoiceId: { type: String, default: "" },
      razorpayOrderId: { type: String, default: "" },
      razorpayPaymentId: { type: String, default: "" },
      paidAt: { type: Date }
    },
    package: {
      id: { type: String, default: "" },
      name: { type: String, default: "" },
      price: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

export default mongoose.model("Contact", contactSchema);
