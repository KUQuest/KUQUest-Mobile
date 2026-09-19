import type { RoleplayActionType } from "@/features/roleplay/roleplayTypes";
import type { SupportedLocale } from "./locale";

export interface RoleplayMessages {
  back: string;
  eyebrow: string;
  title: string;
  description: string;
  scenarios: string;
  scenariosDescription: string;
  scenario: string;
  scenarioDescription: string;
  state: string;
  activePersona: string;
  personas: string;
  personasDescription: string;
  applications: string;
  applicationId: string;
  applicant: string;
  noApplications: string;
  teams: string;
  teamsDescription: string;
  teamMembers: string;
  selectTeam: string;
  rejectTeam: string;
  invitations: string;
  invitationDescription: string;
  acceptInvitation: string;
  declineInvitation: string;
  actions: string;
  actionsDescription: string;
  noActions: string;
  reset: string;
  resetDescription: string;
  resetFeedback: string;
  switchedPersona: (label: string) => string;
  actionSucceeded: (label: string, state: string) => string;
  actionBlocked: (code: string) => string;
  ineligible: string;
  approve: string;
  decline: string;
  actionLabels: Partial<Record<RoleplayActionType, string>>;
  actionDescriptions: Partial<Record<RoleplayActionType, string>>;
}

export const roleplayMessages: Record<SupportedLocale, RoleplayMessages> = {
  en: {
    back: "Go back",
    eyebrow: "Development-only prototype",
    title: "Roleplay Quest",
    description:
      "Switch demo personas and observe the same in-memory Quest workflow.",
    scenarios: "Roleplay scenarios",
    scenariosDescription:
      "Choose one of the four canonical participation and selection modes.",
    scenario: "Selected scenario",
    scenarioDescription:
      "This screen reads the stable roleplay fixture contract.",
    state: "Canonical Quest state",
    activePersona: "Active persona",
    personas: "Switch persona",
    personasDescription:
      "Only the personas supported by this roleplay scenario are shown.",
    applications: "Candidate applications",
    applicationId: "Application",
    applicant: "Applicant",
    noApplications: "No Candidate applications are available.",
    teams: "Candidate Teams",
    teamsDescription:
      "Team Candidate proposals are formed by members and selected by the Hirer.",
    teamMembers: "Members",
    selectTeam: "Accept",
    rejectTeam: "Decline",
    invitations: "Team invitations",
    invitationDescription: "Respond to an invitation from a Candidate Team.",
    acceptInvitation: "Accept invitation",
    declineInvitation: "Decline invitation",
    actions: "Allowed actions",
    actionsDescription:
      "Actions come from the active persona's capability projection.",
    noActions: "No actions are currently available for this persona.",
    reset: "Reset prototype state",
    resetDescription: "Restore the deterministic in-memory fixture.",
    resetFeedback: "Prototype state reset.",
    switchedPersona: (label) => `Active persona changed to ${label}.`,
    actionSucceeded: (label, state) =>
      `${label} completed. Quest state is now ${state}.`,
    actionBlocked: (code) =>
      `Action blocked by the fixture contract (${code}).`,
    ineligible: "This action is not available for the active persona.",
    approve: "Approve",
    decline: "Decline",
    actionLabels: {
      DIRECT_JOIN: "Join Quest",
      APPLY: "Apply as Candidate",
      CREATE_TEAM: "Create Candidate Team",
      INVITE_WORKER: "Invite Worker",
      RESPOND_INVITATION: "Respond to Invitation",
      SUBMIT_TEAM: "Submit Team",
      SELECT_CANDIDATE: "Accept",
      REJECT_CANDIDATE: "Decline",
      REJECT_TEAM: "Decline",
      VOTE_PARTIAL_GROUP_START_CONSENT: "Approve partial start",
      CANCEL: "Cancel Quest",
    },
    actionDescriptions: {
      DIRECT_JOIN:
        "Join directly; the first eligible Worker receives the slot.",
      APPLY: "Submit an individual Candidate application.",
      CREATE_TEAM: "Start a Candidate Team for a GROUP Quest.",
      INVITE_WORKER: "Invite another Worker to your forming Team.",
      RESPOND_INVITATION: "Accept or decline a Candidate Team invitation.",
      SUBMIT_TEAM: "Submit the exact-headcount Team to the Hirer.",
      SELECT_CANDIDATE: "Accept this Candidate for the Quest.",
      REJECT_CANDIDATE: "Reject this Candidate application.",
      REJECT_TEAM: "Reject this submitted Candidate Team.",
      VOTE_PARTIAL_GROUP_START_CONSENT:
        "Approve the revised roster and reward for an underfilled Team Quest.",
      CANCEL: "Cancel the open Quest and end the prototype flow.",
    },
  },
  th: {
    scenarios: "Roleplay scenarios",
    scenariosDescription:
      "Choose one of the four canonical participation and selection modes.",
    teams: "Candidate Teams",
    teamsDescription:
      "Team Candidate proposals are formed by members and selected by the Hirer.",
    teamMembers: "Members",
    selectTeam: "รับ",
    rejectTeam: "ปฏิเสธ",
    invitations: "Team invitations",
    invitationDescription: "Respond to an invitation from a Candidate Team.",
    acceptInvitation: "Accept invitation",
    declineInvitation: "Decline invitation",
    approve: "Approve",
    decline: "Decline",
    back: "ย้อนกลับ",
    eyebrow: "ต้นแบบสำหรับการพัฒนาเท่านั้น",
    title: "จำลองบทบาท Quest",
    description:
      "สลับตัวตนตัวอย่างและดูการทำงานของ Quest เดียวกันในหน่วยความจำ",
    scenario: "สถานการณ์ที่เลือก",
    scenarioDescription:
      "หน้าจอนี้อ่านข้อมูลจากสัญญา roleplay fixture ที่เสถียร",
    state: "สถานะ Quest มาตรฐาน",
    activePersona: "ตัวตนที่ใช้งาน",
    personas: "สลับตัวตน",
    personasDescription: "แสดงเฉพาะตัวตนที่สถานการณ์ roleplay นี้รองรับ",
    applications: "ใบสมัคร Candidate",
    applicationId: "ใบสมัคร",
    applicant: "ผู้สมัคร",
    noApplications: "ไม่มีใบสมัคร Candidate",
    actions: "การกระทำที่อนุญาต",
    actionsDescription: "การกระทำมาจากความสามารถของตัวตนที่ใช้งาน",
    noActions: "ตัวตนนี้ไม่มีการกระทำที่ใช้งานได้ในขณะนี้",
    reset: "รีเซ็ตสถานะต้นแบบ",
    resetDescription: "คืนค่าข้อมูลตัวอย่างในหน่วยความจำให้เป็นค่าเริ่มต้น",
    resetFeedback: "รีเซ็ตสถานะต้นแบบแล้ว",
    switchedPersona: (label) => `เปลี่ยนตัวตนที่ใช้งานเป็น ${label} แล้ว`,
    actionSucceeded: (label, state) =>
      `${label} สำเร็จ สถานะ Quest คือ ${state}`,
    actionBlocked: (code) => `การกระทำถูกปฏิเสธโดยสัญญา fixture (${code})`,
    ineligible: "ตัวตนที่ใช้งานไม่มีสิทธิ์ทำการกระทำนี้",
    actionLabels: {
      APPLY: "สมัครเป็น Candidate",
      SELECT_CANDIDATE: "รับ",
      REJECT_CANDIDATE: "ปฏิเสธ",
      REJECT_TEAM: "ปฏิเสธ",
      CANCEL: "ยกเลิก Quest",
    },
    actionDescriptions: {
      APPLY: "ส่งใบสมัคร Candidate แบบรายบุคคล",
      SELECT_CANDIDATE: "รับ Candidate นี้เข้าร่วม Quest",
      REJECT_CANDIDATE: "ปฏิเสธใบสมัครของ Candidate นี้",
      CANCEL: "ยกเลิก Quest ที่เปิดอยู่และจบการจำลอง",
    },
  },
};
