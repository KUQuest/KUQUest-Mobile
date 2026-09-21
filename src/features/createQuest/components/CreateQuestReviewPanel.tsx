import { useState } from "react";

import type { QuestPublishCheck } from "@/features/questBoard/types";
import { QuestTopUpModal } from "@/features/wallet/components/QuestFundingSummary";
import type { CreateQuestMessages } from "@/locales/createQuestMessages";
import type { SupportedLocale } from "@/locales/locale";

import type { CreateQuestReviewView } from "../createQuestPresentation";
import { QuestSetupOverview } from "./QuestSetupOverview";
import { ReviewStep } from "./ReviewStep";

export function CreateQuestReviewPanel({
  locale,
  messages,
  view,
  wide,
  isCheckingPublish,
  publishCheck,
  onRefreshPublishCheck,
}: {
  locale: SupportedLocale;
  messages: CreateQuestMessages;
  view: CreateQuestReviewView;
  wide: boolean;
  isCheckingPublish: boolean;
  publishCheck: QuestPublishCheck;
  onRefreshPublishCheck: () => void;
}) {
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  return (
    <>
      <QuestSetupOverview
        messages={messages}
        questTag={view.questTag}
        teamSize={view.teamSize}
        acceptanceMethod={view.acceptanceMethod}
        wide={wide}
      />
      <ReviewStep
        messages={messages}
        locale={locale}
        summary={view.summary}
        rewardPerPerson={view.rewardPerPerson}
        publishCheck={publishCheck}
        missingSatang={view.missingSatang}
        isCheckingPublish={isCheckingPublish}
        onTopUp={() => setShowTopUpModal(true)}
      />
      <QuestTopUpModal
        visible={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        onSuccess={onRefreshPublishCheck}
        locale={locale}
        suggestedAmountSatang={view.missingSatang}
      />
    </>
  );
}
