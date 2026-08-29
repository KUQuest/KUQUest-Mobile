import { fireEvent, render, waitFor, within } from '@testing-library/react-native';
import mockReact, { type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import CreateQuestScreen from '../CreateQuestScreen';
import { questFixtureAdapter } from '../../questBoard/questFixtureAdapter';

jest.mock('react-native/Libraries/Modal/Modal', () => {
  return {
    __esModule: true,
    default: ({ visible, children }: { visible: boolean; children: ReactNode }) =>
      visible ? mockReact.createElement(mockReact.Fragment, null, children) : null,
  };
});

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 390, height: 844, scale: 1, fontScale: 1 }),
}));

const mockRouter = { replace: jest.fn() };
const mockLoadQuestDraft = jest.fn();
const mockPersistQuestDraft = jest.fn();
const mockDeleteQuestDraft = jest.fn();

jest.mock('../createQuestPersistence', () => ({
  getQuestDraftStorageKey: jest.fn().mockResolvedValue('test-key'),
  loadQuestDraft: (...args: unknown[]) => mockLoadQuestDraft(...args),
  persistQuestDraft: (...args: unknown[]) => mockPersistQuestDraft(...args),
  deleteQuestDraft: (...args: unknown[]) => mockDeleteQuestDraft(...args),
}));

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('../../../locales/LocaleProvider', () => ({
  useLocale: () => ({ locale: 'th' }),
}));

async function fillQuestDetails(view: Awaited<ReturnType<typeof render>>) {
  await fireEvent.changeText(view.getByLabelText('ชื่อเควสต์ *'), 'ล้างพัดลมหอพัก');
  await fireEvent.press(view.getByLabelText('แท็กเควสต์ *: เลือกแท็กเควสต์'));
  await fireEvent.press(view.getByLabelText('แท็กเควสต์ *: การออกแบบและงานสร้างสรรค์'));
  await fireEvent.changeText(view.getByLabelText('รายละเอียดงาน *'), 'ล้างพัดลมส่วนกลาง');
  await fireEvent.changeText(view.getByLabelText('เกณฑ์การเสร็จงาน *'), 'พัดลมสะอาดและใช้งานได้');
}

