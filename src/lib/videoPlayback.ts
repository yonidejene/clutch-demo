import type {
  BufferOptions,
  ContentType,
  VideoPlayer,
  VideoSource,
} from "expo-video";
import { Platform } from "react-native";

export type PlaybackSurface = "feed" | "match";

// Feed clips start quickly, so we keep a modest forward buffer.
const FEED_BUFFER_OPTIONS: BufferOptions = {
  maxBufferBytes: 0,
  minBufferForPlayback: 2,
  preferredForwardBufferDuration: 15,
  prioritizeTimeOverSizeThreshold: true,
  waitsToMinimizeStalling: true,
};

// Matches are longer-form playback, so we allow a steadier buffer profile.
const MATCH_BUFFER_OPTIONS: BufferOptions = Platform.select({
  android: {
    maxBufferBytes: 0,
    minBufferForPlayback: 2,
    preferredForwardBufferDuration: 8,
    prioritizeTimeOverSizeThreshold: true,
    waitsToMinimizeStalling: true,
  },
  default: {
    // Let iOS manage long-form match buffering automatically instead of forcing
    // the same aggressive forward buffer profile we use in the feed.
    preferredForwardBufferDuration: 0,
    waitsToMinimizeStalling: true,
  },
});

function isMp4VideoUrl(videoUrl: string) {
  return /\.mp4($|[?#])/i.test(videoUrl);
}

export function buildVideoSource(videoUrl: string): VideoSource {
  const isMp4Video = isMp4VideoUrl(videoUrl);
  const contentType: ContentType = isMp4Video ? "progressive" : "auto";

  return {
    contentType,
    uri: videoUrl,
    useCaching: isMp4Video,
  };
}

export function getVideoBufferOptions(surface: PlaybackSurface) {
  return surface === "match" ? MATCH_BUFFER_OPTIONS : FEED_BUFFER_OPTIONS;
}

export function getVideoLoadStallTimeoutMs(surface: PlaybackSurface) {
  return surface === "match" ? 30000 : 20000;
}

export function applyVideoBufferOptions(
  player: VideoPlayer,
  bufferOptions: BufferOptions
) {
  try {
    player.bufferOptions = bufferOptions;
  } catch {
    // `bufferOptions` is not supported on every platform.
  }
}
