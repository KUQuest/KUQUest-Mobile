import { Platform, type TextProps } from "react-native";

import { Text } from "@/tw";
import { cn } from "@/tw/cn";

import { useAppTheme } from "@/features/workspace/AppThemeProvider";
import type { ThemeColors } from "@/theme/colors";

export type ThemedTextProps = TextProps & {
  type?:
    | "default"
    | "title"
    | "small"
    | "smallBold"
    | "subtitle"
    | "link"
    | "linkPrimary"
    | "code";
  themeColor?: keyof ThemeColors;
};

type ThemedTextType = NonNullable<ThemedTextProps["type"]>;

export function ThemedText({
  style,
  type = "default",
  themeColor,
  className,
  ...rest
}: ThemedTextProps) {
  const { colors } = useAppTheme();

  return (
    <Text
      className={cn(styles[type], className)}
      style={[
        { color: colors[themeColor ?? "text"] },
        type === "linkPrimary" && { color: colors.info },
        type === "code" && {
          fontWeight: Platform.select({ android: 700 }) ?? 500,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles: Record<ThemedTextType, string> = {
  small: "font-medium text-[14px] leading-[20px]",
  smallBold: "font-bold text-[14px] leading-[20px]",
  default: "font-medium text-[16px] leading-[24px]",
  title: "font-semibold text-[48px] leading-[52px]",
  subtitle: "font-semibold text-[32px] leading-[44px]",
  link: "text-[14px] leading-[30px]",
  linkPrimary: "text-[14px] leading-[30px]",
  code: "font-mono text-[12px]",
};
