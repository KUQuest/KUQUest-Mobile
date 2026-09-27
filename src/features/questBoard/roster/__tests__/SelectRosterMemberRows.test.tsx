import React from "react";
import { renderWithAppTheme as render } from "@/testing/queryTestUtils";

import { WorkerRow } from "../components/SelectRosterMemberRows";
import { useSelectRosterMemberProfile } from "../useSelectRosterMemberProfile";

jest.mock("../useSelectRosterMemberProfile", () => ({
  useSelectRosterMemberProfile: jest.fn(),
}));

describe("WorkerRow", () => {
  it("shows public rating and academic affiliation, omitting unavailable affiliation", async () => {
    jest.mocked(useSelectRosterMemberProfile).mockReturnValue({
      displayName: "Nina Worker",
      ratingAverage: 4.6,
      faculty: "คณะวิศวกรรมศาสตร์",
      department: "วิศวกรรมคอมพิวเตอร์",
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
    expect(
      view.getByText("คณะวิศวกรรมศาสตร์ · วิศวกรรมคอมพิวเตอร์")
    ).toBeTruthy();
    expect(
      view.getByLabelText(
        "Open Nina Worker profile. 4.6/5. คณะวิศวกรรมศาสตร์ · วิศวกรรมคอมพิวเตอร์"
      )
    ).toBeTruthy();

    jest.mocked(useSelectRosterMemberProfile).mockReturnValue({
      displayName: "Nina Worker",
      ratingAverage: null,
    });
    const withoutAffiliation = await render(
      <WorkerRow
        workerId="worker-2"
        onOpenProfile={jest.fn()}
        openProfileLabel={(name) => `Open ${name} profile`}
      />
    );
    expect(withoutAffiliation.queryByText(/·/)).toBeNull();
  });
});
