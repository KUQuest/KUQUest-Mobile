import { createStore, type StoreApi } from "zustand/vanilla";

import { useAuthEnvironmentStore } from "@/features/auth/authEnvironmentStore";
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
  const activePersonaId = useAuthEnvironmentStore.getState().activePersonaId;
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
  const activePersonaId = useAuthEnvironmentStore.getState().activePersonaId;
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

export interface RoleplayStoreState {
  activeScenarioId: RoleplayScenarioId;
  revision: number;
  setScenario(scenarioId: RoleplayScenarioId): void;
  refresh(): void;
}

export type RoleplayStore = StoreApi<RoleplayStoreState>;

export function selectRoleplayViewModel(
  state: RoleplayStoreState
): RoleplayViewModel {
  return createRoleplayViewModel(state.activeScenarioId);
}

const stateStore = createStore<RoleplayStoreState>((set) => ({
  activeScenarioId: ROLEPLAY_SCENARIO.id,
  revision: 0,
  setScenario: (activeScenarioId) =>
    set((state) => ({
      activeScenarioId,
      revision: state.revision + 1,
    })),
  refresh: () => set((state) => ({ revision: state.revision + 1 })),
}));

let subscriberCount = 0;
let workflowUnsubscribe: (() => void) | undefined;
let authUnsubscribe: (() => void) | undefined;

/**
 * The view model is derived from the quest workflow and the auth environment, so the store
 * mirrors their changes as a revision bump. The upstream subscriptions - and therefore the
 * workflow's deadline timer - exist only while this store has subscribers.
 */
function subscribe(
  listener: (
    state: RoleplayStoreState,
    previousState: RoleplayStoreState
  ) => void
): () => void {
  const unsubscribeStore = stateStore.subscribe(listener);
  subscriberCount += 1;
  if (subscriberCount === 1) {
    const refresh = stateStore.getState().refresh;
    workflowUnsubscribe = questWorkflow.subscribe(refresh);
    authUnsubscribe = useAuthEnvironmentStore.subscribe(refresh);
  }

  let subscribed = true;
  return () => {
    if (!subscribed) return;
    subscribed = false;
    unsubscribeStore();
    subscriberCount -= 1;
    if (subscriberCount > 0) return;
    workflowUnsubscribe?.();
    workflowUnsubscribe = undefined;
    authUnsubscribe?.();
    authUnsubscribe = undefined;
  };
}

export const roleplayStore: RoleplayStore = { ...stateStore, subscribe };

export const roleplayMock: RoleplayMock = {
  getViewModel: () => selectRoleplayViewModel(roleplayStore.getState()),
  setScenario: (scenarioId) => {
    roleplayStore.getState().setScenario(scenarioId);
    return selectRoleplayViewModel(roleplayStore.getState());
  },
  setPersona: (personaId) => {
    useAuthEnvironmentStore.getState().selectPersona(personaId);
    return selectRoleplayViewModel(roleplayStore.getState());
  },
  dispatch: (action) => {
    const state = getCurrentState(roleplayStore.getState().activeScenarioId);
    if (!state.capabilities.availableActions.includes(action.type)) {
      return roleIneligible(state, action);
    }
    return questWorkflow.dispatch(
      toWorkflowAction(
        action,
        roleplayStore.getState().activeScenarioId,
        useAuthEnvironmentStore.getState().activePersonaId
      )
    );
  },
  reset: () => {
    questWorkflow.reset();
    return selectRoleplayViewModel(roleplayStore.getState());
  },
};
