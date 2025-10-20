import * as branchRepo from "../../repositories/v2/branchRepository.js";
import * as restaurantRepo from "../../repositories/v2/restaurantRepository.js";

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
  const branchPayload = {
    name: payload.name?.trim(),
    street: payload.street?.trim(),
    district: payload.district?.trim(),
    city: payload.city?.trim(),
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
