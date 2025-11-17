const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

export const calculateDistanceKm = (pointA, pointB) => {
  if (!pointA || !pointB) return Infinity;
  const { latitude: lat1, longitude: lon1 } = pointA;
  const { latitude: lat2, longitude: lon2 } = pointB;
  if (
    typeof lat1 !== "number" ||
    typeof lon1 !== "number" ||
    typeof lat2 !== "number" ||
    typeof lon2 !== "number"
  ) {
    return Infinity;
  }

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const originLat = toRadians(lat1);
  const destinationLat = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) *
      Math.sin(dLon / 2) *
      Math.cos(originLat) *
      Math.cos(destinationLat);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

export const findNearestBranch = (branches = [], coords) => {
  if (!coords || !branches.length) return null;
  let nearest = null;
  let nearestDistance = Infinity;
  branches.forEach((branch) => {
    const candidateCoords = {
      latitude: branch.latitude,
      longitude: branch.longitude,
    };
    const distance = calculateDistanceKm(coords, candidateCoords);
    if (distance < nearestDistance) {
      nearest = branch;
      nearestDistance = distance;
    }
  });
  return nearest ? { branch: nearest, distance: nearestDistance } : null;
};

export const formatDistanceLabel = (distanceKm) => {
  if (!Number.isFinite(distanceKm)) return "";
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};
