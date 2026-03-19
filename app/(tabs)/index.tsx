import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Skeleton } from "heroui-native";
import { Text } from "../../src/components/Text";
import { VideoList } from "../../src/components/VideoList";
import { useFeed, useFeedPlayback } from "../../src/hooks/useFeed";
import type { Video } from "../../src/types/api";
import { FONTS } from "../../src/theme/fonts";
import { RADIUS } from "../../src/theme/radius";

export default function FeedScreen() {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(true);
  const {
    activeVideoId,
    clearActiveVideo,
    handleViewableItemsChanged,
    handleViewVideo,
  } = useFeedPlayback();
  const {
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    refetch,
    videos,
  } = useFeed();

  const handleToggleMute = useCallback(() => {
    setIsMuted((currentValue) => !currentValue);
  }, []);

  const handleExpand = useCallback(
    (video: Video) => {
      clearActiveVideo();
      router.push({
        params: { id: String(video.id) },
        pathname: '/match/[id]',
      });
    },
    [clearActiveVideo, router],
  );

  const handleCommentPress = useCallback(
    (videoId: number) => {
      clearActiveVideo();
      router.push({
        params: { videoId: String(videoId) },
        pathname: '/comments/[videoId]',
      });
    },
    [clearActiveVideo, router],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background px-5 pt-2">
        {[0, 1].map((i) => (
          <View key={i} className="mb-7">
            <View className="px-1 mb-2">
              <Skeleton className="w-24 h-5 rounded-lg bg-muted/10" animation={{ shimmer: { highlightColor: 'rgba(255,255,255,0.03)' } }} />
              <Skeleton className="w-36 h-4 rounded-lg mt-1 bg-muted/10" animation={{ shimmer: { highlightColor: 'rgba(255,255,255,0.03)' } }} />
            </View>
            <Skeleton className="w-full bg-muted/10" style={{ aspectRatio: 1, borderRadius: RADIUS.sm }} animation={{ shimmer: { highlightColor: 'rgba(255,255,255,0.03)' } }} />
            <View className="flex-row items-center mt-2 px-1 gap-4">
              <Skeleton className="w-12 h-5 rounded-lg bg-muted/10" animation={{ shimmer: { highlightColor: 'rgba(255,255,255,0.03)' } }} />
              <Skeleton className="w-12 h-5 rounded-lg bg-muted/10" animation={{ shimmer: { highlightColor: 'rgba(255,255,255,0.03)' } }} />
              <View className="flex-1" />
              <Skeleton className="w-20 h-4 rounded-lg bg-muted/10" animation={{ shimmer: { highlightColor: 'rgba(255,255,255,0.03)' } }} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-foreground text-center mb-4">
          {error?.message ?? "Failed to load feed"}
        </Text>
        <Button onPress={() => refetch()}>
          <Button.Label style={FONTS.heading}>Retry</Button.Label>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <VideoList
        activeVideoId={activeVideoId}
        isMuted={isMuted}
        onCommentPress={handleCommentPress}
        onEndReached={handleEndReached}
        onExpand={handleExpand}
        onMuteToggle={handleToggleMute}
        onPress={handleViewVideo}
        onViewableItemsChanged={handleViewableItemsChanged}
        videos={videos}
      />
    </View>
  );
}
