import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const sourceDir = path.resolve("docs");
const targetDir = path.resolve("src/content/docs");

if (!existsSync(sourceDir)) {
  console.error(`Docs source directory not found: ${sourceDir}`);
  process.exit(1);
}

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(path.dirname(targetDir), { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true });

console.log(`Synced docs content from ${sourceDir} to ${targetDir}.`);
