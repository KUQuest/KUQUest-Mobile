import { TextInput as RNTextInput } from "react-native";

type MeasureLayout = React.ComponentRef<typeof RNTextInput>["measureLayout"];
type RelativeToNativeNode = Parameters<MeasureLayout>[0];

type MeasureLayoutTarget = {
  measureLayout?: MeasureLayout;
};

export function measureFieldRelativeToScroll(
  target: MeasureLayoutTarget,
  scrollView: RelativeToNativeNode | null,
  onSuccess: Parameters<MeasureLayout>[1],
  onFail: Parameters<MeasureLayout>[2]
): boolean {
  if (!scrollView || typeof target.measureLayout !== "function") return false;

  target.measureLayout(scrollView, onSuccess, onFail);
  return true;
}
