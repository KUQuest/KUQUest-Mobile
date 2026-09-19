import Animated, * as Reanimated from "react-native-reanimated";
import { View } from "@/tw";

export const MotionView = Animated.createAnimatedComponent
  ? Animated.createAnimatedComponent(View)
  : Animated.View;

export function getOnboardingTransition(
  kind: "in" | "out",
  reduceMotion: boolean
) {
  if (reduceMotion) return undefined;
  const transition = kind === "in" ? Reanimated.FadeIn : Reanimated.FadeOut;
  if (!transition || typeof transition.duration !== "function")
    return undefined;
  return transition.duration(220);
}
