import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const outputPath = path.resolve("test-output.txt");
const outputStream = fs.createWriteStream(outputPath, { flags: "w" });

const child = spawn(
  process.execPath,
  ["--test", "--test-concurrency=1", "tests"],
  { stdio: ["ignore", "pipe", "pipe"] }
);

child.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
  outputStream.write(chunk);
});

child.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
  outputStream.write(chunk);
});

child.on("error", (error) => {
  outputStream.end();
  console.error("Failed to start test process:", error);
  process.exitCode = 1;
});

child.on("close", (code) => {
  outputStream.end();
  process.exitCode = code ?? 1;
});

