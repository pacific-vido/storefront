import type { ReactNode } from "react";
import { CabinetShell } from "@/widgets/app-shell";

export default function CabinetLayout({ children }: { children: ReactNode }) {
  return <CabinetShell>{children}</CabinetShell>;
}
