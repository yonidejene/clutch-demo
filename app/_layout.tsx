import "../global.css";
import React, { useEffect } from "react";
import { StatusBar, View } from "react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

import { HeroUINativeProvider, Spinner, useThemeColor } from "heroui-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../src/lib/queryClient";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ClutchLogo } from "../src/components/ClutchLogo";

SplashScreen.preventAutoHideAsync();

function AppStack() {
  const { state, holdRedirect } = useAuth();
  const background = useThemeColor("background");
  const foreground = useThemeColor("foreground");
  const accent = useThemeColor("accent");

  if (state.status === "loading") {
    return (
      <View className="flex-1 justify-center items-center">
        <Spinner size="lg" />
      </View>
    );
  }

  const isAuth = state.status === "authenticated" && !holdRedirect;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: background } }}>
      <Stack.Protected guard={isAuth}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="match/[id]"
          options={{ headerShown: true, title: '', headerBackTitle: 'Back', headerStyle: { backgroundColor: background }, headerTintColor: accent, headerTitleStyle: { color: foreground }, headerShadowVisible: false }}
        />
        <Stack.Screen
          name="comments/[videoId]"
          options={{ headerShown: true, title: 'Comments', headerBackTitle: 'Back', headerStyle: { backgroundColor: background }, headerTintColor: accent, headerTitleStyle: { color: foreground }, headerShadowVisible: false }}
        />
      </Stack.Protected>

      <Stack.Protected guard={!isAuth}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "MonaSansExpanded-Bold": require("../assets/fonts/MonaSansExpanded-Bold.otf"),
    "MonaSans-Regular": require("../assets/fonts/MonaSans-Regular.otf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#03160A' }}>
        <ClutchLogo width={140} height={25} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <HeroUINativeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppStack />
          </AuthProvider>
        </QueryClientProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );
}
