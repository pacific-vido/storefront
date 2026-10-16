import { describe, expect, it } from "vitest";
import { filterRoomsByTitle, parseRoomTitle } from "./room";

const rooms = [
  { title: "Coastal Briefings" },
  { title: "Field Notes" },
  { title: "Harbor Reviews" },
];

describe("filterRoomsByTitle", () => {
  it("returns every room for an empty query", () => {
    expect(filterRoomsByTitle(rooms, "   ")).toEqual(rooms);
  });

  it("matches a partial title without case", () => {
    expect(filterRoomsByTitle(rooms, "harbor")).toEqual([{ title: "Harbor Reviews" }]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterRoomsByTitle([], "coast")).toEqual([]);
    expect(filterRoomsByTitle(rooms, "missing")).toEqual([]);
  });
});

describe("parseRoomTitle", () => {
  it("trims a usable name", () => {
    expect(parseRoomTitle("  Quiet room  ")).toEqual({ ok: true, value: "Quiet room" });
  });

  it("rejects an empty or oversized name", () => {
    expect(parseRoomTitle("   ").ok).toBe(false);
    expect(parseRoomTitle("a".repeat(81)).ok).toBe(false);
  });
});
