import { parseBoundedText, type ParseResult } from "@/shared";

export type VideoStatus = "uploading" | "processing" | "ready" | "error";

export const videoCategories = ["outdoors", "food", "film", "lifestyle"] as const;
export type VideoCategory = (typeof videoCategories)[number];

export interface Video {
  id: string;
  roomId: string;
  title: string;
  status: VideoStatus;
  progress: number;
  durationLabel: string;
  createdAt: string;
  errorMessage: string | null;
  coverSrc?: string | null;
  category?: VideoCategory | null;
}

export interface UploadRequest {
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface ParsedUpload {
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  simulateFailure: boolean;
}

const MAX_FILE_BYTES = 2_000_000_000;

export const videoStatusLabel: Record<VideoStatus, string> = {
  uploading: "Uploading",
  processing: "Processing",
  ready: "Ready",
  error: "Failed",
};

export function parseUploadRequest(input: UploadRequest): ParseResult<ParsedUpload> {
  const title = parseBoundedText(input.title, { min: 1, max: 80, label: "Title" });
  if (!title.ok) return title;

  const fileName = input.fileName.trim();
  if (
    fileName.length < 1 ||
    fileName.length > 180 ||
    /[\\/]/.test(fileName) ||
    fileName.includes("..")
  ) {
    return { ok: false, message: "Choose a video file name without a folder path." };
  }

  const mimeType = input.mimeType.trim().toLowerCase();
  if (!mimeType.startsWith("video/") || mimeType.length > 100) {
    return { ok: false, message: "Choose a video file. Other file types are not accepted." };
  }

  if (!Number.isInteger(input.fileSize) || input.fileSize < 1 || input.fileSize > MAX_FILE_BYTES) {
    return { ok: false, message: "The demo accepts a video between 1 byte and 2 GB." };
  }

  return {
    ok: true,
    value: {
      title: title.value,
      fileName,
      fileSize: input.fileSize,
      mimeType,
      simulateFailure: /fail/i.test(fileName),
    },
  };
}
