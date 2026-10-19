import { describe, expect, it } from "vitest";
import { filterHomeVideos, parseHomeQuery, type HomeListing } from "./filter-home";

const listings: HomeListing[] = [
  { id: "video_sauce", title: "Evening sauce", ownerName: "Samira Nouri", roomTitle: "Kitchen Notes", createdAt: "2026-06-02T15:00:00.000Z", category: "food" },
  { id: "video_ridge", title: "Ridge line", ownerName: "Luis Ortega", roomTitle: "Trail Cuts", createdAt: "2026-06-01T15:00:00.000Z", category: "outdoors" },
  { id: "video_color", title: "Color pass", ownerName: "Mina Okada", roomTitle: "Studio Reels", createdAt: "2026-05-20T15:00:00.000Z", category: "film" },
  { id: "video_creek", title: "Creek crossing", ownerName: "Luis Ortega", roomTitle: "Trail Cuts", createdAt: "2026-05-12T15:00:00.000Z", category: "outdoors" },
  { id: "video_soft", title: "Soft light test", ownerName: "Mina Okada", roomTitle: "Studio Reels", createdAt: "2026-05-04T15:00:00.000Z", category: "film" },
  { id: "video_pier", title: "Pier loop", ownerName: "Jordan Hale", roomTitle: "Jetty Walks", createdAt: "2026-04-02T15:00:00.000Z", category: "lifestyle" },
];

describe("home catalog filters", () => {
  it("keeps newest public order and ignores an unknown topic", () => {
    const query = parseHomeQuery({ topic: "nope", sort: "sideways" });
    expect(query).toEqual({ query: "", topic: "all", sort: "newest" });
    expect(filterHomeVideos(listings, query).map((item) => item.id)).toEqual([
      "video_sauce",
      "video_ridge",
      "video_color",
      "video_creek",
      "video_soft",
      "video_pier",
    ]);
  });

  it("combines category, author or room search, and oldest-first dates", () => {
    const outdoors = filterHomeVideos(listings, parseHomeQuery({ topic: "outdoors", q: " trail " }));
    expect(outdoors.map((item) => item.title)).toEqual(["Ridge line", "Creek crossing"]);

    const oldest = filterHomeVideos(listings, parseHomeQuery({ topic: "outdoors", sort: "oldest" }));
    expect(oldest.map((item) => item.title)).toEqual(["Creek crossing", "Ridge line"]);

    expect(filterHomeVideos(listings, parseHomeQuery({ q: "mina" })).map((item) => item.title)).toEqual([
      "Color pass",
      "Soft light test",
    ]);
    expect(filterHomeVideos(listings, parseHomeQuery({ q: "kitchen" })).map((item) => item.title)).toEqual([
      "Evening sauce",
    ]);
    expect(filterHomeVideos(listings, parseHomeQuery({ topic: "food", q: "luis" }))).toEqual([]);
  });
});
