export type PrototypePersonaRole =
  "hirer" | "applicant" | "team-leader" | "worker";

export type PrototypePersona = Readonly<{
  id: string;
  roles: readonly PrototypePersonaRole[];
}>;

export const PROTOTYPE_PERSONAS = [
  {
    id: "demo-hirer",
    roles: ["hirer"],
  },
  {
    id: "student-demo",
    roles: ["applicant", "team-leader"],
  },
  {
    id: "demo-worker-2",
    roles: ["worker"],
  },
  {
    id: "demo-worker-3",
    roles: ["team-leader"],
  },
] as const satisfies readonly PrototypePersona[];

export type PrototypePersonaId = (typeof PROTOTYPE_PERSONAS)[number]["id"];

export const DEFAULT_PROTOTYPE_PERSONA_ID: PrototypePersonaId = "student-demo";

export const PROTOTYPE_SCENARIOS = [
  {
    id: "team-forming-demo",
    route: "/quest/team-forming-demo",
  },
  {
    id: "team-selection-demo",
    route: "/quest/team-selection-demo",
  },
  {
    id: "single-candidate-demo",
    route: "/quest/single-candidate-demo",
  },
  {
    id: "partial-group-start-demo",
    route: "/quest/partial-group-start-demo",
  },
  {
    id: "proof-in-progress-demo",
    route: "/quest/proof-in-progress-demo",
  },
  {
    id: "proof-free-in-progress-demo",
    route: "/quest/proof-free-in-progress-demo",
  },
  {
    id: "proof-candidate-in-progress-demo",
    route: "/quest/proof-candidate-in-progress-demo",
  },
  {
    id: "proof-free-candidate-in-progress-demo",
    route: "/quest/proof-free-candidate-in-progress-demo",
  },
  {
    id: "proof-group-in-progress-demo",
    route: "/quest/proof-group-in-progress-demo",
  },
  {
    id: "proof-free-group-in-progress-demo",
    route: "/quest/proof-free-group-in-progress-demo",
  },
  {
    id: "proof-team-in-progress-demo",
    route: "/quest/proof-team-in-progress-demo",
  },
  {
    id: "proof-free-team-in-progress-demo",
    route: "/quest/proof-free-team-in-progress-demo",
  },
  {
    id: "roleplay-demo",
    route: "/dev/roleplay",
  },
] as const;

export type PrototypeScenarioId = (typeof PROTOTYPE_SCENARIOS)[number]["id"];
export type PrototypeScenarioRoute =
  (typeof PROTOTYPE_SCENARIOS)[number]["route"];

export type PrototypeResetScope = "current" | "all";
export type PrototypePersonaChangeHandler = (
  personaId: PrototypePersonaId
) => void;
export type PrototypeScenarioSelectHandler = (
  route: PrototypeScenarioRoute
) => void;
export type PrototypeResetHandler = (scope: PrototypeResetScope) => void;

export function isPrototypePersonaId(
  value: string | null | undefined
): value is PrototypePersonaId {
  return PROTOTYPE_PERSONAS.some((persona) => persona.id === value);
}

export function isPrototypeScenarioRoute(
  value: string | null | undefined
): value is PrototypeScenarioRoute {
  return PROTOTYPE_SCENARIOS.some((scenario) => scenario.route === value);
}
