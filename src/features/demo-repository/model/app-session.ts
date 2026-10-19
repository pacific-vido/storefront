import { currentUser } from "@/entities/user";
import { createSeed, type DemoState } from "./fixtures";

const legacyDemoKeys = [
  "pacificvido.demoUser",
  "pacificvido-demo-user",
  "pacific-vido-user",
  "demo-user-id",
  "demoPersonId",
  "pacificvido-session",
];

export function clearLegacyDemoSession(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of legacyDemoKeys) window.localStorage.removeItem(key);
  } catch {
    // Private mode can block storage. The session does not read those keys.
  }
}

export function createAppSessionSeed(): DemoState {
  const state = createSeed();
  const user = state.users.find((item) => item.id === currentUser.id);
  if (!user) throw new Error("Current user is missing from the mock seed.");
  state.sessionUserId = user.id;
  return state;
}
