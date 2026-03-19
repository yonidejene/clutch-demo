import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type VideoPlayer,
  type VideoPlayerStatus,
  useVideoPlayer,
} from "expo-video";
import {
  applyVideoBufferOptions,
  buildVideoSource,
  getVideoBufferOptions,
  getVideoLoadStallTimeoutMs,
  type PlaybackSurface,
} from "../lib/videoPlayback";

interface UseProgressiveVideoPlayerOptions {
  autoPlay: boolean;
  isMuted: boolean;
  loop: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  surface: PlaybackSurface;
  videoUrl: string;
}

const AUTO_RECOVERY_ATTEMPTS = 1;

// Build and manage a single Expo video player for a given video source.
export function useAppVideoPlayer({
  autoPlay,
  isMuted,
  loop,
  onTimeUpdate,
  surface,
  videoUrl,
}: UseProgressiveVideoPlayerOptions) {
  const source = useMemo(() => buildVideoSource(videoUrl), [videoUrl]);
  const bufferOptions = useMemo(
    () => getVideoBufferOptions(surface),
    [surface]
  );
  const loadStallTimeoutMs = useMemo(
    () => getVideoLoadStallTimeoutMs(surface),
    [surface]
  );
  const [hasFirstFrameRendered, setHasFirstFrameRendered] = useState(false);
  const [hasPlaybackError, setHasPlaybackError] = useState(false);
  const [isLoadStalled, setIsLoadStalled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<VideoPlayerStatus>("loading");
  const autoRecoveryCountRef = useRef(0);

  // Keep the native player settings aligned with the current hook options.
  const configurePlayer = useCallback(
    (instance: VideoPlayer) => {
      applyVideoBufferOptions(instance, bufferOptions);
      instance.loop = loop;
      instance.muted = isMuted;
      instance.timeUpdateEventInterval = onTimeUpdate ? 1 : 0;
    },
    [bufferOptions, isMuted, loop, onTimeUpdate]
  );

  const player = useVideoPlayer(source, configurePlayer);

  // Reset the UI-facing playback state before a new load or retry starts.
  const resetPlaybackState = useCallback((resetAutoRecovery = false) => {
    if (resetAutoRecovery) {
      autoRecoveryCountRef.current = 0;
    }

    setHasFirstFrameRendered(false);
    setHasPlaybackError(false);
    setIsLoadStalled(false);
    setIsPlaying(false);
    setStatus("loading");
  }, []);

  // Reload the current source and restart playback when autoplay is enabled.
  const reloadPlayer = useCallback(
    async (resetAutoRecovery = true) => {
      resetPlaybackState(resetAutoRecovery);

      try {
        await player.replaceAsync(source);
        configurePlayer(player);

        if (autoPlay) {
          player.play();
        }
      } catch {
        setHasPlaybackError(true);
      }
    },
    [autoPlay, configurePlayer, player, resetPlaybackState, source]
  );

  // Retry once automatically, then surface a clear error or stall state.
  const handlePlaybackFailure = useCallback(
    (issue: "error" | "stall") => {
      if (autoRecoveryCountRef.current < AUTO_RECOVERY_ATTEMPTS) {
        autoRecoveryCountRef.current += 1;
        void reloadPlayer(false);
        return;
      }

      setHasPlaybackError(issue === "error");
      setIsLoadStalled(issue === "stall");
    },
    [reloadPlayer]
  );

  useEffect(() => {
    resetPlaybackState(true);
  }, [resetPlaybackState, videoUrl]);

  useEffect(() => {
    configurePlayer(player);
  }, [configurePlayer, player]);

  useEffect(() => {
    if (autoPlay) {
      player.play();
      return;
    }

    player.pause();
  }, [autoPlay, player]);

  useEffect(() => {
    const playingSubscription = player.addListener(
      "playingChange",
      ({ isPlaying: nextIsPlaying }) => {
        setIsPlaying(nextIsPlaying);
      }
    );
    const sourceLoadSubscription = player.addListener(
      "sourceLoad",
      ({ duration }) => {
        onTimeUpdate?.(0, duration);
      }
    );
    const statusSubscription = player.addListener(
      "statusChange",
      ({ status: nextStatus }) => {
        setStatus(nextStatus);

        if (nextStatus === "readyToPlay") {
          setHasPlaybackError(false);
          setIsLoadStalled(false);
        }

        if (nextStatus === "error") {
          handlePlaybackFailure("error");
        }
      }
    );
    const timeSubscription = player.addListener(
      "timeUpdate",
      ({ currentTime }) => {
        onTimeUpdate?.(currentTime, player.duration);
      }
    );

    return () => {
      playingSubscription.remove();
      sourceLoadSubscription.remove();
      statusSubscription.remove();
      timeSubscription.remove();
    };
  }, [handlePlaybackFailure, onTimeUpdate, player]);

  useEffect(() => {
    if (
      !autoPlay ||
      hasFirstFrameRendered ||
      hasPlaybackError ||
      isLoadStalled
    ) {
      return;
    }

    const timeout = setTimeout(() => {
      handlePlaybackFailure("stall");
    }, loadStallTimeoutMs);

    return () => clearTimeout(timeout);
  }, [
    autoPlay,
    hasFirstFrameRendered,
    hasPlaybackError,
    handlePlaybackFailure,
    isLoadStalled,
    loadStallTimeoutMs,
  ]);

  // Mark the player as ready once the first video frame is actually visible.
  const handleFirstFrameRender = useCallback(() => {
    if (hasFirstFrameRendered) {
      return;
    }

    setHasFirstFrameRendered(true);
    setHasPlaybackError(false);
    setIsLoadStalled(false);
  }, [hasFirstFrameRendered]);

  // Let the UI trigger a full manual retry from the retry button.
  const retryLoad = useCallback(async () => {
    await reloadPlayer(true);
  }, [reloadPlayer]);

  return {
    hasPlaybackError,
    handleFirstFrameRender,
    hasFirstFrameRendered,
    isBuffering:
      !hasPlaybackError &&
      !isLoadStalled &&
      (status === "loading" || (autoPlay && !hasFirstFrameRendered)),
    isLoadStalled,
    isPlaying,
    player,
    retryLoad,
  };
}
