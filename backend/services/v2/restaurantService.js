import * as restaurantRepo from "../../repositories/v2/restaurantRepository.js";

const resolveRestaurant = async () =>
  (await restaurantRepo.findOne({ isActive: true })) ||
  (await restaurantRepo.findOne({}));

const normaliseRestaurant = (doc) => {
  if (!doc) return null;
  const plain = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    _id: plain._id,
    name: plain.name || "",
    description: plain.description || "",
    phone: plain.phone || "",
    email: plain.email || "",
    logoUrl: plain.logoUrl || "",
    cuisine: plain.cuisine || "",
    policy: plain.policy || "",
    isActive: Boolean(plain.isActive),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
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

const buildUpdatePayload = (payload = {}) => {
  const update = {};

  if (payload.name !== undefined) {
    const trimmed = (payload.name || "").trim();
    if (!trimmed) {
      throw new Error("NAME_REQUIRED");
    }
    update.name = trimmed;
  }

  if (payload.description !== undefined) {
    update.description = (payload.description || "").trim();
  }
  if (payload.phone !== undefined) {
    update.phone = (payload.phone || "").trim();
  }
  if (payload.email !== undefined) {
    update.email = (payload.email || "").trim();
  }
  if (payload.logoUrl !== undefined) {
    update.logoUrl = (payload.logoUrl || "").trim();
  }
  if (payload.cuisine !== undefined) {
    update.cuisine = (payload.cuisine || "").trim();
  }
  if (payload.policy !== undefined) {
    update.policy = (payload.policy || "").trim();
  }

  const isActive = toBooleanOrUndefined(payload.isActive);
  if (isActive !== undefined) {
    update.isActive = isActive;
  }

  return update;
};

export const getSettings = async () => {
  const restaurant = await resolveRestaurant();
  return {
    success: true,
    data: normaliseRestaurant(restaurant),
  };
};

export const upsertSettings = async (payload = {}) => {
  let restaurant = await resolveRestaurant();
  let update;
  try {
    update = buildUpdatePayload(payload);
  } catch (error) {
    if (error.message === "NAME_REQUIRED") {
      return { success: false, message: "Restaurant name is required" };
    }
    throw error;
  }

  if (!restaurant) {
    if (!update.name) {
      return {
        success: false,
        message: "Restaurant name is required to initialise settings",
      };
    }
    restaurant = await restaurantRepo.create(update);
    return { success: true, data: normaliseRestaurant(restaurant) };
  }

  if (Object.keys(update).length === 0) {
    return { success: false, message: "No changes provided" };
  }

  const updated = await restaurantRepo.updateById(restaurant._id, update, {
    runValidators: true,
  });

  return { success: true, data: normaliseRestaurant(updated) };
};

export default {
  getSettings,
  upsertSettings,
};
