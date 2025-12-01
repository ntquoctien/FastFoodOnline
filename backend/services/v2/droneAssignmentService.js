import * as droneRepo from "../../repositories/v2/droneRepository.js";
import * as missionRepo from "../../repositories/v2/missionRepository.js";
import * as hubRepo from "../../repositories/v2/hubRepository.js";
import * as branchRepo from "../../repositories/v2/branchRepository.js";
import * as orderRepo from "../../repositories/v2/orderRepository.js";
import { haversineDistanceKm } from "../../utils/geoDistance.js";

const DEFAULT_DRONE_SPEED_KMH =
  Number(process.env.DRONE_DEFAULT_SPEED_KMH || 40) || 40;
const ETA_BUFFER_MINUTES = Number(process.env.DRONE_ETA_BUFFER_MIN || 5) || 5;

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

    const branch = order.branchId ? await branchRepo.findById(order.branchId) : null;
    if (!branch) {
      console.warn("assignDroneForOrder missing branch", { orderId: order._id });
      await markWaitingForDrone(order._id);
      return null;
    }

    if (!order.hubId && branch.hubId) {
      order.hubId = branch.hubId;
      await orderRepo.updateById(order._id, { hubId: branch.hubId });
    }

    const hubIdForOrder = order.hubId || branch.hubId || null;
    if (!hubIdForOrder) {
      console.warn("assignDroneForOrder missing hubId", { orderId: order._id });
      await markWaitingForDrone(order._id);
      return null;
    }

    const hub = await hubRepo.findById(hubIdForOrder);

    const hubPoint = toPoint(hub?.location);
    const branchPoint = toPoint(branch?.location);
    const customerPoint = toPoint(order.customerLocation);

    if (!hubPoint || !branchPoint || !customerPoint) {
      console.warn("assignDroneForOrder missing geocode", {
        orderId: order._id,
        hasHubPoint: Boolean(hubPoint),
        hasBranchPoint: Boolean(branchPoint),
        hasCustomerPoint: Boolean(customerPoint),
      });
      await markWaitingForDrone(order._id);
      return null;
    }

    const candidates = await droneRepo.findAll({
      hubId: hubIdForOrder,
      status: { $in: ["AVAILABLE", "available"] },
      isActive: { $ne: false },
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
      hubId: hubIdForOrder,
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
        hubId: hubIdForOrder,
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

export const assignNextWaitingOrderForHub = async (hubId) => {
  if (!hubId) return null;
  const waitingList =
    (await orderRepo.find(
      {
        hubId,
        needsDroneAssignment: true,
        status: { $in: ["WAITING_FOR_DRONE", "CREATED"] },
        droneId: null,
        missionId: null,
      },
      { sort: { createdAt: 1 }, limit: 1 }
    )) || [];
  const nextOrder = waitingList[0];
  if (!nextOrder) return null;
  return assignDroneForOrder(nextOrder);
};

export default { assignDroneForOrder, assignNextWaitingOrderForHub };
