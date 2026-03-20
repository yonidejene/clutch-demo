import React, { useCallback } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CommentInput } from '../../src/components/CommentInput';
import { CommentItem } from '../../src/components/CommentItem';
import { Text } from '../../src/components/Text';
import { useAuth } from '../../src/context/AuthContext';
import { useComments } from '../../src/hooks/useComments';
import type { Comment } from '../../src/types/api';

export default function CommentsScreen() {
  const { videoId: videoIdParam } = useLocalSearchParams<{ videoId: string }>();
  const videoId = Number(videoIdParam);

  if (Number.isNaN(videoId)) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-foreground text-center">Invalid video id</Text>
      </View>
    );
  }

  return <CommentsScreenContent videoId={videoId} />;
}

function CommentsScreenContent({ videoId }: { videoId: number }) {
  const { state } = useAuth();
  const userId = state.status === 'authenticated' ? state.user.id : undefined;
  const { comments, confirmAndDelete, isLoading } = useComments(videoId);

  const renderItem = useCallback(
    ({ item }: { item: Comment }) => (
      <CommentItem
        comment={item}
        isOwn={item.user_id === userId}
        onDelete={confirmAndDelete}
      />
    ),
    [userId, confirmAndDelete],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 96 : 0}
      style={{ flex: 1 }}
    >
      <View className="flex-1 bg-background">
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-muted text-base">
                {isLoading ? 'Loading...' : 'No comments yet — be the first!'}
              </Text>
            </View>
          }
        />
        <CommentInput videoId={videoId} />
      </View>
    </KeyboardAvoidingView>
  );
}
