// Tab bar — Glass Minimalist redesign (Fase 2, screen 6/6).
// Bar is absolute-positioned and uses GlassSurface variant="thick" as the
// background; expo-router renders the labels/icons on top. Active tint moves
// from primary (was Ford Blue) to text token so it reads in both modes.
//
// Tab bar glass thick flutuando sobre conteudo (estilo iOS).

import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useCallback } from "react";
import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { GlassSurface } from "@/components/ui/GlassSurface";
import { useTheme } from "@/context/ThemeContext";
import { fontFamily } from "@/lib/theme";

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
          size={size - 2}
          color={color}
        />
      ),
    [],
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // react-navigation/bottom-tabs v7 paints the scene container white by
        // default; without this the mesh background gets covered inside tabs.
        // sceneStyle no v7 substituiu sceneContainerStyle do v6.
        sceneStyle: { backgroundColor: "transparent" },
        // animation 'none' avoids the visible overlap when both scenes are
        // transparent and the cross-fade momentarily renders both stacked.
        // Sem isso, a troca de aba mostra ambas as cenas sobrepostas.
        animation: "none",
        // freezeOnBlur + lazy: react-navigation v7 keeps inactive scenes
        // mounted by default. With transparent sceneStyle both render at once
        // visually. freezeOnBlur pauses inactive scenes, lazy delays the first
        // render of unfocused tabs until they get touched. Together they keep
        // the swap clean without ghost layers.
        // Sem isso, cenas inativas ficam visiveis sobrepostas; lazy/freeze
        // garantem que so a ativa pinta.
        freezeOnBlur: true,
        lazy: true,
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "transparent",
          borderTopWidth: 0,
          elevation: 0,
        },
        // Hairline divider on top so the tab bar reads as detached, not
        // floating ambiguously over content. Background usa bottomBarBg do
        // theme (Figma node 1:2 / 8:55), quase opaco (0.98) e com tint de
        // light/dark. GlassSurface mantida pra blur sutil residual.
        tabBarBackground: () => (
          <GlassSurface
            variant="thick"
            radius={0}
            border={false}
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: colors.bottomBarBg,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: colors.glassBorder,
              },
            ]}
          />
        ),
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: fontFamily.semibold,
          fontSize: 11,
          letterSpacing: 0.2,
        },
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
