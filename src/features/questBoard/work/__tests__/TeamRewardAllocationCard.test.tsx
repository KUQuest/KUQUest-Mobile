import { fireEvent } from "@testing-library/react-native";

import { renderWithQueryClient } from "@/testing/queryTestUtils";
import TeamRewardAllocationCard from "../components/TeamRewardAllocationCard";
import { questWorkMessages } from "@/locales/questWorkMessages";

const mockConfirm = jest.fn();
jest.mock("@/components/ui/SweetAlert", () => ({
  showConfirmModal: (options: { onConfirm: () => void }) =>
    mockConfirm(options),
}));
jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

describe("Team reward allocation editor", () => {
  beforeEach(() => mockConfirm.mockReset());

  it("submits teammate basis points and leaves the remainder for the Leader", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const view = await renderWithQueryClient(
      <TeamRewardAllocationCard
        allocation={{
          status: "PENDING",
          leaderId: "00000000-0000-4000-8000-000000000001",
          totalRewardSatang: 10_000,
          deadlineAt: "2026-10-07T00:00:00.000Z",
          settledAt: null,
          viewerIsLeader: true,
          members: [
            {
              memberId: "00000000-0000-4000-8000-000000000001",
              displayName: "Leader",
              isLeader: true,
              percentageBasisPoints: null,
              rewardSatang: null,
            },
            {
              memberId: "00000000-0000-4000-8000-000000000002",
              displayName: "Alex",
              isLeader: false,
              percentageBasisPoints: null,
              rewardSatang: null,
            },
            {
              memberId: "00000000-0000-4000-8000-000000000003",
              displayName: "Bo",
              isLeader: false,
              percentageBasisPoints: null,
              rewardSatang: null,
            },
          ],
        }}
        messages={questWorkMessages.en}
        submitting={false}
        onSubmit={onSubmit}
      />
    );
    await fireEvent.changeText(
      view.getByTestId(
        "team-reward-percent-00000000-0000-4000-8000-000000000002"
      ),
      "15.25"
    );
    await fireEvent.changeText(
      view.getByTestId(
        "team-reward-percent-00000000-0000-4000-8000-000000000003"
      ),
      "24.75"
    );
    await fireEvent.press(view.getByTestId("team-reward-submit"));
    expect(mockConfirm).toHaveBeenCalledTimes(1);
    const confirm = mockConfirm.mock.calls[0][0] as { onConfirm: () => void };
    confirm.onConfirm();
    expect(onSubmit).toHaveBeenCalledWith([
      {
        memberId: "00000000-0000-4000-8000-000000000002",
        percentageBasisPoints: 1525,
      },
      {
        memberId: "00000000-0000-4000-8000-000000000003",
        percentageBasisPoints: 2475,
      },
    ]);
    expect(view.getByText(/60\.00%/)).toBeTruthy();
  });

  it("disables submission when teammate percentages exceed the pool", async () => {
    const view = await renderWithQueryClient(
      <TeamRewardAllocationCard
        allocation={{
          status: "PENDING",
          leaderId: "00000000-0000-4000-8000-000000000001",
          totalRewardSatang: 10_000,
          deadlineAt: "2026-10-07T00:00:00.000Z",
          settledAt: null,
          viewerIsLeader: true,
          members: [
            {
              memberId: "00000000-0000-4000-8000-000000000001",
              displayName: "Leader",
              isLeader: true,
              percentageBasisPoints: null,
              rewardSatang: null,
            },
            {
              memberId: "00000000-0000-4000-8000-000000000002",
              displayName: "Alex",
              isLeader: false,
              percentageBasisPoints: null,
              rewardSatang: null,
            },
          ],
        }}
        messages={questWorkMessages.en}
        submitting={false}
        onSubmit={jest.fn()}
      />
    );
    await fireEvent.changeText(
      view.getByTestId(
        "team-reward-percent-00000000-0000-4000-8000-000000000002"
      ),
      "100.01"
    );
    expect(view.getByText(questWorkMessages.en.allocationInvalid)).toBeTruthy();
    expect(
      view.getByTestId("team-reward-submit").props.accessibilityState.disabled
    ).toBe(true);
  });
});

const equalAllocation = {
  status: "PENDING" as const,
  leaderId: "leader",
  totalRewardSatang: 100,
  deadlineAt: "2026-10-07T00:00:00.000Z",
  settledAt: null,
  viewerIsLeader: true,
  members: ["leader", "alex", "bo"].map((memberId) => ({
    memberId,
    displayName: memberId,
    isLeader: memberId === "leader",
    percentageBasisPoints: null,
    rewardSatang: null,
  })),
};

it("starts with equal shares, conserves the satang pool, and resets edits", async () => {
  const view = await renderWithQueryClient(
    <TeamRewardAllocationCard
      allocation={equalAllocation}
      messages={questWorkMessages.en}
      submitting={false}
      onSubmit={jest.fn()}
    />
  );
  expect(view.getByTestId("team-reward-percent-alex").props.value).toBe(
    "33.33"
  );
  expect(view.getByText(/33.34%/)).toBeTruthy();
  expect(view.getAllByText(/Estimated reward: ฿0.33/)).toHaveLength(2);
  expect(view.getByText("฿0.34")).toBeTruthy();
  await fireEvent.changeText(
    view.getByTestId("team-reward-percent-alex"),
    "80"
  );
  expect(
    view.getByText(questWorkMessages.en.allocationOverBudget("13.33"))
  ).toBeTruthy();
  expect(
    view.getByTestId("team-reward-submit").props.accessibilityState.disabled
  ).toBe(true);
  await fireEvent.press(view.getByTestId("team-reward-equal"));
  expect(view.getByTestId("team-reward-percent-alex").props.value).toBe(
    "33.33"
  );
  expect(view.getByText(questWorkMessages.en.allocationTotal)).toBeTruthy();
});

it("confirms every member's exact share before paying", async () => {
  mockConfirm.mockReset();
  const view = await renderWithQueryClient(
    <TeamRewardAllocationCard
      allocation={equalAllocation}
      messages={questWorkMessages.en}
      submitting={false}
      onSubmit={jest.fn()}
    />
  );
  await fireEvent.press(view.getByTestId("team-reward-submit"));
  expect(mockConfirm.mock.calls[0][0].message).toContain(
    "leader: 33.34% · ฿0.34"
  );
  expect(mockConfirm.mock.calls[0][0].message).toContain(
    "alex: 33.33% · ฿0.33"
  );
});
