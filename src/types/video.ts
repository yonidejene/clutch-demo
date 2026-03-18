export type HighlightVariant = "clutch_autopan" | "clutch_landscape";

export type VideoVariant = HighlightVariant | "match_wo_breaks";

export interface Video {
  id: number;
  highlight_urls: {
    highlight_thumbnail_urls: Record<VideoVariant, string>;
    highlight_video_urls: Record<VideoVariant, string>;
  };
}

export interface FeedResponse {
  data: Video[];
  pagination: {
    has_next: boolean;
    has_prev: boolean;
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}
