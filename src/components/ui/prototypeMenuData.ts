export type PrototypeMenuLocaleLabel = Readonly<{
  en: string;
  th: string;
}>;

export type PrototypePersonaRole =
  "hirer" | "applicant" | "team-leader" | "worker";

export type PrototypePersona = Readonly<{
  id: string;
  roles: readonly PrototypePersonaRole[];
  label: PrototypeMenuLocaleLabel;
}>;

export const PROTOTYPE_PERSONAS = [
  {
    id: "demo-hirer",
    roles: ["hirer"],
    label: { en: "Hirer", th: "ผู้ว่าจ้าง" },
  },
  {
    id: "student-demo",
    roles: ["applicant", "team-leader"],
    label: { en: "Applicant / Team Leader A", th: "ผู้สมัคร / หัวหน้าทีม A" },
  },
  {
    id: "demo-worker-2",
    roles: ["worker"],
    label: { en: "Invited Worker", th: "ผู้ทำงานที่ได้รับเชิญ" },
  },
  {
    id: "demo-worker-3",
    roles: ["team-leader"],
    label: { en: "Team Leader B", th: "หัวหน้าทีม B" },
  },
] as const satisfies readonly PrototypePersona[];

export type PrototypePersonaId = (typeof PROTOTYPE_PERSONAS)[number]["id"];

export const DEFAULT_PROTOTYPE_PERSONA_ID: PrototypePersonaId = "student-demo";

export const PROTOTYPE_SCENARIOS = [
  {
    id: "team-forming-demo",
    route: "/quest/team-forming-demo",
    label: { en: "Team forming", th: "การรวมทีม" },
  },
  {
    id: "team-selection-demo",
    route: "/quest/team-selection-demo",
    label: { en: "Team selection", th: "การเลือกทีม" },
  },
  {
    id: "single-candidate-demo",
    route: "/quest/single-candidate-demo",
    label: { en: "Single candidate", th: "ผู้สมัครเดี่ยว" },
  },
  {
    id: "partial-group-start-demo",
    route: "/quest/partial-group-start-demo",
    label: { en: "Partial group start", th: "เริ่มกลุ่มไม่เต็มจำนวน" },
  },
  {
    id: "proof-in-progress-demo",
    route: "/quest/proof-in-progress-demo",
    label: { en: "Proof · single FCFS", th: "ส่งหลักฐาน · เดี่ยว FCFS" },
  },
  {
    id: "proof-free-in-progress-demo",
    route: "/quest/proof-free-in-progress-demo",
    label: { en: "No proof · single FCFS", th: "ไม่ใช้หลักฐาน · เดี่ยว FCFS" },
  },
  {
    id: "proof-candidate-in-progress-demo",
    route: "/quest/proof-candidate-in-progress-demo",
    label: {
      en: "Proof · single Candidate",
      th: "ส่งหลักฐาน · Candidate เดี่ยว",
    },
  },
  {
    id: "proof-free-candidate-in-progress-demo",
    route: "/quest/proof-free-candidate-in-progress-demo",
    label: {
      en: "No proof · single Candidate",
      th: "ไม่ใช้หลักฐาน · Candidate เดี่ยว",
    },
  },
  {
    id: "proof-group-in-progress-demo",
    route: "/quest/proof-group-in-progress-demo",
    label: { en: "Proof · group FCFS", th: "ส่งหลักฐาน · กลุ่ม FCFS" },
  },
  {
    id: "proof-free-group-in-progress-demo",
    route: "/quest/proof-free-group-in-progress-demo",
    label: { en: "No proof · group FCFS", th: "ไม่ใช้หลักฐาน · กลุ่ม FCFS" },
  },
  {
    id: "proof-team-in-progress-demo",
    route: "/quest/proof-team-in-progress-demo",
    label: { en: "Proof · Candidate Team", th: "ส่งหลักฐาน · ทีม Candidate" },
  },
  {
    id: "proof-free-team-in-progress-demo",
    route: "/quest/proof-free-team-in-progress-demo",
    label: {
      en: "No proof · Candidate Team",
      th: "ไม่ใช้หลักฐาน · ทีม Candidate",
    },
  },
  {
    id: "roleplay-demo",
    route: "/dev/roleplay",
    label: { en: "Roleplay Quest", th: "จำลองบทบาท Quest" },
  },
] as const;

export type PrototypeScenarioId = (typeof PROTOTYPE_SCENARIOS)[number]["id"];
export type PrototypeScenarioRoute =
  (typeof PROTOTYPE_SCENARIOS)[number]["route"];

export type PrototypeResetScope = "current" | "all";
export type PrototypePersonaChangeHandler = (
  personaId: PrototypePersonaId
) => void;
export type PrototypeScenarioSelectHandler = (
  route: PrototypeScenarioRoute
) => void;
export type PrototypeResetHandler = (scope: PrototypeResetScope) => void;

export function isPrototypePersonaId(
  value: string | null | undefined
): value is PrototypePersonaId {
  return PROTOTYPE_PERSONAS.some((persona) => persona.id === value);
}

export function isPrototypeScenarioRoute(
  value: string | null | undefined
): value is PrototypeScenarioRoute {
  return PROTOTYPE_SCENARIOS.some((scenario) => scenario.route === value);
}
