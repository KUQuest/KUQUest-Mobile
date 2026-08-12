import { fireEvent, render } from '@testing-library/react-native';
import mockReact, { type ReactNode } from 'react';
import { Select } from '../features/onboarding/components/Select';

jest.mock('react-native/Libraries/Modal/Modal', () => {
  return {
    __esModule: true,
    default: ({ visible, children }: { visible: boolean; children: ReactNode }) =>
      visible ? mockReact.createElement(mockReact.Fragment, null, children) : null,
  };
});

const options = [
  { label: 'Faculty of Agriculture', value: 'faculty-agriculture' },
  { label: 'Faculty of Engineering', value: 'faculty-engineering' },
  { label: 'Faculty of Fisheries', value: 'faculty-fisheries' },
];

describe('Select', () => {
  test('filters searchable options and clears the query', async () => {
    const view = await render(
      <Select
        label="Faculty"
        options={options}
        value=""
        onValueChange={jest.fn()}
        placeholder="Select faculty"
        searchable
        searchPlaceholder="Search faculty"
        noResultsMessage="No results"
        clearSearchLabel="Clear search"
        closeLabel="Close"
      />
    );

    await fireEvent.press(view.getByTestId('select-trigger'));
    await fireEvent.changeText(view.getByTestId('select-search-input'), 'engineering');

    expect(view.getByText('Faculty of Engineering')).toBeTruthy();
    expect(view.queryByText('Faculty of Agriculture')).toBeNull();

    await fireEvent.press(view.getByTestId('clear-search-button'));

    expect(view.getByText('Faculty of Agriculture')).toBeTruthy();
    expect(view.getByText('Faculty of Fisheries')).toBeTruthy();
  });

  test('shows a no-results state when no option matches', async () => {
    const view = await render(
      <Select
        label="Faculty"
        options={options}
        value=""
        onValueChange={jest.fn()}
        placeholder="Select faculty"
        searchable
        searchPlaceholder="Search faculty"
        noResultsMessage="No results"
        clearSearchLabel="Clear search"
        closeLabel="Close"
      />
    );

    await fireEvent.press(view.getByTestId('select-trigger'));
    await fireEvent.changeText(view.getByTestId('select-search-input'), 'medicine');

    expect(view.getByText('No results')).toBeTruthy();
  });

  test('selects an option and closes the searchable picker', async () => {
    const onValueChange = jest.fn();
    const view = await render(
      <Select
        label="Faculty"
        options={options}
        value=""
        onValueChange={onValueChange}
        placeholder="Select faculty"
        searchable
        searchPlaceholder="Search faculty"
        noResultsMessage="No results"
        clearSearchLabel="Clear search"
        closeLabel="Close"
      />
    );

    await fireEvent.press(view.getByTestId('select-trigger'));
    await fireEvent.press(view.getByText('Faculty of Engineering'));

    expect(onValueChange).toHaveBeenCalledWith('faculty-engineering');
    expect(view.queryByTestId('select-search-input')).toBeNull();
  });

  test('keeps non-searchable selects compatible with the existing behavior', async () => {
    const view = await render(
      <Select
        label="Occupation"
        options={[{ label: 'Student', value: 'occupation-student' }]}
        value=""
        onValueChange={jest.fn()}
        placeholder="Select occupation"
      />
    );

    await fireEvent.press(view.getByTestId('select-trigger'));

    expect(view.queryByTestId('select-search-input')).toBeNull();
    expect(view.getByText('Student')).toBeTruthy();
  });

  test('does not open when disabled', async () => {
    const view = await render(
      <Select
        label="Department"
        options={options}
        value=""
        onValueChange={jest.fn()}
        placeholder="Select a faculty first"
        disabled
      />
    );

    await fireEvent.press(view.getByTestId('select-trigger'));

    expect(view.queryByText('Faculty of Agriculture')).toBeNull();
  });

  test('exposes localized action labels and closes from the close action', async () => {
    const view = await render(
      <Select
        label="Faculty"
        options={options}
        value=""
        onValueChange={jest.fn()}
        placeholder="Select faculty"
        searchable
        searchPlaceholder="Search faculty"
        noResultsMessage="No results"
        clearSearchLabel="Clear search"
        closeLabel="Close faculty picker"
      />
    );

    await fireEvent.press(view.getByTestId('select-trigger'));

    expect(view.getByTestId('select-search-input').props.accessibilityRole).toBe('search');
    expect(view.getByTestId('close-select-button').props.accessibilityLabel).toBe('Close faculty picker');

    await fireEvent.press(view.getByTestId('close-select-button'));

    expect(view.queryByTestId('select-search-input')).toBeNull();
  });
});
