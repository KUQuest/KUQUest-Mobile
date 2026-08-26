import { fireEvent, render, waitFor, within } from '@testing-library/react-native';

import CreateQuestScreen from '../CreateQuestScreen';

const mockRouter = { replace: jest.fn() };
const mockLoadQuestDraft = jest.fn();
const mockPersistQuestDraft = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('../../../locales/LocaleProvider', () => ({
  useLocale: () => ({ locale: 'th' }),
}));

jest.mock('../createQuestPersistence', () => ({
  getQuestDraftStorageKey: jest.fn().mockResolvedValue('test-key'),
  loadQuestDraft: (...args: unknown[]) => mockLoadQuestDraft(...args),
  persistQuestDraft: (...args: unknown[]) => mockPersistQuestDraft(...args),
  deleteQuestDraft: jest.fn().mockResolvedValue(undefined),
}));

function createSnapshot({ step = 2, state = 'DRAFT', draftOverrides = {} }: { step?: 1 | 2 | 3; state?: 'DRAFT' | 'OPEN'; draftOverrides?: Record<string, unknown> } = {}) {
  return {
    draft: {
      ...jest.requireActual('../createQuestModel').initialDraft,
      title: 'ล้างพัดลมหอพัก',
      tag: 'design',
      description: 'ล้างพัดลมส่วนกลาง',
      conditions: 'พัดลมสะอาดและใช้งานได้',
      startDate: '2099-08-26',
      deadline: '2099-08-27',
      startTime: '09:00',
      endTime: '12:00',
      location: 'หอพัก 13',
      participation: 'GROUP',
      candidateMode: 'CANDIDATE',
      headcount: '5',
      wage: '150',
      ...draftOverrides,
    },
    step,
    state,
  };
}

describe('CreateQuestScreen', () => {
  beforeEach(() => {
    mockRouter.replace.mockClear();
    mockLoadQuestDraft.mockReset();
    mockLoadQuestDraft.mockResolvedValue(createSnapshot());
    mockPersistQuestDraft.mockReset();
    mockPersistQuestDraft.mockResolvedValue(undefined);
  });

  it('renders the Team Setup reference structure and updates the summary when a format changes', async () => {
    const view = await render(<CreateQuestScreen />);

    await waitFor(() => expect(view.getByText('ตั้งค่าเควสต์')).toBeTruthy());
    expect(view.getByText('ตั้งค่าทีม')).toBeTruthy();
    expect(view.getByLabelText('ขั้นตอนที่ 2 จาก 3: ตั้งค่าทีม')).toBeTruthy();
    expect(view.getByText('1. เลือกรูปแบบการทำงาน')).toBeTruthy();
    expect(view.getByText('2. เลือกรูปแบบการรับผู้สมัคร')).toBeTruthy();
    expect(within(view.getByTestId('create-quest-summary-size')).getByText('ไม่เกิน 5 คน')).toBeTruthy();
    expect(view.queryByTestId('create-quest-start-datetime')).toBeNull();

    await fireEvent.press(view.getByTestId('create-quest-choice-single'));

    expect(within(view.getByTestId('create-quest-summary-size')).getByText('1 คน')).toBeTruthy();
  });

  it('reveals the logistics fields when the collapsed section is opened', async () => {
    const view = await render(<CreateQuestScreen />);

    await waitFor(() => expect(view.getByTestId('create-quest-logistics-toggle')).toBeTruthy());
    await fireEvent.press(view.getByTestId('create-quest-logistics-toggle'));

    expect(view.getByTestId('create-quest-start-datetime')).toBeTruthy();
    expect(view.getByTestId('create-quest-deadline-datetime')).toBeTruthy();
  });

  it('returns from Review to the first invalid field and expands logistics', async () => {
    mockLoadQuestDraft.mockResolvedValueOnce(createSnapshot({ step: 3, draftOverrides: { startDate: '', deadline: '', startTime: '', endTime: '', location: '' } }));
    const view = await render(<CreateQuestScreen />);

    await waitFor(() => expect(view.getByText('บันทึกฉบับร่าง')).toBeTruthy());
    await fireEvent.press(view.getByText('บันทึกฉบับร่าง'));

    await waitFor(() => expect(view.getByTestId('create-quest-start-datetime')).toBeTruthy());
    expect(view.getByText(/วันที่เริ่มต้น:/)).toBeTruthy();
  });

  it('shows a retry action when saving fails', async () => {
    const view = await render(<CreateQuestScreen />);

    await waitFor(() => expect(view.getByText('ตั้งค่าทีม')).toBeTruthy());
    await fireEvent.press(view.getByTestId('create-quest-logistics-toggle'));
    await fireEvent.press(view.getByText('ตรวจสอบเควสต์'));
    await waitFor(() => expect(view.getByText('บันทึกตัวอย่างเควสต์')).toBeTruthy());

    mockPersistQuestDraft.mockRejectedValueOnce(new Error('storage unavailable'));
    await fireEvent.press(view.getByText('บันทึกตัวอย่างเควสต์'));

    await waitFor(() => expect(view.getByTestId('create-quest-save-error')).toBeTruthy());
    expect(view.getByText('ลองอีกครั้ง')).toBeTruthy();

    mockPersistQuestDraft.mockResolvedValueOnce(undefined);
    await fireEvent.press(view.getByTestId('create-quest-retry-save'));

    await waitFor(() => expect(view.getByText('บันทึกตัวอย่างเควสต์ในเครื่องแล้ว')).toBeTruthy());
  });
});
