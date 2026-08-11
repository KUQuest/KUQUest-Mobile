import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { BottomNav, navigationItems } from '../components/navigation/BottomNav';
import { navigationMessages } from '../locales/navigationMessages';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

jest.mock('lucide-react-native', () => ({
  CheckSquare: () => null,
  CircleUserRound: () => null,
  Grid2X2: () => null,
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
});
