import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { fileURLToPath } from "url";
import path from "path";
import userModel from "../models/userModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/fooddeliverydb";
const SALT_ROUNDS = Number(process.env.SALT || 10);

const usersToSeed = [
  {
    name: "Sample Customer",
    email: "user@example.com",
    password: "user1234",
    role: "user",
  },
  {
    name: "Site Administrator",
    email: "admin@example.com",
    password: "admin1234",
    role: "admin",
  },
];

const seed = async () => {
  await mongoose.connect(MONGO_URL);
  console.log("Connected to MongoDB");

  for (const user of usersToSeed) {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(user.password, salt);

    const update = {
      name: user.name,
      role: user.role,
      password: hashedPassword,
    };

    const existing = await userModel.findOneAndUpdate(
      { email: user.email },
      update,
      { new: true }
    );

    if (existing) {
      console.log(`Updated ${user.role} account for ${user.email}`);
    } else {
      await userModel.create({
        ...update,
        email: user.email,
        cartData: {},
      });
      console.log(`Created ${user.role} account for ${user.email}`);
    }
  }
};

seed()
  .then(() => {
    console.log("Seeding completed.");
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
