import { fireEvent, render } from "@testing-library/react-native";

import { QuestParticipantRoster } from "../QuestParticipantRoster";
describe("QuestParticipantRoster", () => {
  it("shows the joined count and opens a participant profile", async () => {
    const onOpenProfile = jest.fn();
    const view = await render(
      <QuestParticipantRoster
        countLabel="Participants 3/5"
        onOpenProfile={onOpenProfile}
        participants={[
          { id: "worker-1", displayName: "Sora Student" },
          { id: "worker-2", displayName: "Mali Worker" },
          { id: "worker-3", displayName: "Niran Member" },
        ]}
        profileLabel={(name) => `View profile of ${name}`}
        title="Participants"
      />
    );

    expect(
      view.getByTestId("quest-participant-roster-count")
    ).toHaveTextContent("Participants 3/5");
    expect(view.getByText("Sora Student")).toBeTruthy();

    fireEvent.press(view.getByTestId("quest-participant-worker-2"));

    expect(onOpenProfile).toHaveBeenCalledWith("worker-2");
  });
});
