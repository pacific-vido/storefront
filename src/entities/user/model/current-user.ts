/**
 * The only account the mock app signs in automatically.
 * Public video authors stay in the catalog and are not accounts.
 */
export const currentUser = {
  id: "user_stanislav",
  displayName: "Stanislav",
  email: "stanislav@example.com",
} as const;

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
