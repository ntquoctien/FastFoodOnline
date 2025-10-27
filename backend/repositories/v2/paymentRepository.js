import PaymentModel from "../../models/v2/paymentModel.js";

export const create = (payload) => PaymentModel.create(payload);
export const findByOrderId = (orderId) => PaymentModel.findOne({ orderId });
export const findByOrderAndProvider = (orderId, provider) =>
  PaymentModel.findOne({ orderId, provider });
export const updateByOrderAndProvider = (orderId, provider, update) =>
  PaymentModel.findOneAndUpdate(
    { orderId, provider },
    update,
    { new: true }
  );
export const updateByOrderId = (orderId, update) =>
  PaymentModel.findOneAndUpdate({ orderId }, update, { new: true });

export default {
  create,
  findByOrderId,
  findByOrderAndProvider,
  updateByOrderAndProvider,
  updateByOrderId,
};

