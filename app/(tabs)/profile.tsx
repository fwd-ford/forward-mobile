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
import { ScreenHeader } from "@/components/ui/ScreenHeader";
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
      setState({ email: authRes.data.user?.email ?? null, profile });
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

  if (!state) return <LoadingScreen label={t("loading.profile")} />;

  const { email, profile } = state;
  const displayName = profile?.full_name ?? t("profile.unnamed");
  const avatarSource = profile?.full_name ?? email ?? "?";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing["4xl"] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={t("tabs.profile")} />

        {/* User card: avatar + name + email + photo actions all in one block */}
        {/* Card do usuario: avatar + identidade + acoes de foto numa secao so */}
        <View style={styles.userCard}>
          <View style={styles.userTop}>
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
        </View>

        <Text style={styles.sectionTitle}>{t("profile.appearance")}</Text>

        <SettingRow
          icon={mode === "dark" ? "moon" : "sunny"}
          label={mode === "dark" ? t("profile.dark_mode") : t("profile.light_mode")}
          value={isOverridden ? t("profile.theme_manual") : t("profile.theme_auto")}
          colors={colors}
          styles={styles}
          right={
            <Switch
              value={mode === "dark"}
              onValueChange={() => {
                haptic.selection();
                toggleTheme();
              }}
              trackColor={{ false: colors.borderStrong, true: colors.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={colors.borderStrong}
            />
          }
        />

        {isOverridden ? (
          <Pressable
            onPress={() => {
              haptic.light();
              resetToSystem();
            }}
            style={({ pressed }) => [styles.linkRow, pressed && styles.pressedSoft]}
            accessibilityRole="button"
            accessibilityLabel={t("profile.follow_system")}
          >
            <Text style={styles.linkText}>{t("profile.follow_system")}</Text>
          </Pressable>
        ) : null}

        <Text style={styles.sectionTitle}>{t("profile.language")}</Text>

        <Pressable
          onPress={() => {
            haptic.light();
            setLocalePickerOpen(true);
          }}
          style={({ pressed }) => [pressed && styles.pressedSoft]}
          accessibilityRole="button"
          accessibilityLabel={`${t("profile.language")}: ${LOCALE_LABEL[locale]}`}
        >
          <SettingRow
            icon="globe-outline"
            label={t("profile.language")}
            value={`${LOCALE_LABEL[locale]} · ${LOCALE_SHORT[locale]}`}
            colors={colors}
            styles={styles}
            right={<Ionicons name="chevron-down" size={16} color={colors.textSubtle} />}
          />
        </Pressable>

        <Text style={styles.sectionTitle}>{t("profile.account")}</Text>

        <View style={styles.actionsCard}>
          <Button label={t("profile.sign_out")} variant="ghost" onPress={onSignOut} />
        </View>
      </ScrollView>

      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
      />

      <LocalePicker visible={localePickerOpen} onClose={() => setLocalePickerOpen(false)} />
    </View>
  );
}

// SettingRow — local component, unifies the theme card and locale row visually.
// Linha de configuracao: icone esquerda + label/value + slot direito.
type SettingRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  right: React.ReactNode;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
};

function SettingRow({ icon, label, value, right, colors, styles }: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIconWrap}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <View style={styles.settingTextos}>
          <Text style={styles.settingLabel}>{label}</Text>
          <Text style={styles.settingValue} numberOfLines={1}>
            {value}
          </Text>
        </View>
      </View>
      {right}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scrollContent: { paddingHorizontal: 0 },
    userCard: {
      marginHorizontal: spacing.xl,
      marginBottom: spacing.xl,
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing.lg,
    },
    userTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
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
    photoButtonsRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    sectionTitle: {
      ...typography.label,
      color: c.textMuted,
      textTransform: "uppercase",
      paddingHorizontal: spacing.xl,
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    settingRow: {
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
    settingLeft: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    settingIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    settingTextos: { flex: 1 },
    settingLabel: {
      ...typography.caption,
      color: c.textMuted,
    },
    settingValue: {
      ...typography.body,
      fontWeight: "700",
      color: c.text,
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
