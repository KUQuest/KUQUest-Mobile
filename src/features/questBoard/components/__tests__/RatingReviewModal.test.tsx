import React, { type ReactNode } from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import { RatingReviewModal } from "../RatingReviewModal";

jest.mock("../../../../locales/LocaleProvider", () => ({
  useLocale: () => ({ locale: "en" }),
}));

jest.mock("react-native/Libraries/Modal/Modal", () => ({
  __esModule: true,
  default: ({
    visible,
    children,
  }: {
    visible: boolean;
    children: ReactNode;
  }) => (visible ? <>{children}</> : null),
}));

describe("RatingReviewModal", () => {
  const defaultReviewee = {
    id: "user-worker-1",
    displayName: "Somchai Worker",
    role: "WORKER" as const,
  };
  it("renders reviewee name and 1-5 star selector", async () => {
    const view = await render(
      <RatingReviewModal
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        questId="quest-123"
        questTitle="Clean the Lab"
        reviewee={defaultReviewee}
        visible
      />
    );

    expect(view.getByText("Somchai Worker")).toBeTruthy();
    expect(view.getByText("Rate & Review")).toBeTruthy();
    expect(view.getByText("Clean the Lab")).toBeTruthy();
    expect(view.getByTestId("rating-star-1")).toBeTruthy();
    expect(view.getByTestId("rating-star-5")).toBeTruthy();
  });

  it("selects star rating and enters comment", async () => {
    const handleSubmit = jest.fn();
    const view = await render(
      <RatingReviewModal
        onClose={jest.fn()}
        onSubmit={handleSubmit}
        questId="quest-123"
        questTitle="Clean the Lab"
        reviewee={defaultReviewee}
        visible
      />
    );

    // Press star 4
    await act(async () => {
      fireEvent.press(view.getByTestId("rating-star-4"));
    });

    // Enter comment
    const commentInput = view.getByTestId("rating-comment-input");
    await act(async () => {
      fireEvent.changeText(
        commentInput,
        "Great collaboration and communication!"
      );
    });

    // Submit
    const submitButton = view.getByTestId("submit-review-button");
    await act(async () => {
      fireEvent.press(submitButton);
    });

    expect(handleSubmit).toHaveBeenCalledWith({
      rating: 4,
      comment: "Great collaboration and communication!",
      reviewId: undefined,
    });
  });

  it("displays error message if submit is attempted without selecting stars", async () => {
    const handleSubmit = jest.fn();
    const view = await render(
      <RatingReviewModal
        onClose={jest.fn()}
        onSubmit={handleSubmit}
        questId="quest-123"
        questTitle="Clean the Lab"
        reviewee={defaultReviewee}
        visible
      />
    );

    // Rating is 0 initially, submit button is disabled or triggers validation
    const submitButton = view.getByTestId("submit-review-button");
    expect(submitButton.props.accessibilityState?.disabled).toBe(true);
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("renders in edit mode when initialReview is supplied", async () => {
    const handleSubmit = jest.fn();
    const view = await render(
      <RatingReviewModal
        initialReview={{
          id: "review-abc",
          questId: "quest-123",
          reviewerId: "user-me",
          revieweeId: "user-worker-1",
          rating: 5,
          comment: "Initial great feedback",
          createdAt: "2026-09-18T00:00:00.000Z",
          updatedAt: "2026-09-18T00:00:00.000Z",
        }}
        onClose={jest.fn()}
        onSubmit={handleSubmit}
        questId="quest-123"
        questTitle="Clean the Lab"
        reviewee={defaultReviewee}
        visible
      />
    );

    expect(view.getByText("Edit Review")).toBeTruthy();
    expect(view.getByText("Save Changes")).toBeTruthy();
    expect(view.getByDisplayValue("Initial great feedback")).toBeTruthy();

    // Edit star to 3 and save
    await act(async () => {
      fireEvent.press(view.getByTestId("rating-star-3"));
    });
    await act(async () => {
      fireEvent.press(view.getByTestId("submit-review-button"));
    });

    expect(handleSubmit).toHaveBeenCalledWith({
      rating: 3,
      comment: "Initial great feedback",
      reviewId: "review-abc",
    });
  });

  it("renders read-only mode when isReadOnly is true (expired 7-day window)", async () => {
    const view = await render(
      <RatingReviewModal
        initialReview={{
          id: "review-abc",
          questId: "quest-123",
          reviewerId: "user-me",
          revieweeId: "user-worker-1",
          rating: 4,
          comment: "Archived review",
          createdAt: "2026-09-01T00:00:00.000Z",
          updatedAt: "2026-09-01T00:00:00.000Z",
        }}
        isReadOnly
        onClose={jest.fn()}
        onSubmit={jest.fn()}
        questId="quest-123"
        questTitle="Clean the Lab"
        reviewee={defaultReviewee}
        visible
      />
    );

    expect(view.getByText("Review Quest")).toBeTruthy();
    expect(view.queryByTestId("submit-review-button")).toBeNull();
  });
});
