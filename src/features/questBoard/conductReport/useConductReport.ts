import { useEffect, useMemo, useRef, useState } from "react";

import { ApiError } from "@/api/ApiClient";
import type {
  ConductReport,
  ConductReportReason,
} from "@/api/ConductReportApi";
import { createQuestIdempotencyKey } from "@/api/QuestApi";
import { showSweetAlert, SweetAlertVariant } from "@/components/ui/SweetAlert";
import {
  useConductReportsQuery,
  useFileConductReportMutation,
} from "@/features/questBoard/api/questBoardQueries";
import type {
  LiveQuestAssignment,
  LiveQuestParticipant,
} from "@/features/questBoard/live/liveQuestService";
import { useLocale } from "@/features/preferences/localeStore";
import { useServerCountdown } from "@/features/questBoard/shared/useServerCountdown";
import { conductReportMessages } from "@/locales/conductReportMessages";
import { getLocalizedErrorMessage } from "@/utils/error";

const MAX_DETAIL_LENGTH = 1000;

export const ConductReportRole = {
  HIRER: "HIRER",
  WORKER: "WORKER",
} as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type ConductReportRole =
  (typeof ConductReportRole)[keyof typeof ConductReportRole];

/** Reasons each role files (admin-conduct-report-contract.md, "Allowed reasons"). */
const ROLE_REASONS: Record<ConductReportRole, readonly ConductReportReason[]> =
  {
    [ConductReportRole.HIRER]: ["CONDUCT_ABANDONED"],
    [ConductReportRole.WORKER]: ["CONDUCT_OUT_OF_SCOPE", "CONDUCT_NO_SHOW"],
  };

export type ConductReportTarget = {
  id: string;
  label: string;
  reason: ConductReportReason;
};
export type FiledConductReport = ConductReport & { memberName: string };

interface ConductReportInput {
  role: ConductReportRole;
  questId: string | null;
  viewerId: string;
  assignments: readonly LiveQuestAssignment[];
  participants?: readonly LiveQuestParticipant[];
  /** Names the Hirer when a Worker reports them; the report list carries only ids. */
  hirerName?: string;
  /** The Quest State; a change re-reads `reportable`, which the Server derives from it. */
  questState?: string;
}

/**
 * Conduct Report filing for the viewer's role. The Server decides who can be
 * reported (`reportable`); the app only names the Members it returns for the
 * reasons that role files.
 */
export function useConductReport({
  role,
  questId,
  viewerId,
  assignments,
  participants,
  hirerName,
  questState,
}: ConductReportInput) {
  const { locale } = useLocale();
  const messages = conductReportMessages[locale];
  const copy = messages.copy[role];
  const reportsQuery = useConductReportsQuery(questId, viewerId || null);
  const fileMutation = useFileConductReportMutation();
  const keysRef = useRef<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const windowRemaining = useServerCountdown(reportsQuery.data?.windowEndsAt);
  const windowOpen = windowRemaining === null || windowRemaining > 0;
  const { refetch } = reportsQuery;
  const seenStateRef = useRef(questState);
  useEffect(() => {
    if (seenStateRef.current === questState) return;
    seenStateRef.current = questState;
    void refetch();
  }, [questState, refetch]);

  const memberName = useMemo(() => {
    const names = new Map<string, string>();
    for (const participant of participants ?? []) {
      names.set(participant.id, participant.displayName);
    }
    assignments.forEach((assignment, index) => {
      const name =
        assignment.member?.displayName ??
        names.get(assignment.workerId) ??
        messages.workerFallback(index + 1);
      names.set(assignment.workerId, name);
    });
    return (memberId: string) =>
      names.get(memberId) ??
      (role === ConductReportRole.WORKER ? hirerName : undefined) ??
      copy.targetLabel;
  }, [assignments, copy, hirerName, messages, participants, role]);

  const targets = useMemo<ConductReportTarget[]>(
    () =>
      (reportsQuery.data?.reportable ?? [])
        .filter(({ reason }) => ROLE_REASONS[role].includes(reason))
        .map(({ memberId, reason }) => ({
          id: memberId,
          label: memberName(memberId),
          reason,
        })),
    [memberName, reportsQuery.data, role]
  );
  const filedReports = useMemo<FiledConductReport[]>(
    () =>
      (reportsQuery.data?.items ?? []).map((report) => ({
        ...report,
        memberName: memberName(report.reportedMemberId),
      })),
    [memberName, reportsQuery.data]
  );
  const selectedTarget =
    targets.find((target) => target.id === selectedId) ?? targets[0] ?? null;

  const openReport = () => {
    setSelectedId(null);
    setDetail("");
    setSubmitError(null);
    setOpen(true);
  };
  const closeReport = () => {
    if (!fileMutation.isPending) setOpen(false);
  };

  const errorMessage = (error: unknown) => {
    if (error instanceof ApiError) {
      if (error.code === "CONDUCT_REPORT_ALREADY_EXISTS") {
        return messages.alreadyReported;
      }
      if (error.code === "CONDUCT_REPORT_WINDOW_CLOSED") {
        return messages.windowClosed;
      }
      if (error.code === "CONDUCT_REPORT_NOT_ALLOWED") {
        return messages.notAllowed;
      }
    }
    return getLocalizedErrorMessage(error, locale, {
      fallback: messages.errorFallback,
    });
  };

  const submit = async () => {
    if (!questId || !selectedTarget || fileMutation.isPending) return;
    const trimmedDetail = detail.trim();
    if (trimmedDetail.length > MAX_DETAIL_LENGTH) {
      setSubmitError(messages.invalidDetail);
      return;
    }
    setSubmitError(null);
    const idempotencyKey = (keysRef.current[selectedTarget.id] ??=
      createQuestIdempotencyKey());
    try {
      const report = await fileMutation.mutateAsync({
        questId,
        viewerId,
        input: {
          reportedMemberId: selectedTarget.id,
          reason: selectedTarget.reason,
          ...(trimmedDetail ? { detail: trimmedDetail } : {}),
        },
        idempotencyKey,
      });
      delete keysRef.current[selectedTarget.id];
      setOpen(false);
      showSweetAlert({
        title: messages.successTitle,
        message: messages.successDescription(report.displayId),
        variant: SweetAlertVariant.Success,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status < 500) {
        delete keysRef.current[selectedTarget.id];
      }
      setSubmitError(errorMessage(error));
    }
  };

  return {
    messages,
    copy,
    canReport: windowOpen && targets.length > 0,
    refresh: () => void refetch(),
    filedReports,
    open,
    openReport,
    closeReport,
    targets,
    selectedTarget,
    setSelectedId: (id: string) => {
      setSelectedId(id);
      setSubmitError(null);
    },
    detail,
    setDetail: (value: string) => {
      setDetail(value);
      setSubmitError(null);
    },
    submit,
    submitting: fileMutation.isPending,
    submitError,
  };
}
