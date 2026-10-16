export const demoErrorCodes = [
  "unauthenticated",
  "unknown_room",
  "forbidden",
  "unknown_video",
  "unknown_playlist",
  "validation",
  "invalid_state",
] as const;

export type DemoErrorCode = (typeof demoErrorCodes)[number];

export class DemoAccessError extends Error {
  readonly code: DemoErrorCode;

  constructor(code: DemoErrorCode, message: string) {
    super(message);
    this.name = "DemoAccessError";
    this.code = code;
  }
}

export function demoErrorMessage(error: unknown): string {
  if (error instanceof DemoAccessError) return error.message;
  return "Something went wrong in the demo. Refresh the page and try again.";
}
