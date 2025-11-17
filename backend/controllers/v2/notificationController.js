import * as notificationService from "../../services/v2/notificationService.js";

export const listNotifications = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const notifications = await notificationService.getNotificationsForUser({
      userId: req.userId || req.body.userId,
      limit,
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error("List notifications error", error);
    res
      .status(500)
      .json({ success: false, message: "Unable to load notifications" });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids : undefined;
    const result = await notificationService.markNotificationsRead({
      userId: req.userId || req.body.userId,
      notificationIds: ids,
    });
    res
      .status(result.success ? 200 : 400)
      .json(
        result.success
          ? { success: true, message: "Notifications updated" }
          : result
      );
  } catch (error) {
    console.error("Mark notifications read error", error);
    res
      .status(500)
      .json({ success: false, message: "Unable to mark notifications read" });
  }
};

export default {
  listNotifications,
  markNotificationsRead,
};

