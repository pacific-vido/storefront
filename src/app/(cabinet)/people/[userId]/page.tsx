import type { Metadata } from "next";
import { PersonScreen } from "@/widgets/person-profile";

export const metadata: Metadata = { title: "Profile" };

export default function PersonPage() {
  return <PersonScreen />;
}
