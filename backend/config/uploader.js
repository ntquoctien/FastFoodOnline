import fs from "fs";
import path from "path";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary, { cloudinaryEnabled } from "./cloudinary.js";

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const normalisePath = (filePath) => filePath?.replace(/\\/g, "/");

export const toPublicUploadUrl = (file) => {
  const rawPath = file?.path || file?.filename || "";
  if (!rawPath) return undefined;
  if (/^https?:\/\//i.test(rawPath)) {
    return rawPath;
  }
  const normalised = normalisePath(rawPath);
  const uploadsIndex = normalised.lastIndexOf("/uploads/");
  const relative = uploadsIndex !== -1
    ? normalised.slice(uploadsIndex + "/uploads/".length)
    : normalised.replace(/^\/?uploads\/?/, "");
  const trimmed = relative.startsWith("/") ? relative.slice(1) : relative;
  return `/uploads/${trimmed || path.basename(normalised)}`;
};

export const createUploader = ({
  folder = "fastfoodonline",
  allowedFormats = ["jpg", "jpeg", "png", "webp", "gif"],
} = {}) => {
  if (cloudinaryEnabled) {
    const storage = new CloudinaryStorage({
      cloudinary,
      params: {
        folder,
        allowed_formats: allowedFormats,
        use_filename: true,
        unique_filename: true,
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
    });
    return multer({ storage });
  }

  const uploadsRoot = path.resolve("uploads");
  const targetDir = path.join(uploadsRoot, folder);
  ensureDir(targetDir);

  const storage = multer.diskStorage({
    destination: targetDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || "");
      const baseName = path.basename(file.originalname || "upload", ext);
      const safeBase = baseName.trim().replace(/\s+/g, "-") || "upload";
      cb(null, `${safeBase}-${Date.now()}${ext}`);
    },
  });

  return multer({ storage });
};

export default createUploader;
