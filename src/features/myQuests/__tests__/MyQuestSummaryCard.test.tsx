import { fireEvent, render } from "@testing-library/react-native";

import { myQuestMessages } from "@/locales/myQuestMessages";
import { lightColors } from "@/theme/colors";
import { MyQuestSummaryCard } from "../components/MyQuestSummaryCard";

describe("MyQuestSummaryCard", () => {
  it("blocks repeat cancellation while keeping the Quest and editor accessible", async () => {
    const onCancel = jest.fn();
    const onOpen = jest.fn();
    const onAction = jest.fn();
    const screen = await render(
      <MyQuestSummaryCard
        messages={myQuestMessages.en}
        palette={lightColors}
        cancelling
        onOpen={onOpen}
        onAction={onAction}
        onCancel={onCancel}
        quest={{
          id: "draft-1",
          title: "Draft Quest",
          tag: "Campus",
          categoryTone: "green",
          startsAt: "1 Oct 2026 · 16:00",
          endsAt: "1 Oct 2026 · 19:00",
          location: "Main Campus",
          online: false,
          description: "Complete the campus task.",
          detail: "Draft",
          teamSize: "1",
          mode: "First come, first served",
          reward: "฿250",
          status: "Draft",
          statusTone: "neutral",
          primaryAction: "edit",
          cancelFromCard: "draft",
        }}
      />
    );

    const cancel = screen.getByRole("button", {
      name: "Cancel Quest: Draft Quest",
      busy: true,
    });
    expect(cancel).toBeDisabled();
    await fireEvent.press(cancel);
    expect(onCancel).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId("my-quest-list-card-draft-1"));
    expect(onOpen).toHaveBeenCalledTimes(1);
    await fireEvent.press(
      screen.getByRole("button", { name: "Edit: Draft Quest" })
    );
    expect(onAction).toHaveBeenCalledWith("edit");
  });
});
