import DroneModel from "../../models/v2/droneModel.js";

export const create = (payload) => DroneModel.create(payload);

export const findAvailable = ({
  hubId,
  minBattery = 0,
  minPayloadKg = 0,
  near, // { lat, lng, maxDistanceMeters? }
} = {}) => {
  const filter = { status: { $in: ["available", "AVAILABLE"] }, isActive: { $ne: false } };
  if (hubId) {
    filter.hubId = hubId;
  }
  if (Number.isFinite(minBattery) && minBattery > 0) {
    filter.batteryLevel = { $gte: minBattery };
  }
  if (Number.isFinite(minPayloadKg) && minPayloadKg > 0) {
    filter.maxPayloadKg = { $gte: minPayloadKg };
  }

  const query = DroneModel.find(filter);
  if (near && Number.isFinite(near.lat) && Number.isFinite(near.lng)) {
    query.where("location").near({
      $geometry: { type: "Point", coordinates: [near.lng, near.lat] },
      ...(Number.isFinite(near.maxDistanceMeters)
        ? { $maxDistance: near.maxDistanceMeters }
        : {}),
    });
  }

  return query.sort({ updatedAt: 1, batteryLevel: -1 });
};

export const findById = (id) => DroneModel.findById(id);

export const updateById = (id, update) =>
  DroneModel.findByIdAndUpdate(id, update, { new: true });

export const findAll = (filter = {}) => DroneModel.find(filter);
export const updateMany = (filter = {}, update = {}) =>
  DroneModel.updateMany(filter, update);
export const deleteById = (id) => DroneModel.findByIdAndDelete(id);

export default {
  create,
  findAvailable,
  findById,
  updateById,
  findAll,
  updateMany,
  deleteById,
};
