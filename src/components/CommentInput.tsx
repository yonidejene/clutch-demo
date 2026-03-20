import React, { useCallback, useState } from "react";
import { View, ScrollView } from "react-native";
import { TextField, Input, Separator, Chip, Button } from "heroui-native";
import { useComments } from "../hooks/useComments";
import { INPUT_STYLE } from "../theme/field";
import { FONTS } from "../theme/fonts";
import { RADIUS } from "../theme/radius";

const QUICK_REPLIES = [
  "Nice shot!",
  "GG",
  "What a rally!",
  "Great point!",
  "So close!",
  "Clean winner",
  "Let's go!",
  "Wow",
];

interface CommentInputProps {
  videoId: number;
}

export function CommentInput({ videoId }: CommentInputProps) {
  const { postComment } = useComments(videoId);
  const [text, setText] = useState("");
  const hasText = text.trim().length > 0;

  const handleSend = useCallback(
    (content?: string) => {
      const nextValue = (content ?? text).trim();

      if (!nextValue) {
        return;
      }

      postComment(nextValue, {
        onSuccess: () => {
          setText("");
        },
      });
    },
    [postComment, text]
  );

  return (
    <View>
      <Separator />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 10,
        }}
      >
        {QUICK_REPLIES.map((reply) => (
          <Chip
            key={reply}
            color="default"
            size="md"
            onPress={() => setText(reply)}
          >
            <Chip.Label>{reply}</Chip.Label>
          </Chip>
        ))}
      </ScrollView>
      <View className="flex-row items-center px-4 pt-1 pb-5">
        <TextField className="flex-1">
          <Input
            className="shadow-none"
            style={INPUT_STYLE}
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => handleSend()}
            placeholder="Add a comment..."
            returnKeyType="send"
          />
        </TextField>
        <Button
          size="md"
          isDisabled={!hasText}
          onPress={() => handleSend()}
          className="ml-3"
          style={{ borderRadius: RADIUS.md }}
        >
          <Button.Label style={FONTS.heading}>Post</Button.Label>
        </Button>
      </View>
    </View>
  );
}
