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

  it('keeps Worker and Hirer work in one screen with separate role and status views', async () => {
    const view = await render(<MyQuestsScreen />);

    expect(view.getByText('MyQuest')).toBeTruthy();
    expect(view.getByText('เลือกสถานะเควสต์')).toBeTruthy();
    expect(view.getByText('ช่วยยกกล่องไปหอพัก')).toBeTruthy();
    expect(view.queryByText('พิมพ์โน้ตการเรียน')).toBeNull();
    expect(view.queryByText('2 คนกำลังทำงาน')).toBeNull();

    await fireEvent.press(view.getByTestId('my-quests-status-history'));
    expect(view.getByText('พิมพ์โน้ตการเรียน')).toBeTruthy();

    await fireEvent.press(view.getByTestId('my-quests-role-trigger'));
    expect(view.getByText('เลือกมุมมองเควสต์')).toBeTruthy();
    expect(view.getByText('เข้าร่วมเควสต์')).toBeTruthy();
    expect(view.getByText('โพสต์เควสต์')).toBeTruthy();
    await fireEvent.press(view.getByTestId('my-quests-role-hirer'));

    expect(view.queryByText('โพสต์เควสต์')).toBeNull();
    expect(view.getByText('2 คนกำลังทำงาน')).toBeTruthy();
    expect(view.queryByText('พิมพ์โปสเตอร์งานกิจกรรม')).toBeNull();
    expect(view.queryByText('ช่วยยกกล่องไปหอพัก')).toBeNull();

    await fireEvent.press(view.getByTestId('my-quests-status-completed'));
    expect(view.getByText('พิมพ์โปสเตอร์งานกิจกรรม')).toBeTruthy();
  });

  it('uses Quest language and opens the real Quest Detail route from an active item', async () => {
    const view = await render(<MyQuestsScreen />);

    expect(view.getByText('MyQuest')).toBeTruthy();

    await fireEvent.press(view.getByTestId('my-quest-action-move-boxes'));

    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/quest/[id]', params: { id: 'move-boxes' } });
    expect(view.getByTestId('my-quest-action-move-boxes').props.accessibilityLabel).toContain('ช่วยยกกล่องไปหอพัก');
  });

  it('does not show role-level bottom actions on My Apply Quest or My Quest', async () => {
    const view = await render(<MyQuestsScreen />);

    expect(view.queryByTestId('my-quests-primary-cta')).toBeNull();
    expect(view.queryByText('ค้นหาเควสต์เพิ่ม')).toBeNull();

    await fireEvent.press(view.getByTestId('my-quests-role-trigger'));
    await fireEvent.press(view.getByTestId('my-quests-role-hirer'));
    expect(view.queryByTestId('my-quests-primary-cta')).toBeNull();
    expect(view.queryByTestId('my-quests-secondary-cta')).toBeNull();
    expect(view.queryByText('สร้างเควสต์ใหม่')).toBeNull();
    expect(view.queryByText('ส่งข้อความทั้งหมด')).toBeNull();
  });
});
