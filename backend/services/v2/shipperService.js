import bcrypt from "bcrypt";
import validator from "validator";
import * as shipperRepo from "../../repositories/v2/shipperRepository.js";
import * as userRepo from "../../repositories/userRepository.js";
import * as branchRepo from "../../repositories/v2/branchRepository.js";

const getUser = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) {
    const error = new Error("USER_NOT_FOUND");
    throw error;
  }
  return user;
};

const ensureAdmin = async (userId) => {
  const user = await getUser(userId);
  if (user.role !== "admin") {
    throw new Error("NOT_AUTHORISED");
  }
  return user;
};

const VEHICLE_TYPES = ["drone", "bike", "scooter", "car", "van"];

export const listShippers = async ({ userId }) => {
  await ensureAdmin(userId);
  const shippers = await shipperRepo.findAll({});
  return { success: true, data: shippers };
};

export const updateShipperStatus = async ({ userId, shipperId, status }) => {
  await ensureAdmin(userId);
  const validStatuses = ["available", "busy", "inactive"];
  if (!validStatuses.includes(status)) {
    throw new Error("INVALID_STATUS");
  }
  const updated = await shipperRepo.updateById(shipperId, { status });
  if (!updated) {
    return { success: false, message: "Shipper not found" };
  }
  return { success: true, data: updated };
};

export const createShipper = async ({
  userId,
  name,
  email,
  branchId,
  vehicleType,
}) => {
  await ensureAdmin(userId);

  const trimmedName = (name || "").trim();
  if (!trimmedName) {
    throw new Error("INVALID_NAME");
  }

  const normalisedEmail = (email || "").trim().toLowerCase();
  if (!validator.isEmail(normalisedEmail)) {
    throw new Error("INVALID_EMAIL");
  }

  if (!branchId) {
    throw new Error("BRANCH_REQUIRED");
  }

  const branch = await branchRepo.findById(branchId);
  if (!branch) {
    throw new Error("BRANCH_NOT_FOUND");
  }

  const vehicle = (vehicleType || "drone").trim().toLowerCase();
  if (vehicle && !VEHICLE_TYPES.includes(vehicle)) {
    throw new Error("INVALID_VEHICLE");
  }

  let shipperUser = await userRepo.findOneByEmail(normalisedEmail);
  let temporaryPassword = null;

  if (shipperUser) {
    const existingProfile = await shipperRepo.findByUserId(shipperUser._id);
    if (existingProfile) {
      throw new Error("SHIPPER_EXISTS");
    }
    if (!["staff", "shipper"].includes(shipperUser.role)) {
      throw new Error("EMAIL_IN_USE");
    }
    await userRepo.updateById(shipperUser._id, {
      name: trimmedName,
      branchId: branch._id,
      staffStatus: "active",
      isActive: true,
    });
    shipperUser = await userRepo.findById(shipperUser._id);
  } else {
    const salt = await bcrypt.genSalt(Number(process.env.SALT || 10));
    const rawPassword = `Ship${Math.random().toString(36).slice(-8)}`.replace(
      /[^a-zA-Z0-9]/g,
      ""
    );
    temporaryPassword = rawPassword;
    const hashedPassword = await bcrypt.hash(rawPassword, salt);
    shipperUser = await userRepo.createUser({
      name: trimmedName,
      email: normalisedEmail,
      password: hashedPassword,
      role: "staff",
      branchId: branch._id,
      staffStatus: "active",
      isActive: true,
    });
  }

  const created = await shipperRepo.create({
    userId: shipperUser._id,
    branchId: branch._id,
    vehicleType: vehicle || "drone",
    status: "available",
  });

  const [populated] = await shipperRepo.findAll({ _id: created._id });

  return {
    success: true,
    data: populated || created,
    temporaryPassword,
  };
};

export default { listShippers, updateShipperStatus, createShipper };
