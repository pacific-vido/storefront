"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { RoomFormDialog } from "@/features/create-room";
import { demoErrorMessage, getDemoRepository } from "@/features/demo-repository";

export function CreateRoomHost() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const open = params.get("create") === "room";
  const created = useRef(false);

  function close() {
    if (created.current) {
      created.current = false;
      return;
    }
    const next = new URLSearchParams(params.toString());
    next.delete("create");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <RoomFormDialog
      open={open}
      mode="create"
      initialTitle=""
      initialDescription=""
      onClose={close}
      onSubmit={async (input) => {
        try {
          const room = await getDemoRepository().createRoom(input);
          created.current = true;
          router.push(`/rooms/${room.id}`);
          return null;
        } catch (error) {
          return demoErrorMessage(error);
        }
      }}
    />
  );
}
