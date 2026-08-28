export type PrototypeMenuLocaleLabel = Readonly<{
  en: string;
  th: string;
}>;

export type PrototypePersonaRole = 'hirer' | 'applicant' | 'team-leader' | 'worker';

export type PrototypePersona = Readonly<{
  id: string;
  roles: readonly PrototypePersonaRole[];
  label: PrototypeMenuLocaleLabel;
}>;

export const PROTOTYPE_PERSONAS = [
  { id: 'demo-hirer', roles: ['hirer'], label: { en: 'Hirer', th: 'ผู้ว่าจ้าง' } },
  {
    id: 'student-demo',
    roles: ['applicant', 'team-leader'],
    label: { en: 'Applicant / Team Leader A', th: 'ผู้สมัคร / หัวหน้าทีม A' },
  },
  { id: 'demo-worker-2', roles: ['worker'], label: { en: 'Invited Worker', th: 'ผู้ทำงานที่ได้รับเชิญ' } },
  { id: 'demo-worker-3', roles: ['team-leader'], label: { en: 'Team Leader B', th: 'หัวหน้าทีม B' } },
] as const satisfies readonly PrototypePersona[];

export type PrototypePersonaId = (typeof PROTOTYPE_PERSONAS)[number]['id'];

export const DEFAULT_PROTOTYPE_PERSONA_ID: PrototypePersonaId = 'student-demo';

export const PROTOTYPE_SCENARIOS = [
  {
    id: 'team-forming-demo',
    route: '/quest/team-forming-demo',
    label: { en: 'Team forming', th: 'การรวมทีม' },
  },
  {
    id: 'team-selection-demo',
    route: '/quest/team-selection-demo',
    label: { en: 'Team selection', th: 'การเลือกทีม' },
  },
  {
    id: 'single-candidate-demo',
    route: '/quest/single-candidate-demo',
    label: { en: 'Single candidate', th: 'ผู้สมัครเดี่ยว' },
  },
  {
    id: 'partial-group-start-demo',
    route: '/quest/partial-group-start-demo',
    label: { en: 'Partial group start', th: 'เริ่มกลุ่มไม่เต็มจำนวน' },
  },
] as const;

export type PrototypeScenarioId = (typeof PROTOTYPE_SCENARIOS)[number]['id'];
export type PrototypeScenarioRoute = (typeof PROTOTYPE_SCENARIOS)[number]['route'];

export type PrototypeResetScope = 'current' | 'all';
export type PrototypePersonaChangeHandler = (personaId: PrototypePersonaId) => void;
export type PrototypeScenarioSelectHandler = (route: PrototypeScenarioRoute) => void;
export type PrototypeResetHandler = (scope: PrototypeResetScope) => void;

export function isPrototypePersonaId(value: string | null | undefined): value is PrototypePersonaId {
  return PROTOTYPE_PERSONAS.some((persona) => persona.id === value);
}

export function isPrototypeScenarioRoute(value: string | null | undefined): value is PrototypeScenarioRoute {
  return PROTOTYPE_SCENARIOS.some((scenario) => scenario.route === value);
}
