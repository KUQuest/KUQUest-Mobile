import { useState } from "react";
import type {
  GestureResponderEvent,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";

import { Image, Pressable, Text, View } from "@/tw";
import { cn } from "@/tw/cn";

export type AvatarSize = number | "small" | "medium";

export interface AvatarProps {
  name: string;
  uri?: string;
  size?: AvatarSize;
  onPress?: (event: GestureResponderEvent) => void;
  accessibilityLabel?: string;
  cacheKey?: string;
  className?: string;
  textClassName?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
  imageTestID?: string;
  imageClassName?: string;
}

const sizeStyles = {
  small: { height: 36, width: 36 },
  medium: { height: 48, width: 48 },
} as const;

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return initials.toUpperCase() || "?";
}

export function Avatar({
  name,
  uri,
  size = "medium",
  onPress,
  accessibilityLabel,
  cacheKey,
  className,
  textClassName,
  style,
  textStyle,
  testID,
  imageTestID,
  imageClassName,
}: AvatarProps) {
  const [failedUri, setFailedUri] = useState<string>();
  const resolvedUri = uri && uri !== failedUri ? uri : undefined;
  const showImage = Boolean(resolvedUri);
  const resolvedSize =
    typeof size === "number" ? { height: size, width: size } : sizeStyles[size];
  const labelled = Boolean(accessibilityLabel) && !onPress;
  const avatar = (
    <View
      accessible={false}
      className={cn(
        "items-center justify-center overflow-hidden rounded-ku-pill",
        className
      )}
      style={[resolvedSize, style]}
      testID={testID}
    >
      {showImage ? (
        <Image
          accessibilityLabel={labelled ? accessibilityLabel : undefined}
          accessible={labelled}
          className={imageClassName}
          cachePolicy="memory-disk"
          contentFit="cover"
          onError={() => {
            if (uri) setFailedUri(uri);
          }}
          source={
            cacheKey
              ? [{ uri: resolvedUri ?? "", cacheKey }]
              : { uri: resolvedUri ?? "" }
          }
          style={{ height: "100%", width: "100%" }}
          testID={imageTestID}
        />
      ) : (
        <Text
          accessibilityLabel={labelled ? accessibilityLabel : undefined}
          accessible={labelled}
          className={textClassName}
          style={textStyle}
        >
          {getInitials(name)}
        </Text>
      )}
    </View>
  );

  if (!onPress) return avatar;

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? name}
      accessibilityRole="button"
      onPress={onPress}
    >
      {avatar}
    </Pressable>
  );
}