describe('CreateQuestScreen', () => {
  beforeEach(() => {
    questFixtureAdapter.reset();
    mockRouter.replace.mockClear();
    mockLoadQuestDraft.mockReset();
    mockLoadQuestDraft.mockResolvedValue(null);
    mockPersistQuestDraft.mockReset();
    mockPersistQuestDraft.mockResolvedValue(undefined);
    mockDeleteQuestDraft.mockReset();
    mockDeleteQuestDraft.mockResolvedValue(undefined);
  });

  it('keeps the page skeleton visible until draft hydration settles', async () => {
    let resolveDraft!: (value: null) => void;
    mockLoadQuestDraft.mockReturnValueOnce(new Promise<null>((resolve) => {
      resolveDraft = resolve;
    }));

    const view = await render(<CreateQuestScreen />);

    expect(view.getByTestId('create-quest-loading-skeleton')).toBeTruthy();
    expect(view.getByLabelText('กำลังกู้คืนฉบับร่าง…')).toBeTruthy();
    expect(view.queryByLabelText('ชื่อเควสต์ *')).toBeNull();

    resolveDraft(null);
    await waitFor(() => expect(view.getByLabelText('ชื่อเควสต์ *')).toBeTruthy());
  });

  it('restores the persisted draft and step on mount', async () => {
    mockLoadQuestDraft.mockResolvedValueOnce({
      draft: {
        ...jest.requireActual('../createQuestModel').initialDraft,
        title: 'Restored quest',
        tag: 'design',
        description: 'Restored description',
        conditions: 'Restored criteria',
      },
      step: 2,
      state: 'DRAFT',
    });

    const view = await render(<CreateQuestScreen />);

    await waitFor(() => expect(view.getByText('ตั้งค่าทีม')).toBeTruthy());
    await fireEvent.press(view.getByLabelText('ขั้นตอนที่ 1 จาก 3: ข้อมูลเควสต์'));
    expect(view.getByLabelText('ชื่อเควสต์ *').props.value).toBe('Restored quest');
    expect(mockLoadQuestDraft).toHaveBeenCalledWith('test-key');
  });

  it('opens the mock draft in Team Setup for edit flows and updates the summary', async () => {
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    expect(view.getByText('ตั้งค่าทีม')).toBeTruthy();
    expect(view.getByLabelText('ขั้นตอนที่ 2 จาก 3: ตั้งค่าทีม')).toBeTruthy();
    expect(view.getAllByLabelText('ย้อนกลับ')).toHaveLength(1);
    expect(view.getByText('1. เลือกรูปแบบการทำงาน')).toBeTruthy();
    expect(view.getByText('2. เลือกรูปแบบการรับผู้สมัคร')).toBeTruthy();
    expect(view.queryByText('ตั้งค่าเควสต์')).toBeNull();
    expect(view.queryByTestId('create-quest-summary-size')).toBeNull();
    expect(view.queryByTestId('create-quest-start-datetime')).toBeNull();

    await fireEvent.press(view.getByTestId('create-quest-choice-single'));
    await fireEvent.press(view.getByText('ตรวจสอบเควสต์'));

    await waitFor(() => expect(view.getByText('ตั้งค่าเควสต์')).toBeTruthy());
    expect(within(view.getByTestId('create-quest-summary-size')).getByText('1 คน')).toBeTruthy();
    expect(view.getByTestId('create-quest-summary-type')).toBeTruthy();
    expect(view.getByTestId('create-quest-summary-applicants')).toBeTruthy();
    expect(view.getAllByText('แท็กเควสต์')).toHaveLength(1);
    expect(view.getAllByText('วิธีรับผู้สมัคร')).toHaveLength(1);
    expect(view.queryByText('การเข้าร่วม')).toBeNull();
    expect(view.queryByText('จำนวนผู้เข้าร่วม')).toBeNull();
  });

  it('allows Quest Tags to be searched before selecting one', async () => {
    const view = await render(<CreateQuestScreen />);

    await fireEvent.press(view.getByLabelText('แท็กเควสต์ *: เลือกแท็กเควสต์'));

    const searchInput = view.getByTestId('select-search-input');
    expect(searchInput.props.placeholder).toBe('ค้นหาแท็กเควสต์');

    await fireEvent.changeText(searchInput, 'เทคโนโลยี');

    expect(view.getByLabelText('แท็กเควสต์ *: เทคโนโลยี')).toBeTruthy();
    expect(view.queryByText('การสอนพิเศษ')).toBeNull();

    await fireEvent.press(view.getByLabelText('แท็กเควสต์ *: เทคโนโลยี'));
    expect(view.getByLabelText('แท็กเควสต์ *: เทคโนโลยี')).toBeTruthy();
  });

  it('keeps Single headcount fixed at one in the mock draft', async () => {
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    await fireEvent.press(view.getByTestId('create-quest-choice-single'));
    expect(view.getByLabelText('จำนวนผู้เข้าร่วม: 1').props.accessibilityState).toEqual({ disabled: true });
    expect(view.queryByText('จำนวนผู้เข้าร่วม *')).toBeNull();

    await fireEvent.press(view.getByText('ตรวจสอบเควสต์'));

    await waitFor(() => expect(view.getByText('ตั้งค่าเควสต์')).toBeTruthy());
    expect(within(view.getByTestId('create-quest-summary-size')).getByText('1 คน')).toBeTruthy();
  });

  it('reveals the logistics fields when the collapsed section is opened', async () => {
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    await fireEvent.press(view.getByTestId('create-quest-logistics-toggle'));

    expect(view.getByTestId('create-quest-start-datetime')).toBeTruthy();
    expect(view.getByTestId('create-quest-deadline-datetime')).toBeTruthy();
  });

  it('aligns the fixed Single headcount value like the other form fields', async () => {
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    await fireEvent.press(view.getByTestId('create-quest-choice-single'));
    const headcountField = await waitFor(() => view.getByLabelText('จำนวนผู้เข้าร่วม: 1'));

    expect(StyleSheet.flatten(headcountField.props.style)).toEqual(expect.objectContaining({
      alignItems: 'flex-start',
      justifyContent: 'center',
    }));
  });

  it('uses a checkbox for proof and explains the selected requirement below', async () => {
    const view = await render(<CreateQuestScreen />);

    const proofToggle = await waitFor(() => view.getByTestId('create-quest-proof-toggle'));
    expect(proofToggle.props.accessibilityState).toEqual({ checked: true });
    expect(view.getByText('ผู้เข้าร่วมต้องส่งหลักฐานการเสร็จงานเมื่อทำเควสต์เสร็จ')).toBeTruthy();

    await fireEvent.press(proofToggle);

    expect(view.getByTestId('create-quest-proof-toggle').props.accessibilityState).toEqual({ checked: false });
    expect(view.getByText('ไม่จำเป็นต้องส่งหลักฐานการเสร็จงาน')).toBeTruthy();

    await fireEvent.press(view.getByTestId('create-quest-proof-toggle'));
    expect(view.getByTestId('create-quest-proof-toggle').props.accessibilityState).toEqual({ checked: true });
  });

  it('returns to the first invalid logistics field and expands the section', async () => {
    const view = await render(<CreateQuestScreen />);

    await fillQuestDetails(view);
    await fireEvent.press(view.getByLabelText('ถัดไป'));
    await waitFor(() => expect(view.getByText('ตั้งค่าทีม')).toBeTruthy());

    await fireEvent.press(view.getByLabelText('ตรวจสอบเควสต์'));

    await waitFor(() => expect(view.getByTestId('create-quest-start-datetime')).toBeTruthy());
    expect(view.getByText(/วันที่เริ่มต้น:/)).toBeTruthy();
  });

  it('keeps both Review actions wide enough to remain visible', async () => {
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    await fireEvent.press(view.getByText('ตรวจสอบเควสต์'));
    await waitFor(() => expect(view.getByTestId('create-quest-save-draft')).toBeTruthy());

    const draftButtonStyle = StyleSheet.flatten(view.getByTestId('create-quest-save-draft').props.style);
    const previewButtonStyle = StyleSheet.flatten(view.getByTestId('create-quest-save-preview').props.style);

    expect(draftButtonStyle).toEqual(expect.objectContaining({ flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 0, width: 'auto' }));
    expect(previewButtonStyle).toEqual(expect.objectContaining({ flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 0, width: 'auto' }));
    expect(draftButtonStyle).toEqual(previewButtonStyle);
  });

  it('saves a Review draft through the first action', async () => {
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    await fireEvent.press(view.getByText('ตรวจสอบเควสต์'));
    await waitFor(() => expect(view.getByTestId('create-quest-save-draft')).toBeTruthy());
    await fireEvent.press(view.getByLabelText('บันทึกฉบับร่าง'));

    await waitFor(() => expect(view.getByText('บันทึกฉบับร่างเควสต์แล้ว')).toBeTruthy());
    expect(mockPersistQuestDraft).toHaveBeenCalledWith('test-key', expect.objectContaining({ title: 'Draft campus photo session' }), 3, 'DRAFT', 'mock-draft');
  });

  it('publishes a valid Review Quest through the adapter and clears its SecureStore draft', async () => {
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    await fireEvent.press(view.getByText('ตรวจสอบเควสต์'));
    await waitFor(() => expect(view.getByTestId('create-quest-save-preview')).toBeTruthy());
    await fireEvent.press(view.getByLabelText('เผยแพร่เควสต์'));

    await waitFor(() => expect(view.getByText('เผยแพร่เควสต์แล้ว')).toBeTruthy());
    expect(mockPersistQuestDraft).not.toHaveBeenCalledWith(expect.anything(), expect.anything(), 3, 'OPEN', expect.anything());
    expect(mockDeleteQuestDraft).toHaveBeenCalledWith('test-key', 'mock-draft');
    expect(questFixtureAdapter.listStates('demo-hirer').some((state) => state.quest.title === 'Draft campus photo session' && state.quest.status === 'QUEST_OPEN')).toBe(true);
  });

  it('keeps the published Quest in adapter state after the create flow completes', async () => {
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    await fireEvent.press(view.getByText('ตรวจสอบเควสต์'));
    await waitFor(() => expect(view.getByTestId('create-quest-save-preview')).toBeTruthy());
    await fireEvent.press(view.getByLabelText('เผยแพร่เควสต์'));

    await waitFor(() => expect(view.getByText('เผยแพร่เควสต์แล้ว')).toBeTruthy());
    expect(view.getByText('เควสต์ของคุณอยู่ในสถานะตัวอย่างที่เผยแพร่แล้ว และจะแสดงใน My Quests ของผู้ว่าจ้าง')).toBeTruthy();
    expect(mockDeleteQuestDraft).toHaveBeenCalledWith('test-key', 'mock-draft');
  });

  it('shows a retry action when published Quest draft cleanup fails', async () => {
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    await fireEvent.press(view.getByText('ตรวจสอบเควสต์'));
    await waitFor(() => expect(view.getByTestId('create-quest-save-preview')).toBeTruthy());

    mockDeleteQuestDraft.mockRejectedValueOnce(new Error('storage unavailable'));
    await fireEvent.press(view.getByTestId('create-quest-save-preview'));

    await waitFor(() => expect(view.getByTestId('create-quest-save-error')).toBeTruthy());
    expect(view.getByText('ลองอีกครั้ง')).toBeTruthy();

    mockDeleteQuestDraft.mockResolvedValueOnce(undefined);
    await fireEvent.press(view.getByTestId('create-quest-retry-save'));

    await waitFor(() => expect(view.getByText('เผยแพร่เควสต์แล้ว')).toBeTruthy());
    expect(questFixtureAdapter.listStates('demo-hirer').filter((state) => state.quest.title === 'Draft campus photo session')).toHaveLength(1);
  });

  it('autosaves edits and exposes a retry when persistence fails', async () => {
    const view = await render(<CreateQuestScreen />);

    await waitFor(() => expect(view.getByLabelText('ชื่อเควสต์ *')).toBeTruthy());
    mockPersistQuestDraft.mockRejectedValueOnce(new Error('storage unavailable'));
    await fireEvent.changeText(view.getByLabelText('ชื่อเควสต์ *'), 'บันทึกอัตโนมัติ');

    await waitFor(() => expect(view.getByTestId('create-quest-save-error')).toBeTruthy());
    expect(mockPersistQuestDraft).toHaveBeenCalledWith('test-key', expect.objectContaining({ title: 'บันทึกอัตโนมัติ' }), 1, 'DRAFT');

    mockPersistQuestDraft.mockResolvedValueOnce(undefined);
    await fireEvent.press(view.getByTestId('create-quest-retry-save'));

    await waitFor(() => expect(view.getByText('บันทึกฉบับร่างแล้ว')).toBeTruthy());
  });

  it('starts a fresh blank form after the draft screen is unmounted', async () => {
    const view = await render(<CreateQuestScreen editQuestId="mock-draft" />);

    await fireEvent.press(view.getByLabelText('ขั้นตอนที่ 1 จาก 3: ข้อมูลเควสต์'));
    expect(view.getByLabelText('ชื่อเควสต์ *').props.value).toBe('Draft campus photo session');
    view.unmount();

    const freshView = await render(<CreateQuestScreen />);
    await waitFor(() => expect(freshView.getByLabelText('ชื่อเควสต์ *').props.value).toBe(''));
  });
});
