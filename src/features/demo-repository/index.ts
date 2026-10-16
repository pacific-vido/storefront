"use client";

export { demoErrorMessage, DemoAccessError } from "./model/errors";
export { getDemoRepository } from "./model/client";
export { useDemoQuery } from "./lib/use-demo-query";
export type { QueryState } from "./lib/use-demo-query";
export type {
  AccessOverview,
  CatalogVideo,
  PendingInvitation,
  PersonProfile,
  RoomDetails,
  RoomSummary,
  WatchContext,
} from "./model/repository";
export { DemoErrorState } from "./ui/demo-error";
