import MeasurementUnitModel from "../../models/v2/measurementUnitModel.js";

export const create = (payload) => MeasurementUnitModel.create(payload);
export const createMany = (payload = []) => MeasurementUnitModel.insertMany(payload);
export const findAll = (filter = {}, projection = null) =>
  MeasurementUnitModel.find(filter, projection);
export const findActive = (filter = {}) =>
  MeasurementUnitModel.find({ ...filter, isActive: true });
export const findById = (id) => MeasurementUnitModel.findById(id);
export const findByIds = (ids = []) =>
  MeasurementUnitModel.find({ _id: { $in: ids } });
export const updateById = (id, update) =>
  MeasurementUnitModel.findByIdAndUpdate(id, update, { new: true });
export const countAll = (filter = {}) => MeasurementUnitModel.countDocuments(filter);
export const deleteById = (id) => MeasurementUnitModel.findByIdAndDelete(id);

export default {
  create,
  createMany,
  findAll,
  findActive,
  findById,
  findByIds,
  updateById,
  countAll,
  deleteById,
};
