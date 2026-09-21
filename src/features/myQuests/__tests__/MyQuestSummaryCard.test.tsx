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
          onOpen={jest.fn()}
          palette={palette}
          quest={{
            id: "draft-1",
            title: "Draft Quest",
            tag: "Campus",
            categoryTone: "green",
            date: "1 Oct · 1 Oct",
            location: "Main Campus",
            description: "Complete the campus task.",
            detail: "Draft",
            teamSize: "0 / 1",
            status: "Draft",
            statusTone: "neutral",
            action: "Edit",
            actionType: "edit",
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
