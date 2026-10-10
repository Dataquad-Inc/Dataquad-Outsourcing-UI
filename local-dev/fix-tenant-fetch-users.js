/**
 * Replace fetch(...) that hit API_BASE_URL / BASE_URL with tenantFetch(...).
 * Skips blob/file downloads (resolvedSource, object URLs).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "src");
const importLineFor = (relFromSrc) => {
  const depth = relFromSrc.split(/[/\\]/).length - 1;
  const prefix = "../".repeat(depth);
  return `import { tenantFetch } from "${prefix}utils/tenant";\n`;
};

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(js|jsx|ts|tsx)$/.test(ent.name)) out.push(p);
  }
  return out;
}

const files = walk(root);
let total = 0;
for (const file of files) {
  let s = fs.readFileSync(file, "utf8");
  if (!s.includes("fetch(")) continue;
  if (!s.includes("API_BASE_URL") && !/\bBASE_URL\b/.test(s)) continue;

  // Skip pure blob helpers that only fetch resolvedSource
  const looksLikeApi =
    /fetch\(\s*[`"']?\s*\$?\{?(API_BASE_URL|BASE_URL)/.test(s) ||
    /const\s+\w+\s*=\s*`?\$\{?(API_BASE_URL|BASE_URL)[\s\S]{0,120}?fetch\(\s*\w+/.test(s);

  if (!looksLikeApi && !/fetch\(\s*\n\s*`\$\{(API_BASE_URL|BASE_URL)/.test(s)) {
    // still try multiline fetch( then template with API_BASE_URL
    if (!/fetch\(\s*\n[\s\S]{0,80}\$\{(API_BASE_URL|BASE_URL)/.test(s)) continue;
  }

  let before = s;
  // Contiguous: fetch(`${API_BASE_URL
  s = s.replace(/fetch\(\s*(`\$\{(?:API_BASE_URL|BASE_URL))/g, "tenantFetch($1");
  // fetch(url where url was built from API_BASE_URL nearby — handled per-file below via await fetch(
  // Multiline: await fetch(\n        `${API_BASE_URL
  s = s.replace(
    /fetch\(\s*\n(\s*)(`\$\{(?:API_BASE_URL|BASE_URL))/g,
    "tenantFetch(\n$1$2"
  );
  // fetch(url, { where previous lines assigned API_BASE_URL to url — replace remaining await fetch( only in team files
  // Generic: if file has only API fetches, replace bare await fetch( that aren't blob
  if (
    /API_BASE_URL/.test(s) &&
    !/resolvedSource/.test(s) &&
    (file.includes("IndTeamCreate") ||
      file.includes("TeamManagementForm") ||
      file.includes("Teamlist") ||
      file.includes("submissionSlice") ||
      file.includes("AdroitHome") ||
      file.includes("UsSubmissions") ||
      file.includes("UsRequirements") ||
      file.includes("UsEmployees") ||
      file.includes("UsClients") ||
      file.includes("Hotlist") ||
      file.includes("attendance") ||
      file.includes("DownloadResume"))
  ) {
    s = s.replace(/\bawait fetch\(/g, "await tenantFetch(");
    s = s.replace(/\breturn fetch\(/g, "return tenantFetch(");
    // avoid double
    s = s.replace(/tenanttenantFetch/g, "tenantFetch");
    s = s.replace(/await tenantFetch\(/g, "await tenantFetch(");
  }

  // Undo accidental blob replacements if any slipped (none expected in those files)

  if (s === before) continue;

  if (!s.includes("tenantFetch") || !/from ["'].*utils\/tenant["']/.test(s)) {
    // ensure import exists
    if (!/from ["'][^"']*utils\/tenant["']/.test(s)) {
      const rel = path.relative(root, file).replace(/\\/g, "/");
      const line = importLineFor(rel);
      const m = s.match(/^(import[\s\S]*?;\s*\n)/m);
      if (m) {
        s = s.slice(0, m.index + m[0].length) + line + s.slice(m.index + m[0].length);
      } else {
        s = line + s;
      }
    }
  }

  // Deduplicate import
  const importRe = /import\s*\{\s*tenantFetch\s*\}\s*from\s*["'][^"']*utils\/tenant["'];\s*\n/g;
  const imports = s.match(importRe) || [];
  if (imports.length > 1) {
    let i = 0;
    s = s.replace(importRe, () => (i++ === 0 ? imports[0] : ""));
  }

  fs.writeFileSync(file, s);
  total++;
  console.log("patched", path.relative(root, file));
}
console.log("files patched:", total);
