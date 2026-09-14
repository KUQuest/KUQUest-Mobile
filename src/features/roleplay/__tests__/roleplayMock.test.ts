import { authEnvironment } from "@/features/auth/authEnvironment";
import { QuestStatus } from "@/features/questBoard/types";

import { roleplayMock } from "../roleplayMock";

const fixedScenario = "single-candidate-demo";

describe("roleplayMock", () => {
  beforeEach(() => {
    authEnvironment.reset();
    roleplayMock.reset();
  });

  it("exposes the deterministic single Candidate scenario for each persona", () => {
    const student = roleplayMock.getViewModel();

    expect(student.scenario.id).toBe(fixedScenario);
    expect(student.scenario.prototypeOnly).toBe(true);
    expect(student.activePersonaId).toBe("student-demo");
    expect(student.state.quest.status).toBe(QuestStatus.QUEST_OPEN);
    expect(student.state.quest.proofRequired).toBe("optional");
    expect(student.visibleActions).toEqual(["APPLY"]);

    const hirer = roleplayMock.setPersona("demo-hirer");
    expect(hirer.activePersonaId).toBe("demo-hirer");
    expect(hirer.visibleActions).toEqual([
      "SELECT_CANDIDATE",
      "REJECT_CANDIDATE",
      "CANCEL",
    ]);

    const worker = roleplayMock.setPersona("demo-worker-2");
    expect(worker.activePersonaId).toBe("demo-worker-2");
    expect(worker.visibleActions).toEqual(["APPLY"]);
  });

  it("rejects role-ineligible actions without changing fixture state", () => {
    const before = roleplayMock.getViewModel().state;
    const applicationId = before.applications[0]?.id ?? "missing-application";

    const result = roleplayMock.dispatch({
      type: "SELECT_CANDIDATE",
      applicationId,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("FORBIDDEN");
    expect(roleplayMock.getViewModel().state).toEqual(before);
  });

  it("restores the same fixture state after a valid action and reset", () => {
    const initial = roleplayMock.getViewModel();

    const applied = roleplayMock.dispatch({ type: "APPLY" });
    expect(applied.ok).toBe(true);
    expect(roleplayMock.getViewModel().state.applications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          applicantId: "student-demo",
          status: "APPLICATION_APPLIED",
        }),
      ])
    );

    const reset = roleplayMock.reset();
    expect(reset).toEqual(initial);
  });

  it("maps Candidate selection to the active Hirer identity", () => {
    roleplayMock.setPersona("demo-hirer");
    const applicationId = roleplayMock.getViewModel().state.applications[0]?.id;

    expect(applicationId).toBeDefined();
    const result = roleplayMock.dispatch({
      type: "SELECT_CANDIDATE",
      applicationId: applicationId ?? "missing-application",
    });

    expect(result.ok).toBe(true);
    expect(roleplayMock.getViewModel().state.quest.hirerId).toBe("demo-hirer");
    expect(
      roleplayMock
        .getViewModel()
        .state.applications.find(
          (application) => application.id === applicationId
        )?.status
    ).toBe("APPLICATION_SELECTED");
  });
});
