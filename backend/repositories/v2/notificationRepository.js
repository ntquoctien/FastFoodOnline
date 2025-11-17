import mongoose from "mongoose";
import NotificationModel from "../../models/v2/notificationModel.js";

const { Types } = mongoose;

const normaliseId = (value) => {
  if (!value) return null;
  if (Types.ObjectId.isValid(value)) {
    return new Types.ObjectId(value);
  }
  return null;
};

export const create = (payload) => NotificationModel.create(payload);

export const findVisibleForUser = ({ role, branchId, limit = 20 } = {}) => {
  const query = findVisibleFilter({ role, branchId }) || {};
  return NotificationModel.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

export const markAsRead = ({ notificationIds, userId, role, branchId }) => {
  const normalisedIds =
    Array.isArray(notificationIds) && notificationIds.length
      ? notificationIds.filter((id) => Types.ObjectId.isValid(id))
      : null;
  const filter = [];
  if (normalisedIds && normalisedIds.length) {
    filter.push({ _id: { $in: normalisedIds } });
  }
  const visibleFilter = findVisibleFilter({ role, branchId });
  if (visibleFilter) {
    filter.push(visibleFilter);
  }
  const query = filter.length ? { $and: filter } : visibleFilter || {};
  return NotificationModel.updateMany(query, {
    $addToSet: { readBy: normaliseId(userId) },
  });
};

const findVisibleFilter = ({ role, branchId }) => {
  const conditions = [];
  const roleTargets = [];
  if (role) {
    roleTargets.push(role);
  }
  roleTargets.push("all");
  if (roleTargets.length) {
    conditions.push({ targetRoles: { $in: roleTargets } });
  }

  const normalisedBranchId = normaliseId(branchId);
  if (role !== "admin") {
    if (normalisedBranchId) {
      conditions.push({
        $or: [
          { targetBranchId: null },
          { targetBranchId: { $exists: false } },
          { targetBranchId: normalisedBranchId },
        ],
      });
    } else {
      conditions.push({
        $or: [{ targetBranchId: null }, { targetBranchId: { $exists: false } }],
      });
    }
  }
  if (!conditions.length) {
    return {};
  }
  return { $and: conditions };
};

export default {
  create,
  findVisibleForUser,
  markAsRead,
};
