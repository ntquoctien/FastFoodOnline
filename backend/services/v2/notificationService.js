import * as notificationRepo from "../../repositories/v2/notificationRepository.js";
import * as userRepo from "../../repositories/userRepository.js";

const DEFAULT_TARGET_ROLES = ["admin"];

const buildActorSnapshot = (user) => {
  if (!user) return null;
  return {
    userId: user._id,
    name: user.name,
    role: user.role,
    branchId: user.branchId || null,
  };
};

const normaliseRoles = (roles) => {
  if (!Array.isArray(roles) || roles.length === 0) {
    return [...DEFAULT_TARGET_ROLES];
  }
  const unique = new Set(
    roles
      .map((role) =>
        typeof role === "string" ? role.trim().toLowerCase() : ""
      )
      .filter(Boolean)
  );
  if (!unique.size) {
    DEFAULT_TARGET_ROLES.forEach((role) => unique.add(role));
  }
  return Array.from(unique);
};

export const publishNotification = async ({
  title,
  message,
  level = "info",
  status = "success",
  action = "other",
  entityType,
  entityId,
  targetRoles,
  targetBranchId,
  actor,
  metadata,
} = {}) => {
  if (!title) {
    return null;
  }
  try {
    return await notificationRepo.create({
      title,
      message,
      level,
      status,
      action,
      entityType,
      entityId,
      targetRoles: normaliseRoles(targetRoles),
      targetBranchId: targetBranchId || null,
      actor: buildActorSnapshot(actor),
      metadata,
    });
  } catch (error) {
    console.warn("Notification publish failed:", error.message);
    return null;
  }
};

export const getNotificationsForUser = async ({
  userId,
  limit = 20,
} = {}) => {
  if (!userId) return [];
  const user = await userRepo.findById(userId);
  if (!user) return [];
  const documents = await notificationRepo.findVisibleForUser({
    role: user.role,
    branchId: user.branchId,
    limit,
  });
  const userIdString = user._id?.toString();
  return documents.map((doc) => ({
    ...doc,
    read: Array.isArray(doc.readBy)
      ? doc.readBy.some((entry) => entry?.toString() === userIdString)
      : false,
  }));
};

export const markNotificationsRead = async ({
  userId,
  notificationIds,
} = {}) => {
  if (!userId) {
    return { success: false, message: "User is required" };
  }
  const user = await userRepo.findById(userId);
  if (!user) {
    return { success: false, message: "User not found" };
  }
  await notificationRepo.markAsRead({
    notificationIds,
    userId,
    role: user.role,
    branchId: user.branchId,
  });
  return { success: true };
};

export default {
  publishNotification,
  getNotificationsForUser,
  markNotificationsRead,
};
