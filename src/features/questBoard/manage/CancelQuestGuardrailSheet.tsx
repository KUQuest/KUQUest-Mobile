import { useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Animated } from "@/tw/animated";
import { Pressable, Text, TextInput, View } from "@/tw";

interface CancelQuestGuardrailSheetProps {
  visible: boolean;
  tier: 2 | 3;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  keyword: string;
  keywordLabel: string;
  keywordPlaceholder: string;
  slideLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
}

export function CancelQuestGuardrailSheet(
  props: CancelQuestGuardrailSheetProps
) {
  return (
    <CancelQuestGuardrailSheetContent
      key={props.visible ? "open" : "closed"}
      {...props}
    />
  );
}

function CancelQuestGuardrailSheetContent({
  visible,
  tier,
  title,
  description,
  confirmLabel,
  cancelLabel,
  keyword,
  keywordLabel,
  keywordPlaceholder,
  slideLabel,
  onConfirm,
  onClose,
  busy = false,
}: CancelQuestGuardrailSheetProps) {
  const [input, setInput] = useState("");
  const [trackWidth, setTrackWidth] = useState(0);
  const translateX = useSharedValue(0);
  const maxTravel = Math.max(0, trackWidth - 48);
  const matchesKeyword =
    input.trim().toLocaleUpperCase() === keyword.toLocaleUpperCase();
  const animatedThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
  }));
  const onTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
    translateX.set(0);
  };
  const pan = Gesture.Pan()
    .enabled(!busy)
    .onUpdate((event) => {
      translateX.set(Math.max(0, Math.min(event.translationX, maxTravel)));
    })
    .onEnd(() => {
      if (translateX.get() >= 0.9 * maxTravel && maxTravel > 0) {
        runOnJS(onConfirm)();
        translateX.set(0);
      } else {
        translateX.set(withSpring(0));
      }
    });

  return (
    <BottomSheet
      visible={visible}
      title={title}
      subtitle={description}
      closeLabel={cancelLabel}
      onClose={onClose}
      testID="cancel-quest-guardrail"
    >
      <View className="gap-ku-md py-ku-lg">
        {tier === 2 ? (
          <>
            <GestureHandlerRootView>
              <View
                className="h-[56px] justify-center rounded-ku-pill bg-ku-surface-muted"
                onLayout={onTrackLayout}
                testID="cancel-guardrail-slide-track"
              >
                <Text className="text-center font-ku-semibold text-ku-body-small text-ku-text-secondary">
                  {slideLabel}
                </Text>
                <GestureDetector gesture={pan}>
                  <Animated.View
                    accessibilityLabel={slideLabel}
                    accessibilityRole="adjustable"
                    accessibilityState={{ disabled: busy }}
                    className="absolute top-[4px] left-0 h-[48px] w-[48px] items-center justify-center rounded-ku-pill bg-ku-danger-dark"
                    style={animatedThumbStyle}
                    testID="cancel-guardrail-slide-thumb"
                  >
                    <Text className="font-ku-bold text-ku-body-small text-ku-on-primary">
                      ›
                    </Text>
                  </Animated.View>
                </GestureDetector>
              </View>
            </GestureHandlerRootView>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy, disabled: busy }}
              className="min-h-[48px] items-center justify-center rounded-ku-pill bg-ku-danger-dark px-ku-lg active:opacity-80"
              disabled={busy}
              onPress={onConfirm}
              testID="cancel-guardrail-confirm"
            >
              <Text className="text-center font-ku-semibold text-ku-body-small text-ku-on-primary">
                {confirmLabel}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              accessibilityLabel={keywordLabel}
              accessibilityState={{ disabled: busy }}
              editable={!busy}
              autoCapitalize="characters"
              className="rounded-ku-input min-h-[48px] border border-ku-border-subtle px-ku-md text-ku-body-small text-ku-text-strong"
              onChangeText={setInput}
              placeholder={keywordPlaceholder}
              value={input}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy, disabled: busy || !matchesKeyword }}
              className="min-h-[48px] items-center justify-center rounded-ku-pill bg-ku-danger-dark px-ku-lg active:opacity-80"
              disabled={busy || !matchesKeyword}
              onPress={onConfirm}
              testID="cancel-guardrail-confirm"
            >
              <Text className="text-center font-ku-semibold text-ku-body-small text-ku-on-primary">
                {confirmLabel}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </BottomSheet>
  );
}
