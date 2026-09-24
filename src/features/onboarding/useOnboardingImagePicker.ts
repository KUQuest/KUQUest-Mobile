import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export type OnboardingImageAspect = [number, number];
export type OnboardingImageSelection = (uri: string) => void;

type RetryRequest = {
  onSelected: OnboardingImageSelection;
  aspect: OnboardingImageAspect;
};
export type OnboardingImagePickerState = {
  pickImage: (
    onSelected: OnboardingImageSelection,
    aspect: OnboardingImageAspect
  ) => Promise<void>;
  isTooLargeVisible: boolean;
  dismissTooLarge: () => void;
  retry: () => void;
};

export function useOnboardingImagePicker({ onError }: { onError: () => void }) {
  const [retryRequest, setRetryRequest] = useState<RetryRequest | null>(null);

  const pickImage = useCallback(
    async (
      onSelected: OnboardingImageSelection,
      aspect: OnboardingImageAspect
    ) => {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect,
          quality: 0.5,
        });
        if (result.canceled || !result.assets?.[0]) return;
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
          setRetryRequest({ onSelected, aspect });
          return;
        }
        onSelected(asset.uri);
      } catch {
        onError();
      }
    },
    [onError]
  );

  const dismissTooLarge = useCallback(() => {
    setRetryRequest(null);
  }, []);

  const retry = useCallback(() => {
    const request = retryRequest;
    setRetryRequest(null);
    if (request) void pickImage(request.onSelected, request.aspect);
  }, [pickImage, retryRequest]);

  return {
    pickImage,
    isTooLargeVisible: retryRequest !== null,
    dismissTooLarge,
    retry,
  };
}
