import "dotenv/config";
import cors from "cors";
import crypto from "node:crypto";
import dns from "node:dns";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import User from "./models/User.js";
import Company from "./models/Company.js";
import Contact from "./models/Contact.js";
import Coupon from "./models/Coupon.js";
import Project from "./models/Project.js";
import Task from "./models/Task.js";
import authRoutes from "./routes/auth.js";
import crmRoutes from "./routes/crm.js";
import clientRoutes from "./routes/client.js";
import adminRoutes from "./routes/admin.js";
import Package from "./models/Package.js";
import { sendPortalInviteEmail } from "./services/email.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();
const port = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, "..");
const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      })
    : null;

app.use(cors({ origin: true }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/crm", crmRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/admin", adminRoutes);

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function createPortalInvite(contact) {
  if (contact.payment.status !== "paid") return null;

  let companyId = null;
  const companyName = (contact.company || "").trim();
  if (companyName) {
    const companyRecord = await Company.findOneAndUpdate(
      { name: { $regex: new RegExp(`^${companyName}$`, "i") } },
      { 
        $setOnInsert: { 
          name: companyName, 
          id: `COMP-${Date.now()}`,
          status: "Prospect"
        } 
      },
      { upsert: true, new: true }
    );
    companyId = companyRecord._id;
  }

  // Check if user already exists and has a password
  const existingUser = await User.findOne({ email: contact.email.toLowerCase() });
  const hasAccount = existingUser && existingUser.passwordHash;

  let user;
  let rawToken = "";
  let expiresAt = null;

  if (hasAccount) {
    // Existing user: update name/phone/company but do not alter password or status
    user = await User.findOneAndUpdate(
      { email: contact.email.toLowerCase() },
      {
        $set: {
          name: contact.name,
          phone: contact.phone,
          company: contact.company || "",
          ...(companyId && { companyId }),
        }
      },
      { new: true }
    );
  } else {
    // New user: create/invite
    rawToken = crypto.randomBytes(32).toString("hex");
    expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    user = await User.findOneAndUpdate(
      { email: contact.email.toLowerCase() },
      {
        $set: {
          name: contact.name,
          email: contact.email,
          phone: contact.phone,
          company: contact.company || "",
          ...(companyId && { companyId }),
          role: "user",
          status: "invited",
          invite: {
            tokenHash: sha256(rawToken),
            expiresAt,
            sentAt: new Date()
          }
        },
        $setOnInsert: { passwordHash: "" }
      },
      { upsert: true, new: true }
    );
  }

  // Automatically create a default Project for this package purchase
  const project = await Project.create({
    name: contact.projectName ? `${contact.projectName} (${contact.package?.name})` : `${contact.package?.name || "Service Project"} - ${contact.company || contact.name}`,
    description: `Workspace for executing the ${contact.package?.name || "purchased"} package.`,
    clientId: user._id,
    orderId: contact._id,
    packageName: contact.package?.name || "",
    status: "in_progress",
    progress: 0,
    startDate: new Date()
  });

  const defaultStages = [
    { name: "Onboarding & Discovery", status: "in_progress", startDate: new Date() },
    { name: "Design Phase", status: "pending" },
    { name: "Development Phase", status: "pending" },
    { name: "Review & Refinement", status: "pending" },
    { name: "Final Delivery & Launch", status: "pending" }
  ];

  for (const stage of defaultStages) {
    await Task.create({
      id: `TASK-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: stage.name,
      project: project.name,
      projectId: project._id,
      status: stage.status,
      startDate: stage.startDate ? stage.startDate.toISOString() : "",
      endDate: "",
      description: "",
      clientVisible: true,
      internalNotes: "",
      priority: "Medium",
      assignee: "A"
    });
  }

  const crmUrl = process.env.CRM_PUBLIC_URL || "http://localhost:5173";
  const setPasswordUrl = hasAccount 
    ? `${crmUrl}/login`
    : `${crmUrl}/client-secure-onboarding/access-setup?token=${rawToken}`;

  await sendPortalInviteEmail({
    to: user.email,
    name: user.name,
    packageName: contact.package?.name || "",
    setPasswordUrl
  });

  return { userId: user._id, setPasswordUrl };
}

function computeCouponDiscount(coupon, packagePrice) {
  if (!coupon) return 0;
  const numericAmount = Number(String(coupon.amount || "").replace(/[^\d.]/g, "")) || 0;
  if (coupon.amountType === "fixed") return Math.min(packagePrice, numericAmount);
  return Math.min(packagePrice, Math.round((packagePrice * numericAmount) / 100));
}

function couponExpiryDate(coupon) {
  if (coupon.validUntil) return new Date(coupon.validUntil);
  if (!coupon.validity) return null;
  const parsed = new Date(coupon.validity);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function validateCouponForPackage(code, selectedPackage) {
  if (!code) return { coupon: null, discount: 0, subtotal: selectedPackage.price, total: Math.round(selectedPackage.price * 1.18) };

  const coupon = await Coupon.findOne({ code: String(code).trim().toUpperCase() });
  if (!coupon) {
    const error = new Error("Coupon code not found.");
    error.statusCode = 404;
    throw error;
  }

  const expiryDate = couponExpiryDate(coupon);
  if (expiryDate && expiryDate <= new Date() && ["Active", "Applied", "Not used"].includes(coupon.status)) {
    coupon.status = "Expired";
    await coupon.save();
  }

  if (!["Active", "Not used"].includes(coupon.status)) {
    const error = new Error(`Coupon is ${coupon.status.toLowerCase()} and cannot be applied.`);
    error.statusCode = 400;
    throw error;
  }

  const discount = computeCouponDiscount(coupon, selectedPackage.price);
  const subtotal = Math.max(0, selectedPackage.price - discount);
  const total = Math.round(subtotal * 1.18);

  return {
    coupon,
    discount,
    subtotal,
    total
  };
}

app.get("/api", (_req, res) => {
  res.json({
    ok: true,
    service: "the-copper-studio-api",
    routes: {
      health: "/api/health",
      packages: "/api/packages",
      pricing: "/pricing",
      checkout: "/checkout",
      razorpayConfig: "/api/razorpay/config",
      latestOrder: "/api/orders/latest"
    }
  });
});

async function getPackage(id) {
  if (!id) return null;
  let pkg = await Package.findOne({ customId: id });
  if (!pkg && mongoose.Types.ObjectId.isValid(id)) {
    pkg = await Package.findById(id);
  }
  return pkg ? { id: pkg.customId || pkg._id.toString(), name: pkg.name, price: pkg.price } : null;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "the-copper-studio-api" });
});

app.get("/api/packages", async (_req, res, next) => {
  try {
    const pkgs = await Package.find({});
    res.json(pkgs);
  } catch (err) {
    next(err);
  }
});

app.post("/api/coupons/validate", async (req, res, next) => {
  try {
    const { code, selectedPackageId } = req.body;
    if (!code) return res.status(400).json({ message: "Coupon code is required." });
    const selectedPackage = await getPackage(selectedPackageId);
    if (!selectedPackage) return res.status(400).json({ message: "Invalid package selected." });

    const result = await validateCouponForPackage(code, selectedPackage);
    res.json({
      code: result.coupon.code,
      amount: result.coupon.amount,
      amountType: result.coupon.amountType,
      status: result.coupon.status,
      validUntil: result.coupon.validUntil,
      discount: result.discount,
      subtotal: result.subtotal,
      gst: Math.round(result.subtotal * 0.18),
      total: result.total,
      packageName: selectedPackage.name
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/razorpay/config", (_req, res) => {
  if (!process.env.RAZORPAY_KEY_ID) {
    return res.status(503).json({ message: "Razorpay key id is not configured." });
  }

  res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

app.post("/api/razorpay/order", async (req, res, next) => {
  try {
    if (!razorpay) {
      return res.status(503).json({ message: "Razorpay credentials are not configured." });
    }

    const { selectedPackageId, couponCode } = req.body;
    const selectedPackage = await getPackage(selectedPackageId);
    if (!selectedPackage) return res.status(400).json({ message: "Invalid package selected." });

    const couponResult = await validateCouponForPackage(couponCode, selectedPackage);
    const total = couponResult.total;
    const razorpayOrder = await razorpay.orders.create({
      amount: total * 100,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: {
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        couponCode: couponResult.coupon?.code || "",
        couponDiscount: String(couponResult.discount)
      }
    });

    res.status(201).json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      package: selectedPackage,
      coupon: couponResult.coupon ? {
        code: couponResult.coupon.code,
        amount: couponResult.coupon.amount,
        amountType: couponResult.coupon.amountType,
        discount: couponResult.discount
      } : null,
      subtotal: couponResult.subtotal,
      gst: Math.round(couponResult.subtotal * 0.18),
      total
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/razorpay/verify", async (req, res, next) => {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ message: "Razorpay secret is not configured." });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      selectedPackageId,
      couponCode,
      customer,
      verified
    } = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid Razorpay payment signature." });
    }

    const selectedPackage = await getPackage(selectedPackageId);
    if (!selectedPackage) return res.status(400).json({ message: "Invalid package selected." });

    if (!customer?.customerFirstName || !customer?.customerLastName || !customer?.customerPhone || !customer?.customerEmail) {
      return res.status(400).json({ message: "Customer first name, last name, phone, and email are required." });
    }

    if (!verified?.phone || !verified?.email) {
      return res.status(400).json({ message: "Mobile and email must be verified before order creation." });
    }

    const couponResult = await validateCouponForPackage(couponCode, selectedPackage);
    const total = couponResult.total;

    let contact = await Contact.findOne({ email: customer.customerEmail.trim().toLowerCase(), "payment.status": "pending" });
    const contactData = {
      id: contact?.id || `CONT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `${customer.customerFirstName} ${customer.customerLastName}`.trim(),
      firstName: customer.customerFirstName,
      lastName: customer.customerLastName,
      email: customer.customerEmail.trim().toLowerCase(),
      phone: customer.customerPhone,
      company: customer.customerCompany || "",
      projectName: customer.projectName || "",
      linkedinUrl: customer.linkedinUrl || "",
      companyWebsite: customer.companyWebsite || "",
      gstin: customer.gstin || "",
      billingAddress: {
        line1: customer.billingAddressLine1 || "",
        line2: customer.billingAddressLine2 || "",
        state: customer.billingAddressState || "",
        city: customer.billingAddressCity || "",
        pincode: customer.billingAddressPincode || ""
      },
      designation: "Client",
      payment: {
        status: "paid",
        provider: "razorpay",
        invoiceId: contact?.payment?.invoiceId || `INV-${Date.now().toString().slice(-6)}`,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        paidAt: new Date()
      },
      package: {
        id: selectedPackage.id,
        name: selectedPackage.name,
        price: selectedPackage.price,
        total
      }
    };

    if (contact) {
      contact.set(contactData);
      await contact.save();
    } else {
      contact = await Contact.create(contactData);
    }


    if (couponResult.coupon) {
      couponResult.coupon.status = "Redeemed";
      couponResult.coupon.redeemedAt = new Date();
      await couponResult.coupon.save();
    }
    await createPortalInvite(contact);

    res.status(201).json({
      _id: contact._id,
      customer: {
        customerName: contact.name,
        customerEmail: contact.email,
        customerPhone: contact.phone,
        customerCompany: contact.company
      },
      payment: contact.payment
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders", async (req, res, next) => {
  try {
    const { selectedPackageId, customer, verified, paymentStatus, paidAt, invoiceId, couponCode } = req.body;
    const selectedPackage = await getPackage(selectedPackageId);

    if (!selectedPackage) {
      return res.status(400).json({ message: "Invalid package selected." });
    }

    if (!customer?.customerFirstName || !customer?.customerLastName || !customer?.customerPhone || !customer?.customerEmail) {
      return res.status(400).json({ message: "Customer first name, last name, phone, and email are required." });
    }

    if (!verified?.phone || !verified?.email) {
      return res.status(400).json({ message: "Mobile and email must be verified before order creation." });
    }

    const couponResult = await validateCouponForPackage(couponCode, selectedPackage);
    const total = couponResult.total;

    let contact = await Contact.findOne({ email: customer.customerEmail.trim().toLowerCase(), "payment.status": "pending" });
    const contactData = {
      id: contact?.id || `CONT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: `${customer.customerFirstName} ${customer.customerLastName}`.trim(),
      firstName: customer.customerFirstName,
      lastName: customer.customerLastName,
      email: customer.customerEmail.trim().toLowerCase(),
      phone: customer.customerPhone,
      company: customer.customerCompany || "",
      projectName: customer.projectName || "",
      linkedinUrl: customer.linkedinUrl || "",
      companyWebsite: customer.companyWebsite || "",
      gstin: customer.gstin || "",
      billingAddress: {
        line1: customer.billingAddressLine1 || "",
        line2: customer.billingAddressLine2 || "",
        state: customer.billingAddressState || "",
        city: customer.billingAddressCity || "",
        pincode: customer.billingAddressPincode || ""
      },
      designation: "Client",
      payment: {
        status: paymentStatus === "paid" ? "paid" : "pending",
        provider: "razorpay",
        invoiceId: invoiceId || contact?.payment?.invoiceId || `INV-${Date.now().toString().slice(-6)}`,
        paidAt: paidAt ? new Date(paidAt) : new Date()
      },
      package: {
        id: selectedPackage.id,
        name: selectedPackage.name,
        price: selectedPackage.price,
        total
      }
    };

    if (contact) {
      contact.set(contactData);
      await contact.save();
    } else {
      contact = await Contact.create(contactData);
    }

    if (couponResult.coupon && contact.payment.status === "paid") {
      couponResult.coupon.status = "Redeemed";
      couponResult.coupon.redeemedAt = new Date();
      await couponResult.coupon.save();
    }
    if (contact.payment.status === "paid") {
      await createPortalInvite(contact);
    }

    res.status(201).json({
      _id: contact._id,
      customer: {
        customerName: contact.name,
        customerEmail: contact.email,
        customerPhone: contact.phone,
        customerCompany: contact.company
      },
      payment: contact.payment
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/leads", async (req, res, next) => {
  try {
    const {
      customerFirstName,
      customerLastName,
      linkedinUrl,
      companyWebsite,
      customerCompany,
      gstin,
      billingAddressLine1,
      billingAddressLine2,
      billingAddressState,
      billingAddressCity,
      billingAddressPincode,
      customerPhone,
      customerEmail,
      selectedPackageId,
      verified
    } = req.body;

    if (!customerFirstName || !customerLastName || !customerPhone || !customerEmail) {
      return res.status(400).json({ message: "First name, last name, phone, and email are required." });
    }

    const selectedPackage = await getPackage(selectedPackageId);

    let contact = await Contact.findOne({ email: customerEmail.trim().toLowerCase(), "payment.status": "pending" });
    const contactData = {
      name: `${customerFirstName} ${customerLastName}`.trim(),
      firstName: customerFirstName,
      lastName: customerLastName,
      phone: customerPhone,
      company: customerCompany || "",
      linkedinUrl: linkedinUrl || "",
      companyWebsite: companyWebsite || "",
      gstin: gstin || "",
      billingAddress: {
        line1: billingAddressLine1 || "",
        line2: billingAddressLine2 || "",
        state: billingAddressState || "",
        city: billingAddressCity || "",
        pincode: billingAddressPincode || ""
      },
      designation: "Client",
      payment: {
        status: "pending",
        invoiceId: contact?.payment?.invoiceId || `INV-${Date.now().toString().slice(-6)}`
      },
      package: {
        id: selectedPackage?.id || "",
        name: selectedPackage?.name || "",
        price: selectedPackage?.price || 0,
        total: selectedPackage ? Math.round(selectedPackage.price * 1.18) : 0
      }
    };

    if (contact) {
      contact.set(contactData);
      await contact.save();
    } else {
      contactData.email = customerEmail.trim().toLowerCase();
      contactData.id = `CONT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      contact = await Contact.create(contactData);
    }

    res.status(201).json({ id: contact._id });
  } catch (error) {
    next(error);
  }
});

app.use(express.static(siteRoot));
app.get(["/pricing", "/packages"], (_req, res) => {
  res.sendFile(path.join(siteRoot, "index.html"));
});
app.get("/checkout", (_req, res) => {
  res.sendFile(path.join(siteRoot, "checkout.html"));
});
app.get("/payment", (_req, res) => {
  res.sendFile(path.join(siteRoot, "payment.html"));
});

app.use((error, _req, res, _next) => {
  console.error("API Error:", error);
  res.status(error.statusCode || 500).json({ message: error.message || "Server error." });
});

async function start() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing. Add it to .env.");
  }

  await mongoose.connect(process.env.MONGO_URI);

  // Migration: Migrate existing project stages to Task collection
  try {
    const projects = await Project.find({});
    for (const project of projects) {
      const taskCount = await Task.countDocuments({ projectId: project._id });
      if (taskCount === 0 && project.stages && project.stages.length > 0) {
        console.log(`Migrating ${project.stages.length} stages to Tasks for project "${project.name}"...`);
        for (const stage of project.stages) {
          await Task.create({
            id: `TASK-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            title: stage.name || "Untitled Stage",
            project: project.name,
            projectId: project._id,
            status: stage.status || "pending",
            startDate: stage.startDate ? stage.startDate.toISOString() : "",
            endDate: stage.endDate ? stage.endDate.toISOString() : "",
            description: stage.notes || "",
            clientVisible: true,
            internalNotes: "",
            priority: "Medium",
            assignee: "A"
          });
        }
        // Calculate and save project progress
        const tasks = await Task.find({ projectId: project._id });
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === "completed" || t.status === "Completed").length;
        project.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        project.stages = [];
        await project.save();
      }
    }
  } catch (err) {
    console.error("Failed to migrate project stages to Tasks:", err.message);
  }

  // Sync existing users to contacts
  try {
    const clients = await User.find({ role: "user" });
    for (const client of clients) {
      await Contact.findOneAndUpdate(
        { email: client.email.trim().toLowerCase() },
        {
          $set: {
            "payment.status": "paid"
          },
          $setOnInsert: {
            name: client.name,
            email: client.email.trim().toLowerCase(),
            phone: client.phone || "",
            company: client.company || "",
            id: `CONT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            designation: "Client"
          }
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error("Failed to sync clients to contacts:", err.message);
  }

  if (process.env.SUPERADMIN_EMAIL && process.env.SUPERADMIN_PASSWORD) {
    const bcrypt = await import("bcryptjs");
    await User.findOneAndUpdate(
      { email: process.env.SUPERADMIN_EMAIL.toLowerCase() },
      {
        $set: {
          role: "superadmin",
          status: "active",
          passwordHash: await bcrypt.default.hash(process.env.SUPERADMIN_PASSWORD, 12)
        },
        $setOnInsert: {
          name: process.env.SUPERADMIN_NAME || "Super Admin",
          email: process.env.SUPERADMIN_EMAIL.toLowerCase()
        }
      },
      { upsert: true }
    );
  }

  app.listen(port, () => {
    console.log(`API running at http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start API:", error.message);
  process.exit(1);
});
