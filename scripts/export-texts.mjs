import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const OUTPUT = path.join(ROOT, "docs", "textos_juego.csv");

const SKIP_ATTRIBUTE_NAMES = new Set([
  "className",
  "src",
  "href",
  "style",
  "key",
  "id",
  "htmlFor",
  "value",
  "type",
]);

const SKIP_OBJECT_FIELDS = new Set([
  "id",
  "image",
  "idleImage",
  "selectedImage",
  "backgroundSrc",
  "imageAspect",
  "family",
  "hotspotClass",
  "status",
  "actionKind",
  "roles",
  "lobby",
  "patch",
]);

const SKIP_EXACT = new Set([
  "A",
  "B",
  "C",
  "D",
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkFiles(fullPath);
    return /\.(js|jsx)$/.test(entry.name) ? [fullPath] : [];
  });
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function fieldName(node) {
  if (!node) return "";
  if (node.type === "Identifier") return node.name;
  if (node.type === "StringLiteral") return node.value;
  if (node.type === "NumericLiteral") return String(node.value);
  return "";
}

function looksLikeAssetOrCode(value) {
  const text = value.trim();
  if (!text || SKIP_EXACT.has(text)) return true;
  if (text.startsWith(".")) return true;
  if (text.includes("://")) return true;
  if (/^(\.\/|\.\.\/|\/)/.test(text)) return true;
  if (/\.(png|jpg|jpeg|svg|webp|gif|css|js|jsx|json|html|md)$/i.test(text)) return true;
  if (/(^|\s)(react-|scene-|coord-|device-console|action-queue|map-|draw-preview|role-)/.test(text)) return true;
  if (/^[a-z0-9_-]+$/i.test(text) && !/[A-ZÁÉÍÓÚÑáéíóúñ ]/.test(text)) return true;
  if (/^#[0-9a-f]{3,8}$/i.test(text)) return true;
  if (/^[.#]?[a-z0-9_-]+(\s+[a-z0-9_-]+)*$/i.test(text) && text.includes("-")) return true;
  return false;
}

function isImportSource(node, parent) {
  return parent?.type === "ImportDeclaration" && parent.source === node;
}

function isObjectKey(node, parent) {
  return parent?.type === "ObjectProperty" && parent.key === node && !parent.computed;
}

function getUsage(node, parent) {
  if (parent?.type === "ObjectProperty") return fieldName(parent.key) || "object_value";
  if (parent?.type === "JSXAttribute") return fieldName(parent.name) || "jsx_attribute";
  if (parent?.type === "VariableDeclarator") return fieldName(parent.id) || "variable";
  if (parent?.type === "CallExpression") return "call_argument";
  if (parent?.type === "ReturnStatement") return "return";
  if (parent?.type === "ConditionalExpression") return "conditional";
  if (parent?.type === "TemplateLiteral") return "template";
  return parent?.type || "literal";
}

function shouldInclude(value, node, parent, usage) {
  if (isImportSource(node, parent) || isObjectKey(node, parent)) return false;
  if (parent?.type === "JSXAttribute" && SKIP_ATTRIBUTE_NAMES.has(usage)) return false;
  if (parent?.type === "ObjectProperty" && SKIP_OBJECT_FIELDS.has(usage)) return false;
  if (looksLikeAssetOrCode(value)) return false;
  return /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(value);
}

function traverse(node, parent, visitor) {
  if (!node || typeof node !== "object") return;
  visitor(node, parent);

  for (const [key, value] of Object.entries(node)) {
    if (key === "loc" || key === "start" || key === "end" || key === "extra") continue;
    if (Array.isArray(value)) {
      value.forEach((child) => traverse(child, node, visitor));
    } else if (value && typeof value.type === "string") {
      traverse(value, node, visitor);
    }
  }
}

const rows = [];

for (const filePath of walkFiles(SRC_DIR)) {
  const source = fs.readFileSync(filePath, "utf8");
  const relPath = path.relative(ROOT, filePath).replaceAll("\\", "/");
  let ast;

  try {
    ast = parse(source, {
      sourceType: "module",
      plugins: ["jsx"],
      errorRecovery: true,
    });
  } catch (error) {
    rows.push({
      id: `parse_error.${relPath}`,
      file: relPath,
      line: "",
      usage: "parse_error",
      text: error.message,
      notes: "Revisar manualmente.",
    });
    continue;
  }

  traverse(ast, null, (node, parent) => {
    let value = null;
    let usage = getUsage(node, parent);

    if (node.type === "StringLiteral") {
      value = node.value;
    } else if (node.type === "JSXText") {
      value = node.value.replace(/\s+/g, " ").trim();
      usage = "jsx_text";
    } else if (node.type === "TemplateLiteral") {
      value = node.quasis.map((quasi, index) => {
        const raw = quasi.value.cooked ?? quasi.value.raw;
        return index < node.expressions.length ? `${raw}\${...}` : raw;
      }).join("").replace(/\s+/g, " ").trim();
      usage = "template";
    } else {
      return;
    }

    if (!shouldInclude(value, node, parent, usage)) return;

    const line = node.loc?.start?.line || "";
    rows.push({
      id: `${relPath.replace(/[^a-z0-9]+/gi, "_")}.${line}.${usage}.${rows.length + 1}`,
      file: relPath,
      line,
      usage,
      text: value,
      notes: "",
    });
  });
}

const header = ["text_id", "source_file", "line", "usage", "current_text", "notes"];
const csv = [
  header.map(csvEscape).join(","),
  ...rows.map((row) => [
    row.id,
    row.file,
    row.line,
    row.usage,
    row.text,
    row.notes,
  ].map(csvEscape).join(",")),
].join("\n");

fs.writeFileSync(OUTPUT, `${csv}\n`, "utf8");
console.log(`Exported ${rows.length} text rows to ${path.relative(ROOT, OUTPUT)}`);
