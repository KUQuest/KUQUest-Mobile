import { fireEvent, render } from '@testing-library/react-native';

import MyQuestsScreen from '../MyQuestsScreen';

const mockRouter = { push: jest.fn() };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('../../../locales/LocaleProvider', () => ({
  useLocale: () => ({ locale: 'th' }),
}));

describe('MyQuestsScreen', () => {
  beforeEach(() => {
    mockRouter.push.mockClear();
  });

  it('keeps Worker and Hirer work in one screen with separate role views', async () => {
    const view = await render(<MyQuestsScreen />);

    expect(view.getByText('ช่วยยกกล่องไปหอพัก')).toBeTruthy();
    expect(view.getByText('พิมพ์โน้ตการเรียน')).toBeTruthy();
    expect(view.queryByText('2 คนกำลังทำงาน')).toBeNull();

    await fireEvent.press(view.getByTestId('my-quests-role-hirer'));

    expect(view.getByText('2 คนกำลังทำงาน')).toBeTruthy();
    expect(view.getByText('พิมพ์โปสเตอร์งานกิจกรรม')).toBeTruthy();
    expect(view.queryByText('ช่วยยกกล่องไปหอพัก')).toBeNull();
  });

  it('uses Quest language and opens the real Quest Detail route from an active item', async () => {
    const view = await render(<MyQuestsScreen />);

    expect(view.getByText('เควสต์ที่ฉันเข้าร่วม')).toBeTruthy();

    await fireEvent.press(view.getByTestId('my-quest-action-move-boxes'));

    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/quest/[id]', params: { id: 'move-boxes' } });
    expect(view.getByTestId('my-quest-action-move-boxes').props.accessibilityLabel).toContain('ช่วยยกกล่องไปหอพัก');
  });
});
