// Profile — Glass Minimalist redesign (Fase 2, screen 4/6).
// Header: labelCaps "CONTA" + Fraunces 40 user name.
// Avatar 80 + 3 photo buttons (no card wrapper around them).
// Sections: each is a GlassSurface group containing SettingRows separated
// by hairline dividers. Sign-out is a ghost pill at the bottom.

import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
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

import { CityPicker } from "@/components/ui/CityPicker";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { LocalePicker } from "@/components/ui/LocalePicker";
import { PhotoButton } from "@/components/ui/PhotoButton";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { SettingRow } from "@/components/ui/SettingRow";
import { Toast, type ToastVariant } from "@/components/ui/Toast";
import { useLocale } from "@/context/LocaleContext";
import { useTheme } from "@/context/ThemeContext";
import { useUserLocation } from "@/context/UserLocationContext";
import { signOut } from "@/lib/auth";
import { deleteAvatar, uploadAvatar } from "@/lib/avatar-upload";
import { friendlyDisplayName } from "@/lib/displayName";
import { haptic } from "@/lib/haptics";
import { pickFromCamera, pickFromLibrary, type PickedImage } from "@/lib/image-picker";
import { LOCALE_LABEL, LOCALE_SHORT } from "@/lib/locale";
import { fetchMyProfile, updateMyProfile, type Profile } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { fontFamily, radius, spacing, typography, type ThemeColors } from "@/lib/theme";

