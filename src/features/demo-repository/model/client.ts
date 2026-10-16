import { createDemoRepository, type DemoLibrary } from "./repository";

let singleton: DemoLibrary | null = null;
let version = 0;
const listeners = new Set<() => void>();

export function getDemoRepository(): DemoLibrary {
  if (!singleton) {
    singleton = createDemoRepository({
      onChange() {
        version += 1;
        for (const listener of listeners) listener();
      },
    });
  }
  return singleton;
}

export function subscribeDemo(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDemoVersion(): number {
  return version;
}
