import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const targetUrl =
  process.argv[2] ?? "https://sites.google.com/view/triangle333/home";
const artifactsDir = path.resolve("artifacts", "google-sites");

const launchAttempts = [
  { channel: "msedge", headless: true },
  { channel: "chrome", headless: true },
  { headless: true },
];

const consoleMessages = [];
const pageErrors = [];
const requestFailures = [];
const launchErrors = [];

await mkdir(artifactsDir, { recursive: true });

const { browser, launchMode } = await launchBrowser();
const context = await browser.newContext({
  viewport: { width: 1440, height: 2200 },
});
const page = await context.newPage();

page.on("console", (message) => {
  consoleMessages.push({
    type: message.type(),
    text: message.text(),
    location: message.location(),
  });
});

page.on("pageerror", (error) => {
  pageErrors.push({
    name: error.name,
    message: error.message,
    stack: error.stack ?? null,
  });
});

page.on("requestfailed", (request) => {
  requestFailures.push({
    url: request.url(),
    method: request.method(),
    failure: request.failure()?.errorText ?? null,
    resourceType: request.resourceType(),
  });
});

await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(5000);

const topLevelSummary = await page.evaluate(() => ({
  href: location.href,
  title: document.title,
  iframeCount: document.querySelectorAll("iframe").length,
  iframeInfo: [...document.querySelectorAll("iframe")].map((frame, index) => ({
    index,
    src: frame.getAttribute("src"),
    sandbox: frame.getAttribute("sandbox"),
    width: frame.clientWidth,
    height: frame.clientHeight,
  })),
  dom: {
    pageShell: !!document.querySelector(".page-shell"),
    canvasHost: !!document.querySelector("#canvasHost"),
    canvasCount: document.querySelectorAll("#canvasHost canvas").length,
    labelRendererCount: document.querySelectorAll(".label-renderer").length,
    topView: !!document.querySelector("#topView"),
    resetView: !!document.querySelector("#resetView"),
    bodyTextLength: document.body?.innerText?.length ?? null,
  },
}));

const frameSummaries = [];
for (const frame of page.frames()) {
  frameSummaries.push(await summarizeFrame(frame));
}

const interestingFrames = frameSummaries.filter(
  (frame) =>
    frame.dom.pageShell ||
    frame.dom.canvasHost ||
    frame.dom.canvasCount > 0 ||
    frame.dom.bodyIncludesTitle ||
    frame.dom.bodyIncludesWebGL,
);

const screenshotPath = path.join(artifactsDir, "google-sites-page.png");
await page.screenshot({ path: screenshotPath, fullPage: true });

const report = {
  targetUrl,
  finalUrl: page.url(),
  launchMode,
  topLevelSummary,
  interestingFrames,
  allFrames: frameSummaries,
  consoleMessages,
  pageErrors,
  requestFailures,
  screenshotPath,
};

const reportPath = path.join(artifactsDir, "google-sites-report.json");
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(JSON.stringify(report, null, 2));

await context.close();
await browser.close();

async function launchBrowser() {
  for (const options of launchAttempts) {
    try {
      const browser = await chromium.launch(options);
      return {
        browser,
        launchMode: options.channel ?? "bundled-chromium",
      };
    } catch (error) {
      launchErrors.push({
        attempt: options.channel ?? "bundled-chromium",
        message: error.message,
      });
    }
  }

  throw new Error(
    `Playwright launch failed.\n${JSON.stringify(launchErrors, null, 2)}`,
  );
}

async function summarizeFrame(frame) {
  try {
    const dom = await frame.evaluate(() => {
      const canvasHost = document.querySelector("#canvasHost");
      const canvas = canvasHost?.querySelector("canvas");
      const gl = canvas?.getContext("webgl2") || canvas?.getContext("webgl");
      const bodyText = document.body?.innerText ?? "";

      return {
        title: document.title,
        readyState: document.readyState,
        pageShell: !!document.querySelector(".page-shell"),
        canvasHost: !!canvasHost,
        canvasCount: document.querySelectorAll("#canvasHost canvas").length,
        labelRendererCount: document.querySelectorAll(".label-renderer").length,
        topView: !!document.querySelector("#topView"),
        resetView: !!document.querySelector("#resetView"),
        scriptCount: document.scripts.length,
        bodyTextLength: bodyText.length,
        bodyIncludesTitle: bodyText.includes("文化祭 校内案内図"),
        bodyIncludesWebGL: bodyText.includes("WebGL"),
        hostSize: canvasHost
          ? { width: canvasHost.clientWidth, height: canvasHost.clientHeight }
          : null,
        canvasSize: canvas
          ? { width: canvas.width, height: canvas.height }
          : null,
        hasWebGL: !!gl,
      };
    });

    return {
      name: frame.name(),
      url: frame.url(),
      parentUrl: frame.parentFrame()?.url() ?? null,
      dom,
    };
  } catch (error) {
    return {
      name: frame.name(),
      url: frame.url(),
      parentUrl: frame.parentFrame()?.url() ?? null,
      error: error.message,
      dom: {
        title: null,
        readyState: null,
        pageShell: false,
        canvasHost: false,
        canvasCount: 0,
        labelRendererCount: 0,
        topView: false,
        resetView: false,
        scriptCount: null,
        bodyTextLength: null,
        bodyIncludesTitle: false,
        bodyIncludesWebGL: false,
        hostSize: null,
        canvasSize: null,
        hasWebGL: false,
      },
    };
  }
}
