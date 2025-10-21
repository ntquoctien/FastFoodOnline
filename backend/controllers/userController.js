import * as userService from "../services/userService.js";

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
  try {
    const result = await userService.updateProfile({
      userId: req.userId || req.body.userId,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
      avatarFileName: req.file?.filename,
      removeAvatar: req.body.removeAvatar === "true",
    });
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error" });
  }
};

export default { loginUser, registerUser, getProfile, updateProfile };
