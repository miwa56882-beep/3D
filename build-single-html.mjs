import { build } from "esbuild";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const outputHtmlPath = path.join(rootDir, "index.html");
const docsHtmlPath = path.join(rootDir, "docs", "index.html");
const submissionHtmlPath = path.join(rootDir, "submission", "index.html");
const backupHtmlPath = path.join(rootDir, "index.modular.html");
const cssPath = path.join(rootDir, "styles.css");
const entryPath = path.join(rootDir, "src", "main.js");

await ensureBackupTemplate();

const templateHtml = await fs.readFile(backupHtmlPath, "utf8");
const css = await fs.readFile(cssPath, "utf8");
const { CATEGORY_META, FLOOR_DATA } = await import(
  `${pathToFileURL(path.join(rootDir, "src", "floorData.js")).href}?t=${Date.now()}`
);

const inlineFloorData = await Promise.all(
  FLOOR_DATA.map(async (floor) => ({
    ...floor,
    imageUrl: await fileUrlToDataUrl(floor.imageUrl),
  })),
);

const floorModuleSource = [
  `export const CATEGORY_META = ${JSON.stringify(CATEGORY_META, null, 2)};`,
  `export const FLOOR_DATA = ${JSON.stringify(inlineFloorData, null, 2)};`,
].join("\n\n");

const result = await build({
  entryPoints: [entryPath],
  absWorkingDir: rootDir,
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  write: false,
  plugins: [
    {
      name: "virtual-floor-data",
      setup(buildContext) {
        buildContext.onResolve({ filter: /^\.\/floorData\.js$/ }, () => ({
          path: "virtual:floorData",
          namespace: "virtual-floor-data",
        }));

        buildContext.onLoad(
          { filter: /^virtual:floorData$/, namespace: "virtual-floor-data" },
          () => ({
            contents: floorModuleSource,
            loader: "js",
          }),
        );
      },
    },
  ],
});

const bundledJs = escapeScriptContent(result.outputFiles[0].text);
const inlineCss = css.replace(/<\/style/gi, "<\\/style");

const bundledHtml = templateHtml
  .replace(
    /<link rel="stylesheet" href="\.\/styles\.css" \/>/,
    `<style>\n${inlineCss}\n    </style>`,
  )
  .replace(
    /\s*<script type="importmap">[\s\S]*?<\/script>\s*<script type="module" src="\.\/src\/main\.js"><\/script>/,
    `\n    <script>\n${bundledJs}\n    </script>`,
  );

await fs.mkdir(path.dirname(docsHtmlPath), { recursive: true });
await fs.mkdir(path.dirname(submissionHtmlPath), { recursive: true });

await Promise.all([
  fs.writeFile(outputHtmlPath, bundledHtml, "utf8"),
  fs.writeFile(docsHtmlPath, bundledHtml, "utf8"),
  fs.writeFile(submissionHtmlPath, bundledHtml, "utf8"),
  fs.writeFile(path.join(rootDir, "docs", ".nojekyll"), "", "utf8"),
]);

console.log(
  `Generated single-file HTML: ${[
    path.relative(rootDir, outputHtmlPath),
    path.relative(rootDir, docsHtmlPath),
    path.relative(rootDir, submissionHtmlPath),
  ].join(", ")}`,
);

async function ensureBackupTemplate() {
  try {
    await fs.access(backupHtmlPath);
  } catch {
    await fs.copyFile(outputHtmlPath, backupHtmlPath);
  }
}

async function fileUrlToDataUrl(fileUrl) {
  const filePath = fileURLToPath(fileUrl);
  const buffer = await fs.readFile(filePath);
  return `data:${getMimeType(filePath)};base64,${buffer.toString("base64")}`;
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") {
    return "image/png";
  }
  if (ext === ".bmp") {
    return "image/bmp";
  }
  if (ext === ".jpg" || ext === ".jpeg") {
    return "image/jpeg";
  }
  if (ext === ".webp") {
    return "image/webp";
  }

  return "application/octet-stream";
}

function escapeScriptContent(source) {
  return source.replace(/<\/script/gi, "<\\/script");
}
