import mongoose from "mongoose";
import dotenv from "dotenv";
import Package from "./models/Package.js";

dotenv.config({ path: "../.env" });

const packages = [
  {
    customId: "starter",
    name: "Starter Studio",
    label: "For new client onboarding",
    price: 24999,
    duration: "30 days setup",
    includes: ["Package setup", "Client intake form", "Payment checkout", "Email confirmation"]
  },
  {
    customId: "growth",
    name: "Growth Studio",
    label: "Most selected",
    price: 49999,
    duration: "45 days setup",
    includes: ["Everything in Starter", "Quotation setup", "Razorpay integration", "Priority onboarding"]
  },
  {
    customId: "enterprise",
    name: "Enterprise Studio",
    label: "For custom teams",
    price: 89999,
    duration: "60 days setup",
    includes: ["Everything in Growth", "Dedicated setup manager", "Advanced support", "Custom account setup"]
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/copper-studio");
    console.log("Connected to MongoDB");
    
    const count = await Package.countDocuments();
    if (count === 0) {
      console.log("Seeding packages...");
      await Package.insertMany(packages);
      console.log("Seeding completed.");
    } else {
      console.log("Packages already exist, skipping seed.");
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding packages:", error);
    process.exit(1);
  }
}

seed();
