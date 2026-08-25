import { fireEvent, render } from '@testing-library/react-native';

import MyQuestsScreen from '../MyQuestsScreen';

jest.mock('../../../locales/LocaleProvider', () => ({
  useLocale: () => ({ locale: 'th' }),
}));

describe('MyQuestsScreen', () => {
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
});
