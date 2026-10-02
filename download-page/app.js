import { API, formatSize, pickApk, shortSha } from "./release.js";

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

const builds = [
  { id: "uat", path: "/releases/tags/uat-latest" },
  { id: "staging", path: "/releases/tags/staging-latest" },
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
  const response = await fetch(`${API}${path}`, {
    headers: { Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`);
  return response.json();
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
  if (!ready) return;

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

async function refresh(build) {
  build.state = "loading";
  renderBuild(build);
  try {
    const release = await loadRelease(build.path);
    const apk = pickApk(release);
    Object.assign(
      build,
      apk ? { state: "ready", release, apk } : { state: "none" }
    );
  } catch {
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
