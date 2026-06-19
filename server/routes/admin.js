import express from "express";
import User from "../models/User.js";
import Contact from "../models/Contact.js";
import Project from "../models/Project.js";
import Document from "../models/Document.js";
import Meeting from "../models/Meeting.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { populateProjectStages, syncProjectStagesToTasks } from "../services/projectHelper.js";

const router = express.Router();

router.use(requireAuth, requireRole("superadmin"));

router.get("/clients", async (req, res, next) => {
  try {
    const clients = await User.find({ role: "user" }).sort({ createdAt: -1 }).select("-passwordHash -invite -resetPassword");
    res.json(clients);
  } catch (error) {
    next(error);
  }
});

router.get("/clients/:clientId", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.clientId).select("-passwordHash -invite -resetPassword");
    if (!user) return res.status(404).json({ message: "Client not found." });

    const [contacts, rawProjects, documents, meetings] = await Promise.all([
      Contact.find({ email: user.email.toLowerCase() }).sort({ createdAt: -1 }),
      Project.find({ clientId: user._id }).sort({ createdAt: -1 }),
      Document.find({ clientId: user._id }).sort({ createdAt: -1 }),
      Meeting.find({ clientId: user._id }).sort({ createdAt: -1 })
    ]);

    const projects = await Promise.all(rawProjects.map(p => populateProjectStages(p, true)));

    const mappedOrders = contacts.map(c => ({
      _id: c._id,
      id: c.payment?.invoiceId || c.payment?.razorpayOrderId || `ORD-${c._id.toString().slice(-6).toUpperCase()}`,
      customer: {
        customerName: c.name,
        customerEmail: c.email,
        phone: c.phone
      },
      package: {
        id: c.package?.id,
        name: c.package?.name,
        price: c.package?.price,
        total: c.package?.total
      },
      payment: {
        status: c.payment?.status,
        provider: c.payment?.provider,
        invoiceId: c.payment?.invoiceId,
        razorpayOrderId: c.payment?.razorpayOrderId,
        razorpayPaymentId: c.payment?.razorpayPaymentId,
        paidAt: c.payment?.paidAt
      },
      status: c.payment?.status === "paid" ? "Paid" : c.payment?.status === "failed" ? "Failed" : "Pending",
      createdAt: c.createdAt
    }));

    res.json({ user, orders: mappedOrders, projects, documents, meetings });
  } catch (error) {
    next(error);
  }
});

router.get("/projects", async (req, res, next) => {
  try {
    const rawProjects = await Project.find({}).sort({ createdAt: -1 }).populate("clientId", "name email company");
    const projects = await Promise.all(rawProjects.map(p => populateProjectStages(p, true)));
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.post("/projects", async (req, res, next) => {
  try {
    const project = await Project.create(req.body);
    await syncProjectStagesToTasks(project, req.body.stages);
    const populated = await populateProjectStages(project, true);
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

router.put("/projects/:id", async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return res.status(404).json({ message: "Project not found." });
    await syncProjectStagesToTasks(project, req.body.stages);
    const populated = await populateProjectStages(project, true);
    res.json(populated);
  } catch (error) {
    next(error);
  }
});

router.delete("/projects/:id", async (req, res, next) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/documents", async (req, res, next) => {
  try {
    const docs = await Document.find({}).sort({ createdAt: -1 }).populate("clientId", "name email");
    res.json(docs);
  } catch (error) {
    next(error);
  }
});

router.post("/documents", async (req, res, next) => {
  try {
    const doc = await Document.create({ ...req.body, uploadedById: req.auth.sub });
    res.status(201).json(doc);
  } catch (error) {
    next(error);
  }
});

router.put("/documents/:id", async (req, res, next) => {
  try {
    const doc = await Document.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: "Document not found." });
    res.json(doc);
  } catch (error) {
    next(error);
  }
});

router.delete("/documents/:id", async (req, res, next) => {
  try {
    await Document.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/meetings", async (req, res, next) => {
  try {
    const meetings = await Meeting.find({}).sort({ createdAt: -1 }).populate("clientId", "name email");
    res.json(meetings);
  } catch (error) {
    next(error);
  }
});

router.put("/meetings/:id", async (req, res, next) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!meeting) return res.status(404).json({ message: "Meeting not found." });
    res.json(meeting);
  } catch (error) {
    next(error);
  }
});

router.post("/meetings", async (req, res, next) => {
  try {
    const meeting = await Meeting.create(req.body);
    res.status(201).json(meeting);
  } catch (error) {
    next(error);
  }
});

router.delete("/meetings/:id", async (req, res, next) => {
  try {
    await Meeting.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
