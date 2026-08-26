import { fireEvent, render, waitFor, within } from '@testing-library/react-native';
import mockReact, { type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import CreateQuestScreen from '../CreateQuestScreen';

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
    mockLoadQuestDraft.mockResolvedValueOnce(createSnapshot({ step: 1 }));
    const view = await render(<CreateQuestScreen />);

    const tagTrigger = await waitFor(() => view.getByLabelText('แท็กเควสต์ *: การออกแบบและงานสร้างสรรค์'));
    await fireEvent.press(tagTrigger);

    const searchInput = view.getByTestId('select-search-input');
    expect(searchInput.props.placeholder).toBe('ค้นหาแท็กเควสต์');

    await fireEvent.changeText(searchInput, 'เทคโนโลยี');

    expect(view.getByLabelText('แท็กเควสต์ *: เทคโนโลยี')).toBeTruthy();
    expect(view.queryByText('การสอนพิเศษ')).toBeNull();

    await fireEvent.press(view.getByLabelText('แท็กเควสต์ *: เทคโนโลยี'));
    expect(view.getByLabelText('แท็กเควสต์ *: เทคโนโลยี')).toBeTruthy();
  });

  it('keeps Single headcount fixed at one and valid when the stored capacity is stale', async () => {
    mockLoadQuestDraft.mockResolvedValueOnce(createSnapshot({ draftOverrides: { participation: 'SINGLE', headcount: '' } }));
    const view = await render(<CreateQuestScreen />);

    await waitFor(() => expect(view.getByText('ตรวจสอบเควสต์')).toBeTruthy());

    expect(view.getByLabelText('จำนวนผู้เข้าร่วม: 1').props.accessibilityState).toEqual({ disabled: true });
    expect(view.queryByText('จำนวนผู้เข้าร่วม *')).toBeNull();

    await fireEvent.press(view.getByText('ตรวจสอบเควสต์'));

    await waitFor(() => expect(view.getByText('ตั้งค่าเควสต์')).toBeTruthy());
    expect(within(view.getByTestId('create-quest-summary-size')).getByText('1 คน')).toBeTruthy();

    mockPersistQuestDraft.mockClear();
    await fireEvent.press(view.getByLabelText('บันทึกฉบับร่าง'));
    await waitFor(() => expect(mockPersistQuestDraft).toHaveBeenCalledWith('test-key', expect.objectContaining({ participation: 'SINGLE', headcount: '1' }), 3, 'DRAFT'));
  });

  it('reveals the logistics fields when the collapsed section is opened', async () => {
    const view = await render(<CreateQuestScreen />);

    await waitFor(() => expect(view.getByTestId('create-quest-logistics-toggle')).toBeTruthy());
    await fireEvent.press(view.getByTestId('create-quest-logistics-toggle'));

    expect(view.getByTestId('create-quest-start-datetime')).toBeTruthy();
    expect(view.getByTestId('create-quest-deadline-datetime')).toBeTruthy();
  });

  it('aligns the fixed Single headcount value like the other form fields', async () => {
    mockLoadQuestDraft.mockResolvedValueOnce(createSnapshot({ step: 2, draftOverrides: { participation: 'SINGLE' } }));
    const view = await render(<CreateQuestScreen />);

    const headcountField = await waitFor(() => view.getByLabelText('จำนวนผู้เข้าร่วม: 1'));

    expect(StyleSheet.flatten(headcountField.props.style)).toEqual(expect.objectContaining({
      alignItems: 'flex-start',
      justifyContent: 'center',
    }));
  });

  it('uses a checkbox for proof and explains the selected requirement below', async () => {
    mockLoadQuestDraft.mockResolvedValueOnce(createSnapshot({ step: 1 }));
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

  it('returns from Review to the first invalid field and expands logistics', async () => {
    mockLoadQuestDraft.mockResolvedValueOnce(createSnapshot({ step: 3, draftOverrides: { startDate: '', deadline: '', startTime: '', endTime: '', location: '' } }));
    const view = await render(<CreateQuestScreen />);

    await waitFor(() => expect(view.getByText('บันทึกฉบับร่าง')).toBeTruthy());
    await fireEvent.press(view.getByText('บันทึกฉบับร่าง'));

    await waitFor(() => expect(view.getByTestId('create-quest-start-datetime')).toBeTruthy());
    expect(view.getByText(/วันที่เริ่มต้น:/)).toBeTruthy();
  });

  it('keeps both Review actions wide enough to remain visible', async () => {
    mockLoadQuestDraft.mockResolvedValueOnce(createSnapshot({ step: 3 }));
    const view = await render(<CreateQuestScreen />);

    await waitFor(() => expect(view.getByText('บันทึกฉบับร่าง')).toBeTruthy());

    const draftButtonStyle = StyleSheet.flatten(view.getByTestId('create-quest-save-draft').props.style);
    const previewButtonStyle = StyleSheet.flatten(view.getByTestId('create-quest-save-preview').props.style);

    expect(draftButtonStyle).toEqual(expect.objectContaining({ flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 0, width: 'auto' }));
    expect(previewButtonStyle).toEqual(expect.objectContaining({ flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 0, width: 'auto' }));
    expect(draftButtonStyle).toEqual(previewButtonStyle);
  });

  it('saves a Review draft through the first action', async () => {
    mockLoadQuestDraft.mockResolvedValueOnce(createSnapshot({ step: 3 }));
    const view = await render(<CreateQuestScreen />);

    await waitFor(() => expect(view.getByText('บันทึกฉบับร่าง')).toBeTruthy());
    await fireEvent.press(view.getByLabelText('บันทึกฉบับร่าง'));

    await waitFor(() => expect(mockPersistQuestDraft).toHaveBeenCalledWith('test-key', expect.objectContaining({ title: 'ล้างพัดลมหอพัก' }), 3, 'DRAFT'));
    expect(view.getByText('บันทึกฉบับร่างเควสต์แล้ว')).toBeTruthy();
  });

  it('saves a Review preview through the second action', async () => {
    mockLoadQuestDraft.mockResolvedValueOnce(createSnapshot({ step: 3 }));
    const view = await render(<CreateQuestScreen />);

    await waitFor(() => expect(view.getByText('บันทึกตัวอย่างเควสต์')).toBeTruthy());
    await fireEvent.press(view.getByLabelText('บันทึกตัวอย่างเควสต์'));

    await waitFor(() => expect(mockPersistQuestDraft).toHaveBeenCalledWith('test-key', expect.objectContaining({ title: 'ล้างพัดลมหอพัก' }), 3, 'OPEN'));
    expect(view.getByText('บันทึกตัวอย่างเควสต์ในเครื่องแล้ว')).toBeTruthy();
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
