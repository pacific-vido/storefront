import type { Invitation } from "@/entities/invitation";
import { parseInviteEmail } from "@/entities/invitation";
import type { Playlist } from "@/entities/playlist";
import { parsePlaylistDescription, parsePlaylistTitle } from "@/entities/playlist";
import type { Room, RoomRole } from "@/entities/room";
import { parseRoomDescription, parseRoomTitle } from "@/entities/room";
import type { User } from "@/entities/user";
import { parseDisplayName } from "@/entities/user";
import type { UploadRequest, Video } from "@/entities/video";
import { parseUploadRequest } from "@/entities/video";
import { DemoAccessError } from "./errors";
import { createSeed, signInIds, type DemoState } from "./fixtures";

export const UPLOAD_TICK_MS = 200;

const messages = {
  unauthenticated: "Sign in to a demo person to continue.",
  unknownRoom: "This room does not exist.",
  forbidden: "You do not have access to this room.",
  unknownVideo: "This video is not in this room.",
  unknownPlaylist: "This playlist is not in this room.",
  unavailableInvite: "This invitation is not available.",
  unknownPerson: "This person does not exist.",
} as const;

export interface RoomSummary {
  id: string;
  title: string;
  description: string;
  role: RoomRole;
  videoCount: number;
  playlistCount: number;
}

export interface RoomDetails {
  room: Room;
  role: RoomRole;
}

export interface CatalogVideo {
  id: string;
  title: string;
  status: Video["status"];
  durationLabel: string;
  createdAt: string;
  errorMessage: string | null;
  roomId: string;
  roomTitle: string;
  ownerId: string;
  ownerName: string;
}

export interface PersonProfile {
  person: Pick<User, "id" | "name" | "email">;
  self: boolean;
  rooms: RoomSummary[];
  videos: CatalogVideo[];
}

export interface InvitationView {
  id: string;
  email: string;
  status: Invitation["status"];
  inviteeName: string | null;
}

export interface AccessOverview {
  owner: User;
  viewers: User[];
  invitations: InvitationView[];
}

export interface PendingInvitation {
  id: string;
  roomId: string;
  roomTitle: string;
  invitedByName: string;
}

export interface WatchContext {
  room: Pick<Room, "id" | "title" | "description">;
  role: RoomRole;
  video: Video;
  playlist: Pick<Playlist, "id" | "title"> | null;
  queue: Video[];
}

export interface DemoLibrary {
  listDemoPeople(): Promise<User[]>;
  getSession(): Promise<User | null>;
  signIn(userId: string): Promise<User>;
  signOut(): Promise<void>;
  updateDisplayName(name: string): Promise<User>;
  listRooms(scope: "owned" | "shared"): Promise<RoomSummary[]>;
  listHomeVideos(): Promise<CatalogVideo[]>;
  listOwnedVideos(): Promise<CatalogVideo[]>;
  getPerson(userId: string): Promise<PersonProfile>;
  listPendingInvitations(): Promise<PendingInvitation[]>;
  getRoom(roomId: string): Promise<RoomDetails>;
  createRoom(input: { title: string; description: string }): Promise<Room>;
  updateRoom(roomId: string, input: { title: string; description: string }): Promise<Room>;
  listVideos(roomId: string): Promise<Video[]>;
  getVideo(roomId: string, videoId: string): Promise<Video>;
  startUpload(roomId: string, input: UploadRequest): Promise<Video>;
  retryUpload(roomId: string, videoId: string): Promise<Video>;
  deleteVideo(roomId: string, videoId: string): Promise<void>;
  listPlaylists(roomId: string): Promise<Playlist[]>;
  getPlaylist(roomId: string, playlistId: string): Promise<Playlist>;
  createPlaylist(roomId: string, input: { title: string; description: string }): Promise<Playlist>;
  updatePlaylist(
    roomId: string,
    playlistId: string,
    input: { title: string; description: string },
  ): Promise<Playlist>;
  setPlaylistVideos(roomId: string, playlistId: string, videoIds: string[]): Promise<Playlist>;
  getWatchContext(roomId: string, videoId: string, playlistId?: string | null): Promise<WatchContext>;
  listAccess(roomId: string): Promise<AccessOverview>;
  inviteViewer(roomId: string, email: string): Promise<Invitation>;
  acceptInvitation(invitationId: string): Promise<Invitation>;
  revokeAccess(roomId: string, userId: string): Promise<void>;
  dispose(): void;
}

