import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

export interface UploadAsset {
  uri: string;
  name?: string;
  type?: string;
}

export function fileNameFromUri(uri: string, fallback: string): string {
  const lastSegment = uri.split("/").pop()?.split("?")[0];
  return lastSegment || fallback;
}

export function mimeTypeFromUri(uri: string): string {
  const clean = uri.split("?")[0].toLowerCase();
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".pdf")) return "application/pdf";
  if (clean.endsWith(".mp4")) return "video/mp4";
  return "image/jpeg";
}

/** Server image-upload limit on width × height; the server does not resize. */
export const MAX_UPLOAD_IMAGE_PIXELS = 25_000_000;

/** Largest same-aspect size within the pixel limit, or `null` when it already fits. */
export function fitWithinPixelLimit(
  width: number,
  height: number,
  maxPixels = MAX_UPLOAD_IMAGE_PIXELS
): { width: number; height: number } | null {
  if (width * height <= maxPixels) return null;
  const scale = Math.sqrt(maxPixels / (width * height));
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  };
}

const SAVE_FORMAT_BY_MIME: Record<string, SaveFormat> = {
  "image/png": SaveFormat.PNG,
  "image/webp": SaveFormat.WEBP,
};

/**
 * Downscales an image above `MAX_UPLOAD_IMAGE_PIXELS` into a new local file.
 * Returns the asset unchanged when it already fits.
 */
export async function limitImagePixels(asset: {
  uri: string;
  type: string;
  width: number;
  height: number;
}): Promise<{ uri: string; type: string; resized: boolean }> {
  if (!fitWithinPixelLimit(asset.width, asset.height)) {
    return { uri: asset.uri, type: asset.type, resized: false };
  }
  // Picker dimensions may ignore EXIF rotation; size from the decoded image.
  const decoded = await ImageManipulator.manipulate(asset.uri).renderAsync();
  const size = fitWithinPixelLimit(decoded.width, decoded.height) ?? {
    width: decoded.width,
    height: decoded.height,
  };
  const format = SAVE_FORMAT_BY_MIME[asset.type] ?? SaveFormat.JPEG;
  const rendered = await ImageManipulator.manipulate(decoded)
    .resize(size)
    .renderAsync();
  const saved = await rendered.saveAsync({ format, compress: 0.9 });
  return { uri: saved.uri, type: `image/${format}`, resized: true };
}

export function appendUploadFile(
  formData: FormData,
  field: string,
  asset: UploadAsset,
  defaultBaseName: string = field
): void {
  const mimeType = asset.type || mimeTypeFromUri(asset.uri);
  const ext =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
        ? "webp"
        : mimeType === "application/pdf"
          ? "pdf"
          : mimeType === "video/mp4"
            ? "mp4"
            : "jpg";
  const fileName =
    asset.name ?? fileNameFromUri(asset.uri, `${defaultBaseName}.${ext}`);
  const file = new File(asset.uri);
  Object.defineProperty(file, "type", {
    value: mimeType,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(file, "name", {
    value: fileName,
    configurable: true,
    writable: true,
  });
  formData.append(field, file as unknown as Blob, fileName);
}
