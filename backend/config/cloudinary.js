import { v2 as cloudinary } from "cloudinary";

const {
  CLOUDINARY_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

const hasExplicitKeys =
  Boolean(CLOUDINARY_CLOUD_NAME) &&
  Boolean(CLOUDINARY_API_KEY) &&
  Boolean(CLOUDINARY_API_SECRET);
export const cloudinaryEnabled = Boolean(CLOUDINARY_URL) || hasExplicitKeys;

if (cloudinaryEnabled) {
  if (CLOUDINARY_URL) {
    cloudinary.config({ secure: true });
  } else {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
} else {
  console.warn(
    "Cloudinary is not configured. Falling back to local storage for uploads."
  );
}

export default cloudinary;
