import { parseBoundedText, type ParseResult } from "@/shared";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarSrc?: string | null;
}

export function parseDisplayName(value: string): ParseResult<string> {
  return parseBoundedText(value, { min: 1, max: 60, label: "Display name" });
}
