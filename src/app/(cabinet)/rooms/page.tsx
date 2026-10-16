import type { Metadata } from "next";
import { RoomsScreen } from "@/widgets/rooms-board";

export const metadata: Metadata = { title: "Library" };

export default function RoomsPage() {
  return <RoomsScreen />;
}
