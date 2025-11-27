import {
  createHub,
  updateHub,
  listHubs,
  getHub,
  deleteHub,
} from "../../services/v2/hubService.js";

export const list = async (req, res) => {
  try {
    const result = await listHubs();
    res.json(result);
  } catch (error) {
    console.error("Hub list error", error);
    res.status(500).json({ success: false, message: "Failed to load hubs" });
  }
};

export const create = async (req, res) => {
  try {
    const result = await createHub(req.body || {});
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("Hub create error", error);
    res.status(500).json({ success: false, message: "Failed to create hub" });
  }
};

export const getOne = async (req, res) => {
  try {
    const result = await getHub({ hubId: req.params.hubId });
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error("Hub get error", error);
    res.status(500).json({ success: false, message: "Failed to fetch hub" });
  }
};

export const update = async (req, res) => {
  try {
    const result = await updateHub({ hubId: req.params.hubId, payload: req.body || {} });
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("Hub update error", error);
    res.status(500).json({ success: false, message: "Failed to update hub" });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await deleteHub({ hubId: req.params.hubId });
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("Hub delete error", error);
    res.status(500).json({ success: false, message: "Failed to delete hub" });
  }
};

export default { list, create, getOne, update, remove };
