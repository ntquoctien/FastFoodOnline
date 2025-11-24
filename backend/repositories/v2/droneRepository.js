import DroneModel from "../../models/v2/droneModel.js";

export const create = (payload) => DroneModel.create(payload);

export const findAvailable = ({
  branchId,
  minBattery = 0,
  minPayloadKg = 0,
} = {}) => {
  const filter = { status: "available" };
  if (branchId) {
    filter.branchId = branchId;
  }
  if (Number.isFinite(minBattery) && minBattery > 0) {
    filter.batteryLevel = { $gte: minBattery };
  }
  if (Number.isFinite(minPayloadKg) && minPayloadKg > 0) {
    filter.maxPayloadKg = { $gte: minPayloadKg };
  }

  return DroneModel.find(filter).sort({ updatedAt: 1, batteryLevel: -1 });
};

export const findById = (id) => DroneModel.findById(id);

export const updateById = (id, update) =>
  DroneModel.findByIdAndUpdate(id, update, { new: true });

export const findAll = (filter = {}) => DroneModel.find(filter);
export const deleteById = (id) => DroneModel.findByIdAndDelete(id);

export default {
  create,
  findAvailable,
  findById,
  updateById,
  findAll,
  deleteById,
};
