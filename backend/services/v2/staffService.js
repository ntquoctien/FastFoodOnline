import bcrypt from "bcrypt";
import validator from "validator";
import * as userRepo from "../../repositories/userRepository.js";
import * as branchRepo from "../../repositories/v2/branchRepository.js";

const STAFF_ROLES = ["manager", "branch_manager", "staff", "chef", "support"];
const STAFF_STATUSES = ["active", "inactive", "on_leave"];

const sanitiseStaff = (doc) => {
  if (!doc) return null;
  const plain = typeof doc.toObject === "function" ? doc.toObject() : doc;
  const { password, staffStatus, branchId, _id, name, email, role, phone, isActive } =
    plain;

  let branchName;
  let branchValue = branchId;
  if (branchId && typeof branchId === "object" && branchId._id) {
    branchName = branchId.name;
    branchValue = branchId._id?.toString?.() || branchId._id;
  } else if (branchId && branchId.toString) {
    branchValue = branchId.toString();
  }

  return {
    _id,
    name,
    email,
    role,
    phone: phone || undefined,
    isActive,
    branchId: branchValue || null,
    branchName: branchName || undefined,
    status: staffStatus || "active",
  };
};

const ensureAdmin = async (userId) => {
  const requester = await userRepo.findById(userId);
  if (!requester || requester.role !== "admin") {
    const error = new Error("NOT_AUTHORISED");
    throw error;
  }
  return requester;
};

const ensureBranch = async (branchId) => {
  if (!branchId) return null;
  const branch = await branchRepo.findById(branchId);
  if (!branch) {
    const error = new Error("BRANCH_NOT_FOUND");
    throw error;
  }
  return branch;
};

const ensureStaffExists = async (staffId) => {
  const staff = await userRepo.findById(staffId);
  if (!staff || !STAFF_ROLES.includes(staff.role)) {
    const error = new Error("STAFF_NOT_FOUND");
    throw error;
  }
  return staff;
};

export const listStaff = async ({ userId }) => {
  await ensureAdmin(userId);
  const staffMembers = await userRepo.findStaff({
    role: { $in: STAFF_ROLES },
  });
  return {
    success: true,
    data: staffMembers.map(sanitiseStaff),
  };
};

export const createStaff = async ({
  userId,
  name,
  email,
  password,
  role,
  branchId,
}) => {
  await ensureAdmin(userId);

  if (!name?.trim()) {
    return { success: false, message: "Name is required" };
  }
  if (!validator.isEmail(email || "")) {
    return { success: false, message: "Please enter a valid email" };
  }
  if (!STAFF_ROLES.includes(role)) {
    return { success: false, message: "Invalid staff role" };
  }
  if (!password || password.length < 8) {
    return {
      success: false,
      message: "Password must have at least 8 characters",
    };
  }

  const existing = await userRepo.findOneByEmail(email);
  if (existing) {
    return { success: false, message: "Email is already in use" };
  }

  let branch = null;
  if (branchId) {
    branch = await ensureBranch(branchId);
  }

  const salt = await bcrypt.genSalt(Number(process.env.SALT));
  const hashedPassword = await bcrypt.hash(password, salt);

  const created = await userRepo.createUser({
    name: name.trim(),
    email: email.toLowerCase(),
    password: hashedPassword,
    role,
    branchId: branch?._id,
    staffStatus: "active",
  });

  const populated = await userRepo.findStaffById(created._id);
  return {
    success: true,
    data: sanitiseStaff(populated),
  };
};

export const updateStaffStatus = async ({ userId, staffId, status }) => {
  await ensureAdmin(userId);
  if (!STAFF_STATUSES.includes(status)) {
    return { success: false, message: "Invalid status value" };
  }
  await ensureStaffExists(staffId);
  await userRepo.updateByIdAndReturn(staffId, { staffStatus: status });
  const populated = await userRepo.findStaffById(staffId);
  return {
    success: true,
    data: sanitiseStaff(populated),
  };
};

export const resetStaffPassword = async ({ userId, staffId }) => {
  await ensureAdmin(userId);
  await ensureStaffExists(staffId);
  const tempPassword = `Temp${Math.random().toString(36).slice(-8)}`;
  const salt = await bcrypt.genSalt(Number(process.env.SALT));
  const hashedPassword = await bcrypt.hash(tempPassword, salt);
  await userRepo.updatePasswordById(staffId, hashedPassword);
  return {
    success: true,
    data: { temporaryPassword: tempPassword },
    message: "Temporary password generated",
  };
};

export default {
  listStaff,
  createStaff,
  updateStaffStatus,
  resetStaffPassword,
};
