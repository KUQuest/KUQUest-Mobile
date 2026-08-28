import React, { type ReactNode } from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { PrototypeMenu } from '../PrototypeMenu';
import { PROTOTYPE_PERSONAS } from '../prototypeMenuData';

let mockLocale: 'en' | 'th' = 'en';

jest.mock('@/locales/LocaleProvider', () => ({
  useLocale: () => ({ locale: mockLocale }),
}));

jest.mock('react-native/Libraries/Modal/Modal', () => ({
  __esModule: true,
  default: ({ visible, children }: { visible: boolean; children: ReactNode }) => visible ? <>{children}</> : null,
}));

async function renderMenu(overrides: Partial<React.ComponentProps<typeof PrototypeMenu>> = {}) {
  return render(
    <PrototypeMenu
      activePersonaId="student-demo"
      onPersonaChange={() => undefined}
      onReset={() => undefined}
      onScenarioPress={() => undefined}
      visible
      {...overrides}
    />,
  );
}

describe('PrototypeMenu', () => {
  afterEach(() => {
    mockLocale = 'en';
  });

  it('exposes all fixture personas, scenario routes, and reset scopes', async () => {
    const onPersonaChange = jest.fn();
    const onScenarioPress = jest.fn();
    const onReset = jest.fn();
    const view = await renderMenu({ onPersonaChange, onReset, onScenarioPress, currentScenario: '/quest/team-forming-demo' });

    expect(view.getByTestId('prototype-menu-sheet')).toBeTruthy();
    expect(view.getByRole('header', { name: 'Prototype controls' })).toBeTruthy();
    expect(PROTOTYPE_PERSONAS.map(({ id }) => id)).toEqual([
      'demo-hirer',
      'student-demo',
      'demo-worker-2',
      'demo-worker-3',
    ]);
    expect(PROTOTYPE_PERSONAS.map(({ id, roles, label }) => ({ id, roles, label }))).toEqual([
      { id: 'demo-hirer', roles: ['hirer'], label: { en: 'Hirer', th: 'ผู้ว่าจ้าง' } },
      { id: 'student-demo', roles: ['applicant', 'team-leader'], label: { en: 'Applicant / Team Leader A', th: 'ผู้สมัคร / หัวหน้าทีม A' } },
      { id: 'demo-worker-2', roles: ['worker'], label: { en: 'Invited Worker', th: 'ผู้ทำงานที่ได้รับเชิญ' } },
      { id: 'demo-worker-3', roles: ['team-leader'], label: { en: 'Team Leader B', th: 'หัวหน้าทีม B' } },
    ]);
    expect(view.getAllByRole('radio')).toHaveLength(4);
    expect(view.getByRole('radio', { name: 'Hirer (demo-hirer)' })).toBeTruthy();
    expect(view.getByRole('radio', { name: 'Applicant / Team Leader A (student-demo)' }).props.accessibilityState).toMatchObject({ selected: true });
    expect(view.getByRole('radio', { name: 'Invited Worker (demo-worker-2)' })).toBeTruthy();
    expect(view.getByRole('radio', { name: 'Team Leader B (demo-worker-3)' })).toBeTruthy();
    expect(PROTOTYPE_PERSONAS.find((persona) => persona.id === 'student-demo')?.roles).toEqual(['applicant', 'team-leader']);

    expect(view.getByText('/quest/team-forming-demo')).toBeTruthy();
    expect(view.getByText('/quest/team-selection-demo')).toBeTruthy();
    expect(view.getByText('/quest/single-candidate-demo')).toBeTruthy();
    expect(view.getByText('/quest/partial-group-start-demo')).toBeTruthy();

    await fireEvent.press(view.getByTestId('prototype-menu-persona-demo-worker-2'));
    await fireEvent.press(view.getByTestId('prototype-menu-scenario-single-candidate-demo'));
    await fireEvent.press(view.getByTestId('prototype-menu-reset-current'));
    await fireEvent.press(view.getByTestId('prototype-menu-reset-all'));

    expect(onPersonaChange).toHaveBeenCalledWith('demo-worker-2');
    expect(onScenarioPress).toHaveBeenCalledWith('/quest/single-candidate-demo');
    expect(onReset).toHaveBeenNthCalledWith(1, 'current');
    expect(onReset).toHaveBeenNthCalledWith(2, 'all');
  });

  it('renders Thai copy while keeping stable persona IDs and route paths', async () => {
    mockLocale = 'th';
    const view = await renderMenu();

    expect(view.getByRole('header', { name: 'เครื่องมือ Prototype' })).toBeTruthy();
    expect(view.getByRole('radio', { name: 'ผู้ว่าจ้าง (demo-hirer)' })).toBeTruthy();
    expect(view.getByRole('radio', { name: 'ผู้สมัคร / หัวหน้าทีม A (student-demo)' })).toBeTruthy();
    expect(view.getByText('รีเซ็ตทุกสถานการณ์')).toBeTruthy();
    expect(view.getByText('/quest/partial-group-start-demo')).toBeTruthy();
  });

  it('is opened by a 44-point trigger and closes through the native sheet controls', async () => {
    const onVisibleChange = jest.fn();
    const view = await renderMenu({ visible: undefined, onVisibleChange });
    const trigger = view.getByTestId('prototype-menu-trigger');

    expect(view.queryByTestId('prototype-menu-sheet')).toBeNull();

    await fireEvent.press(trigger);
    expect(view.getByTestId('prototype-menu-sheet')).toBeTruthy();
    await fireEvent.press(view.getByTestId('prototype-menu-close'));
    expect(onVisibleChange).toHaveBeenNthCalledWith(1, true);
    expect(onVisibleChange).toHaveBeenNthCalledWith(2, false);
    expect(view.queryByTestId('prototype-menu-sheet')).toBeNull();
  });
});
