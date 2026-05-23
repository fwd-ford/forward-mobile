import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

import { Button } from "@/components/ui/Button";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { LocalePicker } from "@/components/ui/LocalePicker";
import { PhotoButton } from "@/components/ui/PhotoButton";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { Toast, type ToastVariant } from "@/components/ui/Toast";
import { useLocale } from "@/context/LocaleContext";
import { useTheme } from "@/context/ThemeContext";
import { signOut } from "@/lib/auth";
import { deleteAvatar, uploadAvatar } from "@/lib/avatar-upload";
import { haptic } from "@/lib/haptics";
import { pickFromCamera, pickFromLibrary, type PickedImage } from "@/lib/image-picker";
import { LOCALE_LABEL, LOCALE_SHORT } from "@/lib/locale";
import { fetchMyProfile, updateMyProfile, type Profile } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { radius, spacing, typography, type ThemeColors } from "@/lib/theme";

type ProfileState = {
  email: string | null;
  profile: Profile | null;
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, mode, toggleTheme, isOverridden, resetToSystem } = useTheme();
  const { locale } = useLocale();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [state, setState] = useState<ProfileState | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [localePickerOpen, setLocalePickerOpen] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
  }>({ visible: false, message: "", variant: "success" });

  useEffect(() => {
    void (async () => {
      const [authRes, profile] = await Promise.all([
        supabase.auth.getUser(),
        fetchMyProfile().catch(() => null),
      ]);
      setState({
        email: authRes.data.user?.email ?? null,
        profile,
      });
    })();
  }, []);

  function showToast(message: string, variant: ToastVariant = "success") {
    setToast({ visible: true, message, variant });
  }

  async function applyPhoto(picked: PickedImage) {
    setUploadingPhoto(true);
    try {
      const url = await uploadAvatar(picked);
      const updated = await updateMyProfile({ avatar_url: url });
      setState((prev) => (prev ? { ...prev, profile: updated } : prev));
      haptic.success();
      showToast(t("profile.photo_updated"));
    } catch {
      haptic.error();
      showToast(t("profile.photo_failed"), "error");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function onPickFromLibrary() {
    haptic.light();
    const picked = await pickFromLibrary();
    if (picked) await applyPhoto(picked);
  }

  async function onPickFromCamera() {
    haptic.light();
    const picked = await pickFromCamera();
    if (picked) await applyPhoto(picked);
  }

  async function onRemovePhoto() {
    haptic.warning();
    setUploadingPhoto(true);
    try {
      await deleteAvatar();
      const updated = await updateMyProfile({ avatar_url: null });
      setState((prev) => (prev ? { ...prev, profile: updated } : prev));
      haptic.success();
      showToast(t("profile.photo_removed"));
    } catch {
      haptic.error();
      showToast(t("profile.photo_remove_failed"), "error");
    } finally {
      setUploadingPhoto(false);
    }
  }

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

  function onOpenLocalePicker() {
    haptic.light();
    setLocalePickerOpen(true);
  }

  if (!state) {
    return <LoadingScreen label={t("loading.profile")} />;
  }

  const { email, profile } = state;
  const displayName = profile?.full_name ?? t("profile.unnamed");
  const avatarSource = profile?.full_name ?? email ?? "?";

  return (
    <View style={styles.container}>
      <ScrollView
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
          <Pressable
            onPress={onPickFromLibrary}
            disabled={uploadingPhoto}
            style={({ pressed }) => [styles.avatarPressable, pressed && styles.pressedSoft]}
            accessibilityRole="button"
            accessibilityLabel={t("profile.change_photo")}
          >
            <ProfileAvatar uri={profile?.avatar_url} source={avatarSource} size={64} />
            <View style={styles.avatarBadge}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color={colors.primaryText} />
              ) : (
                <Ionicons name="camera" size={12} color={colors.primaryText} />
              )}
            </View>
          </Pressable>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {email ?? "—"}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t("profile.photo")}</Text>
        <View style={styles.photoButtonsRow}>
          <PhotoButton
            icon="camera-outline"
            label={t("profile.camera")}
            onPress={onPickFromCamera}
            disabled={uploadingPhoto}
          />
          <PhotoButton
            icon="images-outline"
            label={t("profile.gallery")}
            onPress={onPickFromLibrary}
            disabled={uploadingPhoto}
          />
          {profile?.avatar_url ? (
            <PhotoButton
              icon="trash-outline"
              label={t("profile.remove")}
              onPress={onRemovePhoto}
              disabled={uploadingPhoto}
              destructive
            />
          ) : null}
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

        <Text style={styles.sectionTitle}>{t("profile.language")}</Text>
        <Pressable
          onPress={onOpenLocalePicker}
          style={({ pressed }) => [styles.localeRow, pressed && styles.pressedSoft]}
          accessibilityRole="button"
          accessibilityLabel={`${t("profile.language")}: ${LOCALE_LABEL[locale]}`}
        >
          <View style={styles.localeLeft}>
            <View style={styles.localeIconWrap}>
              <Ionicons name="globe-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.localeTextos}>
              <Text style={styles.localeLabel}>{t("profile.language")}</Text>
              <Text style={styles.localeValue}>
                {LOCALE_LABEL[locale]} · {LOCALE_SHORT[locale]}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-down" size={16} color={colors.textSubtle} />
        </Pressable>

        <Text style={styles.sectionTitle}>{t("profile.account")}</Text>
        <View style={styles.actionsCard}>
          <Button label={t("profile.sign_out")} variant="secondary" onPress={onSignOut} />
        </View>
      </ScrollView>

      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
      />

      <LocalePicker
        visible={localePickerOpen}
        onClose={() => setLocalePickerOpen(false)}
      />
    </View>
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
    avatarPressable: { position: "relative" },
    avatarBadge: {
      position: "absolute",
      bottom: -2,
      right: -2,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: c.surface,
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
    photoButtonsRow: {
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      marginBottom: spacing.lg,
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
    localeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.lg,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    localeLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    localeIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    localeTextos: { flex: 1 },
    localeLabel: {
      ...typography.caption,
      color: c.textMuted,
    },
    localeValue: {
      ...typography.body,
      fontWeight: "700",
      color: c.text,
      marginTop: 2,
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
