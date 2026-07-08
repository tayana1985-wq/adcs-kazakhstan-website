import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const htmlFiles = fs.readdirSync(root).filter((file) => file.endsWith(".html"));
const dataCode = fs.readFileSync(path.join(root, "data.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(dataCode, context);

const data = context.window.ADCS_DATA;
const errors = [];

if (!data) {
  errors.push("data.js does not expose window.ADCS_DATA");
}

const languages = data?.languages || [];
const routes = data?.routes || [];
const menuItems = data?.menuItems || [];
const translations = data?.translations || {};

if (menuItems.length !== 11) {
  errors.push(`menuItems must contain 11 items, found ${menuItems.length}`);
}

for (const language of ["ru", "kk", "en"]) {
  const menu = translations[language]?.menu || {};
  for (const item of menuItems) {
    if (!menu[item.key]) {
      errors.push(`Missing ${language} menu translation for ${item.key}`);
    }
  }
}

function localizedFile(href, language) {
  const file = href.split("#")[0].replace(/^\.\//, "");
  if (language === "ru") return file;
  const suffix = language === "kk" ? "-kz" : "-en";
  return file.replace(/\.html$/, `${suffix}.html`);
}

function isLocalAssetUrl(value) {
  return /\.(css|js|jpg|jpeg|png|svg|webp|ico)$/i.test(value) && !/^(https?:|mailto:|tel:|#|\.\/)/.test(value);
}

for (const route of routes) {
  for (const language of languages) {
    const file = localizedFile(route.href, language.code);
    if (!fs.existsSync(path.join(root, file))) {
      errors.push(`Missing localized page: ${file}`);
    }
  }
}

for (const file of htmlFiles) {
  const text = fs.readFileSync(path.join(root, file), "utf8");
  if (!text.includes('src="./data.js"') || !text.includes('src="./site.js"')) {
    errors.push(`${file} must include ./data.js and ./site.js`);
  }

  if (!text.includes('href="./style.css"')) {
    errors.push(`${file} must include ./style.css`);
  }

  if (!text.includes('src="./assets/adcs-logo-official.png"')) {
    errors.push(`${file} must include logo from ./assets`);
  }

  for (const match of text.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (isLocalAssetUrl(match[1])) {
      errors.push(`${file} uses non-explicit local asset path ${match[1]}`);
    }
  }

  for (const match of text.matchAll(/href="([^"]+\.html(?:#[^"]*)?)"/g)) {
    const target = match[1].split("#")[0].replace(/^\.\//, "");
    if (!fs.existsSync(path.join(root, target))) {
      errors.push(`${file} links to missing page ${match[1]}`);
    }
  }
}

const cssText = fs.readFileSync(path.join(root, "style.css"), "utf8");
if (/url\(["']?assets\//.test(cssText)) {
  errors.push("style.css must use ./assets/... in url() paths");
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validation passed: ${htmlFiles.length} HTML files, ${menuItems.length} shared menu items, ${languages.length} languages.`);
