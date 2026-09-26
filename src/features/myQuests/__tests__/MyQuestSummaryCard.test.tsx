import { render } from "@testing-library/react-native";

import { myQuestMessages } from "@/locales/myQuestMessages";
import { darkColors, lightColors } from "@/theme/colors";
import { MyQuestSummaryCard } from "../components/MyQuestSummaryCard";

jest.mock("@/tw", () => {
  const native = jest.requireActual("react-native");
  return {
    Pressable: native.Pressable,
    Text: native.Text,
    View: native.View,
  };
});

describe("MyQuestSummaryCard theme", () => {
  it.each([
    ["light", lightColors],
    ["dark", darkColors],
  ] as const)(
    "uses %s surface for a draft Quest card",
    async (_mode, palette) => {
      const screen = await render(
        <MyQuestSummaryCard
          messages={myQuestMessages.en}
          palette={palette}
          cancelling={false}
          onOpen={jest.fn()}
          onAction={jest.fn()}
          onCancel={jest.fn()}
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

      const root = screen.toJSON();
      expect(root).toEqual(
        expect.objectContaining({
          props: expect.objectContaining({
            style: expect.objectContaining({
              backgroundColor: palette.surface,
            }),
          }),
        })
      );
    }
  );
});
