import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Pressable, ScrollView, Text } from 'react-native';

import { NavigationVisibilityProvider, useNavigationVisibility } from '../NavigationVisibilityContext';

function NavigationVisibilityProbe() {
  const { navigationVisible, handleScroll, showNavigation } = useNavigationVisibility();

  return (
    <>
      <Text testID="visibility">{navigationVisible ? 'visible' : 'hidden'}</Text>
      <ScrollView testID="scroll" onScroll={handleScroll} />
      <Pressable testID="show" onPress={showNavigation} />
    </>
  );
}

describe('NavigationVisibilityContext', () => {
  it('hides after downward movement and shows after upward movement', async () => {
    const view = await render(
      <NavigationVisibilityProvider>
        <NavigationVisibilityProbe />
      </NavigationVisibilityProvider>,
    );
    const scrollView = view.getByTestId('scroll');

    await fireEvent.scroll(scrollView, { nativeEvent: { contentOffset: { x: 0, y: 0 } } });
    await fireEvent.scroll(scrollView, { nativeEvent: { contentOffset: { x: 0, y: 10 } } });
    expect(view.getByTestId('visibility').props.children).toBe('hidden');

    await fireEvent.scroll(scrollView, { nativeEvent: { contentOffset: { x: 0, y: 0 } } });
    expect(view.getByTestId('visibility').props.children).toBe('visible');
  });

  it('shows immediately when requested', async () => {
    const view = await render(
      <NavigationVisibilityProvider>
        <NavigationVisibilityProbe />
      </NavigationVisibilityProvider>,
    );
    const scrollView = view.getByTestId('scroll');

    await fireEvent.scroll(scrollView, { nativeEvent: { contentOffset: { x: 0, y: 0 } } });
    await fireEvent.scroll(scrollView, { nativeEvent: { contentOffset: { x: 0, y: 10 } } });
    await fireEvent.press(view.getByTestId('show'));

    expect(view.getByTestId('visibility').props.children).toBe('visible');
  });
});
