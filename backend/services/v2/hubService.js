import * as hubRepo from "../../repositories/v2/hubRepository.js";
import * as missionRepo from "../../repositories/v2/missionRepository.js";
import * as droneRepo from "../../repositories/v2/droneRepository.js";
import { resolveAddress, buildFullAddress } from "../../utils/geocode.js";

const buildHubPayload = (payload = {}) => {
  const address = {
    street: payload.street?.trim(),
    ward: payload.ward?.trim(),
    district: payload.district?.trim(),
    city: payload.city?.trim(),
    country: payload.country?.trim() || "Vietnam",
  };
  const fullText = payload.fullAddress?.trim() || buildFullAddress(address);
  if (fullText) {
    address.fullText = fullText;
  }
  const base = {
    name: payload.name?.trim(),
    serviceRadiusKm:
      payload.serviceRadiusKm === undefined
        ? undefined
        : Number(payload.serviceRadiusKm),
    address,
  };
  Object.keys(base).forEach((key) => {
    if (base[key] === undefined || base[key] === null || base[key] === "") {
      delete base[key];
    }
  });
  return base;
};

export const createHub = async (payload) => {
  const hubPayload = buildHubPayload(payload);
  if (!hubPayload.name) {
    return { success: false, message: "Hub name is required" };
  }
  if (!hubPayload.address?.fullText) {
    return { success: false, message: "Address is required" };
  }

  const geocoded = await resolveAddress(hubPayload.address);
  if (geocoded) {
    hubPayload.location = {
      type: "Point",
      coordinates: [geocoded.lng, geocoded.lat],
    };
  } else {
    return { success: false, message: "Unable to geocode hub address" };
  }

  const hub = await hubRepo.create(hubPayload);
  return { success: true, data: hub };
};

export const updateHub = async ({ hubId, payload }) => {
  const hub = await hubRepo.findById(hubId);
  if (!hub) return { success: false, message: "Hub not found" };

  const hubPayload = buildHubPayload(payload);
  if (hubPayload.address && Object.keys(hubPayload.address).length) {
    const geocoded = await resolveAddress(hubPayload.address);
    if (geocoded) {
      hubPayload.location = {
        type: "Point",
        coordinates: [geocoded.lng, geocoded.lat],
      };
    }
  }

  const updated = await hubRepo.updateById(hubId, hubPayload);
  return { success: true, data: updated };
};

export const listHubs = async () => {
  const hubs = await hubRepo.findAll({});
  return { success: true, data: hubs };
};

export const getHub = async ({ hubId }) => {
  const hub = await hubRepo.findById(hubId);
  if (!hub) {
    return { success: false, message: "Hub not found" };
  }
  return { success: true, data: hub };
};

export const deleteHub = async ({ hubId }) => {
  const hub = await hubRepo.findById(hubId);
  if (!hub) {
    return { success: false, message: "Hub not found" };
  }

  const activeHubMissions = await missionRepo.countActiveByHubId(hubId);
  if (activeHubMissions > 0) {
    return {
      success: false,
      message: "Cannot delete hub with active missions",
    };
  }

  const hubDrones = await droneRepo.findAll({ hubId });
  const droneIds = hubDrones.map((d) => d?._id).filter(Boolean);
  if (droneIds.length) {
    const activeDroneMissions = await missionRepo.countActive({
      droneId: { $in: droneIds },
    });
    if (activeDroneMissions > 0) {
      return {
        success: false,
        message: "Cannot delete hub while its drones are in missions",
      };
    }
  }

  await hubRepo.deleteById(hubId);
  return { success: true };
};

export default { createHub, updateHub, listHubs, getHub, deleteHub };
