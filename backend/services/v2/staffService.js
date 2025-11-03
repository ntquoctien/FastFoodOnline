import bcrypt from "bcrypt";
import validator from "validator";
import * as userRepo from "../../repositories/userRepository.js";
import * as branchRepo from "../../repositories/v2/branchRepository.js";

const STAFF_ROLES = ["manager", "branch_manager", "staff", "chef", "support"];
const STAFF_STATUSES = ["active", "inactive", "on_leave"];
const BRANCH_MANAGER_ROLES = ["manager", "branch_manager"];
const MANAGEABLE_STAFF_ROLES = ["staff", "chef", "support"];

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

const normaliseId = (value) =>
  value && typeof value.toString === "function" ? value.toString() : value;

const getRequesterContext = async (userId) => {
  if (!userId) {
    const error = new Error("NOT_AUTHORISED");
    throw error;
  }
  const requester = await userRepo.findById(userId);
  if (!requester) {
    const error = new Error("NOT_AUTHORISED");
    throw error;
  }
  if (requester.role === "admin") {
    return { type: "admin", requester };
  }
  if (BRANCH_MANAGER_ROLES.includes(requester.role)) {
    if (!requester.branchId) {
      const error = new Error("NOT_AUTHORISED");
      throw error;
    }
    return { type: "branch_manager", requester };
  }
  const error = new Error("NOT_AUTHORISED");
  throw error;
};

const assertManagerCanManageStaff = (context, staff) => {
  if (context.type !== "branch_manager") {
    return;
  }
  const managerBranchId = normaliseId(context.requester.branchId);
  const staffBranchId = normaliseId(staff.branchId);
  if (!managerBranchId || !staffBranchId || managerBranchId !== staffBranchId) {
    const error = new Error("NOT_AUTHORISED");
    throw error;
  }
  if (!MANAGEABLE_STAFF_ROLES.includes(staff.role)) {
    const error = new Error("NOT_AUTHORISED");
    throw error;
  }
};

export const listStaff = async ({ userId }) => {
  const context = await getRequesterContext(userId);
  let filter;
  if (context.type === "admin") {
    filter = { role: { $in: STAFF_ROLES } };
  } else {
    filter = {
      role: { $in: MANAGEABLE_STAFF_ROLES },
      branchId: context.requester.branchId,
    };
  }
  const staffMembers = await userRepo.findStaff(filter);
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
  const context = await getRequesterContext(userId);
  const trimmedName = name?.trim();
  if (!trimmedName) {
    return { success: false, message: "Name is required" };
  }
  const normalisedEmail = (email || "").trim().toLowerCase();
  if (!validator.isEmail(normalisedEmail)) {
    return { success: false, message: "Please enter a valid email" };
  }
  const allowedRoles =
    context.type === "branch_manager" ? MANAGEABLE_STAFF_ROLES : STAFF_ROLES;
  if (!allowedRoles.includes(role)) {
    return { success: false, message: "Invalid staff role" };
  }
  if (!password || password.length < 8) {
    return {
      success: false,
      message: "Password must have at least 8 characters",
    };
  }

  const existing = await userRepo.findOneByEmail(normalisedEmail);
  if (existing) {
    return { success: false, message: "Email is already in use" };
  }

  let branch = null;
  if (context.type === "branch_manager") {
    const managerBranchId = context.requester.branchId;
    if (!managerBranchId) {
      const error = new Error("NOT_AUTHORISED");
      throw error;
    }
    branch = await ensureBranch(managerBranchId);
  } else if (branchId) {
    branch = await ensureBranch(branchId);
  }

  const salt = await bcrypt.genSalt(Number(process.env.SALT));
  const hashedPassword = await bcrypt.hash(password, salt);

  const created = await userRepo.createUser({
    name: trimmedName,
    email: normalisedEmail,
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
  const context = await getRequesterContext(userId);
  if (!STAFF_STATUSES.includes(status)) {
    return { success: false, message: "Invalid status value" };
  }
  const staff = await ensureStaffExists(staffId);
  assertManagerCanManageStaff(context, staff);
  await userRepo.updateByIdAndReturn(staffId, { staffStatus: status });
  const populated = await userRepo.findStaffById(staffId);
  return {
    success: true,
    data: sanitiseStaff(populated),
  };
};

export const resetStaffPassword = async ({ userId, staffId }) => {
  const context = await getRequesterContext(userId);
  if (context.type !== "admin") {
    const error = new Error("NOT_AUTHORISED");
    throw error;
  }
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

export const updateStaffProfile = async ({
  userId,
  staffId,
  name,
  phone,
  role,
  branchId,
}) => {
  const context = await getRequesterContext(userId);
  const staff = await ensureStaffExists(staffId);
  assertManagerCanManageStaff(context, staff);

  const update = {};

  if (typeof name === "string" && name.trim()) {
    update.name = name.trim();
  }
  if (typeof phone === "string") {
    update.phone = phone.trim();
  }
  if (role) {
    if (!STAFF_ROLES.includes(role)) {
      return { success: false, message: "Invalid staff role" };
    }
    if (
      context.type === "branch_manager" &&
      !MANAGEABLE_STAFF_ROLES.includes(role)
    ) {
      const error = new Error("NOT_AUTHORISED");
      throw error;
    }
    update.role = role;
  }
  if (branchId !== undefined) {
    if (context.type === "branch_manager") {
      const managerBranchId = normaliseId(context.requester.branchId);
      if (branchId && normaliseId(branchId) !== managerBranchId) {
        const error = new Error("NOT_AUTHORISED");
        throw error;
      }
      update.branchId = context.requester.branchId;
    } else if (branchId) {
      const branch = await ensureBranch(branchId);
      update.branchId = branch._id;
    } else {
      update.branchId = null;
    }
  }

  if (Object.keys(update).length === 0) {
    return { success: false, message: "No changes submitted" };
  }

  await userRepo.updateByIdAndReturn(staffId, update);
  const refreshed = await userRepo.findStaffById(staffId);
  return {
    success: true,
    data: sanitiseStaff(refreshed),
  };
};

export default {
  listStaff,
  createStaff,
  updateStaffStatus,
  resetStaffPassword,
  updateStaffProfile,
};
