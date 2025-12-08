import bcrypt from "bcryptjs";
import validator from "validator";
import * as branchRepo from "../../repositories/v2/branchRepository.js";
import * as restaurantRepo from "../../repositories/v2/restaurantRepository.js";
import * as userRepo from "../../repositories/userRepository.js";
import { resolveAddress, buildFullAddress } from "../../utils/geocode.js";

const resolveRestaurant = async () =>
  (await restaurantRepo.findOne({ isActive: true })) ||
  (await restaurantRepo.findOne({}));

const toNumberOrUndefined = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const toBooleanOrUndefined = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalised = value.trim().toLowerCase();
    if (!normalised) return undefined;
    if (["true", "1", "yes", "y", "on"].includes(normalised)) return true;
    if (["false", "0", "no", "n", "off"].includes(normalised)) return false;
  }
  return Boolean(value);
};

const buildBranchPayload = (payload = {}) => {
  const sourceAddress = payload.address || payload;
  const address = {
    street: sourceAddress.street?.trim(),
    ward: sourceAddress.ward?.trim(),
    district: sourceAddress.district?.trim(),
    city: sourceAddress.city?.trim(),
    country: sourceAddress.country?.trim() || "Vietnam",
  };
  const fullText =
    payload.address?.fullText?.trim() ||
    payload.fullAddress?.trim() ||
    buildFullAddress(address);
  if (fullText) address.fullText = fullText;

  const branchPayload = {
    name: payload.name?.trim(),
    hubId: payload.hubId,
    address,
    street: address.street,
    district: address.district,
    city: address.city,
    country: address.country,
    phone: payload.phone?.trim(),
    latitude: toNumberOrUndefined(payload.latitude),
    longitude: toNumberOrUndefined(payload.longitude),
  };

  const isPrimary = toBooleanOrUndefined(payload.isPrimary);
  if (isPrimary !== undefined) {
    branchPayload.isPrimary = isPrimary;
  }

  Object.keys(branchPayload).forEach((key) => {
    const value = branchPayload[key];
    if (value === undefined) {
      delete branchPayload[key];
    }
  });

  return branchPayload;
};

const buildManagerPayload = async (manager = {}) => {
  const trimmedName = manager.name?.trim();
  const normalisedEmail = manager.email?.trim().toLowerCase();
  const password = manager.password?.trim();

  const provided = trimmedName || normalisedEmail || password;
  if (!provided) return null;

  if (!trimmedName || !normalisedEmail || !password) {
    return { error: "Manager name, email and password are required" };
  }
  if (!validator.isEmail(normalisedEmail)) {
    return { error: "Manager email is invalid" };
  }
  if (password.length < 8) {
    return { error: "Manager password must be at least 8 characters" };
  }

  const existing = await userRepo.findOneByEmail(normalisedEmail);
  if (existing) {
    return { error: "Manager email already exists" };
  }

  const salt = await bcrypt.genSalt(Number(process.env.SALT));
  const hashedPassword = await bcrypt.hash(password, salt);

  return {
    name: trimmedName,
    email: normalisedEmail,
    password: hashedPassword,
  };
};

export const listBranches = async ({ includeInactive = false } = {}) => {
  const restaurant = await resolveRestaurant();
  if (!restaurant) {
    return { success: true, data: { restaurant: null, branches: [] } };
  }

  const filter = { restaurantId: restaurant._id };
  const query = includeInactive
    ? branchRepo.findAll(filter)
    : branchRepo.findActive(filter);

  const branches = await query.lean();

  return { success: true, data: { restaurant, branches } };
};

export const createBranch = async (payload) => {
  const restaurant = await resolveRestaurant();
  if (!restaurant) {
    return { success: false, message: "Restaurant not configured" };
  }

  const branchPayload = buildBranchPayload(payload);

  if (!branchPayload.name) {
    return { success: false, message: "Branch name is required" };
  }

  const existing = await branchRepo.findOne({
    restaurantId: restaurant._id,
    name: branchPayload.name,
    isActive: true,
  });

  if (existing) {
    return { success: false, message: "Branch name already exists" };
  }

  let coordinates = null;
  if (branchPayload.address?.fullText) {
    const geocoded = await resolveAddress(branchPayload.address);
    if (geocoded) {
      coordinates = geocoded;
    }
  }

  const managerPayload = await buildManagerPayload(payload.manager);
  if (managerPayload?.error) {
    return { success: false, message: managerPayload.error };
  }

  if (coordinates) {
    branchPayload.location = {
      type: "Point",
      coordinates: [coordinates.lng, coordinates.lat],
    };
    branchPayload.latitude = coordinates.lat;
    branchPayload.longitude = coordinates.lng;
  }

  const branch = await branchRepo.create({
    restaurantId: restaurant._id,
    ...branchPayload,
  });

  if (branch.isPrimary) {
    await branchRepo.updateMany(
      { restaurantId: restaurant._id, _id: { $ne: branch._id } },
      { isPrimary: false }
    );
  }

  if (managerPayload) {
    try {
      await userRepo.createUser({
        ...managerPayload,
        role: "branch_manager",
        branchId: branch._id,
        staffStatus: "active",
        isActive: true,
      });
    } catch (error) {
      console.error("Manager create failed - rolling back branch", error);
      await branchRepo.deleteById(branch._id);
      return {
        success: false,
        message: "Failed to create manager account for this branch",
      };
    }
  }

  return { success: true, data: branch };
};

export const updateBranch = async ({ branchId, payload }) => {
  const branch = await branchRepo.findById(branchId);
  if (!branch || !branch.isActive) {
    return { success: false, message: "Branch not found" };
  }

  const branchPayload = buildBranchPayload(payload);
  if (branchPayload.name) {
    const duplicate = await branchRepo.findOne({
      restaurantId: branch.restaurantId,
      name: branchPayload.name,
      isActive: true,
      _id: { $ne: branch._id },
    });
    if (duplicate) {
      return { success: false, message: "Branch name already exists" };
    }
  }

  const normaliseFullText = (value) => (value || "").trim();
  const newFullText = branchPayload.address
    ? branchPayload.address.fullText || buildFullAddress(branchPayload.address)
    : "";
  const currentFullText = branch.address?.fullText || buildFullAddress(branch.address);
  const addressChanged =
    normaliseFullText(newFullText) && normaliseFullText(newFullText) !== normaliseFullText(currentFullText);

  if (addressChanged) {
    const geocoded = await resolveAddress(branchPayload.address);
    if (geocoded) {
      branchPayload.location = {
        type: "Point",
        coordinates: [geocoded.lng, geocoded.lat],
      };
      branchPayload.latitude = geocoded.lat;
      branchPayload.longitude = geocoded.lng;
    }
  }

  const updated = await branchRepo.updateById(branchId, branchPayload);

  if (updated?.isPrimary) {
    await branchRepo.updateMany(
      { restaurantId: updated.restaurantId, _id: { $ne: updated._id } },
      { isPrimary: false }
    );
  }

  return { success: true, data: updated };
};

export const deleteBranch = async ({ branchId }) => {
  const branch = await branchRepo.findById(branchId);
  if (!branch || !branch.isActive) {
    return { success: false, message: "Branch not found" };
  }

  await branchRepo.deactivateById(branchId);

  return { success: true };
};

export default { listBranches, createBranch, updateBranch, deleteBranch };
