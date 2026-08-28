import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import mockReact, { type ReactNode } from 'react';
import { Alert } from 'react-native';

import MyQuestsScreen from '../MyQuestsScreen';
import { setActivePrototypePersona } from '../../../components/ui/prototypeMenuState';
import { questFixtureAdapter } from '../../questBoard/questFixtureAdapter';

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
    questFixtureAdapter.reset();
  });

  it('keeps Worker and Hirer work in one screen with separate role and status views', async () => {
    const view = await render(<MyQuestsScreen />);

    expect(view.getByText('MyQuest')).toBeTruthy();
    expect(view.queryByTestId('my-quests-help-button')).toBeNull();
    expect(view.getByText('เลือกสถานะเควสต์')).toBeTruthy();
    expect(view.getByTestId('my-quests-status-carousel')).toBeTruthy();
    expect(view.getByTestId('my-quests-status-previous')).toBeTruthy();
    expect(view.getByTestId('my-quests-status-next')).toBeTruthy();
    expect(view.getByText('Join a campus event team')).toBeTruthy();
    expect(view.queryByText('ช่วยยกกล่องไปหอพัก')).toBeNull();

    await fireEvent.press(view.getByTestId('my-quests-status-next'));
    await fireEvent.press(view.getByTestId('my-quests-status-next'));
    expect(view.getByText('Review a completed project')).toBeTruthy();

    await fireEvent.press(view.getByTestId('my-quests-role-trigger'));
    expect(view.getByText('เลือกมุมมองเควสต์')).toBeTruthy();
    expect(view.getByText('เข้าร่วมเควสต์')).toBeTruthy();
    expect(view.getByText('โพสต์เควสต์')).toBeTruthy();
    await fireEvent.press(view.getByTestId('my-quests-role-hirer'));

    expect(view.queryByText('โพสต์เควสต์')).toBeNull();
    expect(view.getByText('รวมทีมกิจกรรมในมหาวิทยาลัย')).toBeTruthy();
    expect(view.queryByText('ช่วยยกกล่องไปหอพัก')).toBeNull();

    await fireEvent.press(view.getByTestId('my-quests-status-next'));
    expect(view.getByText('ยังไม่มีเควสต์ฉบับร่าง')).toBeTruthy();
    await fireEvent.press(view.getByTestId('my-quests-status-next'));
    expect(view.getByText('Review a completed project')).toBeTruthy();
  });

  it('cycles Quest status with arrows and wraps around the available statuses', async () => {
    const view = await render(<MyQuestsScreen />);

    await fireEvent.press(view.getByTestId('my-quests-status-next'));
    expect(view.getByText('ซื้อข้าวจากโรงอาหาร')).toBeTruthy();

    await fireEvent.press(view.getByTestId('my-quests-status-next'));
    expect(view.getByText('Review a completed project')).toBeTruthy();

    await fireEvent.press(view.getByTestId('my-quests-status-next'));
    expect(view.getByText('Join a campus event team')).toBeTruthy();

    await fireEvent.press(view.getByTestId('my-quests-status-previous'));
    expect(view.getByText('Review a completed project')).toBeTruthy();
  });

  it('opens an adapter-backed pending Quest Detail from the card', async () => {
    const view = await render(<MyQuestsScreen />);

    expect(view.getByTestId('my-quest-card-worker-pending-demo')).toBeTruthy();
    await fireEvent.press(view.getByTestId('my-quest-card-worker-pending-demo'));

    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/quest/[id]', params: { id: 'worker-pending-demo', mode: 'join', joinStatus: 'pending' } });
  });

  it('opens adapter-backed messaging for a joined Quest', async () => {
    const view = await render(<MyQuestsScreen />);

    await fireEvent.press(view.getByTestId('my-quests-status-next'));
    await fireEvent.press(view.getByTestId('my-quest-message-buy-lunch'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/chat/[id]',
      params: {
        id: 'conversation-fixture-buy-lunch',
        conversationId: 'conversation-fixture-buy-lunch',
        questId: 'buy-lunch',
        viewerId: 'student-demo',
        canRead: 'true',
        canWrite: 'true',
        readOnly: 'false',
      },
    });
  });

  it('keeps the Message action separate from card detail for an accepted Quest', async () => {
    const view = await render(<MyQuestsScreen />);

    await fireEvent.press(view.getByTestId('my-quests-status-next'));

    expect(view.getAllByText('ข้อความ').length).toBeGreaterThan(0);
    expect(view.queryByText('แชตกับผู้โพสต์')).toBeNull();
    expect(view.queryByText('ดูรายละเอียด')).toBeNull();

    await fireEvent.press(view.getByTestId('my-quest-message-buy-lunch'));
    expect(mockRouter.push).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/chat/[id]' }));

    mockRouter.push.mockClear();
    await fireEvent.press(view.getByTestId('my-quest-card-buy-lunch'));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/quest/[id]', params: { id: 'buy-lunch', mode: 'join', joinStatus: 'accepted' } });
  });

  it('opens posted Quest Detail from the adapter-backed Edit action', async () => {
    const view = await render(<MyQuestsScreen />);

    await fireEvent.press(view.getByTestId('my-quests-role-trigger'));
    await fireEvent.press(view.getByTestId('my-quests-role-hirer'));
    await fireEvent.press(view.getByTestId('my-quest-action-team-forming-demo-secondary'));

    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/quest/[id]', params: { id: 'team-forming-demo', mode: 'post' } });
  });

  it('uses the shared Candidate review sheet for submitted team proposals and updates selection statuses', async () => {
    const view = await render(<MyQuestsScreen />);

    await fireEvent.press(view.getByTestId('my-quests-role-trigger'));
    await fireEvent.press(view.getByTestId('my-quests-role-hirer'));
    await fireEvent.press(view.getByTestId('my-quest-action-team-selection-demo'));

    expect(view.getByTestId('candidate-review-sheet')).toBeTruthy();
    expect(view.getByText('ข้อเสนอจากทีม')).toBeTruthy();
    expect(view.getByText('Team Leader A')).toBeTruthy();
    expect(view.getByText('Team Leader B')).toBeTruthy();

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await fireEvent.press(view.getByTestId('candidate-review-accept-fixture-application-team-selection-demo-team-a'));
    expect(alertSpy).toHaveBeenCalledWith('รับข้อเสนอ', expect.stringContaining('Choose a campus event team'), expect.any(Array));
    const confirmationButtons = alertSpy.mock.calls[0]?.[2];
    await act(async () => {
      confirmationButtons?.[1]?.onPress?.();
    });

    expect(questFixtureAdapter.getState('team-selection-demo', 'demo-hirer')?.teams.find((team) => team.id.endsWith('-a'))?.status).toBe('TEAM_SELECTED');
    expect(view.getByText('ได้รับเลือก')).toBeTruthy();
    expect(view.getByText('ไม่ผ่านการเลือก')).toBeTruthy();
    alertSpy.mockRestore();
  });

  it('uses individual Candidate applications for SINGLE review and keeps competitors visible after selection', async () => {
    const view = await render(<MyQuestsScreen />);

    await fireEvent.press(view.getByTestId('my-quests-role-trigger'));
    await fireEvent.press(view.getByTestId('my-quests-role-hirer'));
    await fireEvent.press(view.getByTestId('my-quest-action-single-candidate-demo'));

    expect(view.getByTestId('candidate-review-sheet')).toBeTruthy();
    expect(view.getByText('single-applicant-a')).toBeTruthy();
    expect(view.getByText('single-applicant-b')).toBeTruthy();
    expect(view.queryByText('ข้อเสนอจากทีม')).toBeNull();

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    await fireEvent.press(view.getByTestId('candidate-review-accept-fixture-application-single-candidate-demo-single-applicant-a'));
    const confirmationButtons = alertSpy.mock.calls[0]?.[2];
    await act(async () => {
      confirmationButtons?.[1]?.onPress?.();
    });

    expect(questFixtureAdapter.getState('single-candidate-demo', 'demo-hirer')?.applications).toEqual(expect.arrayContaining([
      expect.objectContaining({ applicantId: 'single-applicant-a', status: 'APPLICATION_SELECTED' }),
      expect.objectContaining({ applicantId: 'single-applicant-b', status: 'APPLICATION_REJECTED' }),
    ]));
    expect(view.getByText('ได้รับเลือก')).toBeTruthy();
    expect(view.getAllByText('ไม่ผ่านการเลือก').length).toBeGreaterThan(0);
    alertSpy.mockRestore();
  });

  it('shows only submitted team proposals in the shared Candidate sheet', async () => {
    const view = await render(<MyQuestsScreen />);

    await fireEvent.press(view.getByTestId('my-quests-role-trigger'));
    await fireEvent.press(view.getByTestId('my-quests-role-hirer'));
    await fireEvent.press(view.getByTestId('my-quest-action-team-forming-demo'));

    expect(view.getByTestId('candidate-review-sheet')).toBeTruthy();
    expect(view.getByTestId('candidate-review-empty')).toBeTruthy();
    expect(view.queryByText('Demo Team Leader')).toBeNull();
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

  it('switches the adapter-backed My Quests view with the active Prototype persona', async () => {
    setActivePrototypePersona('student-demo');
    const view = await render(<MyQuestsScreen />);

    expect(view.getByTestId('my-quests-prototype-menu-trigger')).toBeTruthy();
    await fireEvent.press(view.getByTestId('my-quests-prototype-menu-trigger'));
    await fireEvent.press(view.getByTestId('my-quests-prototype-menu-persona-demo-hirer'));

    expect(view.getByText('จัดการเควสต์ที่คุณสร้างและเข้าร่วม')).toBeTruthy();
    expect(view.getByText('รวมทีมกิจกรรมในมหาวิทยาลัย')).toBeTruthy();
  });

  it('confirms a submitted Team Proposal rejection and leaves other teams eligible', async () => {
    setActivePrototypePersona('demo-hirer');
    const view = await render(<MyQuestsScreen />);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

    await fireEvent.press(view.getByTestId('my-quest-action-team-selection-demo'));
    await fireEvent.press(view.getByTestId('candidate-review-reject-fixture-application-team-selection-demo-team-a'));

    expect(alertSpy).toHaveBeenCalledWith('ปฏิเสธ', expect.stringContaining('Choose a campus event team'), expect.any(Array));
    const confirmationButtons = alertSpy.mock.calls[0]?.[2];
    const rejectButton = confirmationButtons?.find((button) => button.text === 'ปฏิเสธ');
    await act(async () => {
      rejectButton?.onPress?.();
    });

    await waitFor(() => expect(questFixtureAdapter.getState('team-selection-demo', 'demo-hirer')?.teams.find((team) => team.id.endsWith('-a'))?.status).toBe('TEAM_REJECTED'));
    expect(questFixtureAdapter.getState('team-selection-demo', 'demo-hirer')?.quest.status).toBe('QUEST_OPEN');
    expect(questFixtureAdapter.getState('team-selection-demo', 'demo-hirer')?.teams.find((team) => team.id.endsWith('-b'))?.status).toBe('TEAM_SUBMITTED');
    expect(view.getByText('ไม่ผ่านการเลือก')).toBeTruthy();
    alertSpy.mockRestore();
  });
});
