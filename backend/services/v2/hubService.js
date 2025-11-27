import * as hubRepo from "../../repositories/v2/hubRepository.js";
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
  await hubRepo.deleteById(hubId);
  return { success: true };
};

export default { createHub, updateHub, listHubs, getHub, deleteHub };
