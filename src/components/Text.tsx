import React from "react";
import { Text as RNText } from "react-native";
import { FONTS } from "../theme/fonts";

type FontVariant = keyof typeof FONTS;

export interface TextProps extends React.ComponentProps<typeof RNText> {
  variant?: FontVariant;
}

export const Text = React.forwardRef<
  React.ElementRef<typeof RNText>,
  TextProps
>(function Text({ style, variant = "body", ...props }, ref) {
  return <RNText ref={ref} {...props} style={[FONTS[variant], style]} />;
});

Text.displayName = "Text";
