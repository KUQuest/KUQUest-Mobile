import type { PrototypePersonaId } from "@/components/ui/prototypeMenuData";
import type { QuestFixtureResult } from "@/features/questBoard/fixtures/adapters/questFixtureAdapter";
import type { QuestDetailState } from "@/features/questBoard/domain/types";

export const ROLEPLAY_SCENARIOS = [
  {
    id: "single-candidate-demo",
    route: "/quest/single-candidate-demo",
  },
  {
    id: "print-documents",
    route: "/quest/print-documents",
  },
  {
    id: "team-selection-demo",
    route: "/quest/team-selection-demo",
  },
  {
    id: "clean-fan",
    route: "/quest/clean-fan",
  },
] as const;

export type RoleplayScenarioId = (typeof ROLEPLAY_SCENARIOS)[number]["id"];
export type RoleplayScenarioRoute =
  (typeof ROLEPLAY_SCENARIOS)[number]["route"];

export const ROLEPLAY_SCENARIO_ID = ROLEPLAY_SCENARIOS[0].id;
export const ROLEPLAY_SCENARIO_ROUTE = ROLEPLAY_SCENARIOS[0].route;

export interface RoleplayScenario {
  id: RoleplayScenarioId;
  route: RoleplayScenarioRoute;
  prototypeOnly: true;
}

/** The first scenario remains the default entry point for the Roleplay screen. */
export const ROLEPLAY_SCENARIO: RoleplayScenario = {
  id: ROLEPLAY_SCENARIO_ID,
  route: ROLEPLAY_SCENARIO_ROUTE,
  prototypeOnly: true,
};

export type RoleplayAction =
  | { type: "DIRECT_JOIN" }
  | { type: "APPLY" }
  | { type: "CREATE_TEAM" }
  | { type: "INVITE_WORKER"; workerId: string }
  | { type: "RESPOND_INVITATION"; invitationId: string; accept: boolean }
  | { type: "SUBMIT_TEAM" }
  | { type: "SELECT_CANDIDATE"; applicationId: string }
  | { type: "REJECT_CANDIDATE"; applicationId: string }
  | { type: "REJECT_TEAM"; teamId: string }
  | { type: "VOTE_PARTIAL_GROUP_START_CONSENT"; approve: boolean }
  | { type: "CANCEL" };

export type RoleplayActionType = RoleplayAction["type"];

export interface RoleplayViewModel {
  scenario: RoleplayScenario;
  activePersonaId: PrototypePersonaId;
  state: QuestDetailState;
  visibleActions: RoleplayActionType[];
}

export type RoleplayActionResult = QuestFixtureResult;

export interface RoleplayMock {
  getViewModel(): RoleplayViewModel;
  setScenario(scenarioId: RoleplayScenarioId): RoleplayViewModel;
  setPersona(personaId: PrototypePersonaId): RoleplayViewModel;
  dispatch(action: RoleplayAction): RoleplayActionResult;
  reset(): RoleplayViewModel;
}
