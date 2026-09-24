import { act, fireEvent, render } from "@testing-library/react-native";
import React from "react";

import {
  ErrorAlertHost,
  SweetAlert,
  SweetAlertVariant,
  showErrorAlert,
} from "../SweetAlert";

describe("SweetAlert", () => {
  it("shows alert content and invokes close from the labeled action", async () => {
    const onClose = jest.fn();
    const view = await render(
      <SweetAlert
        buttonLabel="Got it"
        message="Try again later."
        onClose={onClose}
        title="Request failed"
        variant={SweetAlertVariant.Error}
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

  it("confirms only from primary action and lets user cancel", async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    const view = await render(
      <SweetAlert
        buttonLabel="Delete"
        cancelLabel="Keep"
        confirmLabel="Delete quest"
        message="This cannot be undone."
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete quest?"
        variant={SweetAlertVariant.Warning}
        visible
      />
    );

    await fireEvent.press(view.getByRole("button", { name: "Keep" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    await fireEvent.press(view.getByRole("button", { name: "Delete quest" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("renders no dialog while hidden", async () => {
    const view = await render(
      <SweetAlert
        buttonLabel="Close"
        message="Saved."
        onClose={jest.fn()}
        title="Success"
        variant={SweetAlertVariant.Success}
        visible={false}
      />
    );

    expect(view.queryByTestId("sweet-alert")).toBeNull();
  });

  it("shows raised errors app-wide with a localized fallback and dismisses them", async () => {
    const view = await render(<ErrorAlertHost />);
    expect(view.queryByTestId("error-alert")).toBeNull();

    await act(async () => showErrorAlert("สร้างทีมไม่สำเร็จ", new Error("")));
    expect(view.getByText("สร้างทีมไม่สำเร็จ")).toBeTruthy();
    expect(view.getByText("เกิดข้อผิดพลาด โปรดลองอีกครั้ง")).toBeTruthy();

    await fireEvent.press(view.getByRole("button", { name: "ตกลง" }));
    expect(view.queryByTestId("error-alert")).toBeNull();
  });
});
