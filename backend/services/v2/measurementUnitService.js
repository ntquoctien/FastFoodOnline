import * as measurementUnitRepo from "../../repositories/v2/measurementUnitRepository.js";

const DEFAULT_UNITS = [
  { type: "size", symbol: "XL", value: 4 },
  { type: "size", symbol: "L", value: 3 },
  { type: "size", symbol: "M", value: 2 },
  { type: "size", symbol: "S", value: 1 },
  { type: "volume", symbol: "ml", value: 100 },
  { type: "volume", symbol: "ml", value: 250 },
  { type: "volume", symbol: "ml", value: 500 },
  { type: "weight", symbol: "g", value: 100 },
  { type: "weight", symbol: "g", value: 250 },
  { type: "quantity", symbol: "piece", value: 1 },
  { type: "quantity", symbol: "piece", value: 2 },
];

const toNumberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toTrimmedLower = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const ensureSeeds = async () => {
  const total = await measurementUnitRepo.countAll();
  if (total > 0) {
    return;
  }
  await measurementUnitRepo.createMany(DEFAULT_UNITS);
};

export const listUnits = async ({ includeInactive = false } = {}) => {
  await ensureSeeds();
  const filter = includeInactive ? {} : { isActive: true };
  const units = await measurementUnitRepo
    .findAll(filter)
    .sort({ type: 1, symbol: 1, value: -1 })
    .lean();
  return { success: true, data: units };
};

const buildUnitPayload = ({ type, value, symbol, order, description, isActive }) => {
  const cleanedType = toTrimmedLower(type);
  if (!cleanedType) {
    throw new Error("TYPE_REQUIRED");
  }

  const payload = {
    type: cleanedType,
  };

  if (value !== undefined) {
    const numericValue = toNumberOrNull(value);
    if (numericValue === null) {
      throw new Error("VALUE_INVALID");
    }
    payload.value = numericValue;
    if (order === undefined) {
      payload.order = numericValue;
    }
  }

  if (order !== undefined) {
    const numericOrder = toNumberOrNull(order);
    payload.order = numericOrder ?? 0;
  }

  if (symbol !== undefined) {
    payload.symbol = typeof symbol === "string" ? symbol.trim() : "";
  }

  const displayParts = [];
  if (payload.value !== undefined && payload.value !== null) {
    displayParts.push(payload.value);
  }
  if (payload.symbol) {
    displayParts.push(payload.symbol);
  }

  if (displayParts.length === 0) {
    throw new Error("LABEL_DERIVE_FAILED");
  }
  payload.label = displayParts.join(" ").trim();

  if (description !== undefined) {
    payload.description = typeof description === "string" ? description.trim() : "";
  }

  if (isActive !== undefined) {
    payload.isActive = Boolean(isActive);
  }

  return payload;
};

export const createUnit = async (payload) => {
  try {
    const unitPayload = buildUnitPayload(payload);
    const created = await measurementUnitRepo.create(unitPayload);
    return { success: true, data: created.toObject() };
  } catch (error) {
    if (
      ["TYPE_REQUIRED", "VALUE_INVALID", "LABEL_DERIVE_FAILED"].includes(error.message)
    ) {
      return { success: false, message: error.message };
    }
    if (error.code === 11000) {
      return { success: false, message: "Unit label already exists for this type" };
    }
    throw error;
  }
};

export const updateUnit = async ({ unitId, payload }) => {
  const existing = await measurementUnitRepo.findById(unitId);
  if (!existing) {
    return { success: false, message: "Measurement unit not found" };
  }
  try {
    const updatePayload = buildUnitPayload({ ...existing.toObject(), ...payload });
    const updated = await measurementUnitRepo.updateById(unitId, updatePayload);
    return { success: true, data: updated.toObject() };
  } catch (error) {
    if (
      ["TYPE_REQUIRED", "VALUE_INVALID", "LABEL_DERIVE_FAILED"].includes(error.message)
    ) {
      return { success: false, message: error.message };
    }
    if (error.code === 11000) {
      return { success: false, message: "Unit label already exists for this type" };
    }
    throw error;
  }
};

export const toggleUnitStatus = async ({ unitId, isActive }) => {
  const existing = await measurementUnitRepo.findById(unitId);
  if (!existing) {
    return { success: false, message: "Measurement unit not found" };
  }
  const updated = await measurementUnitRepo.updateById(unitId, {
    isActive: Boolean(isActive),
  });
  return { success: true, data: updated.toObject() };
};

export const resolveUnitsByIds = async (unitIds = []) => {
  if (!unitIds.length) return [];
  const docs = await measurementUnitRepo.findByIds(unitIds).lean();
  return docs;
};

export const deleteUnit = async ({ unitId }) => {
  const existing = await measurementUnitRepo.findById(unitId);
  if (!existing) {
    return { success: false, message: "Measurement unit not found" };
  }
  await measurementUnitRepo.deleteById(unitId);
  return { success: true };
};

export default {
  listUnits,
  createUnit,
  updateUnit,
  toggleUnitStatus,
  resolveUnitsByIds,
};
