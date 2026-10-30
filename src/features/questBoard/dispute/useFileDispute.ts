import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

import { showSweetAlert, SweetAlertVariant } from "@/components/ui/SweetAlert";

import { ApiError } from "@/api/ApiClient";
import type { DisputeCase } from "@/api/DisputeApi";
import { showDisputeForm } from "./DisputeFormHost";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import {
  questBoardKeys,
  useFileDisputeMutation,
} from "@/features/questBoard/api/questBoardQueries";
import { useLocale } from "@/features/preferences/localeStore";
import { disputeMessages } from "@/locales/disputeMessages";
import { teamSplitMessages } from "@/locales/teamSplitMessages";
import { getLocalizedErrorMessage } from "@/utils/error";

/**
 * Files the viewer's Dispute Case on a failed Quest. `fileQuestDispute` takes
 * a category and details. Filing is final
 * and limited to one case per filer, so the rules are shown before it.
 */
export function useFileDispute() {
  const { locale } = useLocale();
  const messages = disputeMessages[locale];
  const viewerId = useSessionQuery().data?.user.id ?? "";
  const queryClient = useQueryClient();
  const { mutate, isPending } = useFileDisputeMutation();

  const filingRef = useRef(false);
  const confirmFileDispute = useCallback(
    (questId: string) => {
      if (!viewerId || filingRef.current || isPending) return;
      showDisputeForm(
        (input) =>
          new Promise<boolean>((resolve) => {
            if (filingRef.current) return resolve(false);
            filingRef.current = true;
            mutate(
              { questId, viewerId, input },
              {
                onSuccess: (filedCase) => {
                  resolve(true);
                  showSweetAlert({
                    title: messages.successTitle,
                    message: messages.successDescription(filedCase.displayId),
                    variant: SweetAlertVariant.Success,
                  });
                },
                onError: (error) => {
                  resolve(false);
                  const alreadyFiled =
                    error instanceof ApiError &&
                    error.status === 409 &&
                    queryClient.getQueryData<{ case: DisputeCase | null }>(
                      questBoardKeys.myDisputeCase(questId, viewerId)
                    )?.case != null;
                  showSweetAlert({
                    title: messages.errorTitle,
                    message: alreadyFiled
                      ? messages.alreadyFiled
                      : error instanceof ApiError &&
                          error.code === "DISPUTE_CASE_WINDOW_EXPIRED"
                        ? messages.windowClosed
                        : error instanceof ApiError &&
                            error.code === "DISPUTE_CASE_TEAM_LEADER_ONLY"
                          ? teamSplitMessages[locale].teamCaseLeaderOnly
                          : getLocalizedErrorMessage(error, locale, {
                              fallback: messages.errorFallback,
                            }),
                    variant: SweetAlertVariant.Error,
                  });
                },
                onSettled: () => {
                  filingRef.current = false;
                },
              }
            );
          })
      );
    },
    [isPending, locale, messages, mutate, queryClient, viewerId]
  );

  return { confirmFileDispute, filingDispute: isPending };
}
