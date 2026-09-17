import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { ImageViewerModal } from "../ImageViewerModal";

describe("ImageViewerModal", () => {
  const sampleImageUrl = "https://example.com/media/chat-picture.png";
  const sampleFileName = "chat-picture.png";

  it("renders image and file name when visible", async () => {
    const handleClose = jest.fn();
    const view = await render(
      <ImageViewerModal
        visible={true}
        imageUrl={sampleImageUrl}
        fileName={sampleFileName}
        onClose={handleClose}
      />
    );

    const image = view.getByTestId("image-viewer-image");
    expect(image).toBeTruthy();
    expect(image.props.source).toEqual({ uri: sampleImageUrl });
    expect(image.props.resizeMode).toBe("contain");

    expect(view.getByText(sampleFileName)).toBeTruthy();
    expect(view.getByTestId("image-viewer-close-button")).toBeTruthy();
    expect(view.getByRole("button", { name: "Close" })).toBeTruthy();
  });

  it("calls onClose when close button is pressed", async () => {
    const handleClose = jest.fn();
    const view = await render(
      <ImageViewerModal
        visible={true}
        imageUrl={sampleImageUrl}
        fileName={sampleFileName}
        onClose={handleClose}
      />
    );

    const closeButton = view.getByTestId("image-viewer-close-button");
    fireEvent.press(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("does not render image when visible is false", async () => {
    const handleClose = jest.fn();
    const view = await render(
      <ImageViewerModal
        visible={false}
        imageUrl={sampleImageUrl}
        fileName={sampleFileName}
        onClose={handleClose}
      />
    );

    expect(view.queryByTestId("image-viewer-image")).toBeNull();
    expect(view.queryByTestId("image-viewer-close-button")).toBeNull();
  });

  it("does not render image when imageUrl is null", async () => {
    const handleClose = jest.fn();
    const view = await render(
      <ImageViewerModal
        visible={true}
        imageUrl={null}
        fileName={sampleFileName}
        onClose={handleClose}
      />
    );

    expect(view.queryByTestId("image-viewer-image")).toBeNull();
    expect(view.queryByTestId("image-viewer-close-button")).toBeNull();
  });

  it("renders image without crashing when fileName is not provided", async () => {
    const handleClose = jest.fn();
    const view = await render(
      <ImageViewerModal
        visible={true}
        imageUrl={sampleImageUrl}
        onClose={handleClose}
      />
    );

    expect(view.getByTestId("image-viewer-image")).toBeTruthy();
    expect(view.getByTestId("image-viewer-close-button")).toBeTruthy();
  });
});
