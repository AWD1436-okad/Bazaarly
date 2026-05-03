import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const scanRoots = ["app", "components", "lib"];
const extensions = new Set([".ts", ".tsx"]);
const safeFiles = new Set([
  "lib/currencies.ts",
  "lib/money.ts",
  "lib/price-profiles.ts",
  "lib/catalog-source.ts",
  "lib/route-validation.ts",
]);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath, files);
      continue;
    }
    if ([...extensions].some((extension) => fullPath.endsWith(extension))) {
      files.push(fullPath);
    }
  }
  return files;
}

const findings = [];

for (const rootName of scanRoots) {
  const rootPath = join(root, rootName);
  for (const file of walk(rootPath)) {
    const fileName = relative(root, file).replaceAll("\\", "/");
    if (safeFiles.has(fileName)) {
      continue;
    }

    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const hasHardcodedMoney = /(^|[^A-Za-z])A?\$\s*\d/.test(trimmed) || /\bAUD\s*\d|\d\s*AUD\b/.test(trimmed);
      const hasManualMoneyFormatting =
        trimmed.includes(".toFixed(") &&
        !trimmed.includes("rating") &&
        !trimmed.includes("demandScore");

      if (hasHardcodedMoney || hasManualMoneyFormatting) {
        findings.push({
          file: fileName,
          line: index + 1,
          text: trimmed,
        });
      }
    });
  }
}

if (findings.length === 0) {
  console.log("No obvious hardcoded user-facing money displays found.");
} else {
  console.log("Potential hardcoded money displays:");
  for (const finding of findings) {
    console.log(`${finding.file}:${finding.line}: ${finding.text}`);
  }
}
