import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeColor } from "heroui-native";

export default function TabsLayout() {
  const background = useThemeColor("background");
  const muted = useThemeColor("muted");
  const accent = useThemeColor("accent");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: background }} edges={["top"]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: { backgroundColor: background, borderTopColor: 'transparent', borderTopWidth: 0, elevation: 0, shadowOpacity: 0 },
          tabBarActiveTintColor: accent,
          tabBarInactiveTintColor: muted,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? "grid" : "grid-outline"} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
