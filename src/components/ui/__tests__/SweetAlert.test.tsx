import { fireEvent, render } from "@testing-library/react-native";
import React from "react";

import { SweetAlert } from "../SweetAlert";

describe("SweetAlert", () => {
  it("shows alert content and invokes close from the labeled action", async () => {
    const onClose = jest.fn();
    const view = await render(
      <SweetAlert
        buttonLabel="Got it"
        message="Try again later."
        onClose={onClose}
        title="Request failed"
        variant="error"
        visible
      />
    );

    expect(view.getByText("Request failed")).toBeTruthy();
    expect(view.getByText("Try again later.").props.accessibilityRole).toBe(
      "alert"
    );
    await fireEvent.press(view.getByRole("button", { name: "Got it" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders no dialog while hidden", async () => {
    const view = await render(
      <SweetAlert
        buttonLabel="Close"
        message="Saved."
        onClose={jest.fn()}
        title="Success"
        variant="success"
        visible={false}
      />
    );

    expect(view.queryByTestId("sweet-alert")).toBeNull();
  });
});
