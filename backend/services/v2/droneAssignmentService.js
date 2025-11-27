import * as droneRepo from "../../repositories/v2/droneRepository.js";
import * as missionRepo from "../../repositories/v2/missionRepository.js";
import * as hubRepo from "../../repositories/v2/hubRepository.js";
import * as branchRepo from "../../repositories/v2/branchRepository.js";
import * as orderRepo from "../../repositories/v2/orderRepository.js";
import { haversineDistanceKm } from "../../utils/geoDistance.js";

const MIN_DRONE_BATTERY =
  Number(process.env.DRONE_MIN_BATTERY || 40) || 40;
const DEFAULT_DRONE_SPEED_KMH =
  Number(process.env.DRONE_DEFAULT_SPEED_KMH || 40) || 40;
const ETA_BUFFER_MINUTES = Number(process.env.DRONE_ETA_BUFFER_MIN || 5) || 5;
const PAYLOAD_SAFETY_FACTOR =
  Math.min(
    Math.max(Number(process.env.DRONE_PAYLOAD_SAFETY || 0.85), 0.5),
    1.0
  ) || 0.85;

const toPoint = (location) => {
  if (!location || !Array.isArray(location.coordinates)) return null;
  const [lng, lat] = location.coordinates;
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return null;
  return { lat: Number(lat), lng: Number(lng) };
};

const safeDistance = (a, b) => {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  return haversineDistanceKm([a.lng, a.lat], [b.lng, b.lat]) || 0;
};

const buildRouteAndEta = ({ hubPoint, branchPoint, customerPoint, drone }) => {
  const routeCoords = [
    [hubPoint.lng, hubPoint.lat],
    [branchPoint.lng, branchPoint.lat],
    [customerPoint.lng, customerPoint.lat],
    [hubPoint.lng, hubPoint.lat],
  ];
  const totalDistanceKm =
    safeDistance(hubPoint, branchPoint) +
    safeDistance(branchPoint, customerPoint) +
    safeDistance(customerPoint, hubPoint);
  const speedKmh =
    Number(drone?.speedKmh) && Number.isFinite(Number(drone.speedKmh))
      ? Number(drone.speedKmh)
      : DEFAULT_DRONE_SPEED_KMH;
  const estMinutes =
    Math.max(
      1,
      Math.ceil((totalDistanceKm / (speedKmh || DEFAULT_DRONE_SPEED_KMH)) * 60)
    ) + ETA_BUFFER_MINUTES;
  return { routeCoords, totalDistanceKm, estMinutes };
};

const markWaitingForDrone = async (orderId) =>
  orderRepo.updateById(orderId, {
    status: "WAITING_FOR_DRONE",
    needsDroneAssignment: true,
    droneId: null,
    missionId: null,
    etaMinutes: null,
  });

export const assignDroneForOrder = async (order) => {
  try {
    if (!order || !order._id) {
      return null;
    }
    if (order.droneId) {
      return null;
    }

    const [hub, branch] = await Promise.all([
      order.hubId ? hubRepo.findById(order.hubId) : null,
      order.branchId ? branchRepo.findById(order.branchId) : null,
    ]);

    const hubPoint = toPoint(hub?.location);
    const branchPoint = toPoint(branch?.location);
    const customerPoint = toPoint(order.customerLocation);

    if (!hubPoint || !branchPoint || !customerPoint) {
      await markWaitingForDrone(order._id);
      return null;
    }

    const payloadKg =
      (order.payloadWeightKg || order.orderWeightKg || 0) *
      PAYLOAD_SAFETY_FACTOR;

    const candidates = await droneRepo.findAvailable({
      hubId: order.hubId,
      minBattery: MIN_DRONE_BATTERY,
      minPayloadKg: payloadKg > 0 ? payloadKg : undefined,
      near: {
        lat: branchPoint.lat,
        lng: branchPoint.lng,
      },
    });

    if (!candidates.length) {
      await markWaitingForDrone(order._id);
      return null;
    }

    const nearest = candidates
      .map((drone) => {
        const dronePoint = toPoint(drone.location);
        return { drone, distance: safeDistance(branchPoint, dronePoint) };
      })
      .sort((a, b) => a.distance - b.distance)[0]?.drone;

    if (!nearest) {
      await markWaitingForDrone(order._id);
      return null;
    }

    const routeData = buildRouteAndEta({
      hubPoint,
      branchPoint,
      customerPoint,
      drone: nearest,
    });
    if (!routeData) {
      await markWaitingForDrone(order._id);
      return null;
    }

    const mission = await missionRepo.create({
      orderId: order._id,
      droneId: nearest._id,
      hubId: order.hubId,
      status: "PLANNED",
      route: {
        type: "LineString",
        coordinates: routeData.routeCoords,
      },
      totalDistanceKm: routeData.totalDistanceKm,
      estDurationMinutes: routeData.estMinutes,
      startLocation: {
        type: "Point",
        coordinates: [hubPoint.lng, hubPoint.lat],
      },
      endLocation: {
        type: "Point",
        coordinates: [customerPoint.lng, customerPoint.lat],
      },
    });

    await Promise.all([
      orderRepo.updateById(order._id, {
        droneId: nearest._id,
        missionId: mission._id,
        etaMinutes: routeData.estMinutes,
        status: "ASSIGNED",
        needsDroneAssignment: false,
      }),
      droneRepo.updateById(nearest._id, { status: "ASSIGNED" }),
    ]);

    return { drone: nearest, mission };
  } catch (error) {
    console.error("assignDroneForOrder error", error);
    await markWaitingForDrone(order._id);
    return null;
  }
};

export default { assignDroneForOrder };
