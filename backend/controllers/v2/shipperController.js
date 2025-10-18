import * as shipperService from "../../services/v2/shipperService.js";

const handleError = (res, error, fallback) => {
  if (error.message === "NOT_AUTHORISED") {
    return res
      .status(403)
      .json({ success: false, message: "You are not allowed to perform this action" });
  }
  if (error.message === "USER_NOT_FOUND") {
    return res.status(401).json({ success: false, message: "User not found" });
  }
  if (error.message === "INVALID_STATUS") {
    return res.status(400).json({ success: false, message: "Invalid shipper status" });
  }
  console.error(fallback, error);
  return res.status(500).json({ success: false, message: "Shipper action failed" });
};

export const listShippers = async (req, res) => {
  try {
    const result = await shipperService.listShippers({
      userId: req.userId || req.body.userId,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error, "Shipper list error");
  }
};

export const updateShipperStatus = async (req, res) => {
  try {
    const { shipperId } = req.params;
    const { status } = req.body;
    const result = await shipperService.updateShipperStatus({
      userId: req.userId || req.body.userId,
      shipperId,
      status,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error, "Shipper update error");
  }
};

export default { listShippers, updateShipperStatus };
