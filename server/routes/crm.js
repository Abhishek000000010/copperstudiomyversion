import express from "express";
import Company from "../models/Company.js";
import Contact from "../models/Contact.js";
import Coupon from "../models/Coupon.js";
import Task from "../models/Task.js";
import Package from "../models/Package.js";
import { updateProjectProgress } from "../services/projectHelper.js";

const router = express.Router();
const models = {
  companies: Company,
  contacts: Contact,
  coupons: Coupon,
  tasks: Task,
  packages: Package
};

const expirableCouponStatuses = ["Active", "Applied", "Not used"];

function validateType(req, res, next) {
  if (!models[req.params.type]) {
    return res.status(404).json({ message: "CRM collection not found." });
  }
  next();
}

function asPublicRecord(record) {
  const data = record.toObject();
  return { ...data, id: data.id || data._id.toString(), _id: data._id.toString() };
}

function toDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function couponPayload(body) {
  const payload = { ...body };
  const validUntil = toDate(payload.validUntil || payload.validity);
  if (validUntil) {
    payload.validUntil = validUntil;
    payload.validity = validUntil.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      hour12: true
    });
  }
  if (payload.status === "Revoked" && !payload.revokedAt) payload.revokedAt = new Date();
  if (payload.status === "Redeemed" && !payload.redeemedAt) payload.redeemedAt = new Date();
  return payload;
}

async function expireOldCoupons() {
  await Coupon.updateMany(
    { status: { $in: expirableCouponStatuses }, validUntil: { $lte: new Date() } },
    { $set: { status: "Expired" } }
  );
}

router.get("/:type", validateType, async (req, res, next) => {
  try {
    const Model = models[req.params.type];
    if (req.params.type === "coupons") await expireOldCoupons();
    const records = await Model.find({}).sort({ updatedAt: -1 });
    res.json(records.map(asPublicRecord));
  } catch (error) {
    next(error);
  }
});

router.post("/:type", validateType, async (req, res, next) => {
  try {
    const Model = models[req.params.type];
    const payload = req.params.type === "coupons" ? couponPayload(req.body) : req.body;
    const record = await Model.create(payload);
    if (req.params.type === "tasks" && record.projectId) {
      await updateProjectProgress(record.projectId);
    }
    res.status(201).json(asPublicRecord(record));
  } catch (error) {
    next(error);
  }
});

router.put("/:type/:id", validateType, async (req, res, next) => {
  try {
    const Model = models[req.params.type];
    const payload = req.params.type === "coupons" ? couponPayload(req.body) : req.body;
    const record = await Model.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!record) return res.status(404).json({ message: "CRM record not found." });
    if (req.params.type === "tasks" && record.projectId) {
      await updateProjectProgress(record.projectId);
    }
    res.json(asPublicRecord(record));
  } catch (error) {
    next(error);
  }
});

router.delete("/:type/:id", validateType, async (req, res, next) => {
  try {
    const Model = models[req.params.type];
    let projectId = null;
    if (req.params.type === "tasks") {
      const task = await Model.findById(req.params.id);
      if (task) projectId = task.projectId;
    }
    const record = await Model.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: "CRM record not found." });
    if (req.params.type === "tasks" && projectId) {
      await updateProjectProgress(projectId);
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
