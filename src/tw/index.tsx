import {
  useCssElement,
  useNativeVariable as useFunctionalVariable,
} from 'react-native-css';
import { Link as RouterLink } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator as RNActivityIndicator,
  FlatList as RNFlatList,
  type FlatListProps,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
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
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';

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
    Trigger: RouterLink?.Trigger,
    Menu: RouterLink?.Menu,
    MenuAction: RouterLink?.MenuAction,
    Preview: RouterLink?.Preview,
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

export const ScrollView = React.forwardRef<
  React.ComponentRef<typeof RNScrollView>,
  React.ComponentProps<typeof RNScrollView> & {
    className?: string;
    contentContainerClassName?: string;
  }
>((props, ref) => {
  return useCssElementCompat(RNScrollView, { ...props, ref }, {
    className: 'style',
    contentContainerClassName: 'contentContainerStyle',
  });
});
ScrollView.displayName = 'CSS(ScrollView)';

export const Pressable = React.forwardRef<
  React.ComponentRef<typeof RNPressable>,
  React.ComponentProps<typeof RNPressable> & { className?: string }
>((props, ref) => {
  return useCssElementCompat(RNPressable, { ...props, ref }, { className: 'style' });
});
Pressable.displayName = 'CSS(Pressable)';

export const TouchableOpacity = (
  props: React.ComponentProps<typeof RNTouchableOpacity> & { className?: string },
) => {
  return useCssElementCompat(RNTouchableOpacity, props, { className: 'style' });
};
TouchableOpacity.displayName = 'CSS(TouchableOpacity)';

export const ActivityIndicator = (
  props: React.ComponentProps<typeof RNActivityIndicator> & { className?: string },
) => {
  return useCssElementCompat(RNActivityIndicator, props, { className: 'style' });
};
ActivityIndicator.displayName = 'CSS(ActivityIndicator)';

export const KeyboardAvoidingView = (
  props: React.ComponentProps<typeof RNKeyboardAvoidingView> & { className?: string },
) => {
  return useCssElementCompat(RNKeyboardAvoidingView, props, { className: 'style' });
};
KeyboardAvoidingView.displayName = 'CSS(KeyboardAvoidingView)';

export const SafeAreaView = (
  props: React.ComponentProps<typeof RNSafeAreaView> & { className?: string },
) => {
  return useCssElementCompat(RNSafeAreaView, props, { className: 'style' });
};
SafeAreaView.displayName = 'CSS(SafeAreaView)';

export function FlatList<ItemT>(
  props: FlatListProps<ItemT> & {
    className?: string;
    contentContainerClassName?: string;
  },
) {
  return useCssElementCompat(RNFlatList, props, {
    className: 'style',
    contentContainerClassName: 'contentContainerStyle',
  });
}
FlatList.displayName = 'CSS(FlatList)';

export const TextInput = React.forwardRef<
  React.ComponentRef<typeof RNTextInput>,
  React.ComponentProps<typeof RNTextInput> & { className?: string }
>((props, ref) => {
  return useCssElementCompat(RNTextInput, { ...props, ref }, { className: 'style' });
});
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

type CssTouchableHighlightProps = React.ComponentProps<typeof RNTouchableHighlight> & {
  className?: string;
};

function CSSTouchableHighlight({ className: _className, ...props }: CssTouchableHighlightProps) {
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

export const TouchableHighlight = (props: CssTouchableHighlightProps) => {
  return useCssElementCompat(CSSTouchableHighlight, props, {
    className: 'style',
  });
};
TouchableHighlight.displayName = 'CSS(TouchableHighlight)';

export { Image } from './image';
export type { ImageProps } from './image';
