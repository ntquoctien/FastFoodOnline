import bcrypt from "bcryptjs";
import validator from "validator";
import * as userRepo from "../../repositories/userRepository.js";

const sanitizeAdmin = (doc) => {
  if (!doc) return null;
  const plain =
    typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  return {
    _id: plain._id,
    name: plain.name,
    email: plain.email,
    phone: plain.phone || "",
    createdAt: plain.createdAt,
  };
};

const ensureAdmin = async (userId) => {
  if (!userId) {
    throw new Error("NOT_AUTHORISED");
  }
  const requester = await userRepo.findById(userId);
  if (!requester || requester.role !== "admin") {
    throw new Error("NOT_AUTHORISED");
  }
  return requester;
};

export const listAdmins = async ({ userId }) => {
  await ensureAdmin(userId);
  const admins = await userRepo.findMany(
    { role: "admin" },
    "-password",
    { sort: { createdAt: -1 } }
  );
  return {
    success: true,
    data: admins.map(sanitizeAdmin),
  };
};

export const createAdmin = async ({
  userId,
  name,
  email,
  password,
  phone,
}) => {
  await ensureAdmin(userId);
  const trimmedName = name?.trim();
  if (!trimmedName) {
    return { success: false, message: "Name is required" };
  }
  const normalisedEmail = (email || "").trim().toLowerCase();
  if (!validator.isEmail(normalisedEmail)) {
    return { success: false, message: "Please enter a valid email" };
  }
  if (!password || password.length < 8) {
    return {
      success: false,
      message: "Password must have at least 8 characters",
    };
  }
  const exists = await userRepo.findOneByEmail(normalisedEmail);
  if (exists) {
    return { success: false, message: "Email is already in use" };
  }
  const salt = await bcrypt.genSalt(Number(process.env.SALT || 10));
  const hashedPassword = await bcrypt.hash(password, salt);
  const created = await userRepo.createUser({
    name: trimmedName,
    email: normalisedEmail,
    password: hashedPassword,
    phone: phone?.trim() || "",
    role: "admin",
    isActive: true,
  });
  return {
    success: true,
    data: sanitizeAdmin(created),
  };
};

export default {
  listAdmins,
  createAdmin,
};

