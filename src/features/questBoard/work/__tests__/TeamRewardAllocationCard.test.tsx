import { fireEvent } from "@testing-library/react-native";

import { renderWithQueryClient } from "@/testing/queryTestUtils";
import TeamRewardAllocationCard from "../components/TeamRewardAllocationCard";
import { amountSharesToBasisPoints } from "../teamRewardPreview";
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
    expect(
      view.queryByTestId(
        "team-reward-percent-00000000-0000-4000-8000-000000000001"
      )
    ).toBeNull();
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
      view.getByText(questWorkMessages.en.allocationInvalidInput)
    ).toBeTruthy();
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
  expect(view.getByText("฿1.00")).toBeTruthy();
  expect(view.getByText(/33.34%/)).toBeTruthy();
  expect(view.getAllByText(/Estimated reward: ฿0.33/)).toHaveLength(2);
  expect(view.getByText(/33.34% · ฿0.34/)).toBeTruthy();
  expect(view.getByText(/66.66% · ฿0.66/)).toBeTruthy();
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
  expect(
    view.getByText(questWorkMessages.en.allocationFieldOverBudget("66.67"))
  ).toBeTruthy();
  expect(
    view.getByText(questWorkMessages.en.allocationLeaderShareUnavailable)
  ).toBeTruthy();
  expect(view.queryByText("฿0.00")).toBeNull();
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

it("switches between baht and percent while keeping the API shares in basis points", async () => {
  mockConfirm.mockReset();
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  const view = await renderWithQueryClient(
    <TeamRewardAllocationCard
      allocation={equalAllocation}
      messages={questWorkMessages.en}
      submitting={false}
      onSubmit={onSubmit}
    />
  );

  await fireEvent.press(view.getByTestId("team-reward-mode-baht"));
  expect(view.getByTestId("team-reward-percent-alex").props.value).toBe("0.33");
  expect(view.getByTestId("team-reward-percent-bo").props.value).toBe("0.33");
  expect(
    view.getByText(questWorkMessages.en.allocationBahtRoundingHint)
  ).toBeTruthy();

  await fireEvent.changeText(
    view.getByTestId("team-reward-percent-alex"),
    "0.25"
  );
  await fireEvent.press(view.getByTestId("team-reward-mode-percent"));
  expect(view.getByTestId("team-reward-percent-alex").props.value).toBe(
    "25.00"
  );
  expect(view.getByTestId("team-reward-percent-bo").props.value).toBe("33.00");
  expect(view.getByText(/42\.00% · ฿0\.42/)).toBeTruthy();

  await fireEvent.press(view.getByTestId("team-reward-submit"));
  const confirm = mockConfirm.mock.calls[0][0] as { onConfirm: () => void };
  confirm.onConfirm();
  expect(onSubmit).toHaveBeenCalledWith([
    { memberId: "alex", percentageBasisPoints: 2500 },
    { memberId: "bo", percentageBasisPoints: 3300 },
  ]);
});

it("shows baht over-allocation and blocks submission", async () => {
  const view = await renderWithQueryClient(
    <TeamRewardAllocationCard
      allocation={equalAllocation}
      messages={questWorkMessages.en}
      submitting={false}
      onSubmit={jest.fn()}
    />
  );

  await fireEvent.press(view.getByTestId("team-reward-mode-baht"));
  await fireEvent.changeText(
    view.getByTestId("team-reward-percent-alex"),
    "0.80"
  );

  expect(
    view.getByText(questWorkMessages.en.allocationAmountOverBudget("฿0.13"))
  ).toBeTruthy();
  expect(
    view.getByText(
      questWorkMessages.en.allocationFieldOverBudgetAmount("฿0.67")
    )
  ).toBeTruthy();
  expect(
    view.getByTestId("team-reward-submit").props.accessibilityState.disabled
  ).toBe(true);
});

it("rounds a small baht target down and leaves the residual share with the leader", async () => {
  mockConfirm.mockReset();
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  const allocation = {
    ...equalAllocation,
    totalRewardSatang: 2_000_000,
    members: [
      { ...equalAllocation.members[0], memberId: "leader" },
      { ...equalAllocation.members[1], memberId: "alex" },
    ],
  };
  const view = await renderWithQueryClient(
    <TeamRewardAllocationCard
      allocation={allocation}
      messages={questWorkMessages.en}
      submitting={false}
      onSubmit={onSubmit}
    />
  );

  await fireEvent.press(view.getByTestId("team-reward-mode-baht"));
  await fireEvent.changeText(
    view.getByTestId("team-reward-percent-alex"),
    "1.50"
  );

  expect(view.getByText(/Estimated reward: ฿0\.00/)).toBeTruthy();
  expect(view.getByText(/0\.00% · ฿0\.00/)).toBeTruthy();
  expect(view.getByText(/100\.00% · ฿20,000\.00/)).toBeTruthy();
  await fireEvent.press(view.getByTestId("team-reward-submit"));
  const confirm = mockConfirm.mock.calls[0][0] as { onConfirm: () => void };
  confirm.onConfirm();
  expect(onSubmit).toHaveBeenCalledWith([
    { memberId: "alex", percentageBasisPoints: 0 },
  ]);
});

it("keeps invalid percentages visible and blocks switching to baht until fixed", async () => {
  const view = await renderWithQueryClient(
    <TeamRewardAllocationCard
      allocation={equalAllocation}
      messages={questWorkMessages.en}
      submitting={false}
      onSubmit={jest.fn()}
    />
  );

  await fireEvent.changeText(
    view.getByTestId("team-reward-percent-alex"),
    "100.01"
  );
  await fireEvent.press(view.getByTestId("team-reward-mode-baht"));

  expect(view.getByTestId("team-reward-percent-alex").props.value).toBe(
    "100.01"
  );
  expect(
    view.getByText(questWorkMessages.en.allocationFixPercentBeforeBaht)
  ).toBeTruthy();
  expect(
    view.queryByText(questWorkMessages.en.allocationBahtRoundingHint)
  ).toBeNull();
  expect(
    view.getByTestId("team-reward-mode-percent").props.accessibilityState
      .selected
  ).toBe(true);

  await fireEvent.changeText(
    view.getByTestId("team-reward-percent-alex"),
    "25"
  );
  await fireEvent.press(view.getByTestId("team-reward-mode-baht"));
  expect(view.getByTestId("team-reward-percent-alex").props.value).toBe("0.25");
  expect(
    view.queryByText(questWorkMessages.en.allocationFixPercentBeforeBaht)
  ).toBeNull();
});

it("allows long teammate names to wrap instead of truncating", async () => {
  const longName = "A teammate with a name that needs multiple lines";
  const allocation = {
    ...equalAllocation,
    members: equalAllocation.members.map((member) =>
      member.memberId === "alex" ? { ...member, displayName: longName } : member
    ),
  };
  const view = await renderWithQueryClient(
    <TeamRewardAllocationCard
      allocation={allocation}
      messages={questWorkMessages.en}
      submitting={false}
      onSubmit={jest.fn()}
    />
  );

  expect(view.getByText(longName).props.numberOfLines).toBeUndefined();
});

it("floors each teammate to a whole basis point and leaves the residual to the leader", () => {
  const shares = amountSharesToBasisPoints([1, 1], 3);
  expect(shares).toEqual([3333, 3333]);
  expect(10_000 - shares.reduce((sum, share) => sum + share, 0)).toBe(3334);
  expect(amountSharesToBasisPoints([1, 1], 4)).toEqual([2500, 2500]);
  expect(amountSharesToBasisPoints([150], 2_000_000)).toEqual([0]);
});
