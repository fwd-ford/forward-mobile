import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

import { Button } from "@/components/ui/Button";
import { signOut } from "@/lib/auth";
import { colors, spacing, typography } from "@/lib/theme";

export default function ProfileScreen() {
  const { t } = useTranslation();

  async function onSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("app.name")}</Text>
      <Button label={t("profile.sign_out")} variant="secondary" onPress={onSignOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.xl, gap: spacing.xl, backgroundColor: colors.bg },
  title: { ...typography.h1, color: colors.text },
});
