import * as userService from "../services/userService.js";
import * as userRepo from "../repositories/userRepository.js";
import * as notificationService from "../services/v2/notificationService.js";
import { toPublicUploadUrl } from "../config/uploader.js";

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await userService.login(email, password);
    res.json(result);
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const result = await userService.register(name, email, password);
    res.json(result);
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const result = await userService.getProfile(req.userId || req.body.userId);
    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error" });
  }
};

export const updateProfile = async (req, res) => {
  const actorId = req.userId || req.body.userId;
  let actor = null;
  try {
    actor = actorId ? await userRepo.findById(actorId) : null;
    const result = await userService.updateProfile({
      userId: actorId,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
      avatarFileName: toPublicUploadUrl(req.file),
      removeAvatar: req.body.removeAvatar === "true",
    });
    if (result.success) {
      await notificationService.publishNotification({
        title: "Hồ sơ được cập nhật",
        message: `${result.user?.name || actor?.name || "Một tài khoản"} vừa cập nhật thông tin cá nhân`,
        action: "update",
        entityType: "user",
        entityId: actorId,
        actor,
        targetRoles: ["admin"],
        status: "success",
      });
    } else {
      await notificationService.publishNotification({
        title: "Thay đổi hồ sơ không thành công",
        message: result.message || "Yêu cầu cập nhật hồ sơ bị từ chối",
        action: "update",
        level: "warning",
        status: "failed",
        entityType: "user",
        entityId: actorId,
        actor,
        targetRoles: ["admin"],
      });
    }
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.log(error);
    await notificationService.publishNotification({
      title: "Lỗi cập nhật hồ sơ",
      message: error.message || "Không thể cập nhật hồ sơ người dùng",
      action: "update",
      level: "error",
      status: "failed",
      entityType: "user",
      entityId: actorId,
      actor,
      targetRoles: ["admin"],
    });
    res.status(500).json({ success: false, message: "Error" });
  }
};

export default { loginUser, registerUser, getProfile, updateProfile };
