import { act, fireEvent, render } from "@testing-library/react-native";
import React from "react";

import {
  SweetAlertHost,
  SweetAlert,
  SweetAlertVariant,
  showConfirmModal,
  showErrorAlert,
  showSweetAlert,
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

  it("shows app-wide errors with localized fallback and dismisses them", async () => {
    const view = await render(<SweetAlertHost />);
    expect(view.queryByTestId("sweet-alert")).toBeNull();

    await act(async () => showErrorAlert("สร้างทีมไม่สำเร็จ", new Error("")));
    expect(view.getByText("สร้างทีมไม่สำเร็จ")).toBeTruthy();
    expect(view.getByText("เกิดข้อผิดพลาด โปรดลองอีกครั้ง")).toBeTruthy();

    await fireEvent.press(view.getByRole("button", { name: "ตกลง" }));
    expect(view.queryByTestId("sweet-alert")).toBeNull();
  });
  it("runs close action on a single-button SweetAlert", async () => {
    const onClose = jest.fn();
    const view = await render(<SweetAlertHost />);

    await act(async () =>
      showSweetAlert({
        title: "Quest cancelled",
        message: "Cancellation completed.",
        variant: SweetAlertVariant.Success,
        buttonLabel: "Back",
        onClose,
      })
    );
    expect(view.getByText("Quest cancelled")).toBeTruthy();
    expect(view.queryByRole("button", { name: "ตกลง" })).toBeNull();

    await fireEvent.press(view.getByRole("button", { name: "Back" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(view.queryByText("Quest cancelled")).toBeNull();
  });

  it("runs confirm action only after user accepts and closes modal", async () => {
    const onConfirm = jest.fn();
    const view = await render(<SweetAlertHost />);

    await act(async () =>
      showConfirmModal({
        title: "Delete quest?",
        message: "This cannot be undone.",
        confirmLabel: "Delete",
        cancelLabel: "Keep",
        onConfirm,
      })
    );
    expect(view.getByText("Delete quest?")).toBeTruthy();

    await fireEvent.press(view.getByRole("button", { name: "Keep" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(view.queryByText("Delete quest?")).toBeNull();

    await act(async () =>
      showConfirmModal({
        title: "Delete quest?",
        message: "This cannot be undone.",
        confirmLabel: "Delete",
        cancelLabel: "Keep",
        onConfirm,
      })
    );
    await fireEvent.press(view.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(view.queryByText("Delete quest?")).toBeNull();
  });
});
