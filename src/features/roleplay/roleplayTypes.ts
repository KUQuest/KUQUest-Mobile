import type {
  PrototypePersonaId,
  PrototypeScenarioId,
  PrototypeScenarioRoute,
} from "@/components/ui/prototypeMenuData";
import type { QuestFixtureResult } from "@/features/questBoard/questFixtureAdapter";
import type { QuestDetailState } from "@/features/questBoard/types";

export const ROLEPLAY_SCENARIO_ID = "single-candidate-demo" as const;
export const ROLEPLAY_SCENARIO_ROUTE = "/quest/single-candidate-demo" as const;

export type RoleplayScenarioId = Extract<
  PrototypeScenarioId,
  typeof ROLEPLAY_SCENARIO_ID
>;
export type RoleplayScenarioRoute = Extract<
  PrototypeScenarioRoute,
  typeof ROLEPLAY_SCENARIO_ROUTE
>;

export interface RoleplayScenario {
  id: RoleplayScenarioId;
  route: RoleplayScenarioRoute;
  prototypeOnly: true;
}

/**
 * This scenario intentionally exposes the fixture's optional proof value.
 * That value is prototype compatibility, not a production API guarantee.
 */
export const ROLEPLAY_SCENARIO: RoleplayScenario = {
  id: ROLEPLAY_SCENARIO_ID,
  route: ROLEPLAY_SCENARIO_ROUTE,
  prototypeOnly: true,
};

export type RoleplayAction =
  | { type: "APPLY" }
  | { type: "SELECT_CANDIDATE"; applicationId: string }
  | { type: "REJECT_CANDIDATE"; applicationId: string }
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
  setPersona(personaId: PrototypePersonaId): RoleplayViewModel;
  dispatch(action: RoleplayAction): RoleplayActionResult;
  reset(): RoleplayViewModel;
  subscribe(listener: () => void): () => void;
}
