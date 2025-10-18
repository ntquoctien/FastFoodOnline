import DeliveryAssignmentModel from "../../models/v2/deliveryAssignmentModel.js";

export const create = (payload) => DeliveryAssignmentModel.create(payload);
export const findByOrderId = (orderId) =>
  DeliveryAssignmentModel.findOne({ orderId })
    .populate("shipperId")
    .populate({
      path: "orderId",
      populate: [{ path: "userId" }, { path: "branchId" }],
    });
export const updateByOrderId = (orderId, update) =>
  DeliveryAssignmentModel.findOneAndUpdate({ orderId }, update, {
    new: true,
  });

export default { create, findByOrderId, updateByOrderId };
