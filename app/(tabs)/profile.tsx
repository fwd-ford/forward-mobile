import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { useTheme } from "@/context/ThemeContext";
import { haptic } from "@/lib/haptics";
import { signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";

type SessionUser = {
  email: string | null;
  fullName: string | null;
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, mode, toggleTheme, isOverridden, resetToSystem } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setUser({
        email: u?.email ?? null,
        fullName: (u?.user_metadata?.full_name as string | undefined) ?? null,
      });
    });
  }, []);

  async function onSignOut() {
    haptic.medium();
    await signOut();
    router.replace("/login");
  }

  function onToggleTheme() {
    haptic.selection();
    toggleTheme();
  }

  function onResetToSystem() {
    haptic.light();
    resetToSystem();
  }

  if (!user) {
    return <LoadingScreen label={t("loading.profile")} />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing["4xl"] },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t("tabs.profile")}</Text>
      </View>

      <View style={styles.userCard}>
        <ProfileAvatar
          source={user.fullName ?? user.email ?? "?"}
          size={56}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {user.fullName ?? t("profile.unnamed")}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {user.email ?? "—"}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t("profile.appearance")}</Text>
      <View style={styles.themeCard}>
        <View style={styles.themeInfo}>
          <View style={styles.themeIconWrap}>
            <Ionicons
              name={mode === "dark" ? "moon" : "sunny"}
              size={18}
              color={colors.primary}
            />
          </View>
          <View style={styles.themeTextos}>
            <Text style={styles.themeLabel}>
              {mode === "dark" ? t("profile.dark_mode") : t("profile.light_mode")}
            </Text>
            <Text style={styles.themeSub}>
              {isOverridden ? t("profile.theme_manual") : t("profile.theme_auto")}
            </Text>
          </View>
        </View>
        <Switch
          value={mode === "dark"}
          onValueChange={onToggleTheme}
          trackColor={{ false: colors.borderStrong, true: colors.primary }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={colors.borderStrong}
        />
      </View>

      {isOverridden ? (
        <Pressable
          onPress={onResetToSystem}
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressedSoft]}
          accessibilityRole="button"
          accessibilityLabel={t("profile.follow_system")}
        >
          <Text style={styles.linkText}>{t("profile.follow_system")}</Text>
        </Pressable>
      ) : null}

      <Text style={styles.sectionTitle}>{t("profile.account")}</Text>
      <View style={styles.actionsCard}>
        <Button label={t("profile.sign_out")} variant="secondary" onPress={onSignOut} />
      </View>
    </ScrollView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scrollContent: {
      paddingHorizontal: 0,
    },
    header: {
      paddingHorizontal: spacing.xl,
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.h1,
      color: c.text,
    },
    userCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.xl,
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    userInfo: { flex: 1 },
    userName: {
      ...typography.h3,
      color: c.text,
    },
    userEmail: {
      ...typography.caption,
      color: c.textMuted,
      marginTop: 2,
    },
    sectionTitle: {
      ...typography.label,
      color: c.textMuted,
      textTransform: "uppercase",
      paddingHorizontal: spacing.xl,
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    themeCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    themeInfo: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    themeIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    themeTextos: { flex: 1 },
    themeLabel: {
      ...typography.body,
      fontWeight: "600",
      color: c.text,
    },
    themeSub: {
      ...typography.caption,
      color: c.textMuted,
      marginTop: 2,
    },
    linkRow: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
      marginBottom: spacing.lg,
    },
    linkText: {
      ...typography.caption,
      color: c.primary,
      fontWeight: "600",
    },
    actionsCard: {
      marginHorizontal: spacing.xl,
      marginBottom: spacing.xl,
    },
    pressedSoft: {
      opacity: 0.7,
    },
  });
}
