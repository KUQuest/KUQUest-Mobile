import {
  Clock3,
  UserRound,
  UserRoundCheck,
  UsersRound,
} from "lucide-react-native";

import type { QuestPublishCheck } from "../questBoard/types";
import {
  formatDraftReward,
  formatQuestSchedule,
  type QuestDraft,
} from "./createQuestModel";
import type { ChoiceOption } from "./createQuestTypes";
import type { CreateQuestMessages } from "@/locales/createQuestMessages";
import type { SupportedLocale } from "@/locales/locale";

export type CreateQuestTagOption = {
  label: string;
  shortLabel: string;
  value: string;
};

export type CreateQuestReviewSummaryItem = {
  label: string;
  value: string;
};

export interface CreateQuestReviewView {
  questTag: string;
  teamSize: string;
  acceptanceMethod: string;
  summary: CreateQuestReviewSummaryItem[];
  rewardPerPerson: string;
  missingSatang: number;
  logisticsSummary: string;
}

export function getCreateQuestTagOptions(
  liveTags: readonly { id: string; name: string }[],
  locale: SupportedLocale
): CreateQuestTagOption[] {
  if (liveTags.length > 0) {
    return liveTags.map((tag) => ({
      label: tag.name,
      shortLabel: tag.name,
      value: tag.id,
    }));
  }

  return [
    {
      label:
        locale === "th" ? "การออกแบบและงานสร้างสรรค์" : "Design & creative",
      shortLabel: locale === "th" ? "การออกแบบ" : "Design",
      value: "design",
    },
    {
      label: locale === "th" ? "เทคโนโลยี" : "Technology",
      shortLabel: locale === "th" ? "เทคโนโลยี" : "Technology",
      value: "technology",
    },
    {
      label: locale === "th" ? "การสอนพิเศษ" : "Tutoring",
      shortLabel: locale === "th" ? "ติว" : "Tutoring",
      value: "tutoring",
    },
    {
      label: locale === "th" ? "ชีวิตในมหาวิทยาลัย" : "Campus life",
      shortLabel: locale === "th" ? "ชีวิตมหาวิทยาลัย" : "Campus life",
      value: "campus-life",
    },
  ];
}

export function getCreateQuestChoiceOptions(messages: CreateQuestMessages): {
  participationOptions: ChoiceOption[];
  candidateOptions: ChoiceOption[];
} {
  return {
    candidateOptions: [
      {
        value: "FIRST_COME_FIRST_SERVED",
        label: messages.instantAccept,
        description: messages.instantAcceptDescription,
        icon: Clock3,
      },
      {
        value: "CANDIDATE",
        label: messages.selectCandidate,
        description: messages.selectCandidateDescription,
        icon: UserRoundCheck,
      },
    ],
    participationOptions: [
      {
        value: "SINGLE",
        label: messages.singleFormat,
        description: messages.singleFormatDescription,
        icon: UserRound,
      },
      {
        value: "GROUP",
        label: messages.teamFormat,
        description: messages.teamFormatDescription,
        icon: UsersRound,
      },
    ],
  };
}

export function getCreateQuestCombinationHint(
  draft: Pick<QuestDraft, "candidateMode" | "participation">,
  messages: CreateQuestMessages
): string {
  if (draft.participation === "SINGLE") {
    return draft.candidateMode === "FIRST_COME_FIRST_SERVED"
      ? messages.singleFirstComeHint
      : messages.singleCandidateHint;
  }
  return draft.candidateMode === "FIRST_COME_FIRST_SERVED"
    ? messages.groupFirstComeHint
    : messages.groupCandidateHint;
}

export function getCreateQuestReviewView({
  draft,
  locale,
  messages,
  publishCheck,
  spendingBalanceSatang,
  tagOptions,
}: {
  draft: QuestDraft;
  locale: SupportedLocale;
  messages: CreateQuestMessages;
  publishCheck: QuestPublishCheck;
  spendingBalanceSatang: number;
  tagOptions: readonly CreateQuestTagOption[];
}): CreateQuestReviewView {
  const proofRequired = draft.proofRequired !== "none";
  const scheduleDisplay = formatQuestSchedule(
    draft,
    locale,
    messages.notSelected
  );
  const rewardPerPerson = formatDraftReward(draft, locale);
  const missingSatang = Math.max(
    0,
    publishCheck.escrow.totalRequiredSatang - spendingBalanceSatang
  );
  const selectedQuestTag =
    tagOptions.find((option) => option.value === draft.tag)?.shortLabel ??
    messages.notSelected;
  const selectedTeamSize =
    draft.participation === "SINGLE"
      ? messages.teamSizeValue("1")
      : draft.headcount
        ? messages.teamSizeValue(draft.headcount)
        : messages.notSelected;
  const selectedAcceptanceMethod =
    draft.candidateMode === "CANDIDATE"
      ? messages.selectCandidate
      : messages.instantAccept;
  const logisticsSummary =
    scheduleDisplay.range !== messages.notSelected
      ? messages.logisticsSummaryComplete(
          scheduleDisplay.range,
          draft.locationMode === "ONLINE"
            ? messages.online
            : draft.location || messages.notSelected
        )
      : messages.logisticsSummary;

  return {
    questTag: selectedQuestTag,
    teamSize: selectedTeamSize,
    acceptanceMethod: selectedAcceptanceMethod,
    summary: [
      { label: messages.summary.title, value: draft.title || "—" },
      { label: messages.summary.description, value: draft.description || "—" },
      {
        label: messages.summary.completionCriteria,
        value: draft.conditions || "—",
      },
      {
        label: messages.summary.proof,
        value: proofRequired ? messages.required : messages.notNeeded,
      },
      {
        label: messages.summary.schedule,
        value: scheduleDisplay.range,
      },
      {
        label: messages.summary.location,
        value:
          draft.locationMode === "ONLINE"
            ? messages.online
            : draft.location || messages.notSelected,
      },
      {
        label: messages.summary.images,
        value: draft.imageUris.length
          ? messages.selectedImages(draft.imageUris.length)
          : messages.noImages,
      },
      {
        label: messages.summary.reward,
        value: draft.wage
          ? `${rewardPerPerson} / ${locale === "th" ? "คน" : "person"}`
          : messages.notSelected,
      },
    ],
    rewardPerPerson,
    missingSatang,
    logisticsSummary,
  };
}
