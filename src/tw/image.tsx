import { useCssElement } from 'react-native-css';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Image as RNImage } from 'expo-image';

type CssImageProps = Omit<React.ComponentProps<typeof RNImage>, 'style'> & {
  className?: string;
  style?: unknown;
};

export type ImageProps = React.ComponentProps<typeof RNImage> & {
  className?: string;
};

function CSSImage({ className: _className, style, ...props }: CssImageProps) {
  const flattenedStyle = StyleSheet.flatten(style as never) as
    | Record<string, unknown>
    | undefined;
  const { objectFit, objectPosition, ...nativeStyle } = flattenedStyle || {};
  const contentFit = objectFit ?? props.contentFit;
  const contentPosition = objectPosition ?? props.contentPosition;

  return (
    <RNImage
      {...props}
      contentFit={contentFit as React.ComponentProps<typeof RNImage>['contentFit']}
      contentPosition={contentPosition as React.ComponentProps<typeof RNImage>['contentPosition']}
      source={
        typeof props.source === 'string' ? { uri: props.source } : props.source
      }
      style={nativeStyle as React.ComponentProps<typeof RNImage>['style']}
    />
  );
}

const CssElement = useCssElement as unknown as (
  component: unknown,
  props: unknown,
  mapping: unknown,
) => React.ReactElement;

export const Image = (props: CssImageProps) => {
  return CssElement(CSSImage, props, { className: 'style' });
};

Image.displayName = 'CSS(Image)';
