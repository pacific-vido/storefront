import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { DemoAccessError } from "./errors";
import { invitations, people, playlists, rooms, videos } from "./fixtures";
import { createDemoRepository, UPLOAD_TICK_MS, type DemoLibrary } from "./repository";

let repo: DemoLibrary;

beforeEach(() => {
  repo = createDemoRepository();
});

afterEach(() => {
  repo.dispose();
  vi.useRealTimers();
});

describe("demo session", () => {
  it("rejects an unknown person and blocks data before sign-in", async () => {
    await expect(repo.signIn("user_missing")).rejects.toMatchObject({ code: "validation" });
    await expect(repo.listRooms("owned")).rejects.toMatchObject({ code: "unauthenticated" });
    await expect(repo.getRoom(rooms.coastal)).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("keeps each person's rooms separate after switching", async () => {
    await repo.signIn(people.avery.id);
    expect((await repo.listRooms("owned")).map((room) => room.id).sort()).toEqual(
      [rooms.coastal, rooms.field].sort(),
    );
    await repo.signIn(people.jordan.id);
    expect((await repo.listRooms("owned")).map((room) => room.id).sort()).toEqual(
      [rooms.harbor, rooms.jetty].sort(),
    );
    expect((await repo.listRooms("shared")).map((room) => room.id)).toEqual([rooms.coastal]);
  });
});

describe("room isolation", () => {
  it("hides a missing room, a stranger, and a video from another room", async () => {
    await repo.signIn(people.jordan.id);
    const missing = await capture(repo.getRoom("room_missing"));
    expect(missing).toMatchObject({ code: "unknown_room" });
    expect(text(missing)).not.toContain("Field Notes");

    const forbidden = await capture(repo.getRoom(rooms.field));
    expect(forbidden).toMatchObject({ code: "forbidden" });
    expect(text(forbidden)).not.toContain("Field Notes");
    expect(forbidden).not.toHaveProperty("room");

    await expect(repo.getVideo(rooms.field, videos.north)).rejects.toMatchObject({ code: "forbidden" });
    await expect(repo.getPlaylist(rooms.field, playlists.routes)).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(repo.listVideos(rooms.field)).rejects.toMatchObject({ code: "forbidden" });

    await repo.signIn(people.avery.id);
    await expect(repo.getVideo(rooms.coastal, videos.lane)).rejects.toMatchObject({
      code: "unknown_video",
    });
    await expect(repo.getPlaylist(rooms.coastal, playlists.cuts)).rejects.toMatchObject({
      code: "unknown_playlist",
    });
    await expect(repo.getVideo("room_missing", videos.tide)).rejects.toMatchObject({
      code: "unknown_room",
    });
    const swapped = await capture(repo.getWatchContext(rooms.coastal, videos.lane));
    expect(text(swapped)).not.toContain("Lane review");
  });

  it("returns an empty collection for a new room and rejects a blank name", async () => {
    await repo.signIn(people.jordan.id);
    await expect(repo.createRoom({ title: "   ", description: "" })).rejects.toMatchObject({
      code: "validation",
    });
    const created = await repo.createRoom({ title: "Quiet room", description: "" });
    expect(created.visibility).toBe("private");
    expect(await repo.listVideos(created.id)).toEqual([]);
    expect(await repo.listPlaylists(created.id)).toEqual([]);
    expect((await repo.listRooms("owned")).some((room) => room.id === created.id)).toBe(true);
  });
});

describe("viewer cannot change room data", () => {
  it("lets a viewer watch and rejects every mutation", async () => {
    await repo.signIn(people.jordan.id);
    const details = await repo.getRoom(rooms.coastal);
    expect(details.role).toBe("viewer");
    expect((await repo.listVideos(rooms.coastal)).map((video) => video.id)).toContain(videos.tide);
    const playlist = await repo.getPlaylist(rooms.coastal, playlists.week);
    expect(playlist.videoIds).toEqual([videos.tide, videos.dock]);

    await expect(
      repo.updateRoom(rooms.coastal, { title: "Taken over", description: "nope" }),
    ).rejects.toMatchObject({ code: "forbidden" });
    await expect(repo.listAccess(rooms.coastal)).rejects.toMatchObject({ code: "forbidden" });
    await expect(
      repo.inviteViewer(rooms.coastal, "guest@example.com"),
    ).rejects.toMatchObject({ code: "forbidden" });
    await expect(repo.revokeAccess(rooms.coastal, people.avery.id)).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(
      repo.createPlaylist(rooms.coastal, { title: "Extra", description: "" }),
    ).rejects.toMatchObject({ code: "forbidden" });
    await expect(
      repo.updatePlaylist(rooms.coastal, playlists.week, { title: "Nope", description: "" }),
    ).rejects.toMatchObject({ code: "forbidden" });
    await expect(
      repo.setPlaylistVideos(rooms.coastal, playlists.week, [videos.dock, videos.tide]),
    ).rejects.toMatchObject({ code: "forbidden" });
    await expect(
      repo.startUpload(rooms.coastal, {
        title: "Nope",
        fileName: "nope.mp4",
        fileSize: 10,
        mimeType: "video/mp4",
      }),
    ).rejects.toMatchObject({ code: "forbidden" });
    await expect(repo.deleteVideo(rooms.coastal, videos.tide)).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(repo.retryUpload(rooms.coastal, videos.retake)).rejects.toMatchObject({
      code: "forbidden",
    });

    await repo.signIn(people.avery.id);
    expect((await repo.getRoom(rooms.coastal)).room.title).toBe("Coastal Briefings");
    expect((await repo.getPlaylist(rooms.coastal, playlists.week)).videoIds).toEqual([
      videos.tide,
      videos.dock,
    ]);
    expect(await repo.getVideo(rooms.coastal, videos.tide)).toMatchObject({ title: "Morning tide report" });
  });
});

describe("playlist access follows the room", () => {
  it("gives a viewer the room playlist and lets only the owner reorder it", async () => {
    await repo.signIn(people.jordan.id);
    const watched = await repo.getWatchContext(rooms.coastal, videos.dock, playlists.week);
    expect(watched.playlist?.title).toBe("Week one");
    expect(watched.queue.map((video) => video.id)).toEqual([videos.tide, videos.dock]);
    await expect(
      repo.getWatchContext(rooms.coastal, videos.retake, playlists.week),
    ).rejects.toMatchObject({ code: "unknown_video" });

    await repo.signIn(people.avery.id);
    const renamed = await repo.updatePlaylist(rooms.coastal, playlists.week, {
      title: "Week one revised",
      description: "Updated order.",
    });
    expect(renamed.title).toBe("Week one revised");
    const reordered = await repo.setPlaylistVideos(rooms.coastal, playlists.week, [
      videos.dock,
      videos.tide,
    ]);
    expect(reordered.videoIds).toEqual([videos.dock, videos.tide]);
    await expect(
      repo.setPlaylistVideos(rooms.coastal, playlists.week, [videos.tide, videos.tide]),
    ).rejects.toMatchObject({ code: "validation" });
    await expect(
      repo.setPlaylistVideos(rooms.coastal, playlists.week, [videos.lane, videos.tide]),
    ).rejects.toMatchObject({ code: "unknown_video" });
    expect((await repo.getPlaylist(rooms.coastal, playlists.week)).videoIds).toEqual([
      videos.dock,
      videos.tide,
    ]);
  });
});

describe("invitations and revoke", () => {
  it("does not duplicate a membership when an invite is accepted twice", async () => {
    await repo.signIn(people.jordan.id);
    await repo.acceptInvitation(invitations.fieldJordan);
    await repo.acceptInvitation(invitations.fieldJordan);
    await repo.acceptInvitation(invitations.coastalJordan);
    expect((await repo.listRooms("shared")).map((room) => room.id).sort()).toEqual(
      [rooms.coastal, rooms.field].sort(),
    );

    await repo.signIn(people.avery.id);
    const access = await repo.listAccess(rooms.field);
    expect(access.viewers.filter((viewer) => viewer.id === people.jordan.id)).toHaveLength(1);
    const coastal = await repo.listAccess(rooms.coastal);
    expect(coastal.viewers.filter((viewer) => viewer.id === people.jordan.id)).toHaveLength(1);
  });

  it("keeps a repeated pending invite as one row", async () => {
    await repo.signIn(people.avery.id);
    const first = await repo.inviteViewer(rooms.field, "guest@example.com");
    const second = await repo.inviteViewer(rooms.field, "  Guest@Example.com ");
    expect(second.id).toBe(first.id);
    const access = await repo.listAccess(rooms.field);
    expect(access.invitations.filter((item) => item.email === "guest@example.com")).toHaveLength(1);
    await expect(repo.inviteViewer(rooms.field, "not-an-email")).rejects.toMatchObject({
      code: "validation",
    });
    await expect(repo.inviteViewer(rooms.coastal, people.jordan.email)).rejects.toMatchObject({
      code: "validation",
    });
    await expect(repo.inviteViewer(rooms.field, people.avery.email)).rejects.toMatchObject({
      code: "validation",
    });
  });

  it("closes the room, its videos, and its playlists after revoke", async () => {
    await repo.signIn(people.avery.id);
    await expect(repo.revokeAccess(rooms.coastal, people.avery.id)).rejects.toMatchObject({
      code: "validation",
    });
    await repo.revokeAccess(rooms.coastal, people.jordan.id);

    await repo.signIn(people.jordan.id);
    expect((await repo.listRooms("shared")).map((room) => room.id)).not.toContain(rooms.coastal);
    await expect(repo.getRoom(rooms.coastal)).rejects.toMatchObject({ code: "forbidden" });
    await expect(repo.getVideo(rooms.coastal, videos.tide)).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(repo.getPlaylist(rooms.coastal, playlists.week)).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(repo.getWatchContext(rooms.coastal, videos.dock, playlists.week)).rejects.toMatchObject(
      { code: "forbidden" },
    );
    await expect(repo.acceptInvitation(invitations.coastalJordan)).rejects.toMatchObject({
      code: "forbidden",
    });

    await repo.signIn(people.avery.id);
    const renewed = await repo.inviteViewer(rooms.coastal, people.jordan.email);
    await repo.signIn(people.jordan.id);
    await repo.acceptInvitation(renewed.id);
    expect((await repo.getRoom(rooms.coastal)).role).toBe("viewer");
  });

  it("does not let someone accept another person's invitation", async () => {
    await repo.signIn(people.avery.id);
    await expect(repo.acceptInvitation(invitations.fieldJordan)).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(repo.acceptInvitation("inv_missing")).rejects.toMatchObject({ code: "forbidden" });
  });
});

describe("deleting a video", () => {
  it("removes the video from every playlist", async () => {
    await repo.signIn(people.avery.id);
    const extra = await repo.createPlaylist(rooms.coastal, { title: "Second look", description: "" });
    await repo.setPlaylistVideos(rooms.coastal, extra.id, [videos.tide, videos.dock]);
    await repo.deleteVideo(rooms.coastal, videos.tide);

    expect((await repo.listVideos(rooms.coastal)).map((video) => video.id)).not.toContain(videos.tide);
    expect((await repo.getPlaylist(rooms.coastal, playlists.week)).videoIds).toEqual([videos.dock]);
    expect((await repo.getPlaylist(rooms.coastal, extra.id)).videoIds).toEqual([videos.dock]);
    await expect(repo.getVideo(rooms.coastal, videos.tide)).rejects.toMatchObject({
      code: "unknown_video",
    });
    await expect(repo.deleteVideo(rooms.coastal, videos.tide)).rejects.toMatchObject({
      code: "unknown_video",
    });
  });
});

describe("demo upload", () => {
  it("moves a file through uploading, processing, and ready", async () => {
    vi.useFakeTimers();
    await repo.signIn(people.avery.id);
    const video = await repo.startUpload(rooms.field, {
      title: "Clip",
      fileName: "clip.mp4",
      fileSize: 1200,
      mimeType: "video/mp4",
    });
    expect(video).toMatchObject({ status: "uploading", progress: 0 });

    await vi.advanceTimersByTimeAsync(UPLOAD_TICK_MS);
    expect(await repo.getVideo(rooms.field, video.id)).toMatchObject({
      status: "uploading",
      progress: 25,
    });

    await vi.advanceTimersByTimeAsync(UPLOAD_TICK_MS * 5);
    expect(await repo.getVideo(rooms.field, video.id)).toMatchObject({ status: "ready", progress: 100 });
    await expect(repo.retryUpload(rooms.field, video.id)).rejects.toMatchObject({
      code: "invalid_state",
    });
  });

  it("fails a named simulation, rejects a second retry, then succeeds once", async () => {
    vi.useFakeTimers();
    await repo.signIn(people.avery.id);
    const video = await repo.startUpload(rooms.field, {
      title: "Broken",
      fileName: "fail-clip.mp4",
      fileSize: 1200,
      mimeType: "video/mp4",
    });
    await vi.advanceTimersByTimeAsync(UPLOAD_TICK_MS * 6);
    expect(await repo.getVideo(rooms.field, video.id)).toMatchObject({ status: "error" });

    await repo.retryUpload(rooms.field, video.id);
    await expect(repo.retryUpload(rooms.field, video.id)).rejects.toMatchObject({
      code: "invalid_state",
    });
    await vi.advanceTimersByTimeAsync(UPLOAD_TICK_MS);
    expect(await repo.getVideo(rooms.field, video.id)).toMatchObject({
      status: "uploading",
      progress: 25,
    });
    await vi.advanceTimersByTimeAsync(UPLOAD_TICK_MS * 5);
    expect(await repo.getVideo(rooms.field, video.id)).toMatchObject({ status: "ready" });
  });

  it("rejects a retry while processing and rejects bad files without saving them", async () => {
    vi.useFakeTimers();
    await repo.signIn(people.avery.id);
    const before = (await repo.listVideos(rooms.field)).map((video) => video.id);
    await expect(
      repo.startUpload(rooms.field, {
        title: "Notes",
        fileName: "../secret.mp4",
        fileSize: 10,
        mimeType: "video/mp4",
      }),
    ).rejects.toMatchObject({ code: "validation" });
    await expect(
      repo.startUpload(rooms.field, {
        title: "Notes",
        fileName: "notes.txt",
        fileSize: 10,
        mimeType: "text/plain",
      }),
    ).rejects.toMatchObject({ code: "validation" });
    await expect(
      repo.startUpload(rooms.field, {
        title: " ",
        fileName: "notes.mp4",
        fileSize: 0,
        mimeType: "video/mp4",
      }),
    ).rejects.toMatchObject({ code: "validation" });
    expect((await repo.listVideos(rooms.field)).map((video) => video.id)).toEqual(before);

    const video = await repo.startUpload(rooms.field, {
      title: "Clip",
      fileName: "clip.mp4",
      fileSize: 10,
      mimeType: "video/mp4",
    });
    await vi.advanceTimersByTimeAsync(UPLOAD_TICK_MS * 5);
    expect(await repo.getVideo(rooms.field, video.id)).toMatchObject({ status: "processing" });
    await expect(repo.retryUpload(rooms.field, video.id)).rejects.toMatchObject({
      code: "invalid_state",
    });
    expect(await repo.getVideo(rooms.field, video.id)).toMatchObject({ status: "processing" });
  });

  it("retries the seeded failed video and can delete an in-flight upload", async () => {
    vi.useFakeTimers();
    await repo.signIn(people.avery.id);
    await repo.retryUpload(rooms.coastal, videos.retake);
    await vi.advanceTimersByTimeAsync(UPLOAD_TICK_MS * 6);
    expect(await repo.getVideo(rooms.coastal, videos.retake)).toMatchObject({ status: "ready" });

    const live = await repo.startUpload(rooms.coastal, {
      title: "Live",
      fileName: "live.mp4",
      fileSize: 10,
      mimeType: "video/mp4",
    });
    await repo.deleteVideo(rooms.coastal, live.id);
    await vi.advanceTimersByTimeAsync(UPLOAD_TICK_MS * 8);
    await expect(repo.getVideo(rooms.coastal, live.id)).rejects.toMatchObject({
      code: "unknown_video",
    });
  });
});

describe("public profile", () => {
  it("lets a signed-in visitor watch another person's public room and playlists", async () => {
    await repo.signIn(people.avery.id);
    const profile = await repo.getPerson(people.jordan.id);
    expect(profile.self).toBe(false);
    expect(profile.person).toEqual({
      id: people.jordan.id,
      name: people.jordan.name,
      email: people.jordan.email,
    });
    expect(profile.rooms.map((room) => room.id)).toEqual([rooms.jetty]);
    expect(profile.videos.map((item) => item.id)).toEqual([videos.pier]);
    expect(textOf(profile)).not.toContain("Harbor Reviews");
    expect(textOf(profile)).not.toContain("Field Notes");
    expect(textOf(profile)).not.toContain("Unfinished mist");
    expect(textOf(profile)).not.toContain("Lane review");

    const details = await repo.getRoom(rooms.jetty);
    expect(details.role).toBe("viewer");
    expect(details.room.visibility).toBe("public");
    const playlist = await repo.getPlaylist(rooms.jetty, playlists.shore);
    expect(playlist.videoIds).toEqual([videos.pier]);
    const watch = await repo.getWatchContext(rooms.jetty, videos.pier, playlists.shore);
    expect(watch.playlist?.id).toBe(playlists.shore);
    expect(await repo.listRooms("shared")).toEqual([]);

    await expect(
      repo.updatePlaylist(rooms.jetty, playlists.shore, { title: "Taken", description: "" }),
    ).rejects.toMatchObject({ code: "forbidden" });
    await expect(repo.deleteVideo(rooms.jetty, videos.pier)).rejects.toMatchObject({
      code: "forbidden",
    });
  });

  it("hides private rooms on a profile and rejects a swapped room id", async () => {
    await repo.signIn(people.avery.id);
    const mine = await repo.getPerson(people.avery.id);
    expect(mine.self).toBe(true);
    expect(mine.person.email).toBe(people.avery.email);
    expect(mine.rooms).toEqual([]);
    expect(mine.videos).toEqual([]);
    expect(textOf(mine)).not.toContain("Field Notes");
    expect(textOf(mine)).not.toContain("Morning tide report");

    const hidden = await capture(repo.getRoom(rooms.harbor));
    expect(hidden).toMatchObject({ code: "forbidden" });
    expect(text(hidden)).not.toContain("Harbor Reviews");
    await expect(repo.listPlaylists(rooms.harbor)).rejects.toMatchObject({ code: "forbidden" });
    await expect(repo.getPlaylist(rooms.jetty, playlists.cuts)).rejects.toMatchObject({
      code: "unknown_playlist",
    });
    await expect(repo.getVideo(rooms.jetty, videos.lane)).rejects.toMatchObject({
      code: "unknown_video",
    });

    const missing = await capture(repo.getPerson("user_missing"));
    expect(missing).toMatchObject({ code: "validation" });
    expect(text(missing)).not.toContain("Jetty Walks");
    expect(text(missing)).not.toContain("Harbor Reviews");

    await repo.signOut();
    await expect(repo.getPerson(people.jordan.id)).rejects.toMatchObject({ code: "unauthenticated" });
    await expect(repo.listHomeVideos()).rejects.toMatchObject({ code: "unauthenticated" });
  });

  it("puts other people's ready public videos on the home shelf and keeps the library private", async () => {
    await repo.signIn(people.avery.id);
    const home = await repo.listHomeVideos();
    expect(home.map((item) => item.id)).toEqual([
      videos.sauce,
      videos.ridge,
      videos.color,
      videos.creek,
      videos.soft,
      videos.pier,
    ]);
    expect(home.every((item) => item.ownerId !== people.avery.id && item.status === "ready")).toBe(true);
    expect(textOf(home)).not.toContain("Morning tide report");
    expect(textOf(home)).not.toContain("Harbor Reviews");
    expect(textOf(home)).not.toContain("Unfinished mist");
    expect(textOf(home)).not.toContain("Lane review");
    expect((await repo.listOwnedVideos()).map((item) => item.id)).toEqual([
      videos.north,
      videos.retake,
      videos.dock,
      videos.tide,
    ]);
    expect(textOf(await repo.listOwnedVideos())).not.toContain("Pier loop");

    await expect(repo.signIn(people.mina.id)).rejects.toMatchObject({ code: "validation" });
    expect((await repo.listDemoPeople()).map((person) => person.id).sort()).toEqual(
      [people.avery.id, people.jordan.id].sort(),
    );

    await repo.signIn(people.jordan.id);
    expect((await repo.listHomeVideos()).map((item) => item.id)).toEqual([
      videos.sauce,
      videos.ridge,
      videos.color,
      videos.creek,
      videos.soft,
    ]);
    expect((await repo.listOwnedVideos()).map((item) => item.id)).toEqual([
      videos.mist,
      videos.pier,
      videos.lane,
    ]);
    expect(textOf(await repo.listOwnedVideos())).not.toContain("Field Notes");
  });
});

async function capture(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
    throw new Error("Expected the demo repository to reject.");
  } catch (error) {
    if (error instanceof Error && error.message === "Expected the demo repository to reject.") {
      throw error;
    }
    return error;
  }
}

function text(error: unknown): string {
  expect(error).toBeInstanceOf(DemoAccessError);
  return error instanceof Error ? error.message : "";
}

function textOf(value: unknown): string {
  return JSON.stringify(value);
}
