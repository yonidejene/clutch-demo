import React from "react";
import { Button, Spinner, useThemeColor } from "heroui-native";
import { FONTS } from "../theme/fonts";
import { RADIUS } from "../theme/radius";

interface LoadingButtonProps {
  loading: boolean;
  label: string;
  onPress: () => void;
  className?: string;
  color?: "accent" | "danger" | "success" | "default";
  labelClassName?: string;
}

export function LoadingButton({
  loading,
  label,
  onPress,
  className = "mb-4",
  labelClassName,
}: LoadingButtonProps) {
  const accentForeground = useThemeColor("accent-foreground");

  return (
    <Button
      isDisabled={loading}
      onPress={onPress}
      className={className}
      style={{ borderRadius: RADIUS.md }}
    >
      {loading ? (
        <Spinner size="sm" color={accentForeground} />
      ) : (
        <Button.Label style={FONTS.heading} className={labelClassName}>
          {label}
        </Button.Label>
      )}
    </Button>
  );
}
