import { formatTimestampDate, formatTimeInBangkok } from "@/domain/datetime";
import { act } from "@testing-library/react-native";
import { groupQuestMessages } from "@/locales/groupQuestMessages";
import { questBoardMessages } from "@/locales/questBoardMessages";
import { renderWithAppTheme } from "@/testing/queryTestUtils";
import { LiveEntrySurface } from "../components/QuestDetailEntrySurfaces";
import { QuestDetailBody } from "../components/QuestDetailBody";

const messages = groupQuestMessages.en;
const cancelledAt = "2026-08-12T09:00:00.000Z";
const cancelledAtDate = formatTimestampDate(cancelledAt, "en");
if (!cancelledAtDate) throw new Error("Expected cancellation date formatting");
const cancellationTimestamp = messages.cancelledAt(
  cancelledAtDate,
  formatTimeInBangkok(cancelledAt)
);

function underfilled(cancellationReason: string | null, ownDeclined = false) {
  return {
    id: "underfilled-1",
    questId: "quest-1",
    questState: "QUEST_CANCELLED",
    state: "UNDERFILLED_CANCELLED",
    activeWorkerCount: 1,
    headcount: 2,
    workerRewardPool: 300,
    questReward: 150,
    dueAt: null,
    cancellationReason,
    cancelledAt: "2026-08-12T09:00:00.000Z",
    decision: {
      status: "UNDERFILLED_DECISION_CANCELLED",
      value: null,
      expiresAt: null,
    },
    consent: {
      status: "UNDERFILLED_CONSENT_CANCELLED",
      expiresAt: null,
      totalCount: 1,
      acceptedCount: 0,
      declinedCount: 0,
      pendingCount: 1,
    },
    ownResponse: ownDeclined
      ? {
          workerId: "worker-1",
          decision: "DECLINE",
          questReward: 150,
          respondedAt: "2026-08-12T08:59:00.000Z",
        }
      : null,
  };
}

function liveSnapshot(
  cancellationReason: string | null,
  actor = "WORKER",
  ownDeclined = false
) {
  return {
    actor,
    nextAction: "NONE",
    participation: "GROUP",
    mode: "FIRST_COME_FIRST_SERVED",
    state: "QUEST_CANCELLED",
    team: null,
    capabilities: {},
    underfilled: underfilled(cancellationReason, ownDeclined),
  } as never;
}

const quest = {
  id: "quest-1",
  title: "Quest",
  tags: [],
  description: "Description",
  completionCriteria: "Done",
  proofRequired: "none",
  rewardPerPerson: 150,
  headcount: 2,
  acceptedParticipants: 1,
  startDate: "2026-08-12",
  deadline: "2026-08-13",
  postedAt: "2026-08-01T00:00:00.000Z",
  location: "Online",
  locationMode: "online",
  participationMode: "team",
  candidateMode: "NO_CANDIDATE",
  creator: { name: "Hirer" },
  studentInterestMatch: false,
  ownerStudentId: "hirer-1",
} as never;

function body(cancellationReason: string | null, ownDeclined = false) {
  return (
    <QuestDetailBody
      quest={quest}
      locale="en"
      messages={questBoardMessages.en}
      imageUris={[]}
      refreshing={false}
      onRefresh={() => undefined}
      canParticipate={false}
      participationFirstCome
      onOpenParticipation={() => undefined}
      participationBusy={false}
      onOpenWorkHub={() => undefined}
      onOpenPartialConsent={() => undefined}
      groupFcfs={{
        activeWorkerCount: 1,
        headcount: 2,
        isJoined: true,
        state: "QUEST_CANCELLED",
        underfilled: underfilled(cancellationReason, ownDeclined) as never,
        canConsent: false,
      }}
    />
  );
}

describe("Quest underfilled cancellation outcomes", () => {
  it("shows authoritative reason and worker-safe copy on the entry surface", async () => {
    const cases = [
      ["HIRER_CANCELLED", messages.hirerCancelled],
      ["HIRER_NO_DECISION", messages.hirerNoDecision],
      ["WORKER_DECLINED", messages.declinedByWorker],
      ["CONSENT_TIMEOUT", messages.timedOutCancellation],
      [null, messages.genericCancellation],
    ] as const;
    for (const [reason, expected] of cases) {
      const screen = await renderWithAppTheme(
        <LiveEntrySurface
          snapshot={liveSnapshot(reason)}
          locale="en"
          groupMessages={messages}
          onOpenTeam={() => undefined}
          onOpenCandidateReview={() => undefined}
          onOpenPartialConsent={() => undefined}
        />
      );
      expect(screen.getByText(expected)).toBeTruthy();
      expect(screen.getByText(cancellationTimestamp)).toBeTruthy();
      expect(screen.queryByText(/refunded/i)).toBeNull();
      await act(async () => {
        screen.unmount();
      });
    }
  });

  it("uses own DECLINE to distinguish worker outcome, and shows Hirer refund copy", async () => {
    const declined = await renderWithAppTheme(
      <LiveEntrySurface
        snapshot={liveSnapshot("WORKER_DECLINED", "WORKER", true)}
        locale="en"
        groupMessages={messages}
        onOpenTeam={() => undefined}
        onOpenCandidateReview={() => undefined}
        onOpenPartialConsent={() => undefined}
      />
    );
    expect(declined.getByText(messages.declinedByYou)).toBeTruthy();
    expect(declined.queryByText(/refunded/i)).toBeNull();
    await act(async () => {
      declined.unmount();
    });

    const hirer = await renderWithAppTheme(
      <LiveEntrySurface
        snapshot={liveSnapshot("HIRER_CANCELLED", "HIRER")}
        locale="en"
        groupMessages={messages}
        onOpenTeam={() => undefined}
        onOpenCandidateReview={() => undefined}
        onOpenPartialConsent={() => undefined}
      />
    );
    expect(hirer.getByText(messages.hirerCancelledOutcome)).toBeTruthy();
    await act(async () => {
      hirer.unmount();
    });
  });

  it("shows authoritative reason on worker Quest Detail status card", async () => {
    const cases = [
      ["HIRER_CANCELLED", messages.hirerCancelled],
      ["HIRER_NO_DECISION", messages.hirerNoDecision],
      ["WORKER_DECLINED", messages.declinedByWorker],
      ["CONSENT_TIMEOUT", messages.timedOutCancellation],
      [null, messages.genericCancellation],
    ] as const;
    for (const [reason, expected] of cases) {
      const screen = await renderWithAppTheme(body(reason));
      expect(screen.getByText(expected)).toBeTruthy();
      expect(screen.getByText(cancellationTimestamp)).toBeTruthy();
      expect(screen.queryByText(/refunded/i)).toBeNull();
      await act(async () => {
        screen.unmount();
      });
    }

    const ownDecline = await renderWithAppTheme(body("WORKER_DECLINED", true));
    expect(ownDecline.getByText(messages.declinedByYou)).toBeTruthy();
    expect(ownDecline.queryByText(/refunded/i)).toBeNull();
    await act(async () => {
      ownDecline.unmount();
    });
  });
});
