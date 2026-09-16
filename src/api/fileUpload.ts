import { File } from "expo-file-system";

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
