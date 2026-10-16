import { parseBoundedText, type ParseResult } from "@/shared";

export interface Playlist {
  id: string;
  roomId: string;
  title: string;
  description: string;
  videoIds: string[];
}

export function parsePlaylistTitle(value: string): ParseResult<string> {
  return parseBoundedText(value, { min: 1, max: 80, label: "Playlist name" });
}

export function parsePlaylistDescription(value: string): ParseResult<string> {
  return parseBoundedText(value, { min: 0, max: 400, label: "Description" });
}
