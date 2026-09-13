/**
 * Presentation categories for the report form. The Admin report API is not
 * wired yet, so these values must not be treated as a server enum.
 */
export const REPORT_TOPIC_VALUES = [
  "REPORT_ABUSIVE_OR_HARASSMENT",
  "CONDUCT_ABANDONED",
  "CONDUCT_OUT_OF_SCOPE",
  "CONDUCT_NO_SHOW",
  "REPORT_PROOF_REVIEW",
  "REPORT_REWARD_SETTLEMENT",
] as const;

export type ReportTopic = (typeof REPORT_TOPIC_VALUES)[number];

export type ReportSource = "quest" | "chat";

export interface ReportRouteParams {
  source?: ReportSource;
  questId?: string;
  questTitle?: string;
  viewerId?: string;
  reportedMemberId?: string;
}

export interface ReportFormValue {
  topics: ReportTopic[];
  details: string;
}
