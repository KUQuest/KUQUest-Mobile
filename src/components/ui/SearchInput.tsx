import { CircleX, Search, X } from "lucide-react-native";
import type { TextInputProps } from "react-native";
import { Pressable, TextInput, View } from "@/tw";

export interface SearchInputProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  accessibilityLabel: string;
  clearAccessibilityLabel: string;
  onClear?: () => void;
  className?: string;
  inputClassName?: string;
  clearButtonClassName?: string;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoFocus?: boolean;
  placeholderTextColor?: TextInputProps["placeholderTextColor"];
  testID?: string;
  clearButtonTestID?: string;
  iconColor?: string;
  iconSize?: number;
  iconStrokeWidth?: number;
  clearIcon?: "x" | "circleX";
  clearIconColor?: string;
  clearIconSize?: number;
  clearIconStrokeWidth?: number;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  clearAccessibilityLabel,
  onClear,
  className,
  inputClassName,
  clearButtonClassName,
  autoCapitalize,
  autoFocus,
  placeholderTextColor,
  testID,
  clearButtonTestID,
  iconColor,
  iconSize = 20,
  iconStrokeWidth = 2,
  clearIcon = "x",
  clearIconColor,
  clearIconSize = 20,
  clearIconStrokeWidth = 2,
}: SearchInputProps) {
  const ClearIcon = clearIcon === "circleX" ? CircleX : X;

  return (
    <View className={className}>
      <Search color={iconColor} size={iconSize} strokeWidth={iconStrokeWidth} />
      <TextInput
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="search"
        autoCapitalize={autoCapitalize}
        autoFocus={autoFocus}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        className={inputClassName}
        testID={testID}
        value={value}
      />
      {value && onClear ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={clearAccessibilityLabel}
          className={clearButtonClassName}
          hitSlop={8}
          onPress={onClear}
          testID={clearButtonTestID}
        >
          <ClearIcon
            color={clearIconColor}
            size={clearIconSize}
            strokeWidth={clearIconStrokeWidth}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
