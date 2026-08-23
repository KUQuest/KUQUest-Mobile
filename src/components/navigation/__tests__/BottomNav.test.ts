import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { BottomNav, navigationItems } from '../BottomNav';
import styles from '../bottomNavStyles';
import { navigationMessages } from '../../../locales/navigationMessages';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

jest.mock('lucide-react-native', () => ({
  CheckSquare: () => null,
  CircleUserRound: () => null,
  LayoutDashboard: () => null,
  MessageSquare: () => null,
  Plus: () => null,
}));

describe('authenticated primary navigation', () => {
  it('keeps the approved five-destination order', () => {
    expect(navigationItems.map((item) => item.routeName)).toEqual([
      'index',
      'my-quests',
      'create',
      'chat',
      'profile',
    ]);
  });

  it('marks Create as the central action', () => {
    expect(navigationItems.find((item) => item.routeName === 'create')).toMatchObject({ isCreate: true });
  });

  it('provides the approved English and Thai labels', () => {
    expect(navigationMessages.en).toMatchObject({
      board: 'Quest Board',
      myQuests: 'My Quests',
      create: 'Create',
      chat: 'Chat',
      profile: 'Student Profile',
    });
    expect(navigationMessages.th).toMatchObject({
      board: 'กระดานเควสต์',
      myQuests: 'เควสต์ของฉัน',
      create: 'สร้าง',
      chat: 'แชต',
      profile: 'โปรไฟล์นักศึกษา',
    });
  });

  it('floats above the screen instead of occupying a visible host strip', () => {
    expect(styles.container).toEqual(expect.stringContaining('absolute'));
    expect(styles.container).toEqual(expect.stringContaining('bottom-0'));
    expect(styles.container).not.toEqual(expect.stringContaining('bg-'));
  });

  it('centers the tablet rail actions as one balanced vertical group', () => {
    expect(styles.tabletBar).toEqual(expect.stringContaining('justify-center'));
    expect(styles.tabletBar).toEqual(expect.stringContaining('gap-[8px]'));
  });

  it('exposes destinations as tabs and Create as an action', async () => {
    const routes = navigationItems.map((item) => ({ key: `${item.routeName}-key`, name: item.routeName }));
    const view = await render(
      React.createElement(BottomNav, {
        state: { index: 0, routes } as never,
        descriptors: Object.fromEntries(routes.map((route) => [route.key, { options: {} }])) as never,
        navigation: { emit: jest.fn(() => ({ defaultPrevented: false })), navigate: jest.fn() } as never,
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      })
    );

    expect(view.getByTestId('tab-index').props.accessibilityRole).toBe('tab');
    expect(view.getByTestId('tab-index').props.accessibilityState).toEqual({ selected: true });
    expect(view.getByTestId('tab-profile').props.accessibilityState).toEqual({ selected: false });
    expect(view.getByTestId('tab-create').props.accessibilityRole).toBe('button');
    expect(view.getByTestId('tab-create').props.accessibilityState.selected).toBeUndefined();
    expect(view.queryByText('Create')).toBeNull();
  });

  it('launches Create when it is already the current route', async () => {
    const routes = navigationItems.map((item) => ({ key: `${item.routeName}-key`, name: item.routeName }));
    const navigate = jest.fn();
    const view = await render(
      React.createElement(BottomNav, {
        state: { index: 2, routes } as never,
        descriptors: Object.fromEntries(routes.map((route) => [route.key, { options: {} }])) as never,
        navigation: { emit: jest.fn(() => ({ defaultPrevented: false })), navigate } as never,
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      })
    );

    await fireEvent.press(view.getByTestId('tab-create'));

    expect(navigate).toHaveBeenCalledWith('create', undefined);
  });

  it('marks the profile tab selected when the profile route is focused', async () => {
    const routes = navigationItems.map((item) => ({ key: `${item.routeName}-key`, name: item.routeName }));
    const view = await render(
      React.createElement(BottomNav, {
        state: { index: 4, routes } as never,
        descriptors: Object.fromEntries(routes.map((route) => [route.key, { options: {} }])) as never,
        navigation: { emit: jest.fn(() => ({ defaultPrevented: false })), navigate: jest.fn() } as never,
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      })
    );

    expect(view.getByTestId('tab-profile').props.accessibilityState).toEqual({ selected: true });
    expect(view.getByLabelText('Student Profile selected')).toBeTruthy();
    expect(view.getByTestId('tab-index').props.accessibilityState).toEqual({ selected: false });
  });
});
