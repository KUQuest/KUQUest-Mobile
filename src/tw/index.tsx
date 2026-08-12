import {
  useCssElement,
  useNativeVariable as useFunctionalVariable,
} from 'react-native-css';
import { Link as RouterLink } from 'expo-router';
import React from 'react';
import {
  Pressable as RNPressable,
  ScrollView as RNScrollView,
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  TouchableHighlight as RNTouchableHighlight,
  TouchableOpacity as RNTouchableOpacity,
  View as RNView,
} from 'react-native';
import Animated from 'react-native-reanimated';

type CssElement = (
  component: unknown,
  props: unknown,
  mapping: unknown,
) => React.ReactElement;

const renderCssElement = useCssElement as unknown as CssElement;

function useCssElementCompat(
  component: unknown,
  props: unknown,
  mapping: Record<string, string>,
) {
  return renderCssElement(component, props, mapping);
}

export const Link = Object.assign(
  (props: React.ComponentProps<typeof RouterLink> & { className?: string }) =>
    useCssElementCompat(RouterLink, props, { className: 'style' }),
  {
    Trigger: RouterLink.Trigger,
    Menu: RouterLink.Menu,
    MenuAction: RouterLink.MenuAction,
    Preview: RouterLink.Preview,
  },
);

export const useCSSVariable =
  process.env.EXPO_OS !== 'web'
    ? useFunctionalVariable
    : (variable: string) => `var(${variable})`;

export type ViewProps = React.ComponentProps<typeof RNView> & {
  className?: string;
};

export const View = (props: ViewProps) => {
  return useCssElementCompat(RNView, props, { className: 'style' });
};
View.displayName = 'CSS(View)';

export const Text = (
  props: React.ComponentProps<typeof RNText> & { className?: string },
) => {
  return useCssElementCompat(RNText, props, { className: 'style' });
};
Text.displayName = 'CSS(Text)';

export const ScrollView = (
  props: React.ComponentProps<typeof RNScrollView> & {
    className?: string;
    contentContainerClassName?: string;
  },
) => {
  return useCssElementCompat(RNScrollView, props, {
    className: 'style',
    contentContainerClassName: 'contentContainerStyle',
  });
};
ScrollView.displayName = 'CSS(ScrollView)';

export const Pressable = (
  props: React.ComponentProps<typeof RNPressable> & { className?: string },
) => {
  return useCssElementCompat(RNPressable, props, { className: 'style' });
};
Pressable.displayName = 'CSS(Pressable)';

export const TouchableOpacity = (
  props: React.ComponentProps<typeof RNTouchableOpacity> & { className?: string },
) => {
  return useCssElementCompat(RNTouchableOpacity, props, { className: 'style' });
};
TouchableOpacity.displayName = 'CSS(TouchableOpacity)';

export const TextInput = (
  props: React.ComponentProps<typeof RNTextInput> & { className?: string },
) => {
  return useCssElementCompat(RNTextInput, props, { className: 'style' });
};
TextInput.displayName = 'CSS(TextInput)';

export const AnimatedScrollView = (
  props: React.ComponentProps<typeof Animated.ScrollView> & {
    className?: string;
    contentClassName?: string;
    contentContainerClassName?: string;
  },
) => {
  return useCssElementCompat(Animated.ScrollView, props, {
    className: 'style',
    contentClassName: 'contentContainerStyle',
    contentContainerClassName: 'contentContainerStyle',
  });
};
AnimatedScrollView.displayName = 'CSS(AnimatedScrollView)';

function CSSTouchableHighlight(
  props: React.ComponentProps<typeof RNTouchableHighlight>,
) {
  const flattenedStyle = StyleSheet.flatten(props.style as never) as
    | Record<string, unknown>
    | undefined;
  const { underlayColor, ...style } = flattenedStyle || {};

  return (
    <RNTouchableHighlight
      {...props}
      underlayColor={underlayColor as string | undefined}
      style={style as React.ComponentProps<typeof RNTouchableHighlight>['style']}
    />
  );
}

export const TouchableHighlight = (
  props: React.ComponentProps<typeof RNTouchableHighlight>,
) => {
  return useCssElementCompat(CSSTouchableHighlight, props, {
    className: 'style',
  });
};
TouchableHighlight.displayName = 'CSS(TouchableHighlight)';

export { Image } from './image';
export type { ImageProps } from './image';
