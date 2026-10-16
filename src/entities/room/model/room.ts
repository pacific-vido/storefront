import { parseBoundedText, type ParseResult } from "@/shared";

export type RoomRole = "owner" | "viewer";
export type RoomVisibility = "private" | "public";

export interface Room {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  visibility: RoomVisibility;
  createdAt: string;
}

export function parseRoomTitle(value: string): ParseResult<string> {
  return parseBoundedText(value, { min: 1, max: 80, label: "Room name" });
}

export function parseRoomDescription(value: string): ParseResult<string> {
  return parseBoundedText(value, { min: 0, max: 400, label: "Description" });
}

export function filterRoomsByTitle<T extends { title: string }>(
  rooms: readonly T[],
  query: string,
): T[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...rooms];
  return rooms.filter((room) => room.title.toLowerCase().includes(needle));
}
