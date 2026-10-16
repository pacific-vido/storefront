import type { Invitation } from "@/entities/invitation";
import type { Playlist } from "@/entities/playlist";
import type { Room } from "@/entities/room";
import type { User } from "@/entities/user";
import type { Video } from "@/entities/video";

export interface Membership {
  roomId: string;
  userId: string;
}

export interface DemoState {
  users: User[];
  sessionUserId: string | null;
  rooms: Room[];
  videos: Video[];
  playlists: Playlist[];
  invitations: Invitation[];
  memberships: Membership[];
}

export const people = {
  avery: {
    id: "user_avery",
    name: "Avery Chen",
    email: "avery.chen@example.com",
  },
  jordan: {
    id: "user_jordan",
    name: "Jordan Hale",
    email: "jordan.hale@example.com",
  },
  mina: {
    id: "user_mina",
    name: "Mina Okada",
    email: "mina.okada@example.com",
  },
  luis: {
    id: "user_luis",
    name: "Luis Ortega",
    email: "luis.ortega@example.com",
  },
  samira: {
    id: "user_samira",
    name: "Samira Nouri",
    email: "samira.nouri@example.com",
  },
} as const;

export const signInIds = new Set<string>([people.avery.id, people.jordan.id]);

export const rooms = {
  coastal: "room_coastal",
  field: "room_field",
  harbor: "room_harbor",
  jetty: "room_jetty",
  studio: "room_studio",
  ridge: "room_ridge",
  kitchen: "room_kitchen",
} as const;

export const videos = {
  tide: "video_tide",
  dock: "video_dock",
  retake: "video_retake",
  north: "video_north",
  lane: "video_lane",
  pier: "video_pier",
  mist: "video_mist",
  color: "video_color",
  soft: "video_soft",
  ridge: "video_ridge",
  creek: "video_creek",
  sauce: "video_sauce",
} as const;

export const playlists = {
  week: "playlist_week",
  routes: "playlist_routes",
  cuts: "playlist_cuts",
  shore: "playlist_shore",
  light: "playlist_light",
  trail: "playlist_trail",
  sauce: "playlist_sauce",
} as const;

export const invitations = {
  coastalJordan: "inv_coastal_jordan",
  fieldJordan: "inv_field_jordan",
  harborAvery: "inv_harbor_avery",
} as const;

