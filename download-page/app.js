/* global qrcode */
import { formatSize, parseNotes, pickApk, shortSha } from "./release.js";

const messages = {
  en: {
    title: "Get KUQuest on Android",
    lede: "KUQuest is for people with an @ku.th account. Pick a build, download the APK, then install it.",
    uatName: "UAT",
    uatNote:
      "The latest main build, for acceptance testing against the UAT server.",
    stagingName: "Staging",
    stagingNote:
      "The latest develop build, for testing against the staging server.",
    version: "Version",
    build: "Build",
    commit: "Commit",
    size: "Size",
    updated: "Updated",
    package: "Package",
    message: "Latest change",
    buildLog: "Build log",
    scan: "Show QR code for your phone",
    qrLabel: "QR code that opens the APK download",
    download: "Download APK",
    retry: "Try again",
    checking: "Checking the latest build…",
    none: "No build has been published yet.",
    error: "Could not load build details.",
    installTitle: "How to install",
    step1: "Open this page on your Android phone and tap Download APK.",
    step2: "When Android asks, allow your browser to install unknown apps.",
    step3: "Open the downloaded file and tap Install.",
    sideBySide: "UAT and Staging can be installed side by side.",
    verify:
      "Compare the SHA-256 with the value shown to confirm the file is intact.",
    allReleases: "All releases on GitHub",
    otherLanguage: "ไทย",
    otherLanguageCode: "th",
    dateLocale: "en-GB",
  },
  th: {
    title: "ดาวน์โหลด KUQuest สำหรับ Android",
    lede: "KUQuest สำหรับผู้ที่มีบัญชี @ku.th เลือกเวอร์ชัน ดาวน์โหลดไฟล์ APK แล้วติดตั้ง",
    uatName: "เวอร์ชัน UAT",
    uatNote: "รุ่นล่าสุดจาก main สำหรับทดสอบยอมรับกับเซิร์ฟเวอร์ UAT",
    stagingName: "เวอร์ชันทดสอบ",
    stagingNote: "รุ่นล่าสุดจาก develop สำหรับทดสอบกับเซิร์ฟเวอร์ staging",
    version: "เวอร์ชัน",
    build: "บิลด์",
    commit: "คอมมิต",
    size: "ขนาด",
    updated: "อัปเดต",
    package: "แพ็กเกจ",
    message: "การเปลี่ยนแปลงล่าสุด",
    buildLog: "บันทึกการบิลด์",
    scan: "แสดง QR code สำหรับโทรศัพท์",
    qrLabel: "QR code สำหรับดาวน์โหลด APK",
    download: "ดาวน์โหลด APK",
    retry: "ลองอีกครั้ง",
    checking: "กำลังตรวจสอบรุ่นล่าสุด…",
    none: "ยังไม่มีรุ่นที่เผยแพร่",
    error: "โหลดข้อมูลรุ่นไม่สำเร็จ",
    installTitle: "วิธีติดตั้ง",
    step1: "เปิดหน้านี้บนโทรศัพท์ Android แล้วแตะ ดาวน์โหลด APK",
    step2:
      "เมื่อ Android ถาม ให้อนุญาตเบราว์เซอร์ติดตั้งแอปจากแหล่งที่ไม่รู้จัก",
    step3: "เปิดไฟล์ที่ดาวน์โหลด แล้วแตะ ติดตั้ง",
    sideBySide: "ติดตั้งเวอร์ชัน UAT และเวอร์ชันทดสอบไว้ด้วยกันได้",
    verify: "เปรียบเทียบ SHA-256 กับค่าที่แสดงเพื่อยืนยันว่าไฟล์ไม่เสียหาย",
    allReleases: "ดูรุ่นทั้งหมดบน GitHub",
    otherLanguage: "English",
    otherLanguageCode: "en",
    dateLocale: "th-TH",
  },
};

// Release data comes from nginx (same origin), which caches the GitHub API.
const REFRESH_MS = 5 * 60_000;
const builds = [
  {
    id: "uat",
    path: "/api/uat-latest",
    packageId: "org.kubits.kuquest.uat",
  },
  {
    id: "staging",
    path: "/api/staging-latest",
    packageId: "org.kubits.kuquest.staging",
  },
].map((build) => ({
  ...build,
  card: document.getElementById(`build-${build.id}`),
  state: "loading",
  release: null,
  apk: null,
}));

