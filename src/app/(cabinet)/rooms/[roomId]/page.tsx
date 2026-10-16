import type { Metadata } from "next";
import { RoomScreen } from "@/widgets/room-workspace";

export const metadata: Metadata = { title: "Room" };

export default function RoomPage() {
  return <RoomScreen />;
}
