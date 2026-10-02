import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

import {
  showConfirmModal,
  showSweetAlert,
  SweetAlertVariant,
} from "@/components/ui/SweetAlert";

import { ApiError } from "@/api/ApiClient";
import type { DisputeCase } from "@/api/DisputeApi";
import { useSessionQuery } from "@/features/auth/sessionQueries";
import {
  questBoardKeys,
  useFileDisputeMutation,
} from "@/features/questBoard/api/questBoardQueries";
import { useLocale } from "@/features/preferences/localeStore";
import { disputeMessages } from "@/locales/disputeMessages";
import { getLocalizedErrorMessage } from "@/utils/error";

/**
 * Files the viewer's Dispute Case on a failed Quest. `fileQuestDispute` takes
 * no request body, so filing is a confirmation, not a form. Filing is final
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
      showConfirmModal({
        title: messages.confirmTitle,
        message: messages.rules.map((rule) => `• ${rule}`).join("\n"),
        confirmLabel: messages.confirm,
        cancelLabel: messages.cancel,
        onConfirm: () => {
          if (filingRef.current) return;
          filingRef.current = true;
          mutate(
            { questId, viewerId },
            {
              onSuccess: (filedCase) =>
                showSweetAlert({
                  title: messages.successTitle,
                  message: messages.successDescription(filedCase.displayId),
                  variant: SweetAlertVariant.Success,
                }),
              onError: (error) => {
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
        },
      });
    },
    [isPending, locale, messages, mutate, queryClient, viewerId]
  );

  return { confirmFileDispute, filingDispute: isPending };
}
