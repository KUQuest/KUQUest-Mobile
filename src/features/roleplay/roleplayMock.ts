import { authEnvironment } from "@/features/auth/authEnvironment";
import {
  questWorkflow,
  type QuestFixtureAction,
} from "@/features/questBoard/questWorkflow";
import type {
  QuestAction,
  QuestDetailState,
} from "@/features/questBoard/types";

import {
  ROLEPLAY_SCENARIO,
  ROLEPLAY_SCENARIO_ID,
  type RoleplayAction,
  type RoleplayActionResult,
  type RoleplayActionType,
  type RoleplayMock,
  type RoleplayViewModel,
} from "./roleplayTypes";

const ROLEPLAY_ACTION_TYPES: Record<RoleplayActionType, true> = {
  APPLY: true,
  SELECT_CANDIDATE: true,
  REJECT_CANDIDATE: true,
  CANCEL: true,
};

function isRoleplayActionType(
  action: QuestAction
): action is RoleplayActionType {
  return ROLEPLAY_ACTION_TYPES[action as RoleplayActionType] === true;
}

function getCurrentState(): QuestDetailState {
  const activePersonaId = authEnvironment.getActivePersonaId();
  const state = questWorkflow.getQuestDetailState(
    ROLEPLAY_SCENARIO_ID,
    activePersonaId
  );
  if (!state) {
    throw new Error(`Missing roleplay fixture state: ${ROLEPLAY_SCENARIO_ID}`);
  }
  return state;
}

function roleIneligible(
  state: QuestDetailState,
  action: RoleplayAction
): RoleplayActionResult {
  return {
    ok: false,
    state,
    error: {
      code: "FORBIDDEN",
      message: `The active persona cannot perform ${action.type}.`,
    },
  };
}

function toWorkflowAction(
  action: RoleplayAction,
  activePersonaId: RoleplayViewModel["activePersonaId"]
): QuestFixtureAction {
  switch (action.type) {
    case "APPLY":
      return {
        type: "APPLY",
        questId: ROLEPLAY_SCENARIO_ID,
        workerId: activePersonaId,
      };
    case "SELECT_CANDIDATE":
      return {
        type: "SELECT_CANDIDATE",
        questId: ROLEPLAY_SCENARIO_ID,
        applicationId: action.applicationId,
        hirerId: activePersonaId,
      };
    case "REJECT_CANDIDATE":
      return {
        type: "REJECT_CANDIDATE",
        questId: ROLEPLAY_SCENARIO_ID,
        applicationId: action.applicationId,
        hirerId: activePersonaId,
      };
    case "CANCEL":
      return {
        type: "CANCEL",
        questId: ROLEPLAY_SCENARIO_ID,
        actorId: activePersonaId,
      };
  }
}

function createRoleplayViewModel(): RoleplayViewModel {
  const activePersonaId = authEnvironment.getActivePersonaId();
  const state = getCurrentState();
  return {
    scenario: ROLEPLAY_SCENARIO,
    activePersonaId,
    state,
    visibleActions:
      state.capabilities.availableActions.filter(isRoleplayActionType),
  };
}

export function createRoleplayMock(): RoleplayMock {
  const listeners = new Set<() => void>();
  let workflowUnsubscribe: (() => void) | undefined;
  let authUnsubscribe: (() => void) | undefined;
  const notify = () => listeners.forEach((listener) => listener());

  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    if (listeners.size === 1) {
      workflowUnsubscribe = questWorkflow.subscribe(notify);
      authUnsubscribe = authEnvironment.subscribe(notify);
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size > 0) return;
      workflowUnsubscribe?.();
      workflowUnsubscribe = undefined;
      authUnsubscribe?.();
      authUnsubscribe = undefined;
    };
  };

  return {
    getViewModel: createRoleplayViewModel,
    setPersona: (personaId) => {
      authEnvironment.setActivePersona(personaId);
      return createRoleplayViewModel();
    },
    dispatch: (action) => {
      const state = getCurrentState();
      if (!state.capabilities.availableActions.includes(action.type)) {
        return roleIneligible(state, action);
      }
      return questWorkflow.dispatch(
        toWorkflowAction(action, authEnvironment.getActivePersonaId())
      );
    },
    reset: () => {
      questWorkflow.reset();
      return createRoleplayViewModel();
    },
    subscribe,
  };
}

export const roleplayMock = createRoleplayMock();
