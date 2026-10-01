import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { createQuestMessages } from "@/locales/createQuestMessages";
import { CustomDatePickerModal } from "@/components/ui/CustomDatePickerModal";

describe("CustomDatePickerModal", () => {
  it("blocks dates before the minimum and commits a leap day only on confirmation", async () => {
    const onConfirm = jest.fn();
    const view = await render(
      <CustomDatePickerModal
        title="Start date"
        value="2028-02-27"
        minimumDate="2028-02-28"
        locale="en"
        messages={createQuestMessages.en}
        onConfirm={onConfirm}
        onClose={jest.fn()}
      />
    );

    expect(
      view.getByTestId("custom-date-picker-day-2028-02-27")
    ).toBeDisabled();
    expect(view.getByTestId("custom-date-picker-confirm")).toBeDisabled();
    await fireEvent.press(
      view.getByTestId("custom-date-picker-day-2028-02-29")
    );
    expect(onConfirm).not.toHaveBeenCalled();
    await fireEvent.press(view.getByTestId("custom-date-picker-confirm"));
    expect(onConfirm).toHaveBeenCalledWith("2028-02-29");
  });

  it("dismisses from the shared sheet close button without committing the selected date", async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    const view = await render(
      <CustomDatePickerModal
        title="Start date"
        value="2028-02-28"
        minimumDate="2028-02-28"
        locale="en"
        messages={createQuestMessages.en}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );

    await fireEvent.press(
      view.getByTestId("custom-date-picker-day-2028-02-29")
    );
    await fireEvent.press(view.getByTestId("custom-date-picker-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
  it("blocks dates after the maximum", async () => {
    const view = await render(
      <CustomDatePickerModal
        title="Start date"
        value="2028-02-28"
        maximumDate="2028-02-28"
        locale="en"
        messages={createQuestMessages.en}
        onConfirm={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(
      view.getByTestId("custom-date-picker-day-2028-02-29")
    ).toBeDisabled();
  });
});
