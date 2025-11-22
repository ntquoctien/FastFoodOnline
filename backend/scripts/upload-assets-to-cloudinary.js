import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import cloudinary from "../config/cloudinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".svg",
]);

const targets = [
  {
    label: "uploads",
    dir: path.resolve(__dirname, "..", "uploads"),
    folder: "fastfoodonline/uploads",
  },
  {
    label: "frontend_assets",
    dir: path.resolve(__dirname, "..", "..", "frontend", "src", "assets"),
    folder: "fastfoodonline/frontend",
  },
  {
    label: "admin_assets",
    dir: path.resolve(__dirname, "..", "..", "admin", "src", "assets"),
    folder: "fastfoodonline/admin",
  },
];

const collectFiles = async (dir) => {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectFiles(fullPath);
      files.push(...nested);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (allowedExtensions.has(ext)) {
        files.push(fullPath);
      }
    }
  }
  return files;
};

const makePublicId = (filePath) => {
  const base = path.basename(filePath, path.extname(filePath));
  const safe = base.replace(/[^a-zA-Z0-9_-]/g, "_");
  return safe || "asset";
};

const uploadFile = async (filePath, folder) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    public_id: makePublicId(filePath),
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  });
  return {
    source: filePath,
    secure_url: result.secure_url,
    public_id: result.public_id,
    asset_id: result.asset_id,
    bytes: result.bytes,
    format: result.format,
  };
};

const run = async () => {
  const summary = [];
  for (const target of targets) {
    try {
      await fs.access(target.dir);
    } catch {
      console.warn(`Skip ${target.label}: directory not found (${target.dir})`);
      continue;
    }
    console.log(`Scanning ${target.label}...`);
    const files = await collectFiles(target.dir);
    if (!files.length) {
      console.log(`No eligible files under ${target.label}`);
      continue;
    }
    console.log(`Uploading ${files.length} files from ${target.label} to ${target.folder}`);
    for (const file of files) {
      try {
        const result = await uploadFile(file, target.folder);
        summary.push(result);
        console.log(`Uploaded: ${result.public_id}`);
      } catch (error) {
        console.error(`Failed to upload ${file}:`, error.message);
      }
    }
  }

  const reportPath = path.resolve(__dirname, "..", "cloudinary-upload-report.json");
  await fs.writeFile(reportPath, JSON.stringify(summary, null, 2), "utf-8");
  console.log(`Report saved to ${reportPath}`);
};

run().catch((error) => {
  console.error("Upload script failed", error);
  process.exit(1);
});
