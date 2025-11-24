import GeocodeCacheModel from "../../models/v2/geocodeCacheModel.js";

export const findByAddressKey = (addressKey) =>
  GeocodeCacheModel.findOne({ addressKey });

export const upsert = async ({ addressKey, lat, lng, provider = "nominatim" }) =>
  GeocodeCacheModel.findOneAndUpdate(
    { addressKey },
    { $set: { lat, lng, provider, updatedAt: new Date() } },
    { new: true, upsert: true }
  );

export default { findByAddressKey, upsert };
