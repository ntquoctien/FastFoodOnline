import PaymentModel from '../../models/v2/paymentModel.js';

export const create = (payload) => PaymentModel.create(payload);
export const findByOrderId = (orderId) => PaymentModel.findOne({ orderId });
export const updateByOrderId = (orderId, update) =>
  PaymentModel.findOneAndUpdate({ orderId }, update, { new: true });

export default { create, findByOrderId, updateByOrderId };

