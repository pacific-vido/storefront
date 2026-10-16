"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getDemoRepository, getDemoVersion, subscribeDemo } from "../model/client";
import type { DemoLibrary } from "../model/repository";

export type QueryState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T; refreshing?: boolean }
  | { status: "error"; error: unknown };

export function useDemoQuery<T>(
  key: string,
  load: (repository: DemoLibrary) => Promise<T>,
): QueryState<T> {
  const version = useSyncExternalStore(subscribeDemo, getDemoVersion, () => 0);
  const loadRef = useRef(load);
  const seenKey = useRef<string | null>(null);
  const [state, setState] = useState<QueryState<T>>({ status: "loading" });

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    let active = true;
    const keyChanged = seenKey.current !== key;
    seenKey.current = key;
    setState((current) => {
      if (keyChanged || current.status !== "ready") return { status: "loading" };
      return { status: "ready", data: current.data, refreshing: true };
    });
    void loadRef.current(getDemoRepository()).then(
      (data) => {
        if (active) setState({ status: "ready", data });
      },
      (error: unknown) => {
        if (active) setState({ status: "error", error });
      },
    );
    return () => {
      active = false;
    };
  }, [key, version]);

  return state;
}
