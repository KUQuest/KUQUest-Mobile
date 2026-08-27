import { fireEvent, render } from '@testing-library/react-native';
import mockReact, { type ReactNode } from 'react';
import { Alert } from 'react-native';

import MyQuestsScreen from '../MyQuestsScreen';

const mockRouter = { push: jest.fn() };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('../../../locales/LocaleProvider', () => ({
  useLocale: () => ({ locale: 'th' }),
}));

jest.mock('react-native/Libraries/Modal/Modal', () => {
  return {
    __esModule: true,
    default: ({ children, visible }: { children: ReactNode; visible: boolean }) => visible ? mockReact.createElement(mockReact.Fragment, null, children) : null,
  };
});

describe('MyQuestsScreen', () => {
  beforeEach(() => {
    mockRouter.push.mockClear();
  });

  it('keeps Worker and Hirer work in one screen with separate role and status views', async () => {
    const view = await render(<MyQuestsScreen />);

    expect(view.getByText('MyQuest')).toBeTruthy();
    expect(view.queryByTestId('my-quests-help-button')).toBeNull();
    expect(view.getByText('เลือกสถานะเควสต์')).toBeTruthy();
    expect(view.getByTestId('my-quests-status-carousel')).toBeTruthy();
    expect(view.getByTestId('my-quests-status-previous')).toBeTruthy();
    expect(view.getByTestId('my-quests-status-next')).toBeTruthy();
    expect(view.getByText('ช่วยยกกล่องไปหอพัก')).toBeTruthy();
    expect(view.queryByText('พิมพ์โน้ตการเรียน')).toBeNull();
    expect(view.queryByText('2 คนกำลังทำงาน')).toBeNull();

    await fireEvent.press(view.getByTestId('my-quests-status-next'));
    await fireEvent.press(view.getByTestId('my-quests-status-next'));
    expect(view.getByText('พิมพ์โน้ตการเรียน')).toBeTruthy();

    await fireEvent.press(view.getByTestId('my-quests-role-trigger'));
    expect(view.getByText('เลือกมุมมองเควสต์')).toBeTruthy();
    expect(view.getByText('เข้าร่วมเควสต์')).toBeTruthy();
    expect(view.getByText('โพสต์เควสต์')).toBeTruthy();
    await fireEvent.press(view.getByTestId('my-quests-role-hirer'));

    expect(view.queryByText('โพสต์เควสต์')).toBeNull();
    expect(view.getByText('2 คนกำลังทำงาน')).toBeTruthy();
    expect(view.queryByText('ความคืบหน้า')).toBeNull();
    expect(view.queryByText('พิมพ์โปสเตอร์งานกิจกรรม')).toBeNull();
    expect(view.queryByText('ช่วยยกกล่องไปหอพัก')).toBeNull();

    await fireEvent.press(view.getByTestId('my-quests-status-next'));
    await fireEvent.press(view.getByTestId('my-quests-status-next'));
    expect(view.getByText('พิมพ์โปสเตอร์งานกิจกรรม')).toBeTruthy();
  });

  it('cycles Quest status with arrows and wraps around the available statuses', async () => {
    const view = await render(<MyQuestsScreen />);

    await fireEvent.press(view.getByTestId('my-quests-status-next'));
    expect(view.getByText('ซื้อข้าวจากโรงอาหาร')).toBeTruthy();

    await fireEvent.press(view.getByTestId('my-quests-status-next'));
    expect(view.getByText('พิมพ์โน้ตการเรียน')).toBeTruthy();

    await fireEvent.press(view.getByTestId('my-quests-status-next'));
    expect(view.getByText('ช่วยยกกล่องไปหอพัก')).toBeTruthy();

    await fireEvent.press(view.getByTestId('my-quests-status-previous'));
    expect(view.getByText('พิมพ์โน้ตการเรียน')).toBeTruthy();
  });

  it('uses Quest language and opens the real Quest Detail route from an active item', async () => {
    const view = await render(<MyQuestsScreen />);

    expect(view.getByText('MyQuest')).toBeTruthy();

    await fireEvent.press(view.getByTestId('my-quest-action-move-boxes'));

    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/quest/[id]', params: { id: 'move-boxes', mode: 'join', joinStatus: 'pending' } });
    expect(view.getByTestId('my-quest-action-move-boxes').props.accessibilityLabel).toContain('ช่วยยกกล่องไปหอพัก');
  });

  it('opens group chat for pending joined Quests and active posted Quests', async () => {
    const view = await render(<MyQuestsScreen />);

    await fireEvent.press(view.getByTestId('my-quest-group-chat-move-boxes'));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/chat/[id]', params: { id: 'quest-move-boxes-group' } });

    await fireEvent.press(view.getByTestId('my-quests-role-trigger'));
    await fireEvent.press(view.getByTestId('my-quests-role-hirer'));
    await fireEvent.press(view.getByTestId('my-quest-group-chat-clean-fan'));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/chat/[id]', params: { id: 'quest-clean-fan-group' } });
  });

  it('opens posted Quest Detail in owner mode from the Edit action', async () => {
    const view = await render(<MyQuestsScreen />);

    await fireEvent.press(view.getByTestId('my-quests-role-trigger'));
    await fireEvent.press(view.getByTestId('my-quests-role-hirer'));
    await fireEvent.press(view.getByTestId('my-quest-action-clean-fan-secondary'));

    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/quest/[id]', params: { id: 'clean-fan', mode: 'post' } });
  });

  it('shows candidate and no-candidate applicant states for posted Quests', async () => {
    const view = await render(<MyQuestsScreen />);

    await fireEvent.press(view.getByTestId('my-quests-role-trigger'));
    await fireEvent.press(view.getByTestId('my-quests-role-hirer'));
    await fireEvent.press(view.getByTestId('my-quest-action-clean-fan'));

    expect(view.getByTestId('my-quests-applicant-sheet')).toBeTruthy();
    expect(view.getByText('ผู้สมัครเควสต์')).toBeTruthy();
    expect(view.getByText('พลอย ร.')).toBeTruthy();
    expect(view.queryByTestId('my-quests-applicant-confirm')).toBeNull();

    await fireEvent.press(view.getByTestId('my-quests-applicant-select-ploy-r'));
    expect(view.getByTestId('my-quests-applicant-select-ploy-r').props.accessibilityState).toMatchObject({ checked: true });
    expect(view.getAllByText('เลือกแล้ว 1 คน')).toHaveLength(2);

    await fireEvent.press(view.getByTestId('my-quests-applicant-profile-ploy-r'));
    expect(view.getByTestId('my-quests-applicant-profile-sheet')).toBeTruthy();
    expect(view.getByText('ชอบช่วยงานกิจกรรมและทำงานเป็นทีม')).toBeTruthy();
    await fireEvent.press(view.getByTestId('my-quests-applicant-profile-close'));
    expect(view.queryByTestId('my-quests-applicant-profile-sheet')).toBeNull();

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await fireEvent.press(view.getByTestId('my-quests-applicant-confirm'));
    expect(alertSpy).toHaveBeenCalledWith('ยืนยันเริ่มงานแล้ว', 'เริ่มงานกับผู้สมัคร 1 คนแล้ว', [{ text: 'ปิดหน้าต่างผู้สมัคร', onPress: expect.any(Function) }]);
    alertSpy.mockRestore();

    await fireEvent.press(view.getByTestId('my-quests-applicant-close'));
    expect(view.queryByTestId('my-quests-applicant-sheet')).toBeNull();

    await fireEvent.press(view.getByTestId('my-quest-action-buy-lunch'));
    expect(view.getByTestId('my-quests-no-applicants')).toBeTruthy();
    expect(view.getByText('ยังไม่มีผู้สมัคร')).toBeTruthy();
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
