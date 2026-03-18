import type { Tables } from "../lib/supabase/database.types";

export type {
  FeedResponse as ApiResponse,
  HighlightVariant,
  Video,
  VideoVariant,
} from "./video";

export interface Comment {
  id: string;
  user_id: string;
  video_id: number;
  content: string;
  created_at: string;
  public_profiles: { username: string | null } | null;
}

export type Profile = Tables<"profiles">;
