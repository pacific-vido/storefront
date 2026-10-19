import { afterEach, describe, expect, it } from "vitest";
import { currentUser } from "@/entities/user";
import { clearLegacyDemoSession, createAppSessionSeed } from "./app-session";
import { rooms } from "./fixtures";
import { createDemoRepository } from "./repository";

describe("current mock account", () => {
  const repositories: Array<{ dispose: () => void }> = [];

  afterEach(() => {
    for (const repository of repositories) repository.dispose();
    repositories.length = 0;
  });

  it("opens as Stanislav and leaves other people's private videos off home", async () => {
    const repo = createDemoRepository({ seed: createAppSessionSeed() });
    repositories.push(repo);
    const session = await repo.getSession();
    expect(session).toMatchObject({
      id: currentUser.id,
      name: currentUser.displayName,
      email: currentUser.email,
    });

    expect((await repo.listRooms("owned")).map((room) => room.title)).toEqual([
      "Design journal",
      "Weekend projects",
    ]);
    expect((await repo.getRoom(rooms.design)).room.visibility).toBe("private");
    expect((await repo.getRoom(rooms.weekend)).room.visibility).toBe("private");

    const home = await repo.listHomeVideos();
    expect(home.map((item) => item.title)).toEqual([
      "Evening sauce",
      "Ridge line",
      "Color pass",
      "Creek crossing",
      "Soft light test",
      "Pier loop",
    ]);
    expect(home.every((item) => item.ownerId !== currentUser.id)).toBe(true);
    const serialized = JSON.stringify(home);
    expect(serialized).not.toContain("Morning tide report");
    expect(serialized).not.toContain("Lane review");
    expect(serialized).not.toContain("Unfinished mist");
    expect(serialized).not.toContain("Dock walkthrough");
  });

  it("removes a previously stored demo account key", () => {
    const store = new Map<string, string>([["pacificvido-demo-user", "user_avery"]]);
    const previous = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          removeItem(key: string) {
            store.delete(key);
          },
        },
      },
    });
    clearLegacyDemoSession();
    Object.defineProperty(globalThis, "window", { configurable: true, value: previous });
    expect(store.has("pacificvido-demo-user")).toBe(false);
  });
});
