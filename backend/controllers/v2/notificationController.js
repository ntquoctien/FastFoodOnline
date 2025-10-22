export const listNotifications = (req, res) => {
  res.json({
    success: true,
    notifications: [],
  });
};

export const markNotificationsRead = (req, res) => {
  res.json({
    success: true,
    message: "Notifications marked as read",
  });
};

export default {
  listNotifications,
  markNotificationsRead,
};
