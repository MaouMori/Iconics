import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const decoder = new TextDecoder("utf-8", { fatal: true });

const ignoredDirs = new Set([
  ".git",
  ".next",
  "node_modules",
  ".vercel",
  ".turbo",
  "dist",
  "build",
  "out",
]);

const textExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".jsx",
  ".json",
  ".css",
  ".scss",
  ".sass",
  ".md",
  ".txt",
  ".yml",
  ".yaml",
  ".html",
  ".sql",
  ".env",
  ".example",
]);

const suspiciousTokens = [
  "\u00C3\u00A1",
  "\u00C3\u00A2",
  "\u00C3\u00A3",
  "\u00C3\u00A7",
  "\u00C3\u00A9",
  "\u00C3\u00AA",
  "\u00C3\u00AD",
  "\u00C3\u00B3",
  "\u00C3\u00B4",
  "\u00C3\u00B5",
  "\u00C3\u00BA",
  "\u00E2\u20AC\u201D",
  "\u00E2\u20AC\u201C",
  "\u00E2\u20AC\u02DC",
  "\u00E2\u20AC\u2122",
  "\u00E2\u20AC\u0153",
  "\u00E2\u20AC\uFFFD",
  "\u00E2\u20AC\u00A2",
  "\u00EF\u00BF\u00BD",
  "\uFFFD",
];

function shouldCheckFile(filePath) {
  const base = path.basename(filePath);
  if (base.startsWith(".env")) return true;
  const ext = path.extname(filePath).toLowerCase();
  return textExtensions.has(ext);
}

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) continue;
      walk(fullPath, out);
      continue;
    }
    if (entry.isFile() && shouldCheckFile(fullPath)) {
      out.push(fullPath);
    }
  }
  return out;
}

function findFirstLine(text, token) {
  const idx = text.indexOf(token);
  if (idx < 0) return null;
  return text.slice(0, idx).split("\n").length;
}

const files = walk(root);
const failures = [];

for (const file of files) {
  const rel = path.relative(root, file);
  const raw = fs.readFileSync(file);

  let decoded;
  try {
    decoded = decoder.decode(raw);
  } catch {
    failures.push(`${rel} -> arquivo nao esta em UTF-8 valido`);
    continue;
  }

  for (const token of suspiciousTokens) {
    const line = findFirstLine(decoded, token);
    if (line) {
      failures.push(`${rel}:${line} -> token suspeito "${token}"`);
      break;
    }
  }
}

if (failures.length > 0) {
  console.error("\n[encoding-check] Foram encontrados problemas de encoding/mojibake:\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  console.error(
    "\nCorrija os arquivos acima e salve em UTF-8. Dica: VS Code -> Reopen with Encoding -> UTF-8."
  );
  process.exit(1);
}

console.log("[encoding-check] OK - arquivos de texto validados em UTF-8 sem mojibake conhecido.");
