import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import fs from "fs/promises";
import path from "path";
import * as userRepo from "../repositories/userRepository.js";

const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET);

const sanitizeUser = (user) => {
  if (!user) return null;
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    branchId: user.branchId || "",
    avatarUrl: user.avatarUrl || "",
  };
};

const deleteAvatar = async (fileName) => {
  if (!fileName) return;
  try {
    const filePath = path.resolve("uploads", fileName);
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(`Failed to delete avatar ${fileName}:`, error.message);
    }
  }
};

export const login = async (email, password) => {
  const user = await userRepo.findOneByEmail(email);
  if (!user) {
    return { success: false, message: "User Doesn't exist" };
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return { success: false, message: "Invalid Credentials" };
  }
  const token = createToken(user._id);
  return {
    success: true,
    token,
    role: user.role,
    branchId: user.branchId,
    user: sanitizeUser(user),
  };
};

export const register = async (name, email, password) => {
  const exists = await userRepo.findOneByEmail(email);
  if (exists) {
    return { success: false, message: "User already exists" };
  }

  if (!validator.isEmail(email)) {
    return { success: false, message: "Please enter valid email" };
  }
  if (password.length < 8) {
    return { success: false, message: "Please enter strong password" };
  }

  const salt = await bcrypt.genSalt(Number(process.env.SALT || 10));
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await userRepo.createUser({ name, email, password: hashedPassword });
  const token = createToken(user._id);
  return {
    success: true,
    token,
    role: user.role,
    branchId: user.branchId,
    user: sanitizeUser(user),
  };
};

export const getProfile = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) {
    return { success: false, message: "User not found" };
  }
  return { success: true, user: sanitizeUser(user) };
};

export const updateProfile = async ({
  userId,
  name,
  email,
  phone,
  currentPassword,
  newPassword,
  avatarFileName,
  removeAvatar,
}) => {
  const user = await userRepo.findById(userId);
  if (!user) {
    if (avatarFileName) {
      await deleteAvatar(avatarFileName);
    }
    return { success: false, message: "User not found" };
  }

  const update = {};
  if (typeof name === "string" && name.trim()) {
    update.name = name.trim();
  }
  if (typeof email === "string" && email.trim()) {
    const normalisedEmail = email.trim().toLowerCase();
    if (!validator.isEmail(normalisedEmail)) {
      if (avatarFileName) {
        await deleteAvatar(avatarFileName);
      }
      return { success: false, message: "Please enter a valid email" };
    }
    if (normalisedEmail !== user.email) {
      const exists = await userRepo.findOneByEmail(normalisedEmail);
      if (exists && String(exists._id) !== String(user._id)) {
        if (avatarFileName) {
          await deleteAvatar(avatarFileName);
        }
        return { success: false, message: "Email is already in use" };
      }
      update.email = normalisedEmail;
    }
  }
  if (typeof phone === "string") {
    update.phone = phone.trim();
  }

  if (newPassword) {
    if (!currentPassword) {
      if (avatarFileName) {
        await deleteAvatar(avatarFileName);
      }
      return { success: false, message: "Current password is required" };
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      if (avatarFileName) {
        await deleteAvatar(avatarFileName);
      }
      return { success: false, message: "Current password is incorrect" };
    }
    if (newPassword.length < 8) {
      if (avatarFileName) {
        await deleteAvatar(avatarFileName);
      }
      return { success: false, message: "New password must have at least 8 characters" };
    }
    const salt = await bcrypt.genSalt(Number(process.env.SALT || 10));
    update.password = await bcrypt.hash(newPassword, salt);
  }

  let previousAvatar = null;
  if (avatarFileName) {
    if (user.avatarUrl && user.avatarUrl !== avatarFileName) {
      previousAvatar = user.avatarUrl;
    }
    update.avatarUrl = avatarFileName;
  } else if (removeAvatar && user.avatarUrl) {
    previousAvatar = user.avatarUrl;
    update.avatarUrl = "";
  }

  if (!Object.keys(update).length) {
    if (avatarFileName) {
      await deleteAvatar(avatarFileName);
    }
    return { success: false, message: "No changes provided" };
  }

  const updated = await userRepo.updateByIdAndReturn(userId, update);
  if (previousAvatar) {
    await deleteAvatar(previousAvatar);
  }
  return { success: true, user: sanitizeUser(updated) };
};

export default { login, register, getProfile, updateProfile };