export function createSeed(): DemoState {
  return {
    users: [
      { ...people.avery },
      { ...people.jordan },
      { ...people.mina },
      { ...people.luis },
      { ...people.samira },
    ],
    sessionUserId: null,
    rooms: [
      {
        id: rooms.coastal,
        title: "Coastal Briefings",
        description: "Fictional walkthroughs for a product team that shares one private room.",
        ownerId: people.avery.id,
        visibility: "private",
        createdAt: "2026-01-01T15:00:00.000Z",
      },
      {
        id: rooms.field,
        title: "Field Notes",
        description: "Private research clips that stay with the room owner until someone is invited.",
        ownerId: people.avery.id,
        visibility: "private",
        createdAt: "2026-02-01T15:00:00.000Z",
      },
      {
        id: rooms.harbor,
        title: "Harbor Reviews",
        description: "Review cuts owned by another person. Access starts only after an invite is accepted.",
        ownerId: people.jordan.id,
        visibility: "private",
        createdAt: "2026-03-01T15:00:00.000Z",
      },
      {
        id: rooms.jetty,
        title: "Jetty Walks",
        description: "A public room. Anyone signed in can watch the playlists.",
        ownerId: people.jordan.id,
        visibility: "public",
        createdAt: "2026-04-01T15:00:00.000Z",
      },
      {
        id: rooms.studio,
        title: "Studio Reels",
        description: "Public lighting tests from Mina’s fictional studio.",
        ownerId: people.mina.id,
        visibility: "public",
        createdAt: "2026-05-01T15:00:00.000Z",
      },
      {
        id: rooms.ridge,
        title: "Trail Cuts",
        description: "Public trail clips Luis shares with anyone who is signed in.",
        ownerId: people.luis.id,
        visibility: "public",
        createdAt: "2026-05-02T15:00:00.000Z",
      },
      {
        id: rooms.kitchen,
        title: "Kitchen Notes",
        description: "A public cooking clip from Samira.",
        ownerId: people.samira.id,
        visibility: "public",
        createdAt: "2026-05-03T15:00:00.000Z",
      },
    ],
    videos: [
      video(videos.tide, rooms.coastal, "Morning tide report", "ready", "08:12", "2026-01-02T15:00:00.000Z"),
      video(videos.dock, rooms.coastal, "Dock walkthrough", "ready", "05:40", "2026-01-03T15:00:00.000Z"),
      video(videos.retake, rooms.coastal, "Failed retake", "error", "—", "2026-01-04T15:00:00.000Z"),
      video(videos.north, rooms.field, "North trail notes", "ready", "11:03", "2026-02-02T15:00:00.000Z"),
      video(videos.lane, rooms.harbor, "Lane review", "ready", "06:18", "2026-03-02T15:00:00.000Z"),
      video(videos.pier, rooms.jetty, "Pier loop", "ready", "04:05", "2026-04-02T15:00:00.000Z"),
      video(videos.mist, rooms.jetty, "Unfinished mist", "processing", "—", "2026-04-03T15:00:00.000Z"),
      video(videos.soft, rooms.studio, "Soft light test", "ready", "03:20", "2026-05-04T15:00:00.000Z"),
      video(videos.creek, rooms.ridge, "Creek crossing", "ready", "07:05", "2026-05-12T15:00:00.000Z"),
      video(videos.color, rooms.studio, "Color pass", "ready", "04:48", "2026-05-20T15:00:00.000Z"),
      video(videos.ridge, rooms.ridge, "Ridge line", "ready", "09:11", "2026-06-01T15:00:00.000Z"),
      video(videos.sauce, rooms.kitchen, "Evening sauce", "ready", "06:02", "2026-06-02T15:00:00.000Z"),
    ],
    playlists: [
      {
        id: playlists.week,
        roomId: rooms.coastal,
        title: "Week one",
        description: "Ordered cuts for the first briefing.",
        videoIds: [videos.tide, videos.dock],
      },
      {
        id: playlists.routes,
        roomId: rooms.field,
        title: "Routes",
        description: "A single private clip.",
        videoIds: [videos.north],
      },
      {
        id: playlists.cuts,
        roomId: rooms.harbor,
        title: "Cuts",
        description: "Harbor review order.",
        videoIds: [videos.lane],
      },
      {
        id: playlists.shore,
        roomId: rooms.jetty,
        title: "Shore order",
        description: "The public walk along the jetty.",
        videoIds: [videos.pier],
      },
      {
        id: playlists.light,
        roomId: rooms.studio,
        title: "Light order",
        description: "Mina’s public lighting sequence.",
        videoIds: [videos.soft, videos.color],
      },
      {
        id: playlists.trail,
        roomId: rooms.ridge,
        title: "Trail order",
        description: "Luis’s public trail sequence.",
        videoIds: [videos.creek, videos.ridge],
      },
      {
        id: playlists.sauce,
        roomId: rooms.kitchen,
        title: "Sauce order",
        description: "Samira’s public kitchen clip.",
        videoIds: [videos.sauce],
      },
    ],
    invitations: [
      {
        id: invitations.coastalJordan,
        roomId: rooms.coastal,
        email: people.jordan.email,
        status: "accepted",
        invitedById: people.avery.id,
        acceptedByUserId: people.jordan.id,
      },
      {
        id: invitations.fieldJordan,
        roomId: rooms.field,
        email: people.jordan.email,
        status: "pending",
        invitedById: people.avery.id,
        acceptedByUserId: null,
      },
      {
        id: invitations.harborAvery,
        roomId: rooms.harbor,
        email: people.avery.email,
        status: "pending",
        invitedById: people.jordan.id,
        acceptedByUserId: null,
      },
    ],
    memberships: [{ roomId: rooms.coastal, userId: people.jordan.id }],
  };
}

function video(
  id: string,
  roomId: string,
  title: string,
  status: Video["status"],
  durationLabel: string,
  createdAt: string,
): Video {
  return {
    id,
    roomId,
    title,
    status,
    progress: status === "ready" || status === "error" ? 100 : 0,
    durationLabel,
    createdAt,
    errorMessage: status === "error" ? "Demo processing failed. Retry to finish the simulation." : null,
  };
}
