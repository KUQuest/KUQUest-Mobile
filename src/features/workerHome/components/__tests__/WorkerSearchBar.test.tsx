import React from "react";
import { fireEvent } from "@testing-library/react-native";
import { renderWithAppTheme as render } from "@/testing/queryTestUtils";
import { WorkerSearchBar } from "../WorkerSearchBar";

jest.mock("@/features/preferences/localeStore", () => ({
  useLocale: () => ({ locale: "en" }),
}));

describe("WorkerSearchBar", () => {
  const mockQueryChange = jest.fn();
  const mockClearQuery = jest.fn();
  const mockSelectTag = jest.fn();
  const mockOpenFilter = jest.fn();

  const sampleTags = [
    { id: "tag-1", name: "Printing" },
    { id: "tag-2", name: "Academic" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders search input with placeholder and calls onQueryChange", async () => {
    const view = await render(
      <WorkerSearchBar
        onClearQuery={mockClearQuery}
        onOpenFilter={mockOpenFilter}
        onQueryChange={mockQueryChange}
        onSelectTag={mockSelectTag}
        query=""
        selectedTagId={null}
        tags={sampleTags}
      />
    );

    const input = view.getByTestId("worker-quest-search-input");
    expect(input).toBeTruthy();

    fireEvent.changeText(input, "tutor");
    expect(mockQueryChange).toHaveBeenCalledWith("tutor");
  });

  it("renders clear button when query is present and calls onClearQuery", async () => {
    const view = await render(
      <WorkerSearchBar
        onClearQuery={mockClearQuery}
        onOpenFilter={mockOpenFilter}
        onQueryChange={mockQueryChange}
        onSelectTag={mockSelectTag}
        query="biology"
        selectedTagId={null}
        tags={sampleTags}
      />
    );

    const clearButton = view.getByTestId("clear-search-button");
    expect(clearButton).toBeTruthy();

    fireEvent.press(clearButton);
    expect(mockClearQuery).toHaveBeenCalled();
  });

  it("renders All and tag pills, calling onSelectTag on press", async () => {
    const view = await render(
      <WorkerSearchBar
        onClearQuery={mockClearQuery}
        onOpenFilter={mockOpenFilter}
        onQueryChange={mockQueryChange}
        onSelectTag={mockSelectTag}
        query=""
        selectedTagId={null}
        tags={sampleTags}
      />
    );

    expect(view.getByTestId("tag-pill-all")).toBeTruthy();
    expect(view.getByTestId("tag-pill-tag-1")).toBeTruthy();
    expect(view.getByTestId("tag-pill-tag-2")).toBeTruthy();

    fireEvent.press(view.getByTestId("tag-pill-tag-1"));
    expect(mockSelectTag).toHaveBeenCalledWith("tag-1");

    fireEvent.press(view.getByTestId("tag-pill-all"));
    expect(mockSelectTag).toHaveBeenCalledWith(null);
  });
});
