import { parseBoundedText, type ParseResult } from "@/shared";

export interface User {
  id: string;
  name: string;
  email: string;
}

export function parseDisplayName(value: string): ParseResult<string> {
  return parseBoundedText(value, { min: 1, max: 60, label: "Display name" });
}
