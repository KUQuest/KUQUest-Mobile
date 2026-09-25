import { useCallback } from "react";

import {
  showConfirmModal,
  showSweetAlert,
  SweetAlertVariant,
} from "@/components/ui/SweetAlert";

import { useSessionQuery } from "@/features/auth/sessionQueries";
import { useFileDisputeMutation } from "@/features/questBoard/api/questBoardQueries";
import { useLocale } from "@/features/preferences/localeStore";
import { disputeMessages } from "@/locales/disputeMessages";

/**
 * Files the viewer's Dispute Case on a failed Quest. `fileQuestDispute` takes
 * no request body, so filing is a confirmation, not a form. Filing is final
 * and limited to one case per filer, so the rules are shown before it.
 */
export function useFileDispute() {
  const { locale } = useLocale();
  const messages = disputeMessages[locale];
  const viewerId = useSessionQuery().data?.user.id ?? "";
  const { mutate, isPending } = useFileDisputeMutation();

  const confirmFileDispute = useCallback(
    (questId: string) => {
      if (!viewerId || isPending) return;
      showConfirmModal({
        title: messages.confirmTitle,
        message: messages.rules.map((rule) => `• ${rule}`).join("\n"),
        confirmLabel: messages.confirm,
        cancelLabel: messages.cancel,
        onConfirm: () => {
          mutate(
            { questId, viewerId },
            {
              onSuccess: (filedCase) =>
                showSweetAlert({
                  title: messages.successTitle,
                  message: messages.successDescription(filedCase.displayId),
                  variant: SweetAlertVariant.Success,
                }),
              onError: (error) =>
                showSweetAlert({
                  title: messages.errorTitle,
                  message: error.message || messages.errorFallback,
                  variant: SweetAlertVariant.Error,
                }),
            }
          );
        },
      });
    },
    [isPending, messages, mutate, viewerId]
  );

  return { confirmFileDispute, filingDispute: isPending };
}