export function createDemoRepository(options?: {
  onChange?: () => void;
  seed?: DemoState;
}): DemoLibrary {
  const state = options?.seed ?? createSeed();
  const onChange = options?.onChange ?? (() => undefined);
  const jobs = new Map<string, ReturnType<typeof setInterval>>();
  const failFlags = new Map<string, boolean>();

  function notify() {
    onChange();
  }

  function requireUser(): User {
    const user = state.users.find((item) => item.id === state.sessionUserId);
    if (!user) throw new DemoAccessError("unauthenticated", messages.unauthenticated);
    return user;
  }

  function memberRole(userId: string, room: Room): RoomRole | null {
    if (room.ownerId === userId) return "owner";
    if (state.memberships.some((item) => item.roomId === room.id && item.userId === userId)) {
      return "viewer";
    }
    return null;
  }

  function roleFor(userId: string, room: Room): RoomRole | null {
    return memberRole(userId, room) ?? (room.visibility === "public" ? "viewer" : null);
  }

  function catalogVideo(video: Video): CatalogVideo | null {
    const room = state.rooms.find((item) => item.id === video.roomId);
    const owner = room ? state.users.find((item) => item.id === room.ownerId) : undefined;
    if (!room || !owner) return null;
    return {
      id: video.id,
      title: video.title,
      status: video.status,
      durationLabel: video.durationLabel,
      createdAt: video.createdAt,
      errorMessage: video.errorMessage,
      roomId: room.id,
      roomTitle: room.title,
      ownerId: owner.id,
      ownerName: owner.name,
    };
  }

  function requireRoom(roomId: string): { room: Room; role: RoomRole } {
    const user = requireUser();
    const room = state.rooms.find((item) => item.id === roomId);
    if (!room) throw new DemoAccessError("unknown_room", messages.unknownRoom);
    const role = roleFor(user.id, room);
    if (!role) throw new DemoAccessError("forbidden", messages.forbidden);
    return { room, role };
  }

  function requireOwner(roomId: string): Room {
    const { room, role } = requireRoom(roomId);
    if (role !== "owner") {
      throw new DemoAccessError("forbidden", "Only the room owner can change this room.");
    }
    return room;
  }

  function requireVideo(roomId: string, videoId: string): Video {
    requireRoom(roomId);
    const video = state.videos.find((item) => item.id === videoId && item.roomId === roomId);
    if (!video) throw new DemoAccessError("unknown_video", messages.unknownVideo);
    return video;
  }

  function requirePlaylist(roomId: string, playlistId: string): Playlist {
    requireRoom(roomId);
    const playlist = state.playlists.find((item) => item.id === playlistId && item.roomId === roomId);
    if (!playlist) throw new DemoAccessError("unknown_playlist", messages.unknownPlaylist);
    return playlist;
  }

  function replaceVideo(next: Video) {
    state.videos = state.videos.map((item) => (item.id === next.id ? next : item));
  }

  function clearJob(videoId: string) {
    const timer = jobs.get(videoId);
    if (timer !== undefined) {
      clearInterval(timer);
      jobs.delete(videoId);
    }
  }

  function stepUpload(video: Video, fail: boolean): Video {
    if (video.status === "uploading") {
      if (video.progress >= 100) {
        return { ...video, status: "processing", progress: 100, errorMessage: null };
      }
      return { ...video, progress: video.progress + 25, errorMessage: null };
    }
    if (video.status === "processing") {
      if (fail) {
        return {
          ...video,
          status: "error",
          progress: 100,
          errorMessage: "Demo processing failed. Retry to finish the simulation.",
        };
      }
      return { ...video, status: "ready", progress: 100, durationLabel: "Sample", errorMessage: null };
    }
    return video;
  }

  function schedule(videoId: string) {
    if (jobs.has(videoId)) {
      throw new DemoAccessError("invalid_state", "Upload is already running.");
    }
    const timer = setInterval(() => {
      const current = state.videos.find((item) => item.id === videoId);
      if (!current) {
        clearJob(videoId);
        return;
      }
      const next = stepUpload(current, failFlags.get(videoId) === true);
      replaceVideo(next);
      if (next.status === "ready" || next.status === "error") {
        clearJob(videoId);
        failFlags.delete(videoId);
      }
      notify();
    }, UPLOAD_TICK_MS);
    jobs.set(videoId, timer);
  }

  function ensureMembership(roomId: string, userId: string) {
    const room = state.rooms.find((item) => item.id === roomId);
    if (!room || room.ownerId === userId) return;
    const exists = state.memberships.some((item) => item.roomId === roomId && item.userId === userId);
    if (!exists) state.memberships.push({ roomId, userId });
  }

  function roomVideos(roomId: string): Video[] {
    return state.videos
      .filter((item) => item.roomId === roomId)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  const library: DemoLibrary = {
    async listDemoPeople() {
      return structuredClone(state.users.filter((user) => signInIds.has(user.id)));
    },

    async getSession() {
      const user = state.users.find((item) => item.id === state.sessionUserId);
      return user ? structuredClone(user) : null;
    },

    async signIn(userId) {
      const user = state.users.find((item) => item.id === userId);
      if (!user || !signInIds.has(user.id)) throw new DemoAccessError("validation", "Unknown demo person.");
      state.sessionUserId = user.id;
      notify();
      return structuredClone(user);
    },

    async signOut() {
      state.sessionUserId = null;
      notify();
    },

    async updateDisplayName(name) {
      const user = requireUser();
      const parsed = parseDisplayName(name);
      if (!parsed.ok) throw new DemoAccessError("validation", parsed.message);
      user.name = parsed.value;
      notify();
      return structuredClone(user);
    },

    async listRooms(scope) {
      const user = requireUser();
      const wanted: RoomRole = scope === "owned" ? "owner" : "viewer";
      return state.rooms
        .filter((room) => memberRole(user.id, room) === wanted)
        .sort((left, right) => left.title.localeCompare(right.title))
        .map((room) => ({
          id: room.id,
          title: room.title,
          description: room.description,
          role: wanted,
          videoCount: state.videos.filter((item) => item.roomId === room.id).length,
          playlistCount: state.playlists.filter((item) => item.roomId === room.id).length,
        }));
    },

    async listHomeVideos() {
      const user = requireUser();
      return state.videos
        .flatMap((item) => {
          const entry = catalogVideo(item);
          if (!entry || entry.ownerId === user.id || entry.status !== "ready") return [];
          const room = state.rooms.find((candidate) => candidate.id === item.roomId);
          if (!room || room.visibility !== "public") return [];
          return [entry];
        })
        .sort(byNewest);
    },

    async listOwnedVideos() {
      const user = requireUser();
      return state.videos
        .flatMap((item) => {
          const room = state.rooms.find((candidate) => candidate.id === item.roomId);
          if (!room || room.ownerId !== user.id) return [];
          const entry = catalogVideo(item);
          return entry ? [entry] : [];
        })
        .sort(byNewest);
    },

    async getPerson(userId) {
      const user = requireUser();
      const person = state.users.find((item) => item.id === userId);
      if (!person) throw new DemoAccessError("validation", messages.unknownPerson);
      const rooms = state.rooms
        .filter((room) => room.ownerId === person.id && room.visibility === "public")
        .sort((left, right) => left.title.localeCompare(right.title))
        .map((room) => ({
          id: room.id,
          title: room.title,
          description: room.description,
          role: roleFor(user.id, room) ?? "viewer",
          videoCount: state.videos.filter((item) => item.roomId === room.id).length,
          playlistCount: state.playlists.filter((item) => item.roomId === room.id).length,
        }));
      const videos = state.videos
        .flatMap((item) => {
          if (item.status !== "ready") return [];
          const entry = catalogVideo(item);
          if (!entry || entry.ownerId !== person.id) return [];
          const room = state.rooms.find((candidate) => candidate.id === item.roomId);
          if (!room || room.visibility !== "public") return [];
          return [entry];
        })
        .sort(byNewest);
      return {
        person: { id: person.id, name: person.name, email: person.email },
        self: person.id === user.id,
        rooms,
        videos,
      };
    },

    async listPendingInvitations() {
      const user = requireUser();
      return state.invitations
        .filter((item) => item.status === "pending" && item.email === user.email)
        .flatMap((item) => {
          const room = state.rooms.find((candidate) => candidate.id === item.roomId);
          const inviter = state.users.find((candidate) => candidate.id === item.invitedById);
          if (!room || !inviter) return [];
          return [
            {
              id: item.id,
              roomId: room.id,
              roomTitle: room.title,
              invitedByName: inviter.name,
            },
          ];
        });
    },

    async getRoom(roomId) {
      const { room, role } = requireRoom(roomId);
      return { room: structuredClone(room), role };
    },

    async createRoom(input) {
      const user = requireUser();
      const title = parseRoomTitle(input.title);
      const description = parseRoomDescription(input.description);
      if (!title.ok) throw new DemoAccessError("validation", title.message);
      if (!description.ok) throw new DemoAccessError("validation", description.message);
      const room: Room = {
        id: createId("room"),
        title: title.value,
        description: description.value,
        ownerId: user.id,
        visibility: "private",
        createdAt: new Date().toISOString(),
      };
      state.rooms.push(room);
      notify();
      return structuredClone(room);
    },

    async updateRoom(roomId, input) {
      const room = requireOwner(roomId);
      const title = parseRoomTitle(input.title);
      const description = parseRoomDescription(input.description);
      if (!title.ok) throw new DemoAccessError("validation", title.message);
      if (!description.ok) throw new DemoAccessError("validation", description.message);
      room.title = title.value;
      room.description = description.value;
      notify();
      return structuredClone(room);
    },

    async listVideos(roomId) {
      requireRoom(roomId);
      return structuredClone(roomVideos(roomId));
    },

    async getVideo(roomId, videoId) {
      return structuredClone(requireVideo(roomId, videoId));
    },

    async startUpload(roomId, input) {
      requireOwner(roomId);
      const parsed = parseUploadRequest(input);
      if (!parsed.ok) throw new DemoAccessError("validation", parsed.message);
      const video: Video = {
        id: createId("video"),
        roomId,
        title: parsed.value.title,
        status: "uploading",
        progress: 0,
        durationLabel: "—",
        createdAt: new Date().toISOString(),
        errorMessage: null,
      };
      state.videos.push(video);
      failFlags.set(video.id, parsed.value.simulateFailure);
      schedule(video.id);
      notify();
      return structuredClone(video);
    },

    async retryUpload(roomId, videoId) {
      requireOwner(roomId);
      const video = state.videos.find((item) => item.id === videoId && item.roomId === roomId);
      if (!video) throw new DemoAccessError("unknown_video", messages.unknownVideo);
      if (video.status !== "error") {
        throw new DemoAccessError("invalid_state", "Only a failed upload can be retried.");
      }
      if (jobs.has(videoId)) {
        throw new DemoAccessError("invalid_state", "Upload is already running.");
      }
      const reset: Video = { ...video, status: "uploading", progress: 0, errorMessage: null };
      replaceVideo(reset);
      failFlags.set(videoId, false);
      schedule(videoId);
      notify();
      return structuredClone(reset);
    },

    async deleteVideo(roomId, videoId) {
      requireOwner(roomId);
      const video = state.videos.find((item) => item.id === videoId && item.roomId === roomId);
      if (!video) throw new DemoAccessError("unknown_video", messages.unknownVideo);
      clearJob(videoId);
      failFlags.delete(videoId);
      state.videos = state.videos.filter((item) => item.id !== videoId);
      state.playlists = state.playlists.map((playlist) => ({
        ...playlist,
        videoIds: playlist.videoIds.filter((id) => id !== videoId),
      }));
      notify();
    },

    async listPlaylists(roomId) {
      requireRoom(roomId);
      return structuredClone(
        state.playlists
          .filter((item) => item.roomId === roomId)
          .sort((left, right) => left.title.localeCompare(right.title)),
      );
    },

    async getPlaylist(roomId, playlistId) {
      return structuredClone(requirePlaylist(roomId, playlistId));
    },

    async createPlaylist(roomId, input) {
      requireOwner(roomId);
      const title = parsePlaylistTitle(input.title);
      const description = parsePlaylistDescription(input.description);
      if (!title.ok) throw new DemoAccessError("validation", title.message);
      if (!description.ok) throw new DemoAccessError("validation", description.message);
      const playlist: Playlist = {
        id: createId("playlist"),
        roomId,
        title: title.value,
        description: description.value,
        videoIds: [],
      };
      state.playlists.push(playlist);
      notify();
      return structuredClone(playlist);
    },

    async updatePlaylist(roomId, playlistId, input) {
      const playlist = requirePlaylist(roomId, playlistId);
      requireOwner(roomId);
      const title = parsePlaylistTitle(input.title);
      const description = parsePlaylistDescription(input.description);
      if (!title.ok) throw new DemoAccessError("validation", title.message);
      if (!description.ok) throw new DemoAccessError("validation", description.message);
      playlist.title = title.value;
      playlist.description = description.value;
      notify();
      return structuredClone(playlist);
    },

    async setPlaylistVideos(roomId, playlistId, videoIds) {
      const playlist = requirePlaylist(roomId, playlistId);
      requireOwner(roomId);
      if (videoIds.length > 100) {
        throw new DemoAccessError("validation", "A playlist can hold at most 100 videos.");
      }
      if (new Set(videoIds).size !== videoIds.length) {
        throw new DemoAccessError("validation", "The video list contains duplicates.");
      }
      for (const videoId of videoIds) {
        const video = state.videos.find((item) => item.id === videoId && item.roomId === roomId);
        if (!video) throw new DemoAccessError("unknown_video", messages.unknownVideo);
      }
      playlist.videoIds = [...videoIds];
      notify();
      return structuredClone(playlist);
    },

    async getWatchContext(roomId, videoId, playlistId) {
      const { room, role } = requireRoom(roomId);
      const video = requireVideo(roomId, videoId);
      if (!playlistId) {
        return {
          room: { id: room.id, title: room.title, description: room.description },
          role,
          video: structuredClone(video),
          playlist: null,
          queue: structuredClone(roomVideos(roomId)),
        };
      }
      const playlist = requirePlaylist(roomId, playlistId);
      if (!playlist.videoIds.includes(video.id)) {
        throw new DemoAccessError("unknown_video", messages.unknownVideo);
      }
      const queue = playlist.videoIds.flatMap((id) => {
        const item = state.videos.find((candidate) => candidate.id === id && candidate.roomId === roomId);
        return item ? [structuredClone(item)] : [];
      });
      return {
        room: { id: room.id, title: room.title, description: room.description },
        role,
        video: structuredClone(video),
        playlist: { id: playlist.id, title: playlist.title },
        queue,
      };
    },

    async listAccess(roomId) {
      const room = requireOwner(roomId);
      const owner = state.users.find((item) => item.id === room.ownerId);
      if (!owner) throw new DemoAccessError("validation", "The room owner is missing.");
      const viewers = state.memberships.flatMap((membership) => {
        if (membership.roomId !== room.id) return [];
        const viewer = state.users.find((item) => item.id === membership.userId);
        return viewer ? [structuredClone(viewer)] : [];
      });
      const invitations = state.invitations
        .filter((item) => item.roomId === room.id && item.status === "pending")
        .map((item) => ({
          id: item.id,
          email: item.email,
          status: item.status,
          inviteeName: state.users.find((user) => user.email === item.email)?.name ?? null,
        }));
      return { owner: structuredClone(owner), viewers, invitations };
    },

    async inviteViewer(roomId, email) {
      const room = requireOwner(roomId);
      const user = requireUser();
      const parsed = parseInviteEmail(email);
      if (!parsed.ok) throw new DemoAccessError("validation", parsed.message);
      const owner = state.users.find((item) => item.id === room.ownerId);
      if (owner && parsed.value === owner.email) {
        throw new DemoAccessError("validation", "The owner already has access.");
      }
      const invitee = state.users.find((item) => item.email === parsed.value);
      if (
        invitee &&
        state.memberships.some((item) => item.roomId === room.id && item.userId === invitee.id)
      ) {
        throw new DemoAccessError("validation", "That person already has access.");
      }
      const pending = state.invitations.find(
        (item) => item.roomId === room.id && item.email === parsed.value && item.status === "pending",
      );
      if (pending) return structuredClone(pending);
      const invitation: Invitation = {
        id: createId("invite"),
        roomId: room.id,
        email: parsed.value,
        status: "pending",
        invitedById: user.id,
        acceptedByUserId: null,
      };
      state.invitations.push(invitation);
      notify();
      return structuredClone(invitation);
    },

    async acceptInvitation(invitationId) {
      const user = requireUser();
      const invitation = state.invitations.find((item) => item.id === invitationId);
      if (!invitation || invitation.email !== user.email || invitation.status === "revoked") {
        throw new DemoAccessError("forbidden", messages.unavailableInvite);
      }
      if (invitation.status === "pending") {
        invitation.status = "accepted";
        invitation.acceptedByUserId = user.id;
      }
      ensureMembership(invitation.roomId, user.id);
      notify();
      return structuredClone(invitation);
    },

    async revokeAccess(roomId, userId) {
      const room = requireOwner(roomId);
      if (userId === room.ownerId) {
        throw new DemoAccessError("validation", "The owner cannot be removed.");
      }
      const hadAccess = state.memberships.some((item) => item.roomId === room.id && item.userId === userId);
      if (!hadAccess) throw new DemoAccessError("validation", "That person does not have access.");
      state.memberships = state.memberships.filter(
        (item) => !(item.roomId === room.id && item.userId === userId),
      );
      for (const invitation of state.invitations) {
        if (invitation.roomId === room.id && invitation.acceptedByUserId === userId) {
          invitation.status = "revoked";
        }
      }
      notify();
    },

    dispose() {
      for (const videoId of [...jobs.keys()]) clearJob(videoId);
    },
  };

  return library;
}

function byNewest(left: { createdAt: string }, right: { createdAt: string }): number {
  return right.createdAt.localeCompare(left.createdAt);
}

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
