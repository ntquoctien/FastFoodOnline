import * as shipperRepo from "../../repositories/v2/shipperRepository.js";
import * as userRepo from "../../repositories/userRepository.js";

const getUser = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) {
    const error = new Error("USER_NOT_FOUND");
    throw error;
  }
  return user;
};

export const listShippers = async ({ userId }) => {
  const user = await getUser(userId);
  if (user.role !== "admin") {
    throw new Error("NOT_AUTHORISED");
  }
  const shippers = await shipperRepo.findAll({});
  return { success: true, data: shippers };
};

export const updateShipperStatus = async ({ userId, shipperId, status }) => {
  const user = await getUser(userId);
  if (user.role !== "admin") {
    throw new Error("NOT_AUTHORISED");
  }
  const validStatuses = ["available", "busy", "inactive"];
  if (!validStatuses.includes(status)) {
    throw new Error("INVALID_STATUS");
  }
  const updated = await shipperRepo.updateById(shipperId, { status });
  if (!updated) {
    return { success: false, message: "Shipper not found" };
  }
  return { success: true, data: updated };
};

export default { listShippers, updateShipperStatus };
