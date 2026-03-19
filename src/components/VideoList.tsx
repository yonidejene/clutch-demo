import React, { useCallback } from "react";
import {
  FlatList,
  type ViewToken,
  type ViewabilityConfig,
  View,
} from "react-native";
import type { Video } from "../types/api";
import { Text } from "./Text";
import { VideoCard } from "./VideoCard";

const VIEWABILITY_CONFIG: ViewabilityConfig = {
  itemVisiblePercentThreshold: 70,
};

interface FeedViewabilityInfo {
  changed: ViewToken<Video>[];
  viewableItems: ViewToken<Video>[];
}

interface VideoListProps {
  activeVideoId: number | null;
  isMuted: boolean;
  onCommentPress: (videoId: number) => void;
  onEndReached: () => void;
  onExpand: (item: Video) => void;
  onMuteToggle: () => void;
  onPress: (id: number) => void;
  onViewableItemsChanged: (info: FeedViewabilityInfo) => void;
  videos: Video[];
}

export function VideoList({
  activeVideoId,
  isMuted,
  onCommentPress,
  onEndReached,
  onExpand,
  onMuteToggle,
  onPress,
  onViewableItemsChanged,
  videos,
}: VideoListProps) {
  const keyExtractor = useCallback((item: Video) => String(item.id), []);

  const renderItem = useCallback(
    ({ item }: { item: Video }) => (
      <VideoCard
        isActive={item.id === activeVideoId}
        isMuted={isMuted}
        item={item}
        onCommentPress={onCommentPress}
        onExpand={onExpand}
        onMuteToggle={onMuteToggle}
        onPress={onPress}
      />
    ),
    [
      activeVideoId,
      isMuted,
      onCommentPress,
      onExpand,
      onMuteToggle,
      onPress,
    ],
  );

  return (
    <View className="flex-1">
      <FlatList
        contentContainerStyle={{ paddingTop: 32, paddingBottom: 24 }}
        data={videos}
        extraData={{ activeVideoId, isMuted }}
        initialNumToRender={3}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center px-6">
            <Text className="text-muted text-center">
              No videos yet
            </Text>
          </View>
        }
        maxToRenderPerBatch={3}
        onViewableItemsChanged={onViewableItemsChanged}
        removeClippedSubviews
        viewabilityConfig={VIEWABILITY_CONFIG}
        windowSize={3}
      />
    </View>
  );
}
