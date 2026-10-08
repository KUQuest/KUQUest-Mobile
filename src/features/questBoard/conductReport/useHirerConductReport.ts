import { useEffect, useMemo, useRef, useState } from "react";

import { ApiError } from "@/api/ApiClient";
import type { ConductReport } from "@/api/ConductReportApi";
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

export type ConductReportTarget = { id: string; label: string };
export type FiledConductReport = ConductReport & { workerName: string };

interface HirerConductReportInput {
  questId: string | null;
  viewerId: string;
  assignments: readonly LiveQuestAssignment[];
  participants?: readonly LiveQuestParticipant[];
  /** The Quest State; a change re-reads `reportable`, which the Server derives from it. */
  questState?: string;
}

/**
 * Hirer → Worker CONDUCT_ABANDONED filing. The Server decides who can be
 * reported (`reportable`); the app only names the Workers it returns.
 */
export function useHirerConductReport({
  questId,
  viewerId,
  assignments,
  participants,
  questState,
}: HirerConductReportInput) {
  const { locale } = useLocale();
  const messages = conductReportMessages[locale];
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

  const workerName = useMemo(() => {
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
    return (memberId: string) => names.get(memberId) ?? messages.workerLabel;
  }, [assignments, messages, participants]);

  const targets = useMemo<ConductReportTarget[]>(
    () =>
      (reportsQuery.data?.reportable ?? [])
        .filter(({ reason }) => reason === "CONDUCT_ABANDONED")
        .map(({ memberId }) => ({ id: memberId, label: workerName(memberId) })),
    [reportsQuery.data, workerName]
  );
  const filedReports = useMemo<FiledConductReport[]>(
    () =>
      (reportsQuery.data?.items ?? []).map((report) => ({
        ...report,
        workerName: workerName(report.reportedMemberId),
      })),
    [reportsQuery.data, workerName]
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
          reason: "CONDUCT_ABANDONED",
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