let language = "en";
try {
  language =
    localStorage.getItem("lang") ??
    (navigator.language.startsWith("th") ? "th" : "en");
} catch {
  language = navigator.language.startsWith("th") ? "th" : "en";
}

async function loadRelease(path) {
  const response = await fetch(path, { signal: AbortSignal.timeout(10_000) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
  return response.json();
}

// Draw the QR as inline SVG elements: no innerHTML, no data: URL (the CSP
// allows neither). Dark modules on a white quiet zone scan in any colour scheme.
function drawQr(svg, text, label) {
  if (typeof qrcode === "undefined") return;
  const qr = qrcode(0, "L");
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const quiet = 4;
  const size = count + 2 * quiet;
  let modules = "";
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) {
        modules += `M${col + quiet} ${row + quiet}h1v1h-1z`;
      }
    }
  }
  const ns = "http://www.w3.org/2000/svg";
  const background = document.createElementNS(ns, "rect");
  background.setAttribute("width", size);
  background.setAttribute("height", size);
  background.setAttribute("fill", "#fff");
  const path = document.createElementNS(ns, "path");
  path.setAttribute("d", modules);
  path.setAttribute("fill", "#000");
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  svg.setAttribute("aria-label", label);
  svg.replaceChildren(background, path);
}

function setRow(card, name, value) {
  const row = card.querySelector(`[data-row="${name}"]`);
  if (!row) return;
  row.hidden = !value;
  if (value) row.querySelector("dd").textContent = value;
}

function renderBuild(build) {
  const text = messages[language];
  const { card, state, release, apk } = build;
  const status = card.querySelector(".status");
  const meta = card.querySelector(".meta");
  const download = card.querySelector("a.button");
  const retry = card.querySelector("button.retry");

  const ready = state === "ready";
  status.textContent = ready
    ? ""
    : text[state === "loading" ? "checking" : state];
  status.dataset.state = state;
  meta.hidden = !ready;
  download.hidden = !ready;
  retry.hidden = state !== "error";
  card.querySelector("details.qr").hidden = !ready;
  if (!ready) {
    card.querySelector("a.log").hidden = true;
    return;
  }

  download.href = apk.url;
  setRow(card, "version", apk.version ? `v${apk.version}` : null);
  setRow(card, "build", apk.build);
  setRow(card, "commit", shortSha(release.target_commitish));
  setRow(card, "size", apk.size ? formatSize(apk.size) : null);
  setRow(
    card,
    "updated",
    new Intl.DateTimeFormat(text.dateLocale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(release.published_at))
  );
  setRow(card, "sha256", apk.sha256);
  setRow(card, "package", build.packageId);
  const notes = parseNotes(release.body);
  setRow(card, "message", notes.message);
  const log = card.querySelector("a.log");
  log.hidden = !notes.runUrl;
  if (notes.runUrl) log.href = notes.runUrl;
  drawQr(card.querySelector("svg.qr"), apk.url, text.qrLabel);
}

function render() {
  const text = messages[language];
  document.documentElement.lang = language;
  document.title = `KUQuest — ${text.title}`;
  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = text[element.dataset.i18n];
  }
  const toggle = document.getElementById("lang");
  toggle.textContent = text.otherLanguage;
  toggle.lang = text.otherLanguageCode;
  builds.forEach(renderBuild);
}

async function refresh(build, { quiet = false } = {}) {
  if (!quiet) {
    build.state = "loading";
    renderBuild(build);
  }
  try {
    const release = await loadRelease(build.path);
    const apk = pickApk(release);
    Object.assign(
      build,
      apk ? { state: "ready", release, apk } : { state: "none" }
    );
  } catch {
    // A background refresh keeps the last good data instead of showing an error.
    if (quiet) return;
    build.state = "error";
  }
  renderBuild(build);
}

document.getElementById("lang").addEventListener("click", () => {
  language = messages[language].otherLanguageCode;
  try {
    localStorage.setItem("lang", language);
  } catch {
    // Storage is blocked; the choice just lasts for this visit.
  }
  render();
});

for (const build of builds) {
  build.card
    .querySelector("button.retry")
    .addEventListener("click", () => refresh(build));
}

render();
builds.forEach(refresh);

function refreshAll() {
  builds.forEach((build) => refresh(build, { quiet: true }));
}
setInterval(() => {
  if (!document.hidden) refreshAll();
}, REFRESH_MS);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshAll();
});
