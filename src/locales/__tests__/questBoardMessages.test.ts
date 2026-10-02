import { questBoardMessages } from "../questBoardMessages";

describe("Quest status labels", () => {
  it("keeps awaiting consent statuses concise and localized", () => {
    expect(
      questBoardMessages.en.statusLabel("QUEST_AWAITING_EDIT_CONSENT")
    ).toBe("Awaiting edit consent");
    expect(
      questBoardMessages.en.statusLabel(
        "QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT"
      )
    ).toBe("Awaiting start consent");

    expect(
      questBoardMessages.th.statusLabel("QUEST_AWAITING_EDIT_CONSENT")
    ).toBe("รออนุมัติการแก้ไข");
    expect(
      questBoardMessages.th.statusLabel(
        "QUEST_AWAITING_PARTIAL_GROUP_START_CONSENT"
      )
    ).toBe("รออนุมัติเริ่มงาน");
  });
});
