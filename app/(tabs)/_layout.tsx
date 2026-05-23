import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useCallback } from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/context/ThemeContext";

type TabIconKey = "index" | "leads" | "profile";

type TabIconRenderProps = {
  color: string;
  size: number;
  focused: boolean;
};

const ICONS: Record<
  TabIconKey,
  { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }
> = {
  index: { focused: "home", unfocused: "home-outline" },
  leads: { focused: "briefcase", unfocused: "briefcase-outline" },
  profile: { focused: "person-circle", unfocused: "person-circle-outline" },
};

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const makeTabIcon = useCallback(
    (key: TabIconKey) =>
      ({ color, size, focused }: TabIconRenderProps) => (
        <Ionicons
          name={focused ? ICONS[key].focused : ICONS[key].unfocused}
          size={size}
          color={color}
        />
      ),
    [],
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.separator,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t("tabs.home"), tabBarIcon: makeTabIcon("index") }}
      />
      <Tabs.Screen
        name="leads"
        options={{ title: t("tabs.leads"), tabBarIcon: makeTabIcon("leads") }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t("tabs.profile"), tabBarIcon: makeTabIcon("profile") }}
      />
    </Tabs>
  );
}
