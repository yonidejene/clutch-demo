import React from 'react';
import { View, Pressable } from 'react-native';
import { useThemeColor } from 'heroui-native';
import { formatTimeAgo } from '../lib/formatTimeAgo';
import { RADIUS } from '../theme/radius';
import type { Comment } from '../types/api';
import { Text } from './Text';

interface CommentItemProps {
  comment: Comment;
  isOwn: boolean;
  onDelete: (comment: Comment) => void;
}

export function CommentItem({ comment, isOwn, onDelete }: CommentItemProps) {
  const username = comment.public_profiles?.username ?? 'Unknown';
  const initial = username.charAt(0).toUpperCase();
  const [accentColor, accentFgColor, surfaceColor] = useThemeColor([
    'accent', 'accent-foreground', 'surface',
  ]);

  return (
    <View className="flex-row items-start px-4 py-2.5">
      {/* Avatar */}
      <View
        className="items-center justify-center rounded-full"
        style={{ width: 36, height: 36, backgroundColor: accentColor }}
      >
        <Text
          variant="heading"
          className="text-sm"
          style={{ color: accentFgColor }}
        >
          {initial}
        </Text>
      </View>

      <View className="flex-1 ml-2.5">
        {/* Bubble */}
        <View
          className="px-3 py-2.5"
          style={{ backgroundColor: surfaceColor, borderRadius: RADIUS.md }}
        >
          <Text
            variant="heading"
            className="text-foreground text-sm"
            numberOfLines={1}
          >
            {username}
          </Text>

          <Text
            className="text-foreground mt-1.5"
            style={{ fontSize: 16, lineHeight: 22 }}
          >
            {comment.content}
          </Text>
        </View>

        {/* Meta below bubble */}
        <View className="flex-row items-center mt-1.5 ml-1">
          <Text className="text-muted text-xs">
            {formatTimeAgo(comment.created_at)}
          </Text>

          {isOwn && (
            <>
              <Text className="text-muted text-xs mx-1">·</Text>
              <Pressable onPress={() => onDelete(comment)} hitSlop={8}>
                <Text className="text-muted text-xs">Delete</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
