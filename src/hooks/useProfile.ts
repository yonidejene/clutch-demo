import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useThemeColor, useToast } from "heroui-native";
import { getErrorMessage } from "../lib/errors";
import { supabase } from "../lib/supabase";
import type { Profile } from "../types/api";

export const profileKeys = {
  all: ["profile"] as const,
  detail: (userId: string) => [...profileKeys.all, userId] as const,
  mutations: ["profile", "mutations"] as const,
  update: (userId: string | undefined) =>
    [...profileKeys.mutations, "update", userId ?? "anonymous"] as const,
};

export interface ProfileMutationInput {
  address?: string | null;
  full_name?: string | null;
  username: string;
}

interface UpdateProfileMutationOptions {
  errorFallbackMessage?: string;
  errorLabel?: string;
  onSuccess?: (profile: Profile) => void;
  successLabel?: string;
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Profile | null;
}

export async function upsertProfile(
  userId: string,
  profileInput: ProfileMutationInput,
) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      address: profileInput.address ?? null,

      full_name: profileInput.full_name ?? null,
      id: userId,
      username: profileInput.username,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
}

export function useProfileQuery(userId: string | undefined) {
  return useQuery({
    enabled: Boolean(userId),
    queryFn: () => fetchProfile(userId!),
    queryKey: profileKeys.detail(userId ?? "anonymous"),
  });
}

export function useUpdateProfileMutation(
  userId: string | undefined,
  options: UpdateProfileMutationOptions = {},
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const dangerColor = useThemeColor("danger");
  const successColor = useThemeColor("success");

  return useMutation({
    mutationKey: profileKeys.update(userId),
    mutationFn: async (profileInput: ProfileMutationInput) => {
      if (!userId) {
        throw new Error("Missing user id");
      }

      return upsertProfile(userId, profileInput);
    },
    onError: (error) => {
      toast.show({
        description: getErrorMessage(
          error,
          options.errorFallbackMessage ?? "Failed to save profile",
        ),
        icon: React.createElement(Ionicons, {
          color: dangerColor,
          name: "alert-circle",
          size: 22,
        }),
        label: options.errorLabel ?? "Save failed",
        variant: "danger",
      });
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.detail(profile.id), profile);
      toast.show({
        icon: React.createElement(Ionicons, {
          color: successColor,
          name: "checkmark-circle",
          size: 22,
        }),
        label: options.successLabel ?? "Profile saved!",
        variant: "success",
      });
      options.onSuccess?.(profile);
    },
  });
}
