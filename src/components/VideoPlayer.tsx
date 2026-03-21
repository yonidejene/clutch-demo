import React, { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  View,
} from "react-native";
import { VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./Text";
import { useAppVideoPlayer } from "../hooks/useAppVideoPlayer";
import { OVERLAY } from "../theme/overlay";
import { RADIUS } from "../theme/radius";

interface VideoPlayerProps {
  isMuted: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  shouldPlay: boolean;
  videoUrl: string;
}

export function VideoPlayer({
  isMuted,
  onTimeUpdate,
  shouldPlay,
  videoUrl,
}: VideoPlayerProps) {
  const {
    hasPlaybackError,
    handleFirstFrameRender,
    hasFirstFrameRendered,
    isBuffering,
    isLoadStalled,
    isPlaying,
    player,
    retryLoad,
  } = useAppVideoPlayer({
    autoPlay: shouldPlay,
    isMuted,
    loop: true,
    onTimeUpdate,
    surface: "feed",
    videoUrl,
  });
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFadeTimer = useCallback(() => {
    if (fadeTimer.current) {
      clearTimeout(fadeTimer.current);
      fadeTimer.current = null;
    }
  }, []);

  const showOverlay = useCallback(() => {
    clearFadeTimer();

    overlayOpacity.setValue(1);

    fadeTimer.current = setTimeout(() => {
      Animated.timing(overlayOpacity, {
        duration: 300,
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }, 2000);
  }, [clearFadeTimer, overlayOpacity]);

  useEffect(() => {
    if (!shouldPlay || !hasFirstFrameRendered) {
      clearFadeTimer();
      overlayOpacity.setValue(0);
      return;
    }

    if (isPlaying) {
      showOverlay();
      return;
    }

    clearFadeTimer();
    overlayOpacity.setValue(1);
  }, [
    clearFadeTimer,
    hasFirstFrameRendered,
    isPlaying,
    overlayOpacity,
    shouldPlay,
    showOverlay,
  ]);

  useEffect(
    () => () => {
      clearFadeTimer();
    },
    [clearFadeTimer]
  );

  const handleTogglePlayback = useCallback(() => {
    if (!shouldPlay || isBuffering || isLoadStalled || hasPlaybackError) {
      return;
    }

    if (player.playing) {
      player.pause();
      clearFadeTimer();
      overlayOpacity.setValue(1);
      return;
    }

    player.play();
    showOverlay();
  }, [
    clearFadeTimer,
    isBuffering,
    hasPlaybackError,
    isLoadStalled,
    overlayOpacity,
    player,
    shouldPlay,
    showOverlay,
  ]);

  const handleRetry = useCallback(() => {
    void retryLoad();
  }, [retryLoad]);

  const showRetryState = isLoadStalled || hasPlaybackError;
  const shouldShowLoader = shouldPlay && !showRetryState && isBuffering;
  const shouldShowControls = shouldPlay && !shouldShowLoader && !showRetryState;

  return (
    <View
      className="w-full h-full overflow-hidden"
      style={{ borderRadius: RADIUS.sm, backgroundColor: "transparent" }}
    >
      <VideoView
        contentFit="cover"
        nativeControls={false}
        onFirstFrameRender={handleFirstFrameRender}
        player={player}
        style={{
          height: "100%",
          opacity:
            shouldPlay && hasFirstFrameRendered && !showRetryState ? 1 : 0,
          width: "100%",
        }}
      />

      {shouldShowLoader && (
        <View
          className="absolute inset-0 items-center justify-center"
          pointerEvents="none"
        >
          <View
            className="w-14 h-14 rounded-full items-center justify-center"
            style={{ backgroundColor: OVERLAY.bgHeavy }}
          >
            <ActivityIndicator color={OVERLAY.fg} size="small" />
          </View>
        </View>
      )}

      {showRetryState ? (
        <View className="absolute inset-0 items-center justify-center px-6">
          <View
            className="items-center rounded-2xl px-4 py-4"
            style={{ backgroundColor: OVERLAY.bgHeavy }}
          >
            <Text className="text-white text-center text-sm font-medium">
              Video is taking longer than expected.
            </Text>
            <Pressable
              className="mt-3 rounded-full px-4 py-2"
              hitSlop={8}
              onPress={handleRetry}
              style={{ backgroundColor: OVERLAY.highlight }}
            >
              <Text className="text-white text-sm font-semibold">Retry</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {shouldShowControls ? (
        <Pressable
          className="absolute inset-0 items-center justify-center"
          onPress={handleTogglePlayback}
        >
          <Animated.View
            pointerEvents="none"
            style={{ opacity: overlayOpacity }}
          >
            <View
              className="w-14 h-14 rounded-full items-center justify-center"
              style={{ backgroundColor: OVERLAY.highlight }}
            >
              <Ionicons
                color={OVERLAY.fg}
                name={isPlaying ? "pause" : "play"}
                size={24}
                style={isPlaying ? undefined : { marginLeft: 2 }}
              />
            </View>
          </Animated.View>
        </Pressable>
      ) : null}
    </View>
  );
}
