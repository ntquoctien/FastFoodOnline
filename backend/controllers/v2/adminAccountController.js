import {
  createAdmin,
  listAdmins,
} from "../../services/v2/adminAccountService.js";

const handleError = (res, error, message) => {
  if (error.message === "NOT_AUTHORISED") {
    return res
      .status(403)
      .json({ success: false, message: "You are not allowed to perform this action" });
  }
  console.error(message, error);
  return res.status(500).json({ success: false, message });
};

export const getAdmins = async (req, res) => {
  try {
    const result = await listAdmins({ userId: req.userId || req.body.userId });
    res.json(result);
  } catch (error) {
    handleError(res, error, "Failed to load admin accounts");
  }
};

export const addAdmin = async (req, res) => {
  try {
    const result = await createAdmin({
      userId: req.userId || req.body.userId,
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
    });
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    handleError(res, error, "Failed to create admin account");
  }
};

export default {
  getAdmins,
  addAdmin,
};

