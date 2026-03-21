import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  type LayoutChangeEvent,
  Pressable,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Skeleton, useThemeColor } from "heroui-native";
import type { Video, HighlightVariant } from "../types/api";
import { Text } from "./Text";
import { VideoPlayer } from "./VideoPlayer";
import { useLikes } from "../hooks/useLikes";
import { useComments } from "../hooks/useComments";
import { OVERLAY } from "../theme/overlay";
import { RADIUS } from "../theme/radius";
import { formatDuration } from "../lib/formatDuration";
import { getRelativeTime, getVenue } from "../data/venues";

const LANDSCAPE_HEIGHT_RATIO = 0.58;
const LANDSCAPE_WIDTH_RATIO = 1.0;
const PORTRAIT_HEIGHT_RATIO = 1.0;
const PORTRAIT_WIDTH_RATIO = 0.72;
const TIMING_CONFIG = { duration: 300, easing: Easing.inOut(Easing.ease) };

export interface VideoCardProps {
  isActive: boolean;
  isMuted: boolean;
  item: Video;
  onCommentPress: (videoId: number) => void;
  onExpand: (item: Video) => void;
  onMuteToggle: () => void;
  onPress: (id: number) => void;
}

function VideoCardInner({
  isActive,
  isMuted,
  item,
  onCommentPress,
  onExpand,
  onMuteToggle,
  onPress,
}: VideoCardProps) {
  const videoId = item.id;
  const [imgError, setImgError] = useState(false);
  const [localVariant, setLocalVariant] =
    useState<HighlightVariant>("clutch_autopan");
  const [containerSize, setContainerSize] = useState(0);
  const [playbackTime, setPlaybackTime] = useState({ current: 0, duration: 0 });
  const {
    likeCount,
    isCountLoading: isLikesLoading,
    hasLiked,
    toggleLike,
  } = useLikes(item.id);
  const { commentCount, isCountLoading: isCommentsLoading } = useComments(
    item.id
  );
  const accentColor = useThemeColor("accent");

  const isLandscape = localVariant === "clutch_landscape";
  const relativeTime = getRelativeTime(videoId);
  const thumbnailUrl =
    item.highlight_urls.highlight_thumbnail_urls[localVariant];
  const venue = getVenue(videoId);
  const videoUrl = item.highlight_urls.highlight_video_urls[localVariant];
  const shouldRenderActivePlayer = Boolean(videoUrl) && isActive;

  const widthPercent = useSharedValue(PORTRAIT_WIDTH_RATIO);
  const heightPercent = useSharedValue(PORTRAIT_HEIGHT_RATIO);
  const innerAnimatedStyle = useAnimatedStyle(() => ({
    width: containerSize * widthPercent.value,
    height: containerSize * heightPercent.value,
    borderRadius: RADIUS.sm,
    overflow: "hidden" as const,
  }));

  const handleContainerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;

      if (width > 0 && width !== containerSize) {
        setContainerSize(width);
      }
    },
    [containerSize]
  );

  const handleToggleVariant = useCallback(() => {
    setLocalVariant((currentVariant) => {
      const nextVariant =
        currentVariant === "clutch_autopan"
          ? "clutch_landscape"
          : "clutch_autopan";
      const [nextWidth, nextHeight] =
        nextVariant === "clutch_landscape"
          ? [LANDSCAPE_WIDTH_RATIO, LANDSCAPE_HEIGHT_RATIO]
          : [PORTRAIT_WIDTH_RATIO, PORTRAIT_HEIGHT_RATIO];

      widthPercent.value = withTiming(nextWidth, TIMING_CONFIG);
      heightPercent.value = withTiming(nextHeight, TIMING_CONFIG);

      return nextVariant;
    });
  }, [heightPercent, widthPercent]);

  const handleToggleLike = useCallback(() => {
    toggleLike();
  }, [toggleLike]);

  const handleViewVideo = useCallback(() => {
    if (!isActive) {
      onPress(videoId);
    }
  }, [isActive, onPress, videoId]);

  const handleTimeUpdate = useCallback((current: number, duration: number) => {
    setPlaybackTime({ current, duration });
  }, []);

  useEffect(() => {
    setImgError(false);
  }, [thumbnailUrl]);

  useEffect(() => {
    setPlaybackTime({ current: 0, duration: 0 });
  }, [videoUrl]);

  return (
    <View className="mb-10 mx-5">
      {/* Header */}
      <View className="px-1 mb-2">
        <Text
          variant="heading"
          style={{ fontSize: 18, lineHeight: 22 }}
          className="text-foreground"
        >
          {venue.name}
        </Text>
        <View className="flex-row items-baseline">
          <Text style={{ fontSize: 14 }} className="text-muted">
            {venue.city}, {venue.region} · {relativeTime} ·{" "}
          </Text>
          <Pressable
            onPress={() => onExpand(item)}
            className="flex-row items-baseline gap-0.5"
            hitSlop={10}
          >
            <Text
              style={{ fontSize: 14, fontWeight: "600", color: accentColor }}
            >
              Full match
            </Text>
            <Text style={{ fontSize: 14, color: accentColor }}>›</Text>
          </Pressable>
        </View>
      </View>

      <Pressable onPress={isActive ? undefined : handleViewVideo}>
        <View
          className="w-full overflow-hidden"
          style={{ aspectRatio: 1, borderRadius: RADIUS.sm }}
          onLayout={handleContainerLayout}
        >
          {thumbnailUrl && !imgError ? (
            <Image
              blurRadius={50}
              onError={() => setImgError(true)}
              resizeMode="cover"
              source={{ uri: thumbnailUrl }}
              style={{ height: "100%", position: "absolute", width: "100%" }}
            />
          ) : (
            <View className="absolute inset-0 bg-default-200" />
          )}

          <View
            className="absolute inset-0"
            style={{ backgroundColor: OVERLAY.tint }}
          />

          {containerSize > 0 && (
            <View className="absolute inset-0 items-center justify-center">
              <Animated.View style={innerAnimatedStyle}>
                {thumbnailUrl && !imgError ? (
                  <Image
                    resizeMode="cover"
                    source={{ uri: thumbnailUrl }}
                    style={{ height: "100%", width: "100%" }}
                  />
                ) : (
                  <View className="flex-1 items-center justify-center bg-default-200">
                    <Text className="text-muted text-sm">No preview</Text>
                  </View>
                )}

                {shouldRenderActivePlayer ? (
                  <View className="absolute inset-0">
                    <VideoPlayer
                      isMuted={isMuted}
                      onTimeUpdate={isActive ? handleTimeUpdate : undefined}
                      shouldPlay={isActive}
                      videoUrl={videoUrl}
                    />
                  </View>
                ) : null}
              </Animated.View>
            </View>
          )}

          {!isActive && (
            <View
              className="absolute inset-0 items-center justify-center"
              pointerEvents="none"
            >
              <View
                className="w-14 h-14 rounded-full items-center justify-center"
                style={{ backgroundColor: OVERLAY.highlight }}
              >
                <Ionicons
                  color={OVERLAY.fg}
                  name="play"
                  size={24}
                  style={{ marginLeft: 2 }}
                />
              </View>
            </View>
          )}

          {isActive && (
            <Pressable
              className="absolute top-3 right-3 w-11 h-11 rounded-full items-center justify-center"
              hitSlop={8}
              onPress={onMuteToggle}
              style={{ backgroundColor: OVERLAY.bg }}
            >
              <Ionicons
                color={OVERLAY.fg}
                name={isMuted ? "volume-mute" : "volume-high"}
                size={20}
              />
            </Pressable>
          )}

          {isActive && playbackTime.duration > 0 && (
            <View
              className="absolute bottom-3 left-3 rounded-full px-2 py-1"
              style={{ backgroundColor: OVERLAY.bgHeavy }}
            >
              <Text className="text-white text-sm font-medium">
                {formatDuration(playbackTime.duration - playbackTime.current)}
              </Text>
            </View>
          )}

          {isActive && (
            <View
              className="absolute bottom-3 right-3 flex-row rounded-full overflow-hidden"
              style={{ backgroundColor: OVERLAY.bgHeavy }}
            >
              <Pressable
                className="px-2.5 py-1.5"
                hitSlop={4}
                onPress={isLandscape ? handleToggleVariant : undefined}
                style={
                  !isLandscape
                    ? { backgroundColor: OVERLAY.highlight }
                    : undefined
                }
              >
                <Ionicons
                  color={OVERLAY.fg}
                  name="phone-portrait-outline"
                  size={16}
                />
              </Pressable>
              <Pressable
                className="px-2.5 py-1.5"
                hitSlop={4}
                onPress={!isLandscape ? handleToggleVariant : undefined}
                style={
                  isLandscape
                    ? { backgroundColor: OVERLAY.highlight }
                    : undefined
                }
              >
                <Ionicons
                  color={OVERLAY.fg}
                  name="phone-landscape-outline"
                  size={16}
                />
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>

      <View className="flex-row items-center mt-2 px-1">
        <Pressable className="flex-row items-center" hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }} onPress={handleToggleLike}>
          <Ionicons
            name={hasLiked ? "heart" : "heart-outline"}
            size={22}
            color={accentColor}
          />
          <Skeleton
            isLoading={isLikesLoading}
            className="w-6 h-5 rounded bg-muted/10 ml-1"
            animation={{
              shimmer: { highlightColor: "rgba(255,255,255,0.03)" },
            }}
          >
            <Text variant="heading" className="text-accent text-base ml-1">
              {likeCount}
            </Text>
          </Skeleton>
        </Pressable>
        <Pressable
          onPress={() => onCommentPress(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          className="flex-row items-center ml-4"
        >
          <Ionicons name="chatbubble-outline" size={20} color={accentColor} />
          <Skeleton
            isLoading={isCommentsLoading}
            className="w-6 h-5 rounded bg-muted/10 ml-1"
            animation={{
              shimmer: { highlightColor: "rgba(255,255,255,0.03)" },
            }}
          >
            <Text variant="heading" className="text-accent text-base ml-1">
              {commentCount}
            </Text>
          </Skeleton>
        </Pressable>
      </View>
    </View>
  );
}

export const VideoCard = React.memo(VideoCardInner);