type ProfileState = {
  email: string | null;
  profile: Profile | null;
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, mode, toggleTheme, isOverridden, resetToSystem } = useTheme();
  const { locale } = useLocale();
  const { city } = useUserLocation();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [state, setState] = useState<ProfileState | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [localePickerOpen, setLocalePickerOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [showPhotoActions, setShowPhotoActions] = useState(false);
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
      setShowPhotoActions(false);
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
      setShowPhotoActions(false);
      haptic.success();
      showToast(t("profile.photo_removed"));
    } catch {
      haptic.error();
      showToast(t("profile.photo_remove_failed"), "error");
    } finally {
      setUploadingPhoto(false);
    }
  }

  const onToggleActions = useCallback(() => {
    haptic.selection();
    setShowPhotoActions((prev) => !prev);
  }, []);

  async function onSignOut() {
    haptic.medium();
    await signOut();
    router.replace("/login");
  }

  const onToggleTheme = useCallback(() => {
    haptic.selection();
    toggleTheme();
  }, [toggleTheme]);

  const onResetToSystem = useCallback(() => {
    haptic.light();
    resetToSystem();
  }, [resetToSystem]);

  const onOpenLocalePicker = useCallback(() => {
    haptic.light();
    setLocalePickerOpen(true);
  }, []);

  const onOpenCityPicker = useCallback(() => {
    haptic.light();
    setCityPickerOpen(true);
  }, []);

  if (!state) return <LoadingScreen label={t("loading.profile")} />;

  const { email, profile } = state;
  const displayName =
    friendlyDisplayName({ fullName: profile?.full_name, email }) ??
    t("profile.greeting_fallback");
  // ProfileAvatar deriva iniciais — preferir full_name; cair pra email; nunca string vazia.
  const avatarSource = profile?.full_name?.trim() || email || displayName;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing["6xl"] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: labelCaps "CONTA" + Fraunces 40 nome */}
        <View style={styles.header}>
          <Text style={styles.labelCaps}>{t("profile.account")}</Text>
          <Text style={styles.heroTitle} numberOfLines={2}>
            {displayName}
          </Text>
          {email ? <Text style={styles.email}>{email}</Text> : null}
        </View>

        {/* Avatar inline; pills de Camera/Galeria/Remover so aparecem quando o user
            toca o avatar (default colapsado pra reduzir poluicao visual). */}
        <View style={styles.avatarBlock}>
          <Pressable
            onPress={onToggleActions}
            disabled={uploadingPhoto}
            style={({ pressed }) => [styles.avatarPressable, pressed && styles.pressedSoft]}
            accessibilityRole="button"
            accessibilityLabel={t("profile.change_photo")}
            accessibilityState={{ expanded: showPhotoActions }}
          >
            <ProfileAvatar uri={profile?.avatar_url} source={avatarSource} size={88} />
            <View style={styles.avatarBadge}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color={colors.primaryText} />
              ) : (
                <Ionicons name="camera" size={14} color={colors.primaryText} />
              )}
            </View>
          </Pressable>

          {showPhotoActions ? (
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
          ) : (
            <Text style={styles.photoHint}>{t("profile.change_photo_hint")}</Text>
          )}
        </View>

        {/* Aparencia section — glass group, rows separadas por hairline */}
        <Text style={styles.sectionLabel}>{t("profile.appearance")}</Text>
        <GlassSurface variant="thin" radius={20} style={styles.sectionGroup}>
          <SettingRow
            icon="moon-outline"
            label={t("profile.dark_mode")}
            value={isOverridden ? t("profile.theme_manual") : t("profile.theme_auto")}
            emphasis="label"
            divider={isOverridden}
            right={
              <Switch
                value={mode === "dark"}
                onValueChange={onToggleTheme}
                trackColor={{ false: colors.borderStrong, true: colors.primary }}
                thumbColor={mode === "dark" ? colors.primaryText : "#FFFFFF"}
                ios_backgroundColor={colors.borderStrong}
                style={
                  Platform.OS === "web"
                    ? ({ accentColor: colors.primary } as never)
                    : undefined
                }
              />
            }
          />
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
        </GlassSurface>

        {/* Localizacao — cidade exibida no marker do globo da home.
            Default Sao Paulo, persistida em AsyncStorage via Context. */}
        <Text style={styles.sectionLabel}>{t("profile.location")}</Text>
        <GlassSurface variant="thin" radius={20} style={styles.sectionGroup}>
          <Pressable
            onPress={onOpenCityPicker}
            style={({ pressed }) => [pressed && styles.pressedSoft]}
            accessibilityRole="button"
            accessibilityLabel={`${t("profile.location")}: ${city.label}`}
          >
            <SettingRow
              icon="location-outline"
              label={city.name}
              value={city.region}
              emphasis="label"
              right={<Ionicons name="chevron-down" size={16} color={colors.textSubtle} />}
            />
          </Pressable>
        </GlassSurface>

        {/* Idioma — section header "IDIOMA" + row mostra o idioma SELECIONADO
            como label (em vez de duplicar "Idioma"). Value vira o short code. */}
        <Text style={styles.sectionLabel}>{t("profile.language")}</Text>
        <GlassSurface variant="thin" radius={20} style={styles.sectionGroup}>
          <Pressable
            onPress={onOpenLocalePicker}
            style={({ pressed }) => [pressed && styles.pressedSoft]}
            accessibilityRole="button"
            accessibilityLabel={`${t("profile.language")}: ${LOCALE_LABEL[locale]}`}
          >
            <SettingRow
              icon="globe-outline"
              label={LOCALE_LABEL[locale]}
              value={LOCALE_SHORT[locale]}
              emphasis="label"
              right={<Ionicons name="chevron-down" size={16} color={colors.textSubtle} />}
            />
          </Pressable>
        </GlassSurface>

        {/* Sign out — ghost pill, no section title needed (label already in header) */}
        <Pressable
          onPress={onSignOut}
          accessibilityRole="button"
          accessibilityLabel={t("profile.sign_out")}
          style={({ pressed }) => [
            styles.signOutPill,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Text style={styles.signOutLabel}>{t("profile.sign_out")}</Text>
        </Pressable>
      </ScrollView>

      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
      />

      <LocalePicker visible={localePickerOpen} onClose={() => setLocalePickerOpen(false)} />
      <CityPicker visible={cityPickerOpen} onClose={() => setCityPickerOpen(false)} />
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: "transparent" },
    scrollContent: { paddingHorizontal: 0 },
    header: {
      paddingHorizontal: spacing["2xl"],
      paddingTop: spacing["3xl"],
      gap: spacing.sm,
    },
    labelCaps: {
      ...typography.labelCaps,
      color: c.textMuted,
    },
    heroTitle: {
      ...typography.hDisplay,
      color: c.text,
    },
    email: {
      ...typography.body,
      color: c.textMuted,
    },
    avatarBlock: {
      alignItems: "center",
      gap: spacing.lg,
      paddingVertical: spacing["2xl"],
      paddingHorizontal: spacing["2xl"],
    },
    avatarPressable: { position: "relative" },
    avatarBadge: {
      position: "absolute",
      bottom: 2,
      right: 2,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: c.bg,
    },
    photoButtonsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      justifyContent: "center",
    },
    photoHint: {
      ...typography.caption,
      color: c.textMuted,
      textAlign: "center",
    },
    sectionLabel: {
      ...typography.labelCaps,
      color: c.textMuted,
      paddingHorizontal: spacing["2xl"],
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    sectionGroup: {
      marginHorizontal: spacing["2xl"],
      overflow: "hidden",
    },
    linkRow: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    linkText: {
      ...typography.caption,
      fontFamily: fontFamily.semibold,
      color: c.text,
    },
    signOutPill: {
      marginTop: spacing["2xl"],
      marginHorizontal: spacing["2xl"],
      height: 52,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderStrong,
      alignItems: "center",
      justifyContent: "center",
    },
    signOutLabel: {
      ...typography.body,
      fontFamily: fontFamily.semibold,
      // Sair e acao destrutiva (encerra sessao). Padrao iOS: label em
      // tom de erro, border neutra (nao alarmante demais).
      color: c.error,
    },
    pressedSoft: { opacity: 0.7 },
  });
}
