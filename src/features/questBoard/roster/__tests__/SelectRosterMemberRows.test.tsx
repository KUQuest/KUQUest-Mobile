import React from "react";
import { renderWithAppTheme as render } from "@/testing/queryTestUtils";

import { WorkerRow } from "../components/SelectRosterMemberRows";
import { useSelectRosterMemberProfile } from "../useSelectRosterMemberProfile";

jest.mock("../useSelectRosterMemberProfile", () => ({
  useSelectRosterMemberProfile: jest.fn(),
}));

describe("WorkerRow", () => {
  it("shows public rating beside worker name and includes it in accessible label", async () => {
    jest.mocked(useSelectRosterMemberProfile).mockReturnValue({
      displayName: "Nina Worker",
      ratingAverage: 4.6,
    });

    const view = await render(
      <WorkerRow
        workerId="worker-1"
        onOpenProfile={jest.fn()}
        openProfileLabel={(name) => `Open ${name} profile`}
      />
    );

    expect(view.getByText("Nina Worker")).toBeTruthy();
    expect(view.getByText("★ 4.6")).toBeTruthy();
    expect(view.getByLabelText("Open Nina Worker profile. 4.6/5")).toBeTruthy();
  });
});
