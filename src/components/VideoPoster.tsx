import React from "react";
import { Image, StyleSheet } from "react-native";

interface VideoPosterProps {
  posterUrl?: string;
  showPoster: boolean;
}

export function VideoPoster({
  posterUrl,
  showPoster,
}: VideoPosterProps) {
  if (!posterUrl || !showPoster) {
    return null;
  }

  return (
    <Image
      resizeMode="cover"
      source={{ uri: posterUrl }}
      style={StyleSheet.absoluteFillObject}
    />
  );
}
