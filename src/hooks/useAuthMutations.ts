import React, { useCallback, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useThemeColor, useToast } from "heroui-native";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/errors";
import { supabase } from "../lib/supabase";
import { upsertProfile } from "./useProfile";

const authKeys = {
  login: ["auth", "mutations", "login"] as const,
  register: ["auth", "mutations", "register"] as const,
};

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  username: string;
}

export class ProfileSetupError extends Error {
  constructor(
    message: string,
    public readonly userId: string,
  ) {
    super(message);
    this.name = "ProfileSetupError";
  }
}

async function loginWithPassword({ email, password }: LoginInput) {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw error;
  }
}

async function registerWithProfile({
  email,
  password,
  username,
}: RegisterInput) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });

  if (error) {
    throw error;
  }

  const userId = data.user?.id;

  if (!userId) {
    throw new Error("Sign-up succeeded but no user ID returned");
  }

  try {
    await upsertProfile(userId, { username: username.trim() });
  } catch (profileError) {
    throw new ProfileSetupError(
      getErrorMessage(profileError, "Profile setup failed"),
      userId,
    );
  }

  return { userId };
}

export function useLoginMutation() {
  const { toast } = useToast();
  const dangerColor = useThemeColor("danger");

  return useMutation({
    mutationKey: authKeys.login,
    mutationFn: loginWithPassword,
    onError: (error) => {
      toast.show({
        description: getErrorMessage(error, "Failed to log in"),
        icon: React.createElement(Ionicons, {
          color: dangerColor,
          name: "alert-circle",
          size: 22,
        }),
        label: "Login failed",
        variant: "danger",
      });
    },
  });
}

export function useRegisterMutation() {
  const { setHoldRedirect } = useAuth();
  const { toast } = useToast();
  const dangerColor = useThemeColor("danger");
  const [profileRetryUserId, setProfileRetryUserId] = useState<string | null>(
    null,
  );

  const clearProfileRetry = useCallback(() => {
    setProfileRetryUserId(null);
  }, []);

  const mutation = useMutation({
    mutationKey: authKeys.register,
    mutationFn: registerWithProfile,
    onError: (error) => {
      if (error instanceof ProfileSetupError) {
        setProfileRetryUserId(error.userId);
        toast.show({
          description: error.message,
          icon: React.createElement(Ionicons, {
            color: dangerColor,
            name: "alert-circle",
            size: 22,
          }),
          label: "Profile setup failed",
          variant: "danger",
        });
        return;
      }

      setHoldRedirect(false);
      toast.show({
        description: getErrorMessage(error, "Registration failed"),
        icon: React.createElement(Ionicons, {
          color: dangerColor,
          name: "alert-circle",
          size: 22,
        }),
        label: "Registration failed",
        variant: "danger",
      });
    },
    onMutate: () => {
      setProfileRetryUserId(null);
      setHoldRedirect(true);
    },
    onSuccess: () => {
      setProfileRetryUserId(null);
      setHoldRedirect(false);
    },
  });

  return {
    ...mutation,
    clearProfileRetry,
    profileRetryUserId,
  };
}
