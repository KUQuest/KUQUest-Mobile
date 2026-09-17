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
  ROLEPLAY_SCENARIOS,
  type RoleplayAction,
  type RoleplayActionResult,
  type RoleplayActionType,
  type RoleplayMock,
  type RoleplayScenarioId,
  type RoleplayViewModel,
} from "./roleplayTypes";

const ROLEPLAY_ACTION_TYPES: Record<RoleplayActionType, true> = {
  DIRECT_JOIN: true,
  APPLY: true,
  CREATE_TEAM: true,
  INVITE_WORKER: true,
  RESPOND_INVITATION: true,
  SUBMIT_TEAM: true,
  SELECT_CANDIDATE: true,
  REJECT_CANDIDATE: true,
  REJECT_TEAM: true,
  VOTE_PARTIAL_GROUP_START_CONSENT: true,
  CANCEL: true,
};

function isRoleplayActionType(
  action: QuestAction
): action is RoleplayActionType {
  return ROLEPLAY_ACTION_TYPES[action as RoleplayActionType] === true;
}

function getScenario(scenarioId: RoleplayScenarioId) {
  return (
    ROLEPLAY_SCENARIOS.find((scenario) => scenario.id === scenarioId) ??
    ROLEPLAY_SCENARIO
  );
}

function getCurrentState(scenarioId: RoleplayScenarioId): QuestDetailState {
  const activePersonaId = authEnvironment.getActivePersonaId();
  const state = questWorkflow.getQuestDetailState(scenarioId, activePersonaId);
  if (!state) {
    throw new Error(`Missing roleplay fixture state: ${scenarioId}`);
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
  questId: RoleplayScenarioId,
  activePersonaId: RoleplayViewModel["activePersonaId"]
): QuestFixtureAction {
  switch (action.type) {
    case "DIRECT_JOIN":
      return {
        type: "DIRECT_JOIN",
        questId,
        workerId: activePersonaId,
      };
    case "APPLY":
      return {
        type: "APPLY",
        questId,
        workerId: activePersonaId,
      };
    case "CREATE_TEAM":
      return {
        type: "CREATE_TEAM",
        questId,
        leaderId: activePersonaId,
      };
    case "INVITE_WORKER":
      return {
        type: "INVITE_WORKER",
        questId,
        workerId: action.workerId,
        leaderId: activePersonaId,
      };
    case "RESPOND_INVITATION":
      return {
        type: "RESPOND_INVITATION",
        questId,
        invitationId: action.invitationId,
        workerId: activePersonaId,
        accept: action.accept,
      };
    case "SUBMIT_TEAM":
      return {
        type: "SUBMIT_TEAM",
        questId,
        leaderId: activePersonaId,
      };
    case "SELECT_CANDIDATE":
      return {
        type: "SELECT_CANDIDATE",
        questId,
        applicationId: action.applicationId,
        hirerId: activePersonaId,
      };
    case "REJECT_CANDIDATE":
      return {
        type: "REJECT_CANDIDATE",
        questId,
        applicationId: action.applicationId,
        hirerId: activePersonaId,
      };
    case "REJECT_TEAM":
      return {
        type: "REJECT_TEAM",
        questId,
        teamId: action.teamId,
        hirerId: activePersonaId,
      };
    case "VOTE_PARTIAL_GROUP_START_CONSENT":
      return {
        type: "VOTE_PARTIAL_GROUP_START_CONSENT",
        questId,
        voterId: activePersonaId,
        approve: action.approve,
      };
    case "CANCEL":
      return {
        type: "CANCEL",
        questId,
        actorId: activePersonaId,
      };
  }
}

function createRoleplayViewModel(
  scenarioId: RoleplayScenarioId
): RoleplayViewModel {
  const activePersonaId = authEnvironment.getActivePersonaId();
  const state = getCurrentState(scenarioId);
  return {
    scenario: {
      ...getScenario(scenarioId),
      prototypeOnly: true,
    },
    activePersonaId,
    state,
    visibleActions:
      state.capabilities.availableActions.filter(isRoleplayActionType),
  };
}

export function createRoleplayMock(): RoleplayMock {
  const listeners = new Set<() => void>();
  let activeScenarioId: RoleplayScenarioId = ROLEPLAY_SCENARIO.id;
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
    getViewModel: () => createRoleplayViewModel(activeScenarioId),
    setScenario: (scenarioId) => {
      activeScenarioId = scenarioId;
      return createRoleplayViewModel(activeScenarioId);
    },
    setPersona: (personaId) => {
      authEnvironment.setActivePersona(personaId);
      return createRoleplayViewModel(activeScenarioId);
    },
    dispatch: (action) => {
      const state = getCurrentState(activeScenarioId);
      if (!state.capabilities.availableActions.includes(action.type)) {
        return roleIneligible(state, action);
      }
      return questWorkflow.dispatch(
        toWorkflowAction(
          action,
          activeScenarioId,
          authEnvironment.getActivePersonaId()
        )
      );
    },
    reset: () => {
      questWorkflow.reset();
      return createRoleplayViewModel(activeScenarioId);
    },
    subscribe,
  };
}

export const roleplayMock = createRoleplayMock();
