import type { ParseResult } from "@/shared";

export type InvitationStatus = "pending" | "accepted" | "revoked";

export interface Invitation {
  id: string;
  roomId: string;
  email: string;
  status: InvitationStatus;
  invitedById: string;
  acceptedByUserId: string | null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseInviteEmail(value: string): ParseResult<string> {
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 120 || !EMAIL.test(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }
  return { ok: true, value: email };
}
