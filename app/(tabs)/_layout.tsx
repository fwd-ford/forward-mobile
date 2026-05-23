import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/context/ThemeContext";

type TabIconKey = "index" | "leads" | "profile";

const ICONS: Record<TabIconKey, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  index: { focused: "home", unfocused: "home-outline" },
  leads: { focused: "briefcase", unfocused: "briefcase-outline" },
  profile: { focused: "person-circle", unfocused: "person-circle-outline" },
};

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? ICONS.index.focused : ICONS.index.unfocused} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: t("tabs.leads"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? ICONS.leads.focused : ICONS.leads.unfocused} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? ICONS.profile.focused : ICONS.profile.unfocused} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
