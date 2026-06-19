import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendForgotPasswordOtpEmail } from "../services/email.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || "replace-this-development-secret";

function signUser(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    jwtSecret,
    { expiresIn: "7d" }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    company: user.company || "",
    jobTitle: user.jobTitle || "",
    role: user.role,
    status: user.status,
    preferences: user.preferences || {}
  };
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

router.post("/login", async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, password, and role are required." });
    }

    const user = await User.findOne({ email: String(email).toLowerCase(), role });
    if (!user || !user.passwordHash || user.status === "disabled") {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials." });

    user.lastLoginAt = new Date();
    user.status = "active";
    await user.save();

    res.json({ token: signUser(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub);
    if (!user) return res.status(401).json({ message: "Session user not found." });
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/set-password", async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) {
      return res.status(400).json({ message: "A valid token and 8+ character password are required." });
    }

    const user = await User.findOne({
      "invite.tokenHash": sha256(token),
      "invite.expiresAt": { $gt: new Date() }
    });

    if (!user) return res.status(400).json({ message: "Set-password link is invalid or expired." });

    user.passwordHash = await bcrypt.hash(password, 12);
    user.status = "active";
    user.invite = {};
    await user.save();

    res.json({ token: signUser(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const user = await User.findOne({ email: String(email || "").toLowerCase(), role });

    if (user && user.status !== "disabled") {
      const otp = String(crypto.randomInt(100000, 999999));
      user.resetPassword = {
        otpHash: sha256(otp),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      };
      await user.save();
      await sendForgotPasswordOtpEmail({ to: user.email, name: user.name, otp });
    }

    res.json({ message: "If the account exists, an OTP has been sent." });
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const { email, role, otp, password } = req.body;
    if (!email || !role || !otp || !password || password.length < 8) {
      return res.status(400).json({ message: "Email, role, OTP, and 8+ character password are required." });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase(),
      role,
      "resetPassword.otpHash": sha256(otp),
      "resetPassword.expiresAt": { $gt: new Date() }
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired OTP." });

    user.passwordHash = await bcrypt.hash(password, 12);
    user.status = "active";
    user.resetPassword = {};
    await user.save();

    res.json({ token: signUser(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

export default router;
