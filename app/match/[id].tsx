import React, { useCallback } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";
import { Separator, Spinner, useThemeColor } from "heroui-native";
import { CommentInput } from "../../src/components/CommentInput";
import { CommentItem } from "../../src/components/CommentItem";
import { Text } from "../../src/components/Text";
import { VideoPoster } from "../../src/components/VideoPoster";
import { useAuth } from "../../src/context/AuthContext";
import { getVenue } from "../../src/data/venues";
import { useComments } from "../../src/hooks/useComments";
import { useMatchVideoQuery } from "../../src/hooks/useFeed";
import { useLikes } from "../../src/hooks/useLikes";
import { useAppVideoPlayer } from "../../src/hooks/useAppVideoPlayer";
import { OVERLAY } from "../../src/theme/overlay";
import type { Comment } from "../../src/types/api";

export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const videoId = Number(id);

  if (Number.isNaN(videoId)) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-foreground text-center">Invalid match id</Text>
      </View>
    );
  }

  return <MatchScreenContent videoId={videoId} />;
}

function MatchScreenContent({ videoId }: { videoId: number }) {
  const matchQuery = useMatchVideoQuery(videoId);
  const venue = getVenue(videoId);

  if (matchQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Spinner size="lg" />
      </View>
    );
  }

  if (matchQuery.error || !matchQuery.data) {
    return (
      <View className="flex-1 justify-center items-center bg-background px-6">
        <Text className="text-foreground text-center">
          {matchQuery.error?.message ?? "No match URL available"}
        </Text>
      </View>
    );
  }

  const matchUrl =
    matchQuery.data.highlight_urls.highlight_video_urls.match_wo_breaks;
  const posterUrl =
    matchQuery.data.highlight_urls.highlight_thumbnail_urls.match_wo_breaks;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 96 : 0}
      style={{ flex: 1 }}
    >
      <View className="flex-1 bg-background">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-3">
            <VenueAndSocial venue={venue} videoId={videoId} />
            <MatchVideo matchUrl={matchUrl} posterUrl={posterUrl} />
            <Separator />
            <CommentList videoId={videoId} />
          </View>
        </ScrollView>
        <CommentInput videoId={videoId} />
      </View>
    </KeyboardAvoidingView>
  );
}

function MatchVideo({
  matchUrl,
  posterUrl,
}: {
  matchUrl: string;
  posterUrl?: string;
}) {
  const {
    hasPlaybackError,
    handleFirstFrameRender,
    hasFirstFrameRendered,
    isBuffering,
    isLoadStalled,
    player,
    retryLoad,
  } = useAppVideoPlayer({
    autoPlay: true,
    isMuted: true,
    loop: false,
    surface: "match",
    videoUrl: matchUrl,
  });

  const handleRetry = useCallback(() => {
    void retryLoad();
  }, [retryLoad]);

  const showRetryState = isLoadStalled || hasPlaybackError;
  const shouldShowPoster =
    Boolean(posterUrl) && (!hasFirstFrameRendered || showRetryState);

  return (
    <View className="bg-black" style={{ aspectRatio: 16 / 9, width: "100%" }}>
      <VideoPoster posterUrl={posterUrl} showPoster={shouldShowPoster} />

      <VideoView
        contentFit="contain"
        nativeControls
        onFirstFrameRender={handleFirstFrameRender}
        player={player}
        style={{
          height: "100%",
          opacity: hasFirstFrameRendered && !showRetryState ? 1 : 0,
          width: "100%",
        }}
      />

      {!showRetryState && isBuffering ? (
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
      ) : null}

      {showRetryState ? (
        <View className="absolute inset-0 items-center justify-center px-6">
          <View
            className="items-center rounded-2xl px-4 py-4"
            style={{ backgroundColor: OVERLAY.bgHeavy }}
          >
            <Text className="text-white text-center text-sm font-medium">
              Match video is taking longer than expected.
            </Text>
            <Pressable
              className="mt-3 rounded-full px-4 py-2"
              onPress={handleRetry}
              style={{ backgroundColor: OVERLAY.highlight }}
            >
              <Text className="text-white text-sm font-semibold">Retry</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function VenueAndSocial({
  venue,
  videoId,
}: {
  venue: { name: string; city: string; region: string };
  videoId: number;
}) {
  const { likeCount, hasLiked, toggleLike } = useLikes(videoId);
  const { commentCount } = useComments(videoId);
  const accentColor = useThemeColor("accent");

  return (
    <View className="flex-row items-center justify-between px-4 pt-4">
      <View>
        <Text
          variant="heading"
          style={{ fontSize: 18 }}
          className="text-foreground"
        >
          {venue.name}
        </Text>
        <Text className="text-muted text-base">
          {venue.city}, {venue.region}
        </Text>
      </View>
      <View className="flex-row items-center gap-3">
        <Pressable className="flex-row items-center py-2.5 pr-2" onPress={toggleLike}>
          <Ionicons
            name={hasLiked ? "heart" : "heart-outline"}
            size={20}
            color={accentColor}
          />
          <Text className="text-accent text-base ml-1">{likeCount}</Text>
        </Pressable>
        <View className="flex-row items-center">
          <Ionicons name="chatbubble-outline" size={18} color={accentColor} />
          <Text className="text-accent text-base ml-1">{commentCount}</Text>
        </View>
      </View>
    </View>
  );
}

function CommentList({ videoId }: { videoId: number }) {
  const { state } = useAuth();
  const userId = state.status === "authenticated" ? state.user.id : undefined;
  const { comments, confirmAndDelete, isLoading } = useComments(videoId);

  if (isLoading) {
    return (
      <View className="items-center py-8">
        <Text className="text-muted text-base">Loading...</Text>
      </View>
    );
  }

  if (comments.length === 0) {
    return (
      <View className="items-center py-8">
        <Text className="text-muted text-base">No comments yet</Text>
      </View>
    );
  }

  return (
    <View className="py-2">
      {comments.map((item) => (
        <CommentItem
          key={item.id}
          comment={item}
          isOwn={item.user_id === userId}
          onDelete={confirmAndDelete}
        />
      ))}
    </View>
  );
}
