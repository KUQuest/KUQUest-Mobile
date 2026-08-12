import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { Button } from '../Button';

describe('Button', () => {
  it('exposes its label as an accessible action and handles presses', async () => {
    const onPress = jest.fn();

    const view = await render(
      <Button testID="continue-button" onPress={onPress}>
        Continue
      </Button>,
    );

    expect(view.getByText('Continue')).toBeTruthy();
    const button = view.getByTestId('continue-button');
    fireEvent.press(button);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not invoke its action while disabled', async () => {
    const onPress = jest.fn();

    const view = await render(
      <Button disabled testID="continue-button" onPress={onPress}>
        Continue
      </Button>,
    );

    const button = view.getByTestId('continue-button');
    fireEvent.press(button);

    expect(button.props.accessibilityState).toEqual({ disabled: true });
    expect(onPress).not.toHaveBeenCalled();
  });
});
